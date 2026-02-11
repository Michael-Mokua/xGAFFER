import { fplLogin, fetchMyTeamPrivate, fetchUserProfile } from '../services/api';
import { state, setState } from '../store/state';

export const setupAccountListeners = () => {
    const loginTrigger = document.getElementById('login-trigger');
    const modalContainer = document.getElementById('modal-container');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');

    if (loginTrigger) {
        loginTrigger.addEventListener('click', () => {
            modalTitle.textContent = 'FPL Secure Login';
            modalBody.innerHTML = `
                <form id="login-form" class="auth-form">
                    <p class="subtitle">Enter your official FPL credentials to sync private data. Credentials are processed via our secure backend proxy.</p>
                    <div class="form-group">
                        <label>Email Address</label>
                        <input type="email" id="login-email" required class="input-full" placeholder="gaffer@example.com">
                    </div>
                    <div class="form-group">
                        <label>Password</label>
                        <input type="password" id="login-password" required class="input-full" placeholder="••••••••">
                    </div>
                    <div class="form-actions">
                        <button type="submit" class="btn btn-primary btn-full">Sync Account</button>
                    </div>
                    <p class="disclaimer">Note: We never store your password. It is only used to obtain a session token from premierleague.com.</p>
                </form>
            `;
            modalContainer.classList.remove('hidden');

            // Modal close logic
            const closeBtn = modalContainer.querySelector('.close-modal');
            const closeModal = () => modalContainer.classList.add('hidden');
            closeBtn.onclick = closeModal;

            const backgroundClickHandler = (e) => {
                if (e.target === modalContainer) {
                    closeModal();
                    window.removeEventListener('click', backgroundClickHandler);
                }
            };
            window.addEventListener('click', backgroundClickHandler);

            document.getElementById('login-form').onsubmit = handleLogin;
        });
    }
};

const handleLogin = async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    setState({ loading: true });

    try {
        const result = await fplLogin(email, password);
        if (result.success) {
            // Load private team data immediately
            const privateData = await fetchMyTeamPrivate();
            const profile = await fetchUserProfile(privateData.entryId);

            // Update state with private squad and leagues
            setState({
                userTeam: {
                    ...state.userTeam,
                    picks: privateData.picks,
                    bank: privateData.transfers.bank / 10,
                    summary: privateData.transfers,
                    entryId: privateData.entryId,
                    leagues: profile.leagues.classic
                },
                isLoggedIn: true,
                loading: false
            });

            document.getElementById('modal-container').classList.add('hidden');
            updateAccountUI(true);
            alert('FPL Intel Synced! Welcome back, Gaffer.');
        }
    } catch (error) {
        setState({ loading: false });
        alert('Login failed. Please check your credentials or FPL status.');
    }
};

export const updateAccountUI = (isLoggedIn) => {
    const loginTrigger = document.getElementById('login-trigger');
    const profileToggle = document.getElementById('profile-toggle');

    if (isLoggedIn) {
        if (loginTrigger) loginTrigger.classList.add('hidden');
        if (profileToggle) profileToggle.classList.remove('hidden');
    } else {
        if (loginTrigger) loginTrigger.classList.remove('hidden');
        if (profileToggle) profileToggle.classList.add('hidden');
    }
};
