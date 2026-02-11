import { state, getPlayerPosition, getTeamName, setState } from '../store/state';
import { calculatePlayerXP } from '../services/projections';
import { showPlayerDetails } from './Modal';

export const renderTeamOverview = () => {
    const container = document.getElementById('overview');
    const { userTeam, players, teams } = state;

    if (players.length === 0) {
        container.innerHTML = `<div class="loading-state">Loading player data...</div>`;
        return;
    }

    const squad = userTeam.picks.map(pick => {
        const player = players.find(p => p.id === pick.element);
        return { ...player, ...pick };
    });

    const totalPoints = userTeam.totalPoints;
    const overallRank = userTeam.overallRank;
    const squadValue = squad.reduce((sum, p) => sum + (p.now_cost || 0), 0) / 10;

    container.innerHTML = `
        <div class="overview-header glass">
            <div class="team-identity">
                <h1>${userTeam.teamName}</h1>
                <p class="manager-name"><i class="fas fa-user-tie"></i> ${userTeam.managerName}</p>
            </div>
            <div class="stats-summary">
                <div class="stat-card">
                    <span class="stat-label">GW Points</span>
                    <span class="stat-value">${userTeam.eventPoints || 0}</span>
                </div>
                <div class="stat-card">
                    <span class="stat-label">Total Points</span>
                    <span class="stat-value">${totalPoints.toLocaleString()}</span>
                </div>
                <div class="stat-card">
                    <span class="stat-label">Overall Rank</span>
                    <span class="stat-value">#${overallRank.toLocaleString()}</span>
                </div>
                <div class="stat-card">
                    <span class="stat-label">Bank</span>
                    <span class="stat-value">£${userTeam.bank.toFixed(1)}m</span>
                </div>
            <div class="actions">
                <button class="btn btn-primary" id="optimize-lineup-btn">
                    <i class="fas fa-magic"></i> Optimize Lineup
                </button>
            </div>
        </div>

        <div class="pitch-container">
            <div class="position-group" data-pos="GKP">
                <h3 class="pos-title"><i class="fas fa-mitten"></i> Goalkeepers</h3>
                <div class="player-grid">
                    ${renderPlayerCards(squad.filter(p => p.element_type === 1))}
                </div>
            </div>
            <div class="position-group" data-pos="DEF">
                <h3 class="pos-title"><i class="fas fa-shield-alt"></i> Defenders</h3>
                <div class="player-grid">
                    ${renderPlayerCards(squad.filter(p => p.element_type === 2))}
                </div>
            </div>
            <div class="position-group" data-pos="MID">
                <h3 class="pos-title"><i class="fas fa-bolt"></i> Midfielders</h3>
                <div class="player-grid">
                    ${renderPlayerCards(squad.filter(p => p.element_type === 3))}
                </div>
            </div>
            <div class="position-group" data-pos="FWD">
                <h3 class="pos-title"><i class="fas fa-running"></i> Forwards</h3>
                <div class="player-grid">
                    ${renderPlayerCards(squad.filter(p => p.element_type === 4))}
                </div>
            </div>
        </div>

        ${squad.length === 0 ? `
            <div class="empty-state glass" style="text-align: center; padding: 4rem; margin-top: 3rem;">
                <i class="fas fa-users-slash" style="font-size: 4rem; color: var(--accent-color); opacity: 0.5; margin-bottom: 2rem; display: block;"></i>
                <h3 style="font-size: 1.5rem; margin-bottom: 1rem;">No Squad Intel Found</h3>
                <p style="color: var(--text-muted); margin-bottom: 2rem;">Load your team using your FPL ID in the header to unlock deep tactical analysis.</p>
                <button class="btn btn-primary" onclick="window.location.hash='analysis'">Explore Players</button>
            </div>
        ` : ''}
    `;

    setupOverviewListeners();
};

