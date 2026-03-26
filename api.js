import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const api = axios.create({
  baseURL: BACKEND_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
const token = localStorage.getItem('token');
if (token) {
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

// Auth APIs
export const authAPI = {
  login: async (email, password) => {
    const response = await api.post('/api/auth/login', { email, password });
    return response.data;
  },

  register: async (username, email, password, full_name) => {
    const response = await api.post('/api/auth/register', {
      username,
      email,
      password,
      full_name
    });
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await api.get('/api/auth/me');
    return response.data;
  },
};

// Recall APIs
export const recallAPI = {
  // Get all recalls with optional filters
  getRecalls: async (params = {}) => {
    const response = await api.get('/api/recalls', { params });
    return response.data;
  },

  // Get statistics
  getStatistics: async () => {
    const response = await api.get('/api/recalls/stats');
    return response.data;
  },

  // Get unique countries
  getCountries: async () => {
    const response = await api.get('/api/recalls/countries');
    return response.data.countries;
  },

  // Get high-risk alerts
  getAlerts: async (limit = 100) => {
    const response = await api.get('/api/recalls/alerts', { params: { limit } });
    return response.data;
  },

  // Search recalls
  searchRecalls: async (query, limit = 100) => {
    const response = await api.get(`/api/recalls/search/${encodeURIComponent(query)}`, { params: { limit } });
    return response.data;
  },
};

// Watchlist APIs
export const watchlistAPI = {
  // Get watchlist
  getWatchlist: async () => {
    const response = await api.get('/api/watchlist');
    return response.data;
  },

  // Add to watchlist
  addToWatchlist: async (product) => {
    const response = await api.post('/api/watchlist', {
      product_name: product.product_name,
      source: product.source,
    });
    return response.data;
  },

  // Remove from watchlist
  removeFromWatchlist: async (product) => {
    const response = await api.delete('/api/watchlist', {
      params: {
        product_name: product.product_name,
        source: product.source,
      },
    });
    return response.data;
  },
};

// Health check
export const healthCheck = async () => {
  const response = await api.get('/api/health');
  return response.data;
};

export default api;

