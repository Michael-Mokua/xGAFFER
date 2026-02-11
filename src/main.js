import './style.css';
import { fetchBootstrapStatic, fetchTeamPicks, fetchEntryInfo } from './services/api';
import { state, setState } from './store/state';

// Component imports
import { renderTeamOverview } from './components/TeamOverview';
import { renderPlayerAnalysis } from './components/PlayerAnalysis';
import { renderTransferSimulator } from './components/TransferSimulator';
import { renderProjections } from './components/Projections';
import { renderAIAdvisor } from './components/AIAdvisor';
import { renderChatbot } from './components/Chatbot';
import { setupAccountListeners, updateAccountUI } from './components/Account';
import { setupNotificationListeners, addNotification } from './components/Notifications';
import { renderLiveDashboard } from './components/LiveDashboard';
import { renderMiniLeague } from './components/MiniLeague';
import { renderWatchlist } from './components/Watchlist';
import { exportSquadCSV } from './utils/export';

const app = {
    async init() {
        this.setupNavigation();
        this.setupEventListeners();
        await this.loadInitialData();
        setupAccountListeners();
        setupNotificationListeners();
        this.startBackgroundPoller();
        renderChatbot();
        this.route();
    },

    setupNavigation() {
        const navLinks = document.querySelectorAll('.nav-links a');
        const hamburger = document.getElementById('hamburger');
        const navLinksList = document.getElementById('nav-links');

        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const sectionId = link.getAttribute('data-section');
                this.navigate(sectionId);

                // Close mobile menu
                if (navLinksList.classList.contains('mobile-active')) {
                    navLinksList.classList.remove('mobile-active');
                }
            });
        });

        hamburger.addEventListener('click', () => {
            navLinksList.classList.toggle('mobile-active');
        });

        // Logo click
        document.querySelector('.logo').addEventListener('click', (e) => {
            e.preventDefault();
            this.navigate('overview');
        });
    },

    setupEventListeners() {
        // Global state updates
        document.addEventListener('stateUpdate', (e) => {
            const newState = e.detail;
            if (newState.loading) {
                document.body.classList.add('loading');
            } else {
                document.body.classList.remove('loading');
            }
        });

        // Sync button
        document.getElementById('refresh-data').addEventListener('click', () => {
            this.loadInitialData();
        });

        // Load team button
        document.getElementById('load-team-btn').addEventListener('click', () => {
            const teamId = document.getElementById('team-id-input').value;
            if (teamId) {
                this.loadTeam(teamId);
            }
        });

        // Export CSV button
        document.getElementById('export-btn').addEventListener('click', () => {
            exportSquadCSV(state.userTeam.picks, state.players);
        });

        // Handle hash changes for back/forward support
        window.addEventListener('hashchange', () => {
            this.route();
        });
    },

    async loadInitialData() {
        setState({ loading: true });
        try {
            const data = await fetchBootstrapStatic();
            setState({
                players: data.elements,
                teams: data.teams,
                events: data.events,
                loading: false
            });
            console.log('Data loaded successfully');
        } catch (error) {
            setState({
                error: 'Failed to fetch data from FPL API. Please try again later.',
                loading: false
            });
            this.showError(state.error);
        }
    },

    navigate(sectionId) {
        window.location.hash = sectionId;
    },

    route() {
        const hash = window.location.hash.slice(1) || 'overview';
        const sections = document.querySelectorAll('.content-section');
        const navLinks = document.querySelectorAll('.nav-links a');

        sections.forEach(s => s.classList.remove('active'));
        navLinks.forEach(l => l.classList.remove('active'));

        const activeSection = document.getElementById(hash);
        const activeLink = document.querySelector(`[data-section="${hash}"]`);

        if (activeSection) activeSection.classList.add('active');
        if (activeLink) activeLink.classList.add('active');

        this.renderSection(hash);
    },

    renderSection(sectionId) {
        console.log(`Rendering section: ${sectionId}`);
        switch (sectionId) {
            case 'overview':
                this.renderOverview();
                break;
            case 'analysis':
                this.renderAnalysis();
                break;
            case 'transfers':
                this.renderTransfers();
                break;
            case 'projections':
                this.renderProjections();
                break;
            case 'advisor':
                renderAIAdvisor();
                break;
            case 'live':
                renderLiveDashboard();
                break;
            case 'mini-league':
                renderMiniLeague();
                break;
            case 'watchlist':
                renderWatchlist();
                break;
        }
    },

    renderOverview() {
        renderTeamOverview();
    },

    renderAnalysis() {
        renderPlayerAnalysis();
    },

    renderTransfers() {
        renderTransferSimulator();
    },

    renderProjections() {
        renderProjections();
    },

    async loadTeam(teamId) {
        setState({ loading: true });
        try {
            const currentEvent = state.events.find(e => e.is_current) || state.events[0];
            const [picksData, entryData] = await Promise.all([
                fetchTeamPicks(teamId, currentEvent.id),
                fetchEntryInfo(teamId)
            ]);

            setState({
                userTeam: {
                    ...state.userTeam,
                    picks: picksData.picks,
                    bank: picksData.entry_history.bank / 10,
                    summary: picksData.entry_history,
                    info: entryData,
                    entryId: teamId
                },
                loading: false
            });

            this.navigate('overview');
            renderTeamOverview();
        } catch (error) {
            console.error('Error loading team:', error);
            setState({ loading: false });
            this.showError('Could not load team data. Check the Team ID.');
        }
    },

    showError(message) {
        alert(message);
    },

    startBackgroundPoller() {
        setInterval(() => {
            this.loadInitialData();
        }, 600000);
    }
};

document.addEventListener('DOMContentLoaded', () => {
    app.init();
});
