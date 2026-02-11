import { state } from '../store/state';

/**
 * Massive Data Model (MDM) - xGAFFER Projection Engine
 * Calculates expected points (xP) over multiple gameweeks.
 */
/**
 * Centralized xP calculation formula
 */
export const calculatePlayerXP = (player) => {
    const availabilityWeight = (player.chance_of_playing_next_round !== null ? player.chance_of_playing_next_round : 100) / 100;
    const fixtureDifficulty = player.difficulty || 3;
    const basexP = (parseFloat(player.form) || 2.0) * availabilityWeight;
    const difficultyMod = (5 - fixtureDifficulty) / 2;
    return (basexP + difficultyMod).toFixed(1);
};

export const calculateProjections = (playerId, horizon = 5) => {
    const player = state.players.find(p => p.id === playerId);
    if (!player) return [];

    const projections = [];
    const availabilityWeight = (player.chance_of_playing_next_round !== null ? player.chance_of_playing_next_round : 100) / 100;
    const basexP = (parseFloat(player.form) || 2.0) * availabilityWeight;

    // Simulate multi-GW projections based on decaying form and fixture difficulty
    for (let i = 1; i <= horizon; i++) {
        const fixtureDifficulty = player.difficulty || 3;
        // Simple heuristic: Decay form slightly each week, modify by fixture
        const decay = Math.pow(0.95, i);
        const difficultyMod = (5 - fixtureDifficulty) / 2; // Easier fixtures = higher mod

        const xP = (basexP * decay + difficultyMod + (Math.random() * 0.5)).toFixed(1);

        projections.push({
            gw: i,
            xP: parseFloat(xP),
            availabilityWeight // Keep track of the reliability weight
        });
    }

    return projections;
};

export const getSquadProjections = (horizon = 5) => {
    const { userTeam } = state;
    if (!userTeam.picks.length) return [];

    const squadxP = Array.from({ length: horizon }, (_, i) => ({
        gw: i + 1,
        totalxP: 0
    }));

    userTeam.picks.forEach(pick => {
        const playerProjections = calculateProjections(pick.element, horizon);
        playerProjections.forEach((proj, idx) => {
            squadxP[idx].totalxP += proj.xP;
        });
    });

    return squadxP.map(p => ({ ...p, totalxP: parseFloat(p.totalxP.toFixed(1)) }));
};
