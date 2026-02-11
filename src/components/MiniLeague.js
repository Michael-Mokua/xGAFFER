import { fetchLeagueStandings } from '../services/api';
import { state } from '../store/state';

export const renderMiniLeague = () => {
    const container = document.getElementById('mini-league');
    const { userTeam } = state;

    container.innerHTML = `
        <div class="analysis-header glass">
            <h1>Mini-League Intelligence</h1>
            <p>Analyze your standing and compare metrics against league rivals.</p>
        </div>

        ${userTeam.leagues ? `
            <div class="user-leagues glass" style="margin-top: 2rem; padding: 2.5rem;">
                <h3 style="margin-bottom: 1.5rem;"><i class="fas fa-trophy" style="color: var(--accent-color)"></i> Your Mini-Leagues</h3>
                <div class="league-pills" style="display: flex; flex-wrap: wrap; gap: 1rem;">
                    ${userTeam.leagues.map(l => `
                        <button class="btn btn-secondary btn-sm league-select" data-id="${l.id}">
                            ${l.name}
                        </button>
                    `).join('')}
                </div>
            </div>
        ` : ''}

        <div class="league-controls glass" style="margin-top: 2rem; padding: 2rem; display: flex; gap: 1rem; align-items: center;">
            <input type="number" id="league-id-input" placeholder="Enter League ID (e.g. 123456)" class="input-full" style="max-width: 300px;">
            <button id="fetch-league-btn" class="btn btn-primary">Analyze League</button>
            <p class="subtitle" style="margin: 0; margin-left: auto;">Find your League ID in the URL of your league's standings page on the FPL site.</p>
        </div>

        <div id="league-results" style="margin-top: 3rem;">
            <!-- Results will be injected here -->
        </div>
    `;

    setupLeagueListeners();
};

const setupLeagueListeners = () => {
    const fetchBtn = document.getElementById('fetch-league-btn');
    const input = document.getElementById('league-id-input');

    // Select from user's leagues
    document.querySelectorAll('.league-select').forEach(btn => {
        btn.addEventListener('click', () => {
            input.value = btn.dataset.id;
            fetchBtn.click();
        });
    });

    fetchBtn.addEventListener('click', async () => {
        const leagueId = input.value.trim();
        if (!leagueId) {
            alert('Please enter a valid League ID.');
            return;
        }

        const resultsContainer = document.getElementById('league-results');
        resultsContainer.innerHTML = '<div class="loading-state glass" style="padding: 4rem;">Crunching League Data...</div>';

        try {
            const data = await fetchLeagueStandings(leagueId);
            renderLeagueResults(data);
        } catch (error) {
            resultsContainer.innerHTML = `
                <div class="error-state glass" style="padding: 4rem; text-align: center;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: #ff4b4b; margin-bottom: 2rem;"></i>
                    <h3>League Data Unavailable</h3>
                    <p>Ensure the League ID is correct and the league is Public.</p>
                </div>
            `;
        }
    });

    input.onkeypress = (e) => { if (e.key === 'Enter') fetchBtn.click(); };
};

const renderLeagueResults = (data) => {
    const resultsContainer = document.getElementById('league-results');
    const { league, standings } = data;

    resultsContainer.innerHTML = `
        <div class="league-info glass" style="margin-bottom: 2rem; padding: 2.5rem;">
            <h2>${league.name}</h2>
            <div style="display: flex; gap: 3rem; margin-top: 1rem;">
                <div><span class="label">Managers:</span> <span class="value">${standings.results.length}</span></div>
                <div><span class="label">Created:</span> <span class="value">${new Date(league.created).toLocaleDateString()}</span></div>
            </div>
        </div>

        <div class="table-container glass">
            <table class="player-table">
                <thead>
                    <tr>
                        <th>Rank</th>
                        <th>Manager / Team</th>
                        <th>GW Pts</th>
                        <th>Total Pts</th>
                        <th>Diff vs You</th>
                    </tr>
                </thead>
                <tbody>
                    ${standings.results.map(manager => {
        const isUser = state.userTeam.entryId === manager.entry;
        const diff = (manager.total - (state.userTeam.totalPoints || 0));
        const diffClass = diff > 0 ? 'negative' : (diff < 0 ? 'positive' : '');

        return `
                            <tr class="${isUser ? 'user-row' : ''}">
                                <td>${manager.rank}</td>
                                <td>
                                    <div class="manager-name">${manager.player_name}</div>
                                    <div class="team-meta">${manager.entry_name}</div>
                                </td>
                                <td>${manager.event_total}</td>
                                <td><strong>${manager.total}</strong></td>
                                <td class="${diffClass}">${diff > 0 ? '+' : ''}${diff}</td>
                            </tr>
                        `;
    }).join('')}
                </tbody>
            </table>
        </div>
    `;
};
