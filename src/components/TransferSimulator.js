import { state, getPlayerPosition, getTeamName, setState } from '../store/state';
import { calculatePlayerXP } from '../services/projections';

export const renderTransferSimulator = () => {
    const container = document.getElementById('transfers');
    const { userTeam, players } = state;

    if (players.length === 0) {
        container.innerHTML = `<div class="loading-state">Loading player data...</div>`;
        return;
    }

    const squad = userTeam.picks.map(pick => {
        const player = players.find(p => p.id === pick.element);
        return { ...player, ...pick };
    });

    container.innerHTML = `
        <div class="transfers-header glass">
            <div class="header-content">
                <h1>Transfer Simulator</h1>
                <p class="subtitle">Tactical Planning & Squad Optimization</p>
            </div>
            <div class="stats-summary">
                <div class="stat-card">
                    <span class="stat-label">Budget</span>
                    <span class="stat-value">£${userTeam.bank.toFixed(1)}m</span>
                </div>
                <div class="stat-card">
                    <span class="stat-label">Transfers</span>
                    <span class="stat-value">${userTeam.transfers}</span>
                </div>
            </div>
        </div>

        <div class="transfer-grid">
            <div class="current-squad-panel glass">
                <h3>Current Squad</h3>
                <p class="panel-subtitle">Select a player to transfer out</p>
                <div class="transfers-list" id="out-list">
                    ${renderTransferPicks(squad)}
                </div>
            </div>
            
            <div class="search-panel glass hidden" id="replacement-panel">
                <h3>Select Replacement</h3>
                <div class="replacement-filters">
                    <input type="text" id="replacement-search" placeholder="Search replacement..." class="input-search">
                    <button class="btn btn-secondary" id="suggest-best-btn" title="Suggest top performer in this position">
                        <i class="fas fa-magic"></i> Suggest
                    </button>
                    <button class="btn btn-primary" id="ai-solve-btn" title="AI Optimal Solver">
                        <i class="fas fa-brain"></i> AI Solve
                    </button>
                </div>
                <div class="transfers-list" id="in-list">
                    <!-- Replacements will be rendered here -->
                </div>
                <button class="btn btn-secondary btn-full" style="margin-top: 1rem; width: 100%; border-radius: 12px;" id="cancel-transfer">Cancel</button>
            </div>

            <div class="placeholder-panel glass" id="replacement-placeholder">
                <div class="placeholder-content">
                    <i class="fas fa-exchange-alt"></i>
                    <p>Select a player from the left to explore replacements.</p>
                </div>
            </div>
        </div>

        <div class="transfer-footer" style="margin-top: 3rem; text-align: center;">
            <button class="btn btn-primary btn-lg" id="confirm-sync-btn">
                <i class="fas fa-check-circle"></i> Confirm & Sync Moves
            </button>
        </div>
    `;

    setupTransferListeners();
};

const renderTransferPicks = (picks) => {
    return picks.map(player => `
        <div class="transfer-pick" data-id="${player.id}" data-pos="${player.element_type}">
            <div class="pick-info">
                <span class="pick-name">${player.web_name}</span>
                <span class="pick-meta">${getPlayerPosition(player.element_type)} | £${(player.now_cost / 10).toFixed(1)}</span>
            </div>
            <button class="btn-icon transfer-out-btn"><i class="fas fa-minus-circle"></i></button>
        </div>
    `).join('') || '<p class="empty-msg">No players in squad.</p>';
};

