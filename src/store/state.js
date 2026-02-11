export const state = {
    players: [],
    teams: [],
    events: [], // Gameweeks
    elements: [], // Player types (GK, DEF, etc)
    userTeam: JSON.parse(localStorage.getItem('fpl_user_team')) || {
        picks: [],
        transfers: 0,
        bank: 100.0,
        teamName: 'My Team',
        managerName: '',
        totalPoints: 0,
        overallRank: 0,
        eventPoints: 0,
        eventRank: 0,
    },
    loading: false,
    error: null,
    isLoggedIn: false,
};

export const setState = (newState) => {
    // Enrich players if they are being updated
    if (newState.players) {
        newState.players = newState.players.map(p => ({
            ...p,
            ppm: p.minutes > 0 ? (p.total_points / p.minutes).toFixed(3) : 0,
            vfm: (p.total_points / (p.now_cost / 10)).toFixed(2),
            // Mock consistency for now (Standard Deviation of points would be ideal but needs match history)
            consistency: (parseFloat(p.form) / 8).toFixed(2), // Ratio vs peak form
            xEfficiency: (parseFloat(p.form) / (p.now_cost / 10)).toFixed(2)
        }));
    }

    Object.assign(state, newState);
    if (newState.userTeam) {
        localStorage.setItem('fpl_user_team', JSON.stringify(state.userTeam));
    }
    // Simple event emitter for reactive updates
    document.dispatchEvent(new CustomEvent('stateUpdate', { detail: state }));
};

export const getPlayerPosition = (element_type) => {
    const types = {
        1: 'GKP',
        2: 'DEF',
        3: 'MID',
        4: 'FWD'
    };
    return types[element_type] || '???';
};

export const getTeamName = (teamId) => {
    const team = state.teams.find(t => t.id === teamId);
    return team ? team.name : 'Unknown';
};
