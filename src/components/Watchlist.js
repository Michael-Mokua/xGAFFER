import { state } from '../store/state';

export const renderWatchlist = () => {
    const list = document.getElementById('watchlist-content');
    if (!list) return;

    const watchlist = JSON.parse(localStorage.getItem('xgaffer_watchlist') || '[]');

    if (watchlist.length === 0) {
        list.innerHTML = '<div class="empty-state">No players on your watchlist. Add some from the Analysis tab!</div>';
        return;
    }

    list.innerHTML = `
        <div class="watchlist-grid">
            ${watchlist.map(id => {
        const p = state.players.find(player => player.id === id);
        return `
                    <div class="watchlist-card glass">
                        <div class="player-info">
                            <strong>${p.web_name}</strong>
                            <span>£${(p.now_cost / 10).toFixed(1)}m</span>
                        </div>
                        <div class="price-trend ${p.cost_change_event > 0 ? 'up' : 'down'}">
                            ${p.cost_change_event > 0 ? '▲' : '▼'} £${Math.abs(p.cost_change_event / 10).toFixed(1)}
                        </div>
                        <button class="btn-icon remove-watchlist" data-id="${p.id}"><i class="fas fa-trash"></i></button>
                    </div>
                `;
    }).join('')}
        </div>
    `;

    setupWatchlistListeners();
};

const setupWatchlistListeners = () => {
    document.querySelectorAll('.remove-watchlist').forEach(btn => {
        btn.onclick = () => {
            const id = parseInt(btn.dataset.id);
            removeFromWatchlist(id);
        };
    });
};

export const addToWatchlist = (id) => {
    const watchlist = JSON.parse(localStorage.getItem('xgaffer_watchlist') || '[]');
    if (!watchlist.includes(id)) {
        watchlist.push(id);
        localStorage.setItem('xgaffer_watchlist', JSON.stringify(watchlist));
        alert('Player added to watchlist!');
    }
};

const removeFromWatchlist = (id) => {
    let watchlist = JSON.parse(localStorage.getItem('xgaffer_watchlist') || '[]');
    watchlist = watchlist.filter(wid => wid !== id);
    localStorage.setItem('xgaffer_watchlist', JSON.stringify(watchlist));
    renderWatchlist();
};
