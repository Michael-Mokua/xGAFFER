import { state } from '../store/state';

export const generateAIInsights = () => {
    const { userTeam, players, events } = state;
    if (!userTeam.picks.length) return ["Welcome, Gaffer. Load your team to begin the deep analysis."];

    const currentSquad = userTeam.picks.map(pick => {
        const p = players.find(pl => pl.id === pick.element);
        const availabilityWeight = (p.chance_of_playing_next_round !== null ? p.chance_of_playing_next_round : 100) / 100;

        // Advanced Weighted Logic (True xP)
        const xP = ((parseFloat(p.form) * availabilityWeight * 1.5) + (5 - (p.difficulty || 3)) * 0.8).toFixed(1);
        const vfm = (p.total_points / (p.now_cost / 10)).toFixed(1);
        return { ...p, ...pick, xP, vfm, availabilityWeight };
    });

    const insights = [];

    // 1. Critical "Sell" Alert (Low xP/High Price)
    const underperformers = currentSquad
        .filter(p => p.xP < 3.0 && p.now_cost > 70)
        .sort((a, b) => a.xP - b.xP);

    if (underperformers.length > 0) {
        const p = underperformers[0];
        insights.push(`🚨 **High-Priority Sell**: ${p.web_name} is underperforming relative to his £${(p.now_cost / 10).toFixed(1)}m price tag. Our AI suggests swapping him for a high-xP differential.`);
    }

    // 2. Market Gem (High xP / Low Ownership)
    const marketGems = players
        .filter(p => !userTeam.picks.some(pick => pick.element === p.id))
        .filter(p => parseFloat(p.selected_by_percent) < 15 && parseFloat(p.form) > 5.0)
        .sort((a, b) => b.form - a.form);

    if (marketGems.length > 0) {
        const gem = marketGems[0];
        insights.push(`💎 **Hidden Gem Alert**: ${gem.web_name} (${gem.selected_by_percent}% ownership) is in elite form. Bringing him in now could lead to massive rank gains.`);
    }

    // 3. Captaincy Optimization
    const bestCap = [...currentSquad].sort((a, b) => b.xP - a.xP)[0];
    if (bestCap && !bestCap.is_captain) {
        insights.push(`👑 **Captaincy Correction**: Our projections show ${bestCap.web_name} has a higher xP (${bestCap.xP}) than your current captain for this GW. Consider switching.`);
    }

    // 4. Structural Risk
    const totalValue = currentSquad.reduce((acc, p) => acc + p.now_cost, 0) / 10;
    if (totalValue < 95) {
        insights.push(`⚠️ **Value Warning**: Your squad value is low. You are leaving too much 'intel capital' on the table. Invest in more premium assets.`);
    }

    // 5. Fixture Swing
    const toughFixtures = currentSquad.filter(p => p.difficulty >= 4);
    if (toughFixtures.length > 2) {
        insights.push(`📅 **Fixture Friction**: You have ${toughFixtures.length} players facing difficult matches. A 'mini-rebuild' over the next 2 GWs is recommended.`);
    }

    // 6. Availability Alerts (Injuries/Suspensions)
    const flagged = currentSquad.filter(p => p.chance_of_playing_next_round !== null && p.chance_of_playing_next_round < 100);
    if (flagged.length > 0) {
        const p = flagged[0];
        insights.push(`🚑 **Medical Report**: ${p.web_name} is currently flagged (${p.news}). Check the latest press conference updates before the deadline.`);
    }

    // 7. Market Pulse (Price Fluctuations)
    const priceRisks = currentSquad.filter(p => p.cost_change_event < 0).length;
    if (priceRisks > 3) {
        insights.push(`📉 **Budget Bleed**: You have multiple players losing value this GW. Consider early transfers to protect your team value.`);
    }

    return insights;
};
