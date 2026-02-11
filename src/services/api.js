import axios from 'axios';

const FPL_BASE_URL = '/api';

const api = axios.create({
    baseURL: FPL_BASE_URL,
    timeout: 15000,
});

// Cache implementation
const cache = {
    get(key) {
        const item = localStorage.getItem(`fpl_cache_${key}`);
        if (!item) return null;

        const { value, expiry } = JSON.parse(item);
        if (Date.now() > expiry) {
            localStorage.removeItem(`fpl_cache_${key}`);
            return null;
        }
        return value;
    },
    set(key, value, ttl = 3600000) { // Default 1 hour
        const item = {
            value,
            expiry: Date.now() + ttl,
        };
        localStorage.setItem(`fpl_cache_${key}`, JSON.stringify(item));
    }
};

export const fetchBootstrapStatic = async () => {
    const cachedData = cache.get('bootstrap_static');
    if (cachedData) return cachedData;

    try {
        const response = await api.get('bootstrap-static/');
        cache.set('bootstrap_static', response.data);
        return response.data;
    } catch (error) {
        console.error('Error fetching bootstrap-static:', error);
        throw error;
    }
};

export const fetchElementSummary = async (playerId) => {
    const cacheKey = `element_summary_${playerId}`;
    const cachedData = cache.get(cacheKey);
    if (cachedData) return cachedData;

    try {
        const response = await api.get(`element-summary/${playerId}/`);
        cache.set(cacheKey, response.data);
        return response.data;
    } catch (error) {
        console.error(`Error fetching element summary for ${playerId}:`, error);
        throw error;
    }
};

export const fetchFixtures = async () => {
    const cachedData = cache.get('fixtures');
    if (cachedData) return cachedData;

    try {
        const response = await api.get('fixtures/');
        cache.set('fixtures', response.data);
        return response.data;
    } catch (error) {
        console.error('Error fetching fixtures:', error);
        throw error;
    }
};

export const fetchTeamPicks = async (teamId, eventId) => {
    try {
        const response = await api.get(`entry/${teamId}/event/${eventId}/picks/`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching picks for team ${teamId}:`, error);
        throw error;
    }
};

export const fetchEntryInfo = async (teamId) => {
    try {
        const response = await api.get(`entry/${teamId}/`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching entry info for ${teamId}:`, error);
        throw error;
    }
};

// Private Backend Proxy instance
const privateApi = axios.create({
    baseURL: 'http://localhost:5000/api/fpl',
    withCredentials: true,
    timeout: 10000,
});

export const fplLogin = async (email, password) => {
    try {
        const response = await privateApi.post('login', { email, password });
        return response.data;
    } catch (error) {
        console.error('FPL Login failed:', error);
        throw error;
    }
};

export const fetchMyTeamPrivate = async () => {
    try {
        const response = await privateApi.get('my-team');
        return response.data;
    } catch (error) {
        console.error('Error fetching private team data:', error);
        throw error;
    }
};

export const fetchLiveEvent = async (gw) => {
    try {
        const response = await privateApi.get(`event/${gw}/live`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching live data for GW${gw}:`, error);
        throw error;
    }
};

export const fetchEntryTransfers = async (entryId) => {
    try {
        const response = await privateApi.get(`entry/${entryId}/transfers`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching transfers for entry ${entryId}:`, error);
        throw error;
    }
};

export const fetchLeagueStandings = async (leagueId) => {
    try {
        const response = await privateApi.get(`leagues-classic/${leagueId}/standings`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching league standings for ${leagueId}:`, error);
        throw error;
    }
};

export const fetchUserProfile = async (entryId) => {
    try {
        const response = await privateApi.get(`entry/${entryId}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching profile for entry ${entryId}:`, error);
        throw error;
    }
};
