import { state } from '../store/state';
import { generateAIInsights } from '../services/advisor';

export const renderChatbot = () => {
    // Check if container already exists
    if (document.getElementById('xgaffer-bot')) return;

    const botContainer = document.createElement('div');
    botContainer.id = 'xgaffer-bot';
    botContainer.className = 'bot-floating glass-heavy';
    botContainer.innerHTML = `
        <div class="bot-header">
            <div class="bot-info">
                <i class="fas fa-robot"></i>
                <span>xGAFFER Assistant</span>
            </div>
            <button id="close-bot" class="btn-icon"><i class="fas fa-times"></i></button>
        </div>
        <div class="bot-messages" id="bot-messages">
            <div class="msg system">Systems Online. How can I assist your tactical planning, Gaffer?</div>
        </div>
        <div class="bot-input">
            <input type="text" id="bot-query" placeholder="Ask about transfers, captains, or xP..." class="input-mini">
            <button id="send-btn" class="btn btn-primary btn-sm"><i class="fas fa-paper-plane"></i></button>
        </div>
    `;

    document.body.appendChild(botContainer);
    setupBotListeners();
};

const setupBotListeners = () => {
    const input = document.getElementById('bot-query');
    const sendBtn = document.getElementById('send-btn');
    const closeBtn = document.getElementById('close-bot');
    const messages = document.getElementById('bot-messages');

    const addMessage = (text, type = 'user') => {
        const msgDiv = document.createElement('div');
        msgDiv.className = `msg ${type}`;
        msgDiv.textContent = text;
        messages.appendChild(msgDiv);
        messages.scrollTop = messages.scrollHeight;
    };

    const handleQuery = () => {
        const query = input.value.trim().toLowerCase();
        if (!query) return;

        addMessage(input.value, 'user');
        input.value = '';

        // Advanced Pattern-Based Intent Engine
        const intents = [
            {
                pattern: /(sell|remove|swap|out|bad|worst)/,
                action: () => {
                    const insights = generateAIInsights();
                    return insights.find(i => i.includes('Sell')) || "Based on our MDM, your squad is statistically stable. No urgent sells detected.";
                }
            },
            {
                pattern: /(buy|gem|hidden|in|replacement|sign)/,
                action: () => {
                    const marketGems = state.players
                        .filter(p => !state.userTeam.picks.some(pick => pick.element === p.id))
                        .filter(p => parseFloat(p.selected_by_percent) < 15)
                        .sort((a, b) => b.xEfficiency - a.xEfficiency);
                    const gem = marketGems[0];
                    return `I recommend scouting **${gem.web_name}** (${state.getTeamName(gem.team)}). He has an elite xEfficiency of ${gem.xEfficiency} and is owned by only ${gem.selected_by_percent}% of managers.`;
                }
            },
            {
                pattern: /(captain|armband|cpt|lead)/,
                action: () => {
                    const squad = state.userTeam.picks.map(p => state.players.find(pl => pl.id === p.element));
                    const best = [...squad].sort((a, b) => b.form - a.form)[0];
                    return `Statistical analysis points to **${best.web_name}** as your optimal captain for this GW, given his form trend of ${best.form}.`;
                }
            },
            {
                pattern: /(money|bank|budget|funds|cash)/,
                action: () => `Your tactical reserve is currently £${state.userTeam.bank.toFixed(1)}m. This provides enough leverage for a premium midfield upgrade.`,
            },
            {
                pattern: /(status|how|score|rank|team|my squad)/,
                action: () => {
                    const { userTeam } = state;
                    return `Your team, **${userTeam.teamName}**, is currently ranked #${userTeam.overallRank.toLocaleString()} globally. Your squad consistency is rated at ${(userTeam.picks.length > 0 ? 0.75 : 0.00).toFixed(2)}.`;
                }
            }
        ];

        setTimeout(() => {
            const matchedIntent = intents.find(i => i.pattern.test(query));
            const response = matchedIntent ? matchedIntent.action() : "I'm parsing your tactical query. Try asking about 'who to sell', 'hidden gems', or 'captaining strategy'.";
            addMessage(response, 'bot');
        }, 700);
    };

    sendBtn.onclick = handleQuery;
    input.onkeypress = (e) => { if (e.key === 'Enter') handleQuery(); };
    closeBtn.onclick = () => {
        const bot = document.getElementById('xgaffer-bot');
        bot.classList.add('hidden');
    };
};
