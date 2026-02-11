import { fetchElementSummary } from '../services/api';
import { getTeamName, getPlayerPosition } from '../store/state';

export const showPlayerDetails = async (playerId) => {
    const modalContainer = document.getElementById('modal-container');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');

    modalTitle.textContent = 'Loading...';
    modalBody.innerHTML = '<div class="skeleton-loader"></div>';
    modalContainer.classList.remove('hidden');

    try {
        const summary = await fetchElementSummary(playerId);
        const player = (await import('../store/state')).state.players.find(p => p.id === playerId);

        modalTitle.textContent = player.web_name;
        modalBody.innerHTML = `
            <div class="player-detail-grid">
                <div class="detail-photo">
                    <img src="https://resources.premierleague.com/premierleague/photos/players/110x140/p${player.code}.png" alt="${player.web_name}">
                </div>
                <div class="detail-info">
                    <p><strong>Team:</strong> ${getTeamName(player.team)}</p>
                    <p><strong>Position:</strong> ${getPlayerPosition(player.element_type)}</p>
                    <p><strong>Points:</strong> ${player.total_points}</p>
                    <p><strong>Form:</strong> ${player.form}</p>
                    <p><strong>xG:</strong> <span class="tooltip-trigger" title="Expected Goals"> ${player.expected_goals}</span></p>
                    <p><strong>xA:</strong> <span class="tooltip-trigger" title="Expected Assists"> ${player.expected_assists}</span></p>
                </div>
            </div>
            <div class="history-table">
                <h3>Recent Fixtures</h3>
                <table>
                    <thead>
                        <tr>
                            <th>GW</th>
                            <th>Opponent</th>
                            <th>Pts</th>
                            <th>Mins</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${summary.history.slice(-5).reverse().map(h => `
                            <tr>
                                <td>${h.round}</td>
                                <td>${h.opponent_team}</td>
                                <td>${h.total_points}</td>
                                <td>${h.minutes}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    } catch (error) {
        modalTitle.textContent = 'Error';
        modalBody.innerHTML = '<p>Failed to load player details.</p>';
    }

    // Modal close logic
    const closeBtn = modalContainer.querySelector('.close-modal');
    const closeModal = () => modalContainer.classList.add('hidden');
    closeBtn.onclick = closeModal;
    window.onclick = (e) => { if (e.target === modalContainer) closeModal(); };
};