const setupTransferListeners = () => {
    const outList = document.getElementById('out-list');
    const replacementPanel = document.getElementById('replacement-panel');
    const replacementPlaceholder = document.getElementById('replacement-placeholder');
    const inList = document.getElementById('in-list');
    const cancelBtn = document.getElementById('cancel-transfer');
    const searchInput = document.getElementById('replacement-search');

    let selectedOutId = null;
    let selectedOutPos = null;

    outList.addEventListener('click', (e) => {
        const btn = e.target.closest('.transfer-out-btn');
        if (btn) {
            const item = btn.closest('.transfer-pick');
            selectedOutId = parseInt(item.dataset.id);
            selectedOutPos = parseInt(item.dataset.pos);

            replacementPlaceholder.classList.add('hidden');
            replacementPanel.classList.remove('hidden');

            showReplacements(selectedOutPos, selectedOutId);
        }
    });

    cancelBtn.addEventListener('click', () => {
        replacementPanel.classList.add('hidden');
        replacementPlaceholder.classList.remove('hidden');
    });

    const showReplacements = (pos, outId) => {
        const outPlayer = state.players.find(p => p.id === outId);
        const maxPrice = (outPlayer.now_cost / 10) + state.userTeam.bank;

        const replacements = state.players.filter(p =>
            p.element_type === pos &&
            p.id !== outId &&
            (p.now_cost / 10) <= maxPrice &&
            !state.userTeam.picks.some(pick => pick.element === p.id)
        ).sort((a, b) => b.total_points - a.total_points).slice(0, 20);

        inList.innerHTML = replacements.map(p => {
            const xP = calculatePlayerXP(p);
            return `
                <div class="transfer-pick in" data-id="${p.id}">
                    <div class="pick-info">
                        <span class="pick-name">${p.web_name}</span>
                        <span class="pick-meta">£${(p.now_cost / 10).toFixed(1)} | xP: ${xP}</span>
                    </div>
                    <button class="btn-icon transfer-in-btn"><i class="fas fa-plus-circle"></i></button>
                </div>
            `;
        }).join('') || '<p class="empty-msg">No affordable replacements found.</p>';
    };

    inList.addEventListener('click', (e) => {
        const btn = e.target.closest('.transfer-in-btn');
        if (btn) {
            const playerId = parseInt(btn.closest('.transfer-pick').dataset.id);
            completeTransfer(selectedOutId, playerId);
        }
    });

    searchInput.addEventListener('input', () => {
        const query = searchInput.value.toLowerCase();
        const items = inList.querySelectorAll('.transfer-pick');
        items.forEach(item => {
            const name = item.querySelector('.pick-name').textContent.toLowerCase();
            item.style.display = name.includes(query) ? 'flex' : 'none';
        });
    });

    document.getElementById('suggest-best-btn').addEventListener('click', () => {
        const items = inList.querySelectorAll('.transfer-pick');
        if (items.length > 0) {
            // Replacements are already sorted by total_points in showReplacements
            const bestId = parseInt(items[0].dataset.id);
            completeTransfer(selectedOutId, bestId);
        }
    });

    document.getElementById('ai-solve-btn').addEventListener('click', () => {
        const outPlayer = state.players.find(p => p.id === selectedOutId);
        const maxPrice = (outPlayer.now_cost / 10) + state.userTeam.bank;

        const bestMatch = state.players
            .filter(p => p.element_type === selectedOutPos && p.id !== selectedOutId && (p.now_cost / 10) <= maxPrice && !state.userTeam.picks.some(pick => pick.element === p.id))
            .sort((a, b) => {
                const xPA = parseFloat(calculatePlayerXP(a));
                const xPB = parseFloat(calculatePlayerXP(b));
                return xPB - xPA;
            })[0];

        if (bestMatch) {
            const xP = calculatePlayerXP(bestMatch);
            if (confirm(`AI Optimal Solver recommends ${bestMatch.web_name} (True xP: ${xP}). Proceed?`)) {
                completeTransfer(selectedOutId, bestMatch.id);
            }
        }
    });

    document.getElementById('confirm-sync-btn').addEventListener('click', () => {
        if (state.userTeam.transfers === 0) {
            alert("No transfers simulated yet. Make some moves first!");
            return;
        }

        const summary = `
            <h3>xGAFFER Sync Manual</h3>
            <p style="margin-bottom: 1rem; color: var(--text-muted);">Official FPL API requires manual entry for security. Please perform these moves on the official site:</p>
            <div style="background: rgba(0,0,0,0.2); padding: 1rem; border-radius: 10px; margin-bottom: 2rem; border: 1px dashed var(--accent-color);">
                <p><strong>Total Moves:</strong> ${state.userTeam.transfers}</p>
                <p><strong>Remaining Budget:</strong> £${state.userTeam.bank.toFixed(1)}m</p>
            </div>
            <p style="font-size: 0.9rem;">⚠️ <em>Note: After confirming on the official site, click 'Sync' in the xGAFFER header to refresh your squad stats.</em></p>
        `;

        const modalContainer = document.getElementById('modal-container');
        const modalTitle = document.getElementById('modal-title');
        const modalBody = document.getElementById('modal-body');

        modalTitle.textContent = "Confirm & Sync Strategy";
        modalBody.innerHTML = summary;
        modalContainer.classList.remove('hidden');

        const closeBtn = modalContainer.querySelector('.close-modal');
        closeBtn.onclick = () => modalContainer.classList.add('hidden');
    });
};

const completeTransfer = (outId, inId) => {
    const outPlayer = state.players.find(p => p.id === outId);
    const inPlayer = state.players.find(p => p.id === inId);

    const { userTeam } = state;
    const newPicks = userTeam.picks.map(p =>
        p.element === outId ? { ...p, element: inId } : p
    );

    const costDiff = (inPlayer.now_cost - outPlayer.now_cost) / 10;
    const newBank = userTeam.bank - costDiff;

    setState({
        userTeam: {
            ...userTeam,
            picks: newPicks,
            bank: newBank,
            transfers: userTeam.transfers + 1
        }
    });

    alert(`Transfer complete: ${outPlayer.web_name} -> ${inPlayer.web_name}`);
    renderTransferSimulator();
};
