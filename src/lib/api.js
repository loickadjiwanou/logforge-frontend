import axios from 'axios';

const getBackendUrl = () =>
  (localStorage.getItem('logforge_backend_url') || process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000')
    .trim().replace(/\/$/, '');

const getWsUrl = () =>
  getBackendUrl().replace('https://', 'wss://').replace('http://', 'ws://');

// Kept for backwards compatibility — reflect current localStorage value at call time
const BACKEND_URL = getBackendUrl();
const WS_URL = getWsUrl();

const api = axios.create({
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  // Resolve the base URL on every request so changes take effect immediately
  config.baseURL = `${getBackendUrl()}/api`;
  const token = localStorage.getItem('logforge_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('logforge_token');
      localStorage.removeItem('logforge_user');
      localStorage.removeItem('logforge_theme');

      if (window.location.pathname !== '/login' && window.location.pathname !== '/signup') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
export { getBackendUrl, getWsUrl, BACKEND_URL, WS_URL };
