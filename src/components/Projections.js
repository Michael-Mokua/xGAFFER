import { Chart, registerables } from 'chart.js';
import { state, getPlayerPosition } from '../store/state';
import { calculateProjections, getSquadProjections } from '../services/projections';

Chart.register(...registerables);

export const renderProjections = () => {
    const container = document.getElementById('projections');
    const { userTeam, players } = state;

    if (players.length === 0) {
        container.innerHTML = `<div class="loading-state">Loading data engine...</div>`;
        return;
    }

    container.innerHTML = `
        <div class="projections-header glass">
            <h1>Predictive Intelligence</h1>
            <p>Massive Data Model (MDM) running projections over the next 5 Gameweeks.</p>
        </div>

        <div class="charts-grid">
            <div class="chart-card glass">
                <h3>Squad xP Variance</h3>
                <p class="subtitle">Reliability of projections based on performance consistency.</p>
                <canvas id="variance-chart"></canvas>
            </div>
            <div class="chart-card glass">
                <h3>Projected Points (MDM v1.0)</h3>
                <p class="subtitle">Aggregated expected points for your current XI.</p>
                <canvas id="projection-chart"></canvas>
            </div>
            <div class="chart-card wide glass">
                <h3>Top Performers (xEfficiency)</h3>
                <p class="subtitle">Players providing the best xP return per £1m spent.</p>
                <canvas id="performance-chart"></canvas>
            </div>
        </div>

        <div class="heatmap-section glass" style="margin-top: 3rem; padding: 2.5rem;">
            <h3>Tactical Intensity Heatmap</h3>
            <p class="subtitle" style="margin-bottom: 2rem;">Squad fixture difficulty clusters (FDR) over the next 5 GWs.</p>
            <div id="heatmap-container" style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 1rem;">
                ${renderHeatmap()}
            </div>
        </div>

        <div class="chip-planner glass" style="margin-top: 3rem; padding: 3rem;">
            <div class="planner-header">
                <h2>Chip Strategy Planner</h2>
                <p>Simulate the impact of your season-defining chips.</p>
            </div>
            <div class="chip-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 2rem; margin-top: 2rem;">
                <div class="chip-slot glass" style="padding: 2rem; text-align: center;">
                    <i class="fas fa-bolt" style="font-size: 2.5rem; color: var(--accent-color); margin-bottom: 1rem;"></i>
                    <h4>Wildcard</h4>
                    <p style="font-size: 0.8rem; color: var(--text-muted);">Projected Gain: +12.5 pts</p>
                    <button class="btn btn-secondary btn-sm" style="margin-top: 1rem;">Simulate WC</button>
                </div>
                <div class="chip-slot glass" style="padding: 2rem; text-align: center;">
                    <i class="fas fa-tachometer-alt" style="font-size: 2.5rem; color: var(--accent-color); margin-bottom: 1rem;"></i>
                    <h4>Bench Boost</h4>
                    <p style="font-size: 0.8rem; color: var(--text-muted);">Projected Gain: +8.2 pts</p>
                    <button class="btn btn-secondary btn-sm" style="margin-top: 1rem;">Simulate BB</button>
                </div>
                <div class="chip-slot glass" style="padding: 2rem; text-align: center;">
                    <i class="fas fa-star" style="font-size: 2.5rem; color: var(--accent-color); margin-bottom: 1rem;"></i>
                    <h4>Free Hit</h4>
                    <p style="font-size: 0.8rem; color: var(--text-muted);">Projected Gain: +15.1 pts</p>
                    <button class="btn btn-secondary btn-sm" style="margin-top: 1rem;">Simulate FH</button>
                </div>
            </div>
        </div>
    `;

    renderVarianceChart();
    renderProjectionChart();
    renderPerformanceChart();
};

const renderHeatmap = () => {
    const { userTeam, players } = state;
    if (!userTeam.picks.length) return '<p class="empty-msg">Load your team to generate heatmap.</p>';

    let html = '';
    // Generate 5 GW columns
    for (let gw = 1; gw <= 5; gw++) {
        const squadDifficulty = userTeam.picks.reduce((acc, pick) => {
            const p = players.find(player => player.id === pick.element);
            return acc + (p.difficulty || 3);
        }, 0) / userTeam.picks.length;

        const fdrScore = Math.round(squadDifficulty);
        html += `
            <div class="heatmap-cell fdr-${fdrScore}" style="height: 100px; border-radius: 12px; display: flex; flex-direction: column; justify-content: center; align-items: center; border: 1px solid rgba(255,255,255,0.1);">
                <span style="font-size: 0.7rem; font-weight: 800; opacity: 0.7;">GW +${gw}</span>
                <span style="font-size: 1.5rem; font-weight: 900;">${squadDifficulty.toFixed(1)}</span>
            </div>
        `;
    }
    return html;
};

const renderVarianceChart = () => {
    const ctx = document.getElementById('variance-chart').getContext('2d');
    const { userTeam, players } = state;

    const posData = { GKP: 0, DEF: 0, MID: 0, FWD: 0 };
    userTeam.picks.forEach(pick => {
        const p = players.find(player => player.id === pick.element);
        const pos = getPlayerPosition(p.element_type);
        posData[pos] += parseFloat(p.consistency || 0.5);
    });

    new Chart(ctx, {
        type: 'radar',
        data: {
            labels: Object.keys(posData),
            datasets: [{
                label: 'Position Reliability',
                data: Object.values(posData),
                backgroundColor: 'rgba(0, 255, 133, 0.2)',
                borderColor: '#00ff85',
                borderWidth: 2
            }]
        },
        options: {
            scales: {
                r: {
                    grid: { color: 'rgba(255, 255, 255, 0.1)' },
                    angleLines: { color: 'rgba(255, 255, 255, 0.1)' },
                    ticks: { display: false }
                }
            },
            plugins: { legend: { display: false } }
        }
    });
};

const renderProjectionChart = () => {
    const ctx = document.getElementById('projection-chart').getContext('2d');
    const projections = getSquadProjections(5);

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: projections.map(d => `GW ${d.gw}`),
            datasets: [{
                label: 'Squad xP',
                data: projections.map(d => d.totalxP),
                borderColor: '#00ff85',
                backgroundColor: 'rgba(0, 255, 133, 0.1)',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: { grid: { color: 'rgba(255, 255, 255, 0.05)' } },
                x: { grid: { display: false } }
            }
        }
    });
};

const renderPerformanceChart = () => {
    const ctx = document.getElementById('performance-chart').getContext('2d');
    const efficiencyGems = [...state.players]
        .sort((a, b) => b.xEfficiency - a.xEfficiency)
        .slice(0, 10);

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: efficiencyGems.map(p => p.web_name),
            datasets: [{
                label: 'xEfficiency (xP/£m)',
                data: efficiencyGems.map(p => p.xEfficiency),
                backgroundColor: '#00ff85'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { grid: { color: 'rgba(255, 255, 255, 0.05)' } },
                x: { grid: { display: false } }
            }
        }
    });
};
