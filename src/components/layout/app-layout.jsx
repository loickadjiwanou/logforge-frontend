import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './sidebar';
import { ChangelogModal } from './changelog-modal';
import { useLanguage } from '../../lib/LanguageContext';
import { Info } from 'lucide-react';
import api from '../../lib/api';
import { loadAppSettings } from '../../lib/appColors';

export default function AppLayout() {
  const { t, lang, appSettings } = useLanguage();
  const [changelogOpen, setChangelogOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    return localStorage.getItem('sidebar_collapsed') === 'true';
  });

  const toggleSidebar = () => {
    setIsSidebarCollapsed(prev => {
      const newVal = !prev;
      localStorage.setItem('sidebar_collapsed', String(newVal));
      return newVal;
    });
  };

  return (
    <div className="app-layout" data-testid="app-layout">
      <Sidebar isCollapsed={isSidebarCollapsed} toggleCollapse={toggleSidebar} />
      <main className="app-main flex flex-col min-h-screen">
        <div className="flex-1">
          <Outlet />
        </div>
        <footer className="py-3 px-8 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setChangelogOpen(true)}
              className="footer-version-btn text-[11px] text-zinc-500 hover:text-emerald-500 transition-colors flex items-center gap-1.5 font-medium"
            >
              <Info className="w-3.5 h-3.5" />
              {appSettings?.app_name || 'LogForge'} v0.2.0
            </button>
          </div>
          <p className="text-[11px] text-zinc-400 dark:text-zinc-600 font-medium">
            &copy; {new Date().getFullYear()} {(appSettings?.app_name || 'LogForge').trim()}. {t('allRightsReserved')}
          </p>
          <ChangelogModal open={changelogOpen} onOpenChange={setChangelogOpen} />
        </footer>
      </main>
    </div>
  );
}
