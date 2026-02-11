import { generateAIInsights } from '../services/advisor';

export const renderAIAdvisor = () => {
    const container = document.getElementById('ai-advisor-content');
    if (!container) return;

    const insights = generateAIInsights();

    container.innerHTML = `
        <div class="ai-card glass">
            <div class="ai-header">
                <i class="fas fa-robot"></i>
                <h3>xGAFFER Tactical Advisor</h3>
            </div>
            <div class="ai-body">
                ${insights.map(insight => `
                    <div class="ai-insight">
                        <p>${insight}</p>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
};
