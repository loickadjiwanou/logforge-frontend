import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/AuthContext';
import {
  LayoutDashboard, Search, FolderKanban, Hash,
  BookOpen, Settings, LogOut, Shield, Layers,
  Menu, Container
} from 'lucide-react';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';
import { Badge } from '../ui/badge';
import api from '../../lib/api';
import { loadAppSettings } from '../../lib/appColors';
import { useLanguage } from '../../lib/LanguageContext';
import { ChangelogModal } from './changelog-modal';
import { Info, HelpCircle } from 'lucide-react';
import { HelpModal } from './help-modal';
import LogoutConfirmModal from './logout-confirm-modal';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, labelKey: 'dashboard' },
  { to: '/logs', icon: Search, labelKey: 'logExplorer' },
  { to: '/logs/groups', icon: Layers, labelKey: 'logGroups' },
  { to: '/logs/docker', icon: Container, labelKey: 'dockerLogs' },
  { to: '/projects', icon: FolderKanban, labelKey: 'projects' },
  { to: '/channels', icon: Hash, labelKey: 'channels' },
  { to: '/sdk-docs', icon: BookOpen, labelKey: 'sdkDocs' },
  { to: '/settings', icon: Settings, labelKey: 'settings' },
];

export const Sidebar = ({ isCollapsed, toggleCollapse }) => {
  const { user, logout, isAdmin } = useAuth();
  const { t, lang, appSettings } = useLanguage();
  const navigate = useNavigate();
  const [changelogOpen, setChangelogOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [logoutConfirmOpen, setlogoutConfirmOpen] = useState(false);

  const handlelogout = () => {
    setlogoutConfirmOpen(true);
  };

  const confirmlogout = () => {
    // Add a small delay for a smoother exit animation or use a transition
    setlogoutConfirmOpen(false);
    
    // To avoid the "flash", we can navigate first or use a fade-out effect
    // But since AuthContext clears the user, the ProtectedRoute might trigger immediately.
    // A clean way is to let the modal close then logout.
    setTimeout(() => {
      logout();
      navigate('/login');
    }, 200);
  };

  return (
    <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`} data-testid="sidebar">
      <div className={`sidebar-header flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
        {!isCollapsed && (
          <div 
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
            title={lang === 'fr' ? 'Retour au Dashboard' : 'Back to Dashboard'}
          >
            {appSettings?.logo_url ? (
              <img
                src={appSettings.logo_url}
                alt="App logo"
                className="w-7 h-7 object-contain rounded shrink-0"
              />
            ) : (
              <Shield className="w-6 h-6 text-emerald-500 shrink-0" strokeWidth={1.5} />
            )}
            <span className="font-mono font-bold text-lg tracking-tight text-heading truncate">
              {appSettings?.app_name || 'LogForge'}
            </span>
          </div>
        )}
        <Button variant="ghost" size="sm" onClick={toggleCollapse} className="p-1.5 h-auto text-zinc-500 hover:text-white shrink-0">
          <Menu className="w-5 h-5" />
        </Button>
      </div>

      <ScrollArea className="flex-1 px-3">
        <nav className="space-y-1 py-4">
          {navItems.map(({ to, icon: Icon, labelKey }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/logs'}
              data-testid={`nav-${labelKey}`}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'sidebar-link-active' : ''} ${isCollapsed ? 'justify-center px-0' : ''}`
              }
              title={isCollapsed ? t(labelKey) : undefined}
            >
              <Icon className="w-4 h-4 shrink-0" strokeWidth={1.5} />
              {!isCollapsed && <span className="truncate">{t(labelKey)}</span>}
            </NavLink>
          ))}
          <button
            onClick={() => setHelpOpen(true)}
            className={`sidebar-link w-full ${isCollapsed ? 'justify-center px-0' : 'text-left'}`}
            data-testid="nav-faq"
            title={isCollapsed ? t('faq') : undefined}
          >
            <HelpCircle className="w-4 h-4 text-emerald-500 shrink-0" strokeWidth={1.5} />
            {!isCollapsed && <span className="truncate">{t('faq')}</span>}
          </button>
        </nav>
      </ScrollArea>

      <Separator />

      <div className="p-4 space-y-3">
        <button
          onClick={() => navigate('/profile')}
          className={`sidebar-user-card w-full flex items-center gap-3 transition-all ${isCollapsed ? 'justify-center w-10 h-10 mx-auto rounded-full' : 'px-3 py-2.5 rounded-xl border border-transparent'}`}
          title={isCollapsed ? user?.name : t('settings')}
        >
          <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
            <span className="text-xs font-mono font-bold text-emerald-500">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </span>
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0 text-left space-y-0.5">
              <p className="text-xs font-bold text-white truncate leading-tight">
                {user?.name}
              </p>
              <p className="text-[9px] text-zinc-500 truncate leading-tight">{user?.email}</p>
              <Badge variant="outline" className={`text-[8px] py-0 px-1 inline-flex h-4 ${isAdmin ? 'border-emerald-500/20 text-emerald-500' : 'border-zinc-700 text-zinc-500'}`}>
                {isAdmin ? (lang === 'fr' ? 'Admin' : 'Admin') : (lang === 'fr' ? 'Membre' : 'Member')}
              </Badge>
            </div>
          )}
        </button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handlelogout}
          data-testid="logout-btn"
          className={`transition-all ${isCollapsed ? 'w-10 h-10 mx-auto justify-center px-0 rounded-full' : 'w-full justify-start'}`}
          title={isCollapsed ? t('signOut') : undefined}
        >
          <LogOut className={`w-4 h-4 ${isCollapsed ? '' : 'mr-2'}`} strokeWidth={1.5} />
          {!isCollapsed && t('signOut')}
        </Button>
      </div>

      <HelpModal open={helpOpen} onOpenChange={setHelpOpen} />
      <LogoutConfirmModal 
        open={logoutConfirmOpen} 
        onOpenChange={setlogoutConfirmOpen} 
        onConfirm={confirmlogout} 
      />
    </aside>
  );
};
