import axios from 'axios';

const BACKEND_URL = (process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000').trim().replace(/\/$/, '');
const WS_URL = (process.env.REACT_APP_WS_URL || (BACKEND_URL ? BACKEND_URL.replace('https://', 'wss://').replace('http://', 'ws://') : 'ws://localhost:8000')).trim().replace(/\/$/, '');

const api = axios.create({
  baseURL: `${BACKEND_URL}/api`,
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('logforge_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
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
export { BACKEND_URL, WS_URL };
