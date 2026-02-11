import express from 'express';
import cors from 'cors';
import axios from 'axios';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';

const app = express();
const PORT = 5000;

// Middleware
app.use(cors({
    origin: 'http://localhost:5173', // Vite default
    credentials: true
}));
app.use(bodyParser.json());
app.use(cookieParser());

// In-memory session store
const sessions = {};

// Helper to set FPL headers
const getFplHeaders = (cookie) => ({
    'Cookie': cookie,
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    'Origin': 'https://fantasy.premierleague.com',
    'Referer': 'https://fantasy.premierleague.com/'
});

// 1. LOGIN
app.post('/api/fpl/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const response = await axios.post('https://users.premierleague.com/accounts/login/',
            `password=${encodeURIComponent(password)}&login=${encodeURIComponent(email)}&redirect_uri=https://fantasy.premierleague.com/&app=plfpl-web`,
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'User-Agent': 'Mozilla/5.0'
                },
                maxRedirects: 0,
                validateStatus: (status) => status >= 200 && status < 400
            }
        );

        // Capture cookies
        const cookies = response.headers['set-cookie'];
        if (!cookies) throw new Error('No cookies returned from FPL');

        const cookieString = cookies.map(c => c.split(';')[0]).join('; ');

        // Generate a simple session ID
        const sessionId = Math.random().toString(36).substring(7);
        sessions[sessionId] = cookieString;

        res.cookie('xgaffer_session', sessionId, { httpOnly: true, sameSite: 'lax' });
        res.json({ success: true, message: 'Logged in successfully' });

    } catch (error) {
        console.error('Login Error:', error.response?.data || error.message);
        res.status(401).json({ success: false, message: 'Invalid credentials or FPL connection error' });
    }
});

// Middleware to check xGAFFER session
const authMiddleware = (req, res, next) => {
    const sessionId = req.cookies.xgaffer_session;
    if (!sessionId || !sessions[sessionId]) {
        return res.status(401).json({ error: 'Unauthorized: No active session' });
    }
    req.fplCookie = sessions[sessionId];
    next();
};

// 2. MY TEAM
app.get('/api/fpl/my-team', authMiddleware, async (req, res) => {
    try {
        const meResponse = await axios.get('https://fantasy.premierleague.com/api/me/', {
            headers: getFplHeaders(req.fplCookie)
        });

        const entryId = meResponse.data.entry;
        const teamResponse = await axios.get(`https://fantasy.premierleague.com/api/my-team/${entryId}/`, {
            headers: getFplHeaders(req.fplCookie)
        });

        res.json({ ...teamResponse.data, entryId });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch squad' });
    }
});

// 3. ME (Session info)
app.get('/api/fpl/me', authMiddleware, async (req, res) => {
    try {
        const response = await axios.get('https://fantasy.premierleague.com/api/me/', {
            headers: getFplHeaders(req.fplCookie)
        });
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch account info' });
    }
});

// 4. TRANSFERS
app.get('/api/fpl/entry/:id/transfers', authMiddleware, async (req, res) => {
    try {
        const response = await axios.get(`https://fantasy.premierleague.com/api/entry/${req.params.id}/transfers/`, {
            headers: getFplHeaders(req.fplCookie)
        });
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch transfers' });
    }
});

// 4.5 ENTRY PROFILE
app.get('/api/fpl/entry/:id', async (req, res) => {
    try {
        const response = await axios.get(`https://fantasy.premierleague.com/api/entry/${req.params.id}/`);
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
});

// 5. LIVE EVENT
app.get('/api/fpl/event/:gw/live', async (req, res) => {
    try {
        const response = await axios.get(`https://fantasy.premierleague.com/api/event/${req.params.gw}/live/`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
            }
        });
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch live data' });
    }
});

// 6. LEAGUE STANDINGS
app.get('/api/fpl/leagues-classic/:id/standings', async (req, res) => {
    try {
        const response = await axios.get(`https://fantasy.premierleague.com/api/leagues-classic/${req.params.id}/standings/`);
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch league standings' });
    }
});

app.listen(PORT, () => {
    console.log(`xGAFFER Backend Proxy running at http://localhost:${PORT}`);
});
