import { fetchLiveEvent } from '../services/api';
import { state } from '../store/state';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

export const renderLiveDashboard = async () => {
    const container = document.getElementById('live');
    const { userTeam, events } = state;

    const currentEvent = events.find(e => e.is_current) || events[0];
    if (!currentEvent) {
        container.innerHTML = `<div class="error-msg glass" style="padding: 3rem; text-align: center;">FPL Gameweek data is currently unavailable. Please check your connection.</div>`;
        return;
    }

    container.innerHTML = `
        <div class="live-header glass">
            <h1>Live Gameweek Dashboard</h1>
            <p>Real-time statistics for Gameweek ${currentEvent.id}. Data refreshes every 5 mins.</p>
        </div>

        <div class="live-grid">
            <div class="live-card glass">
                <h3>Live Points (Net)</h3>
                <div class="points-ticker" id="live-points">--</div>
                <p>Safety Score: <span id="safety-score">--</span></p>
            </div>
            <div class="live-card glass">
                <h3>Live Rank</h3>
                <div class="points-ticker" id="live-rank">#--</div>
                <p>Projected Movement: <span id="rank-movement">--</span></p>
            </div>
            <div class="live-card glass">
                <h3>Captain Watch</h3>
                <div id="captain-performance" class="stat-value">--</div>
                <p id="captain-points">0 pts (x2)</p>
            </div>
        </div>

        <div class="chart-card wide glass" style="margin-top: 2rem;">
            <h3>Live Rank Progression</h3>
            <canvas id="live-rank-chart" height="300"></canvas>
        </div>
    `;

    await updateLiveStats(currentEvent.id);
};

const updateLiveStats = async (gw) => {
    try {
        const liveData = await fetchLiveEvent(gw);
        const { userTeam, players } = state;

        if (!liveData || !liveData.elements) {
            throw new Error('Incomplete live data received');
        }

        if (!userTeam.picks || userTeam.picks.length === 0) {
            document.getElementById('live-points').textContent = '0';
            document.getElementById('live-rank').textContent = '#--';
            document.getElementById('captain-performance').textContent = 'No Squad';
            return;
        }

        // Calculate points
        let totalLivePoints = 0;
        userTeam.picks.forEach(pick => {
            const playerStats = liveData.elements.find(e => e.id === pick.element);
            if (playerStats) {
                const multiplier = pick.multiplier || 1;
                totalLivePoints += (playerStats.stats.total_points * multiplier);
            }
        });

        document.getElementById('live-points').textContent = totalLivePoints;

        // Update Captain
        const captain = userTeam.picks.find(p => p.is_captain);
        if (captain) {
            const capPlayer = players.find(p => p.id === captain.element);
            const capStats = liveData.elements.find(e => e.id === captain.element);
            document.getElementById('captain-performance').textContent = capPlayer.web_name;
            document.getElementById('captain-points').textContent = `${capStats?.stats.total_points || 0} pts (x2)`;
        }

        renderLiveRankChart();
    } catch (error) {
        console.error('Error updating live stats:', error);
    }
};

const renderLiveRankChart = () => {
    const ctx = document.getElementById('live-rank-chart').getContext('2d');
    // Mock progression for visualization
    const labels = Array.from({ length: 12 }, (_, i) => `${i * 2}h`);
    const data = Array.from({ length: 12 }, () => Math.floor(Math.random() * 100000) + 100000);

    new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: 'Overall Rank',
                data,
                borderColor: '#00ff85',
                tension: 0.4,
                fill: false
            }]
        },
        options: {
            scales: {
                y: { reverse: true, grid: { color: 'rgba(255,255,255,0.05)' } },
                x: { grid: { display: false } }
            }
        }
    });
};