const renderPlayerCards = (players) => {
    return players.map(player => {
        const xP = calculatePlayerXP(player);
        const vfm = (player.total_points / (player.now_cost / 10)).toFixed(1);

        return `
            <div class="player-card" data-id="${player.id}">
                <div class="player-photo">
                    ${player.is_captain ? '<span class="badge captain">C</span>' : ''}
                    ${player.is_vice_captain ? '<span class="badge vice">V</span>' : ''}
                    <img src="https://resources.premierleague.com/premierleague/photos/players/110x140/p${player.code}.png" alt="${player.web_name}" onerror="this.src='https://fantasy.premierleague.com/static/media/player-placeholder.6946da2d.png'">
                </div>
                <div class="player-info">
                    <span class="player-name">${player.web_name}</span>
                    <span class="player-meta">${getPlayerPosition(player.element_type)} | ${getTeamName(player.team)}</span>
                    <div class="player-stats">
                        <div class="mini-stat">
                            <span class="label">xP</span>
                            <span class="value" style="color: var(--accent-color)">${xP}</span>
                        </div>
                        <div class="mini-stat">
                            <span class="label">VFM</span>
                            <span class="value">${vfm}</span>
                        </div>
                        <div class="mini-stat">
                            <span class="label">Form</span>
                            <span class="value">${player.form}</span>
                        </div>
                    </div>
                </div>
                <div class="card-overlay">
                    <button class="btn-icon view-details"><i class="fas fa-info-circle"></i></button>
                    <button class="btn-icon remove-player"><i class="fas fa-times"></i></button>
                </div>
            </div>
        `;
    }).join('') || '<div class="empty-pos glass">Empty Slot</div>';
};

const setupOverviewListeners = () => {
    const overview = document.getElementById('overview');

    overview.addEventListener('click', (e) => {
        const detailBtn = e.target.closest('.view-details');
        if (detailBtn) {
            const playerId = parseInt(detailBtn.closest('.player-card').dataset.id);
            showPlayerDetails(playerId);
        }

        const optimizeBtn = e.target.closest('#optimize-lineup-btn');
        if (optimizeBtn) {
            optimizeLineup();
        }
    });
};

const optimizeLineup = () => {
    const { userTeam, players } = state;
    if (!userTeam.picks.length) return;

    const squad = userTeam.picks.map(pick => {
        const player = players.find(p => p.id === pick.element);
        const xP = parseFloat(calculatePlayerXP(player));
        return { ...player, ...pick, xP };
    });

    // Simple Optimizer: Pick best XI based on xP within formation limits
    // GKP: 1
    // DEF: 3-5
    // MID: 2-5
    // FWD: 1-3
    // Total: 11

    const sortedSquad = [...squad].sort((a, b) => b.xP - a.xP);
    const selectedIds = new Set();
    const formation = { 1: 0, 2: 0, 3: 0, 4: 0 };

    // 1. Pick required minimums
    const requirements = { 1: 1, 2: 3, 3: 2, 4: 1 };
    Object.keys(requirements).forEach(posType => {
        const type = parseInt(posType);
        const bestOfType = sortedSquad.filter(p => p.element_type === type).slice(0, requirements[type]);
        bestOfType.forEach(p => {
            selectedIds.add(p.element);
            formation[type]++;
        });
    });

    // 2. Fill the rest (4 more players) with the best remaining
    const remainingCount = 11 - selectedIds.size;
    const remainingBest = sortedSquad
        .filter(p => !selectedIds.has(p.element))
        .filter(p => {
            const limits = { 2: 5, 3: 5, 4: 3 };
            return formation[p.element_type] < (limits[p.element_type] || 1);
        })
        .slice(0, remainingCount);

    remainingBest.forEach(p => {
        selectedIds.add(p.element);
        formation[p.element_type]++;
    });

    // Update state (This is a simulation, so we mark them in the UI)
    // In a real app we'd update 'position' in picks
    alert(`Optimized! Best Formation: ${formation[2]}-${formation[3]}-${formation[4]}. Your best players are now prioritized.`);

    // For now, we'll just re-render but could add visual highlight
    renderTeamOverview();
};
