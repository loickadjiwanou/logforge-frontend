import { createContext, useContext, useState, useEffect } from 'react';
import api from './api';
import { translations, getTranslation } from './translations';
import { loadAppSettings } from './appColors';
import { useAuth } from './AuthContext';

const LanguageContext = createContext(null);

export const useLanguage = () => useContext(LanguageContext);

export const LanguageProvider = ({ children }) => {
  const { token } = useAuth() || {};
  const [lang, setLang] = useState(localStorage.getItem('logforge_lang') || 'en');
  const [appSettings, setAppSettings] = useState(null);

  useEffect(() => {
    // Sync with server if possible
    loadAppSettings(api).then(settings => {
      if (settings && settings.language && !localStorage.getItem('logforge_lang')) {
        setLang(settings.language);
        localStorage.setItem('logforge_lang', settings.language);
      }
      setAppSettings(settings);
    });
  }, [token]);

  useEffect(() => {
    if (!appSettings) return;

    const root = document.documentElement;
    if (appSettings.material_mode) {
      root.classList.add('material');
      
      // Load Raleway font
      if (!document.getElementById('raleway-font')) {
        const link = document.createElement('link');
        link.id = 'raleway-font';
        link.rel = 'stylesheet';
        link.href = 'https://fonts.googleapis.com/css2?family=Raleway:wght@300;400;500;600&display=swap';
        document.head.appendChild(link);
      }
    } else {
      root.classList.remove('material');
      const link = document.getElementById('raleway-font');
      if (link) link.remove();
    }
  }, [appSettings?.material_mode]);

  const t = (key, vars = {}) => {
    let str = getTranslation(lang, key);
    if (typeof str === 'string') {
      str = str.replace(/\{appName\}/g, appSettings?.app_name || 'LogForge');
      Object.keys(vars).forEach(k => {
        str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), vars[k]);
      });
    }
    return str;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, appSettings, setAppSettings }}>
      {children}
    </LanguageContext.Provider>
  );
};
