import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import api from './api';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('logforge_token'));
  const [loading, setLoading] = useState(true);
  const [isSetup, setIsSetup] = useState(null); // null means "checking"
  const transitionRef = useRef(null);

  const checkSetupStatus = useCallback(async () => {
    try {
      const res = await api.get('/setup/status');
      setIsSetup(res.data.is_setup);
      return res.data.is_setup;
    } catch (err) {
      console.error('Failed to check setup status', err);
      return true; // Assume setup if error to avoid loop
    }
  }, []);

  const [theme, setThemeState] = useState(localStorage.getItem('logforge_theme') || 'dark');

  const applyTheme = useCallback((newTheme, suppressAnimation = false) => {
    const t = typeof newTheme === 'string' ? newTheme.trim() : 'dark';
    const validTheme = (t === 'light' || t === 'dark') ? t : 'dark';
    
    const changeTheme = () => {
      const root = document.getElementById('app-root') || document.documentElement;
      const body = document.body;
      
      if (validTheme === 'light') {
        root.classList.remove('dark');
        root.classList.add('light');
        body.classList.remove('dark');
        body.classList.add('light');
      } else {
        root.classList.remove('light');
        root.classList.add('dark');
        body.classList.remove('light');
        body.classList.add('dark');
      }
      
      localStorage.setItem('logforge_theme', validTheme);
      setThemeState(validTheme);
    };

    // Use View Transitions only if supported, not suppressed, and not already transitioning
    if (document.startViewTransition && !suppressAnimation && !transitionRef.current) {
      try {
        const transition = document.startViewTransition(changeTheme);
        transitionRef.current = transition;
        
        // Ensure we clear the ref even if it's skipped or finishes
        transition.finished.finally(() => {
          transitionRef.current = null;
        }).catch(() => {
          // Explicitly catch skipped transition rejections to prevent React error overlay
          transitionRef.current = null;
        });
      } catch (e) {
        // Fallback if the call itself fails
        changeTheme();
      }
    } else {
      // Direct change for non-supporting browsers, suppressed load, or active transition
      changeTheme();
    }
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      // Apply theme from localStorage immediately without animation
      applyTheme(theme, true);
      
      await checkSetupStatus();
      if (token) {
        try {
          const res = await api.get('/auth/me');
          setUser(res.data);
          // Sync profile theme if different, without animation
          if (res.data.theme && res.data.theme !== theme) {
            applyTheme(res.data.theme, true);
          }
        } catch (err) {
          localStorage.removeItem('logforge_token');
          localStorage.removeItem('logforge_theme');
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };
    initAuth();
  }, [token, checkSetupStatus, applyTheme]);


  const login = useCallback(async (email, password, company_id = null) => {
    const payload = { email, password };
    if (company_id) payload.company_id = company_id;
    const res = await api.post('/auth/login', payload);
    const { access_token, user: userData } = res.data;
    localStorage.setItem('logforge_token', access_token);
    setToken(access_token);
    setUser(userData);
    if (userData.theme) applyTheme(userData.theme, true);
    return userData;
  }, [applyTheme]);

  const signup = useCallback(async (email, password, name, invitation_token) => {
    const res = await api.post('/auth/signup', { email, password, name, invitation_token });
    const { access_token, user: userData } = res.data;
    localStorage.setItem('logforge_token', access_token);
    setToken(access_token);
    setUser(userData);
    if (userData.theme) applyTheme(userData.theme, true);
    return userData;
  }, [applyTheme]);

  const loginWithToken = useCallback((access_token, userData) => {
    localStorage.setItem('logforge_token', access_token);
    setToken(access_token);
    setUser(userData);
    setIsSetup(true);
    if (userData.theme) applyTheme(userData.theme, true);
  }, [applyTheme]);

  const logout = useCallback(() => {
    localStorage.removeItem('logforge_token');
    localStorage.removeItem('logforge_theme');
    setToken(null);
    setUser(null);
    applyTheme('dark', true); // Reset to dark without animation on logout
  }, [applyTheme]);

  const isAdmin = user?.role === 'admin';

  const hasPermission = useCallback((permission) => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    return (user.permissions || []).includes(permission);
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, token, loading, isSetup, checkSetupStatus, login, signup, loginWithToken, logout, setUser, isAdmin, hasPermission, theme, applyTheme }}>
      {children}
    </AuthContext.Provider>
  );
};
