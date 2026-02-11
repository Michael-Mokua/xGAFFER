import { state, getPlayerPosition, getTeamName, setState } from '../store/state';
import { calculatePlayerXP } from '../services/projections';

export const renderPlayerAnalysis = () => {
    const container = document.getElementById('analysis');
    const { players, teams } = state;

    if (players.length === 0) {
        container.innerHTML = `<div class="loading-state">Loading player data...</div>`;
        return;
    }

    container.innerHTML = `
        <div class="analysis-header">
            <h1>Player Analysis</h1>
            <div class="filters">
                <input type="text" id="player-search" placeholder="Search players..." class="input-search">
                <select id="pos-filter" class="select-filter">
                    <option value="">All Positions</option>
                    <option value="1">GKP</option>
                    <option value="2">DEF</option>
                    <option value="3">MID</option>
                    <option value="4">FWD</option>
                </select>
                <select id="team-filter" class="select-filter">
                    <option value="">All Teams</option>
                    ${teams.map(t => `<option value="${t.id}">${t.name}</option>`).join('')}
                </select>
                <div class="filter-toggle glass">
                    <input type="checkbox" id="gem-filter">
                    <label for="gem-filter"><i class="fas fa-gem"></i> Hidden Gems</label>
                </div>
            </div>
        </div>

        <div class="table-container">
            <table class="player-table" id="player-table">
                <thead>
                    <tr>
                        <th data-sort="web_name">Player <i class="fas fa-sort"></i></th>
                        <th data-sort="now_cost">Price <i class="fas fa-sort"></i></th>
                        <th data-sort="total_points">Pts <i class="fas fa-sort"></i></th>
                        <th data-sort="selected_by_percent">Sel. % <i class="fas fa-sort"></i></th>
                        <th data-sort="form">Form <i class="fas fa-sort"></i></th>
                        <th data-sort="xP">xP <i class="fas fa-sort"></i></th>
                        <th data-sort="consistency">Reliability <i class="fas fa-sort"></i></th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody id="player-table-body">
                    ${renderTableRows(players.slice(0, 50))}
                </tbody>
            </table>
        </div>
        <div class="load-more">
            <button class="btn btn-secondary" id="load-more-btn">Load More</button>
        </div>
    `;

    setupAnalysisListeners();
};

const renderTableRows = (players) => {
    return players.map(player => {
        const xP = calculatePlayerXP(player);
        const vfm = (player.total_points / (player.now_cost / 10)).toFixed(1);

        const rowClass = player.chance_of_playing_next_round !== null && player.chance_of_playing_next_round < 100 ? 'flagged' : '';

        return `
            <tr data-id="${player.id}" class="${rowClass}">
                <td>
                    <div class="player-info">
                        <span class="player-name">${player.web_name}</span>
                        <span class="player-team-pos">${state.teams.find(t => t.id === player.team).short_name} - ${player.element_type === 1 ? 'GKP' : player.element_type === 2 ? 'DEF' : player.element_type === 3 ? 'MID' : 'FWD'}</span>
                    </div>
                </td>
                <td>£${(player.now_cost / 10).toFixed(1)}m</td>
                <td>${player.total_points}</td>
                <td>${player.selected_by_percent}%</td>
                <td>${player.form}</td>
                <td style="color: var(--accent-color); font-weight: 700;">${xP}</td>
                <td>
                    <div class="reliability-meter">
                        <div class="meter-bar" style="width: ${Math.min(100, (player.consistency || 0) * 100)}%;"></div>
                    </div>
                </td>
                <td>
                    <button class="btn-icon add-to-team" title="Add to Team"><i class="fas fa-plus"></i></button>
                    <button class="btn-icon add-to-watchlist" title="Add to Watchlist"><i class="fas fa-eye"></i></button>
                </td>
            </tr>
        `;
    }).join('');
};

const setupAnalysisListeners = () => {
    const searchInput = document.getElementById('player-search');
    const posFilter = document.getElementById('pos-filter');
    const teamFilter = document.getElementById('team-filter');
    const gemFilter = document.getElementById('gem-filter');
    const tableBody = document.getElementById('player-table-body');
    const tableHeaders = document.querySelectorAll('.player-table th[data-sort]');

    let displayedCount = 50;
    let currentSort = { key: 'total_points', dir: 'desc' };

    const debounce = (func, delay) => {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func(...args), delay);
        };
    };

    const filterAndSortPlayers = () => {
        const query = searchInput.value.toLowerCase();
        const pos = posFilter.value;
        const team = teamFilter.value;
        const hideTemplate = gemFilter.checked;

        let filtered = state.players.filter(p => {
            const matchesSearch = p.web_name.toLowerCase().includes(query);
            const matchesPos = !pos || p.element_type === parseInt(pos);
            const matchesTeam = !team || p.team === parseInt(team);
            const isGem = !hideTemplate || (parseFloat(p.selected_by_percent) < 15 && parseFloat(p.xEfficiency) > 0.5);
            return matchesSearch && matchesPos && matchesTeam && isGem;
        });

        filtered.sort((a, b) => {
            let key = currentSort.key;
            let valA = a[key];
            let valB = b[key];

            if (key === 'web_name') {
                return currentSort.dir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
            }

            valA = parseFloat(valA) || 0;
            valB = parseFloat(valB) || 0;
            return currentSort.dir === 'asc' ? valA - valB : valB - valA;
        });

        tableBody.innerHTML = renderTableRows(filtered.slice(0, displayedCount));
    };

    const debouncedFilter = debounce(filterAndSortPlayers, 300);

    searchInput.addEventListener('input', debouncedFilter);
    posFilter.addEventListener('change', filterAndSortPlayers);
    teamFilter.addEventListener('change', filterAndSortPlayers);
    gemFilter.addEventListener('change', filterAndSortPlayers);

    tableHeaders.forEach(th => {
        th.addEventListener('click', () => {
            const key = th.dataset.sort;
            if (currentSort.key === key) {
                currentSort.dir = currentSort.dir === 'asc' ? 'desc' : 'asc';
            } else {
                currentSort.key = key;
                currentSort.dir = 'desc';
            }

            tableHeaders.forEach(h => {
                const icon = h.querySelector('i');
                if (icon) icon.className = 'fas fa-sort';
            });
            const activeIcon = th.querySelector('i');
            if (activeIcon) activeIcon.className = `fas fa-sort-${currentSort.dir === 'asc' ? 'up' : 'down'}`;

            filterAndSortPlayers();
        });
    });

    document.getElementById('load-more-btn').addEventListener('click', () => {
        displayedCount += 50;
        filterAndSortPlayers();
    });

    tableBody.addEventListener('click', async (e) => {
        if (e.target.closest('.add-to-team')) {
            const row = e.target.closest('tr');
            const playerId = parseInt(row.dataset.id);
            addPlayerToSquad(playerId);
        }

        if (e.target.closest('.add-to-watchlist')) {
            const row = e.target.closest('tr');
            const playerId = parseInt(row.dataset.id);
            const { addToWatchlist } = await import('./Watchlist');
            addToWatchlist(playerId);
        }
    });
};

const addPlayerToSquad = (playerId) => {
    const player = state.players.find(p => p.id === playerId);
    const { userTeam } = state;

    if (userTeam.picks.some(p => p.element === playerId)) {
        alert('Player already in squad!');
        return;
    }

    if (userTeam.picks.length >= 15) {
        alert('Squad is full (15 players max)!');
        return;
    }

    // Positions limits
    const posCount = userTeam.picks.reduce((acc, pick) => {
        const p = state.players.find(pl => pl.id === pick.element);
        acc[p.element_type] = (acc[p.element_type] || 0) + 1;
        return acc;
    }, {});

    const limits = { 1: 2, 2: 5, 3: 5, 4: 3 };
    if ((posCount[player.element_type] || 0) >= limits[player.element_type]) {
        alert(`You can only have ${limits[player.element_type]} players in this position.`);
        return;
    }

    // Budget check
    if (userTeam.bank < (player.now_cost / 10)) {
        alert('Insufficient budget!');
        return;
    }

    // Club limit
    const clubCount = userTeam.picks.filter(pick => {
        const p = state.players.find(pl => pl.id === pick.element);
        return p.team === player.team;
    }).length;

    if (clubCount >= 3) {
        alert(`You can only have 3 players from ${getTeamName(player.team)}.`);
        return;
    }

    const newPicks = [...userTeam.picks, { element: playerId, position: userTeam.picks.length + 1 }];
    const newBank = userTeam.bank - (player.now_cost / 10);

    setState({
        userTeam: { ...userTeam, picks: newPicks, bank: newBank }
    });

    alert(`${player.web_name} added to your squad!`);
};
