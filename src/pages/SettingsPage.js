import { useState, useEffect, useRef, useCallback } from 'react';
import api from '../lib/api';
import { useAuth } from '../lib/AuthContext';
import { useLanguage } from '../lib/LanguageContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Switch } from '../components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '../components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Separator } from '../components/ui/separator';
import {
  Settings, Mail, Bell, Sun, Moon, Plus, Trash2, Edit2, Loader2, Send, Save,
  Palette, Shield, Upload, Image, Lock, Users, CheckCircle2, XCircle, LayoutDashboard,
  Container, Zap, Terminal, Copy, RefreshCw, AlertCircle, UserPlus, MailCheck, Clock, X
} from 'lucide-react';
import { toast } from 'sonner';
import { getPrimaryColor, setPrimaryColor, loadAppSettings } from '../lib/appColors';
import { ConfirmModal } from '../components/ui/confirm-modal';

const PERMISSIONS = [
  { key: 'manage_smtp', label: 'SMTP Config', label_fr: 'Config SMTP', description: 'Configure email notifications', description_fr: 'Configurer les notifications par email' },
  { key: 'manage_alert_rules', label: 'Alert Rules', label_fr: 'Règles d\'Alerte', description: 'Create & manage alert rules', description_fr: 'Créer & gérer les règles d\'alerte' },
  { key: 'delete_projects', label: 'Delete Projects', label_fr: 'Supprimer Projets', description: 'Permanently delete projects', description_fr: 'Supprimer définitivement les projets' },
  { key: 'view_docker_logs', label: 'View Docker Logs', label_fr: 'Voir Logs Docker', description: 'Access infrastructure-wide container logs', description_fr: 'Accéder aux logs des conteneurs de l\'infrastructure' },
];

export default function SettingsPage() {
  const { user, isAdmin, hasPermission, setUser, applyTheme } = useAuth();
  const { t, lang, setLang, appSettings: globalAppSettings, setAppSettings: setGlobalAppSettings } = useLanguage();
  const [theme, setTheme] = useState(localStorage.getItem('logforge_theme') || 'dark');
  const [appColor, setAppColor] = useState(getPrimaryColor());
  const [smtp, setSmtp] = useState({ host: '', port: 587, username: '', password: '', from_email: '', enabled: false });
  const [rules, setRules] = useState([]);
  const [rulesPage, setRulesPage] = useState(1);
  const [rulesTotal, setRulesTotal] = useState(0);
  const [projects, setProjects] = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(false);

  // Dashboard customization
  const [dashboardWidgets, setDashboardWidgets] = useState([]);
  const [savingDashboard, setSavingDashboard] = useState(false);

  useEffect(() => {
    if (user?.dashboard_config?.widgets) {
      setDashboardWidgets(user.dashboard_config.widgets);
    }
  }, [user?.dashboard_config]);

  // App customization
  const [appSettings, setAppSettings] = useState({ 
    app_name: 'LogForge', 
    primary_color: '#10b981', 
    logo_url: null,
    notify_role_change: true,
    notify_project_access: true,
    notify_permission_change: true,
    notify_status_change: true,
    material_mode: false
  });
  const [savingApp, setSavingApp] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const logoInputRef = useRef(null);

  // Roles
  const [allUsers, setAllUsers] = useState([]);
  const [usersPage, setUsersPage] = useState(1);
  const [usersTotal, setUsersTotal] = useState(0);
  const [rolesLoading, setRolesLoading] = useState(false);

  // Modals
  const [showRuleDeleteModal, setShowRuleDeleteModal] = useState(false);
  const [showRuleUpdateModal, setShowRuleUpdateModal] = useState(false);
  const [showRuleCreateModal, setShowRuleCreateModal] = useState(false);
  const [showSmtpUpdateModal, setShowSmtpUpdateModal] = useState(false);
  const [showAppSettingsUpdateModal, setShowAppSettingsUpdateModal] = useState(false);
  const [showDashboardUpdateModal, setShowDashboardUpdateModal] = useState(false);
  const [showProjectAccessUpdateModal, setShowProjectAccessUpdateModal] = useState(false);
  const [showAgentKeyGenerateModal, setShowAgentKeyGenerateModal] = useState(false);
  const [projectAccessModalOpen, setProjectAccessModalOpen] = useState(false);
  const [selectedAccessUser, setSelectedAccessUser] = useState(null);
  const [tempAllowedProjects, setTempAllowedProjects] = useState([]);
  const [selectedRuleId, setSelectedRuleId] = useState(null);
  const [ruleDialogOpen, setRuleDialogOpen] = useState(false);
  const [editRule, setEditRule] = useState(null);
  const [ruleForm, setRuleForm] = useState({ 
    name: '', level: 'error', project_id: '', channel: '', emails: '', enabled: true,
    container_name: '', message_pattern: '', exclude_pattern: '', metadata_key: '', metadata_value: ''
  });
  const [smtpTesting, setSmtpTesting] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [userToToggleStatus, setUserToToggleStatus] = useState(null);
  const [showAdvancedAlert, setShowAdvancedAlert] = useState(false);

  // Agent Keys
  const [agentKeys, setAgentKeys] = useState([]);
  const [agentKeysLoading, setAgentKeysLoading] = useState(false);
  const [newAgentKey, setNewAgentKey] = useState(null);
  const [agentKeyExpOption, setAgentKeyExpOption] = useState('7');
  const [customExpDate, setCustomExpDate] = useState('');
  const [showAgentRevokeModal, setShowAgentRevokeModal] = useState(false);
  const [selectedAgentKeyId, setSelectedAgentKeyId] = useState(null);
  const [permissionsModalOpen, setPermissionsModalOpen] = useState(false);
  const [selectedPermissionUser, setSelectedPermissionUser] = useState(null);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [userToReset, setUserToReset] = useState(null);
  const [resettingPassword, setResettingPassword] = useState(false);

  // Invitations
  const [invitations, setInvitations] = useState([]);
  const [invitationsLoading, setInvitationsLoading] = useState(false);
  const [inviteEmails, setInviteEmails] = useState('');
  const [inviting, setInviting] = useState(false);
  const [showDeleteInvitationModal, setShowDeleteInvitationModal] = useState(false);
  const [selectedInvitationId, setSelectedInvitationId] = useState(null);
  const [resendingId, setResendingId] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [settingsRes, rulesRes, projectsRes, appSettingsRes] = await Promise.all([
          api.get('/settings/'),
          api.get('/settings/alert-rules', { params: { page: rulesPage, size: 99 } }),
          api.get('/projects/', { params: { page: 1, size: 100 } }),
          api.get('/settings/app'),
        ]);
        const s = settingsRes.data;
        setTheme(s.theme || 'dark');
        if (s.smtp_config) setSmtp(s.smtp_config);
        setRules(rulesRes.data.rules || []);
        setRulesTotal(rulesRes.data.total || rulesRes.data.rules?.length || 0);
        setProjects(projectsRes.data.projects || []);
        const app = appSettingsRes.data;
        setAppSettings(app);
        setGlobalAppSettings(app);
        if (app.primary_color) {
          setAppColor(app.primary_color);
        }
      } catch (e) { /* ignore */ }
    };
    loadData();
  }, [rulesPage, setGlobalAppSettings]);

  const loadUsers = useCallback(async () => {
    if (!isAdmin) return;
    setRolesLoading(true);
    try {
      const res = await api.get('/roles/users', { params: { page: usersPage, size: 99 } });
      setAllUsers(res.data.users || []);
      setUsersTotal(res.data.total || res.data.users?.length || 0);
    } catch (e) {
      toast.error('Failed to load users');
    } finally {
      setRolesLoading(false);
    }
  }, [isAdmin, usersPage]);

  useEffect(() => {
    if (isAdmin) loadUsers();
  }, [isAdmin, loadUsers]);

  const loadInvitations = useCallback(async () => {
    if (!isAdmin) return;
    setInvitationsLoading(true);
    try {
      const res = await api.get('/invitations/');
      setInvitations(res.data.invitations || []);
    } catch (e) {
      toast.error('Failed to load invitations');
    } finally {
      setInvitationsLoading(false);
    }
  }, [isAdmin]);

  const handleInvite = async () => {
    const emails = inviteEmails.split(',').map(e => e.trim()).filter(Boolean);
    if (!emails.length) return;
    setInviting(true);
    try {
      const res = await api.post('/invitations/', { emails });
      const results = res.data.results || [];
      const sent = results.filter(r => r.status === 'invited').length;
      const alreadyMember = results.filter(r => r.status === 'already_member').length;
      const alreadyInvited = results.filter(r => r.status === 'already_invited').length;
      if (sent > 0) toast.success(`${sent} ${t('invitationsSent')}`);
      if (alreadyMember > 0) toast.info(`${alreadyMember} ${t('alreadyMember')}`);
      if (alreadyInvited > 0) toast.info(`${alreadyInvited} ${t('alreadyInvited')}`);
      setInviteEmails('');
      loadInvitations();
    } catch (err) {
      const detail = err.response?.data?.detail;
      if (detail === 'SMTP_NOT_CONFIGURED') {
        toast.error(t('smtpRequiredForInvitations'));
      } else {
        toast.error(detail || 'Failed to send invitations');
      }
    } finally {
      setInviting(false);
    }
  };

  const handleResendInvitation = async (id) => {
    setResendingId(id);
    try {
      await api.post(`/invitations/${id}/resend`);
      toast.success(t('invitationResent'));
      loadInvitations();
    } catch (err) {
      const detail = err.response?.data?.detail;
      if (detail === 'SMTP_NOT_CONFIGURED') {
        toast.error(t('smtpRequiredForInvitations'));
      } else {
        toast.error(detail || 'Failed to resend invitation');
      }
    } finally {
      setResendingId(null);
    }
  };

  const handleDeleteInvitation = async (id) => {
    try {
      await api.delete(`/invitations/${id}`);
      toast.success(t('invitationDeleted'));
      setInvitations(prev => prev.filter(i => i.id !== id));
    } catch {
      toast.error('Failed to cancel invitation');
    } finally {
      setShowDeleteInvitationModal(false);
      setSelectedInvitationId(null);
    }
  };

  const handleThemeChange = async (newTheme) => {
    setTheme(newTheme);
    try {
      // Apply theme centrally via AuthContext
      applyTheme(newTheme);
      
      await api.put('/settings/theme', { theme: newTheme });
      // Update local user state triggers re-renders
      if (user) {
        setUser({ ...user, theme: newTheme });
      }
      toast.success(t('themeUpdated'));
    } catch (err) {
      console.error("Theme update error:", err);
      toast.error(t('failedToUpdateTheme'));
    }
  };

  const handleColorChange = (e) => {
    const newColor = e.target.value;
    setAppColor(newColor);
    setPrimaryColor(newColor);
  };

  const handleSmtpSave = async () => {
    try {
      await api.put('/settings/smtp', smtp);
      toast.success('SMTP configuration saved');
    } catch (e) { toast.error(e.response?.data?.detail || 'Failed to save SMTP config'); }
  };

  const handleSmtpTest = async () => {
    setSmtpTesting(true);
    try {
      await api.post('/settings/smtp/test', smtp);
      toast.success('Test email sent!');
    } catch (e) { toast.error(e.response?.data?.detail || 'SMTP test failed'); }
    finally { setSmtpTesting(false); }
  };

  const handleRuleSave = async () => {
    const payload = {
      ...ruleForm,
      emails: ruleForm.emails.split(',').map(e => e.trim()).filter(Boolean),
      project_id: ruleForm.project_id || null,
      channel: ruleForm.channel || null,
      container_name: ruleForm.container_name || null,
      message_pattern: ruleForm.message_pattern || null,
      exclude_pattern: ruleForm.exclude_pattern || null,
      metadata_key: ruleForm.metadata_key || null,
      metadata_value: ruleForm.metadata_value || null,
    };
    try {
      if (editRule) {
        await api.put(`/settings/alert-rules/${editRule.id}`, payload);
        toast.success('Rule updated');
      } else {
        await api.post('/settings/alert-rules', payload);
        toast.success('Rule created');
      }
      setRuleDialogOpen(false);
      setEditRule(null);
      const res = await api.get('/settings/alert-rules');
      setRules(res.data.rules || []);
    } catch (e) { toast.error(e.response?.data?.detail || 'Failed to save rule'); }
  };

  const handleRuleDelete = async (id) => {
    try {
      await api.delete(`/settings/alert-rules/${id}`);
      setRules(prev => prev.filter(r => r.id !== id));
      toast.success('Rule deleted');
    } catch (e) { toast.error('Failed to delete rule'); }
  };

  const openNewRule = () => {
    setEditRule(null);
    setRuleForm({ 
      name: '', level: 'error', project_id: '', channel: '', emails: '', enabled: true,
      container_name: '', message_pattern: '', exclude_pattern: '', metadata_key: '', metadata_value: ''
    });
    setRuleDialogOpen(true);
  };

  const openEditRule = (rule) => {
    setEditRule(rule);
    setRuleForm({
      name: rule.name, level: rule.level,
      project_id: rule.project_id || '', channel: rule.channel || '',
      emails: (rule.emails || []).join(', '), enabled: rule.enabled,
      container_name: rule.container_name || '',
      message_pattern: rule.message_pattern || '',
      exclude_pattern: rule.exclude_pattern || '',
      metadata_key: rule.metadata_key || '',
      metadata_value: rule.metadata_value || ''
    });
    setRuleDialogOpen(true);
  };

  // --- App Customization ---
  const handleAppSettingsSave = async () => {
    setSavingApp(true);
    try {
      const res = await api.put('/settings/app', {
        app_name: appSettings?.app_name,
        primary_color: appColor,
        language: appSettings?.language,
        logo_url: appSettings?.logo_url,
        notify_role_change: appSettings?.notify_role_change,
        notify_project_access: appSettings?.notify_project_access,
        notify_permission_change: appSettings?.notify_permission_change,
        notify_status_change: appSettings?.notify_status_change,
        material_mode: appSettings?.material_mode
      });
      setAppSettings(res.data);
      setGlobalAppSettings(res.data);
      setPrimaryColor(appColor);
      toast.success(lang === 'fr' ? 'Paramètres de l\'application enregistrés' : 'App settings saved');
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to save app settings');
    } finally {
      setSavingApp(false);
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await api.post('/settings/app/logo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const newSettings = { ...appSettings, logo_url: response.data.logo_url };
      setAppSettings(newSettings);
      setGlobalAppSettings(newSettings);
      toast.success('Logo uploaded successfully');
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to upload logo');
    } finally {
      setLogoUploading(false);
    }
  };

  const handleRemoveLogo = async () => {
    try {
      await api.put('/settings/app', { logo_url: '' });
      setAppSettings(prev => ({ ...prev, logo_url: null }));
      toast.success(lang === 'fr' ? 'Logo supprimé' : 'Logo removed');
    } catch (e) {
      toast.error(lang === 'fr' ? 'Échec de la suppression du logo' : 'Failed to remove logo');
    }
  };

  // --- Dashboard Customization ---
  const handleSaveDashboard = async () => {
    setSavingDashboard(true);
    try {
      const payload = { widgets: dashboardWidgets };
      const res = await api.patch('/auth/me/preferences', { dashboard_config: payload });
      setUser(res.data);
      toast.success(lang === 'fr' ? 'Tableau de bord enregistré' : 'Dashboard preferences saved');
    } catch (e) {
      toast.error(lang === 'fr' ? 'Échec de l\'enregistrement' : 'Failed to save dashboard preferences');
    } finally {
      setSavingDashboard(false);
    }
  };

  const addWidget = () => {
    setDashboardWidgets([...dashboardWidgets, { id: Date.now().toString(), title: 'New Widget', type: 'area', dataSource: 'timeline_count' }]);
  };

  const removeWidget = (id) => {
    setDashboardWidgets(dashboardWidgets.filter(w => w.id !== id));
  };

  const updateWidget = (id, field, value) => {
    setDashboardWidgets(dashboardWidgets.map(w => w.id === id ? { ...w, [field]: value } : w));
  };

  // --- Roles ---
  const handleUpdatePermission = async (userId, permission, granted) => {
    const targetUser = allUsers.find(u => u.id === userId);
    if (!targetUser) return;
    const currentPerms = targetUser.permissions || [];
    const newPerms = granted
      ? [...new Set([...currentPerms, permission])]
      : currentPerms.filter(p => p !== permission);
    try {
      const res = await api.patch(`/roles/users/${userId}`, { permissions: newPerms });
      const updatedUser = { ...targetUser, permissions: res.data.permissions };
      setAllUsers(prev => prev.map(u => u.id === userId ? updatedUser : u));
      if (selectedPermissionUser?.id === userId) {
        setSelectedPermissionUser(updatedUser);
      }
      toast.success(lang === 'fr' ? 'Permission mise à jour' : `Permission ${granted ? 'granted' : 'revoked'}`);
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to update permission');
    }
  };

  const handleUpdateRole = async (userId, newRole) => {
    try {
      const res = await api.patch(`/roles/users/${userId}`, { role: newRole });
      setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, role: res.data.role, permissions: res.data.permissions } : u));
      toast.success(`Role updated to ${newRole}`);
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to update role');
    }
  };

  const handleToggleStatus = async () => {
    if (!userToToggleStatus) return;
    const { id, is_active } = userToToggleStatus;
    const currentlyActive = is_active !== false;

    try {
      const res = await api.patch(`/roles/users/${id}`, { is_active: !currentlyActive });
      setAllUsers(prev => prev.map(u => u.id === id ? { ...u, is_active: res.data.is_active } : u));
      toast.success(lang === 'fr' 
        ? `Compte ${!currentlyActive ? 'activé' : 'désactivé'}` 
        : `Account ${!currentlyActive ? 'activated' : 'deactivated'}`);
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to update user status');
    } finally {
      setStatusModalOpen(false);
      setUserToToggleStatus(null);
    }
  };

  const handleSaveAllowedProjects = async () => {
    if (!selectedAccessUser) return;
    try {
      const res = await api.patch(`/roles/users/${selectedAccessUser.id}`, { allowed_projects: tempAllowedProjects });
      setAllUsers(prev => prev.map(u => u.id === selectedAccessUser.id ? { ...u, allowed_projects: res.data.allowed_projects } : u));
      setProjectAccessModalOpen(false);
      toast.success('Project access updated');
    } catch (e) {
      toast.error('Failed to update project access');
    }
  };

  const handleTriggerPasswordReset = async () => {
    if (!userToReset) return;
    setResettingPassword(true);
    try {
      await api.post(`/roles/users/${userToReset.id}/reset-password`);
      toast.success(lang === 'fr' 
        ? `Email de réinitialisation envoyé à ${userToReset.email}` 
        : `Reset email sent to ${userToReset.email}`);
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to send reset email');
    } finally {
      setResettingPassword(false);
      setResetModalOpen(false);
      setUserToReset(null);
    }
  };

  const toggleTempProject = (projectId) => {
    setTempAllowedProjects(prev => prev.includes(projectId) ? prev.filter(id => id !== projectId) : [...prev, projectId]);
  };

  // --- Docker Agent ---
  const loadAgentKeys = useCallback(async () => {
    if (!isAdmin) return;
    setAgentKeysLoading(true);
    try {
      const res = await api.get('/settings/agent-keys');
      setAgentKeys(res.data || []);
    } catch (e) {
      toast.error('Failed to load agent keys');
    } finally {
      setAgentKeysLoading(false);
    }
  }, [isAdmin]);

  const handleGenerateAgentKey = async () => {
    let expires_at = null;
    if (agentKeyExpOption !== 'never') {
      const now = new Date();
      if (agentKeyExpOption === 'custom' && customExpDate) {
        expires_at = new Date(customExpDate).toISOString();
      } else {
        const days = parseInt(agentKeyExpOption);
        now.setDate(now.getDate() + days);
        expires_at = now.toISOString();
      }
    }

    try {
      const res = await api.post('/settings/agent-keys', { 
        description: 'Docker Agent',
        expires_at: expires_at
      });
      setNewAgentKey(res.data.raw_key);
      toast.success(lang === 'fr' ? 'Clé agent générée' : 'Agent key generated');
      loadAgentKeys();
    } catch (e) {
      toast.error('Failed to generate agent key');
    }
  };

  const handleRevokeAgentKey = async (id) => {
    try {
      await api.delete(`/settings/agent-keys/${id}`);
      toast.success(lang === 'fr' ? 'Clé révoquée' : 'Agent key revoked');
      loadAgentKeys();
    } catch (e) {
      toast.error('Failed to revoke agent key');
    }
  };

  return (
    <div className="p-6 space-y-6" data-testid="settings-page">
      <div>
        <h1 className="text-2xl font-mono font-bold tracking-tight text-white">{t('settings')}</h1>
        <p className="text-sm text-zinc-500 mt-1">{lang === 'fr' ? `Configurez l'instance de ${appSettings?.app_name || 'LogForge'}` : `Configure your ${appSettings?.app_name || 'LogForge'} instance`}</p>
      </div>

      <Tabs defaultValue="customization">
        <TabsList className="bg-zinc-900 border-zinc-800 flex-wrap gap-1 h-auto py-1">
          <TabsTrigger value="customization" className="data-[state=active]:bg-zinc-800 text-xs" data-testid="tab-customization">
            <Image className="w-3.5 h-3.5 mr-1.5" /> {t('appCustomization')}
          </TabsTrigger>
          <TabsTrigger value="dashboard" className="data-[state=active]:bg-zinc-800 text-xs" data-testid="tab-dashboard">
            <LayoutDashboard className="w-3.5 h-3.5 mr-1.5" /> {lang === 'fr' ? 'Mon Dashboard' : 'My Dashboard'}
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="security" className="data-[state=active]:bg-zinc-800 text-xs" data-testid="tab-security">
              <Shield className="w-3.5 h-3.5 mr-1.5" /> {t('securityAccess')}
            </TabsTrigger>
          )}
          {isAdmin && (
            <TabsTrigger value="roles" className="data-[state=active]:bg-zinc-800 text-xs" data-testid="tab-roles"
              onClick={loadUsers}>
              <Users className="w-3.5 h-3.5 mr-1.5" /> {lang === 'fr' ? 'Gestion Utilisateurs' : 'User Management'}
            </TabsTrigger>
          )}
          {isAdmin && (
            <TabsTrigger value="invitations" className="data-[state=active]:bg-zinc-800 text-xs" data-testid="tab-invitations"
              onClick={loadInvitations}>
              <UserPlus className="w-3.5 h-3.5 mr-1.5" /> {t('invitations')}
            </TabsTrigger>
          )}
          <TabsTrigger value="smtp" className="data-[state=active]:bg-zinc-800 text-xs" data-testid="tab-smtp">
            <Mail className="w-3.5 h-3.5 mr-1.5" /> {t('smtpConfig')}
            {!hasPermission('manage_smtp') && <Lock className="w-3 h-3 ml-1.5 text-zinc-600" />}
          </TabsTrigger>
          <TabsTrigger value="alerts" className="data-[state=active]:bg-zinc-800 text-xs" data-testid="tab-alerts">
            <Bell className="w-3.5 h-3.5 mr-1.5" /> {t('alertRules')}
            {!hasPermission('manage_alert_rules') && <Lock className="w-3 h-3 ml-1.5 text-zinc-600" />}
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="agent" className="data-[state=active]:bg-zinc-800 text-xs" data-testid="tab-agent"
              onClick={loadAgentKeys}>
              <Container className="w-3.5 h-3.5 mr-1.5" /> Docker Agent
            </TabsTrigger>
          )}
        </TabsList>

        {/* ── SMTP ─────────────────────────────────── */}
        <TabsContent value="smtp" className="mt-4 space-y-4">
          {!hasPermission('manage_smtp') && (
            <div className="flex items-center gap-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <Lock className="w-4 h-4 text-amber-400 shrink-0" />
              <p className="text-xs text-amber-400">
                {lang === 'fr' 
                  ? "Vous n'avez pas la permission de modifier les paramètres SMTP. Un administrateur peut vous accorder la permission " 
                  : "You don't have permission to modify SMTP settings. An admin can grant you the "}
                <code className="bg-amber-500/10 px-1 rounded">manage_smtp</code> {lang === 'fr' ? 'permission' : 'permission'}.
              </p>
            </div>
          )}
          <Card className="bg-zinc-950 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-sm text-white">{t('smtpConfig')}</CardTitle>
              <CardDescription className="text-xs text-zinc-500">
                {t('smtpDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm text-zinc-300">{t('enableSMTP')}</Label>
                <Switch checked={smtp.enabled} onCheckedChange={(v) => setSmtp({ ...smtp, enabled: v })}
                  disabled={!hasPermission('manage_smtp')} data-testid="smtp-enabled-switch" />
              </div>
              <Separator className="bg-zinc-800" />
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-zinc-400">{t('smtpHost')}</Label>
                  <Input value={smtp.host} onChange={(e) => setSmtp({ ...smtp, host: e.target.value })}
                    placeholder="smtp.gmail.com" data-testid="smtp-host-input"
                    disabled={!hasPermission('manage_smtp')}
                    className="bg-zinc-900 border-zinc-800 text-white disabled:opacity-50" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-zinc-400">{lang === 'fr' ? 'Port' : 'Port'}</Label>
                  <Input type="number" value={smtp.port} onChange={(e) => setSmtp({ ...smtp, port: parseInt(e.target.value) || 587 })}
                    data-testid="smtp-port-input"
                    disabled={!hasPermission('manage_smtp')}
                    className="bg-zinc-900 border-zinc-800 text-white disabled:opacity-50" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-zinc-400">{t('username')}</Label>
                  <Input value={smtp.username} onChange={(e) => setSmtp({ ...smtp, username: e.target.value })}
                    data-testid="smtp-username-input"
                    disabled={!hasPermission('manage_smtp')}
                    className="bg-zinc-900 border-zinc-800 text-white disabled:opacity-50" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-zinc-400">{t('password')}</Label>
                  <Input type="password" value={smtp.password} onChange={(e) => setSmtp({ ...smtp, password: e.target.value })}
                    data-testid="smtp-password-input"
                    disabled={!hasPermission('manage_smtp')}
                    className="bg-zinc-900 border-zinc-800 text-white disabled:opacity-50" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-zinc-400">{t('fromEmail')}</Label>
                  <Input value={smtp.from_email} onChange={(e) => setSmtp({ ...smtp, from_email: e.target.value })}
                    placeholder="alerts@yourdomain.com" data-testid="smtp-from-input"
                    disabled={!hasPermission('manage_smtp')}
                    className="bg-zinc-900 border-zinc-800 text-white disabled:opacity-50" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-zinc-400">{t('emailLanguage')}</Label>
                  <Select value={smtp.language || "en"} onValueChange={(v) => setSmtp({ ...smtp, language: v })} disabled={!hasPermission('manage_smtp')}>
                    <SelectTrigger className="bg-zinc-900 border-zinc-800 text-white">
                      <SelectValue placeholder={t('selectLanguage')} />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                      <SelectItem value="en">English (EN)</SelectItem>
                      <SelectItem value="fr">Français (FR)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <Button
                  onClick={() => hasPermission('manage_smtp') ? setShowSmtpUpdateModal(true) : null}
                  disabled={!hasPermission('manage_smtp')}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-40"
                  data-testid="save-smtp-btn">
                  {!hasPermission('manage_smtp') && <Lock className="w-3.5 h-3.5 mr-1.5" />}
                  {t('saveConfig')}
                </Button>
                <Button variant="outline" onClick={handleSmtpTest} disabled={!smtp.enabled || smtpTesting}>
                  {smtpTesting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                  {lang === 'fr' ? 'Tester la Connexion' : 'Test Connection'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── ALERT RULES ──────────────────────────── */}
        <TabsContent value="alerts" className="mt-4 space-y-4">
          {!hasPermission('manage_alert_rules') && (
            <div className="flex items-center gap-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <Lock className="w-4 h-4 text-amber-400 shrink-0" />
              <p className="text-xs text-amber-400">
                {lang === 'fr' ? "Vous n'avez pas la permission de gérer les règles d'alerte. Demandez à un administrateur de vous accorder la permission " : "You don't have permission to manage alert rules. Ask an admin to grant you "}
                <code className="bg-amber-500/10 px-1 rounded">manage_alert_rules</code>.
              </p>
            </div>
          )}
          <Card className="bg-zinc-950 border-zinc-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div>
                <CardTitle className="text-sm text-white">{t('alertRules')}</CardTitle>
                <CardDescription className="text-xs text-zinc-500">
                  {lang === 'fr' ? 'Soyez notifié lorsque des événements spécifiques surviennent' : 'Get notified when specific events occur'}
                </CardDescription>
              </div>
            {hasPermission('manage_alert_rules') && (
              <Dialog open={ruleDialogOpen} onOpenChange={setRuleDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={openNewRule} data-testid="create-rule-btn"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    disabled={projects.length === 0}>
                    <Plus className="w-4 h-4 mr-2" /> {lang === 'fr' ? 'Nouvelle Règle' : 'New Rule'}
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-zinc-950 border-zinc-800">
                  <DialogHeader>
                    <DialogTitle className="text-white">
                      {editRule ? (lang === 'fr' ? 'Modifier la règle' : 'Edit Rule') : (lang === 'fr' ? 'Créer une règle d\'alerte' : 'Create Alert Rule')}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-2">
                    <div className="space-y-2">
                      <Label className="text-xs text-zinc-400">{lang === 'fr' ? 'Nom de la règle' : 'Rule Name'}</Label>
                      <Input value={ruleForm.name} onChange={(e) => setRuleForm({ ...ruleForm, name: e.target.value })}
                        placeholder={lang === 'fr' ? 'Alerte Erreur Critique' : 'Critical Error Alert'} data-testid="rule-name-input"
                        className="bg-zinc-900 border-zinc-800 text-white" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-zinc-400">{lang === 'fr' ? 'Niveau de log' : 'Log Level'}</Label>
                      <Select value={ruleForm.level} onValueChange={(v) => setRuleForm({ ...ruleForm, level: v })}>
                        <SelectTrigger className="bg-zinc-900 border-zinc-800 text-white" data-testid="rule-level-select">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                          {['debug', 'info', 'warning', 'error', 'critical'].map(lvl => (
                            <SelectItem key={lvl} value={lvl}>{lvl.toUpperCase()}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-zinc-400">{lang === 'fr' ? 'Projet (facultatif)' : 'Project (optional)'}</Label>
                      <Select value={ruleForm.project_id || 'any'} onValueChange={(v) => setRuleForm({ ...ruleForm, project_id: v === 'any' ? '' : v })}>
                        <SelectContent>
                          <SelectItem value="any">Any project</SelectItem>
                          {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-zinc-400">Email Recipients (comma-separated)</Label>
                      <Input value={ruleForm.emails} onChange={(e) => setRuleForm({ ...ruleForm, emails: e.target.value })}
                        placeholder="dev@example.com, ops@example.com" data-testid="rule-emails-input"
                        className="bg-zinc-900 border-zinc-800 text-white" />
                    </div>

                    <div className="pt-2">
                      <Button 
                        type="button"
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setShowAdvancedAlert(!showAdvancedAlert)}
                        className="text-[10px] uppercase tracking-widest text-zinc-500 hover:text-zinc-300 p-0 h-auto"
                      >
                        {showAdvancedAlert ? (lang === 'fr' ? 'Masquer les filtres avancés' : 'Hide Advanced Filters') : (lang === 'fr' ? 'Afficher les filtres avancés' : 'Show Advanced Filters')}
                      </Button>
                    </div>

                    {showAdvancedAlert && (
                      <div className="space-y-4 pt-2 border-t border-zinc-900 animate-in fade-in slide-in-from-top-1 duration-200">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label className="text-[10px] text-zinc-500 uppercase tracking-wider">{lang === 'fr' ? 'Nom du Conteneur' : 'Container Name'}</Label>
                            <Input value={ruleForm.container_name} onChange={(e) => setRuleForm({ ...ruleForm, container_name: e.target.value })}
                              placeholder="e.g. nginx-prod"
                              className="bg-zinc-900 border-zinc-800 text-white text-xs" />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[10px] text-zinc-500 uppercase tracking-wider">{lang === 'fr' ? 'Canal Spécifique' : 'Specific Channel'}</Label>
                            <Input value={ruleForm.channel} onChange={(e) => setRuleForm({ ...ruleForm, channel: e.target.value })}
                              placeholder="e.g. auth"
                              className="bg-zinc-900 border-zinc-800 text-white text-xs" />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-[10px] text-zinc-500 uppercase tracking-wider">{lang === 'fr' ? 'Pattern Message (Inclusion)' : 'Message Pattern (Include)'}</Label>
                          <Input value={ruleForm.message_pattern} onChange={(e) => setRuleForm({ ...ruleForm, message_pattern: e.target.value })}
                            placeholder="Regex or text (e.g. timeout|failed)"
                            className="bg-zinc-900 border-zinc-800 text-white text-xs" />
                        </div>

                        <div className="space-y-2">
                          <Label className="text-[10px] text-zinc-500 uppercase tracking-wider">{lang === 'fr' ? 'Pattern Message (Exclusion)' : 'Message Pattern (Exclude)'}</Label>
                          <Input value={ruleForm.exclude_pattern} onChange={(e) => setRuleForm({ ...ruleForm, exclude_pattern: e.target.value })}
                            placeholder="Regex or text (e.g. healthcheck)"
                            className="bg-zinc-900 border-zinc-800 text-white text-xs" />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label className="text-[10px] text-zinc-500 uppercase tracking-wider">Metadata Key</Label>
                            <Input value={ruleForm.metadata_key} onChange={(e) => setRuleForm({ ...ruleForm, metadata_key: e.target.value })}
                              placeholder="e.g. user_role"
                              className="bg-zinc-900 border-zinc-800 text-white text-xs" />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[10px] text-zinc-500 uppercase tracking-wider">Metadata Value</Label>
                            <Input value={ruleForm.metadata_value} onChange={(e) => setRuleForm({ ...ruleForm, metadata_value: e.target.value })}
                              placeholder="e.g. admin"
                              className="bg-zinc-900 border-zinc-800 text-white text-xs" />
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <Label className="text-sm text-zinc-300">Enabled</Label>
                      <Switch checked={ruleForm.enabled}
                        onCheckedChange={(v) => setRuleForm({ ...ruleForm, enabled: v })} data-testid="rule-enabled-switch" />
                    </div>
                    <Button onClick={() => {
                      if (editRule) { setShowRuleUpdateModal(true); } else { setShowRuleCreateModal(true); }
                    }} data-testid="save-rule-btn"
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                      {editRule ? 'Update' : 'Create'} Rule
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
            </CardHeader>
            <CardContent className="pt-0">
          <div className="border border-zinc-800 rounded-lg overflow-hidden">
            <Table>
              <TableHeader className="bg-zinc-900/40">
                <TableRow className="border-zinc-800 hover:bg-transparent">
                  <TableHead className="text-zinc-400 text-[10px] uppercase tracking-wider font-bold h-10">Name</TableHead>
                  <TableHead className="text-zinc-400 text-[10px] uppercase tracking-wider font-bold h-10">Active Filters / Target</TableHead>
                  <TableHead className="text-zinc-400 text-[10px] uppercase tracking-wider font-bold h-10">Recipients</TableHead>
                  <TableHead className="text-zinc-400 text-[10px] uppercase tracking-wider font-bold h-10 w-[100px]">Status</TableHead>
                  {hasPermission('manage_alert_rules') && (
                    <TableHead className="text-zinc-400 text-[10px] uppercase tracking-wider font-bold h-10 w-[100px] text-right pr-4">Actions</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rules.length === 0 ? (
                  <TableRow className="hover:bg-transparent border-0">
                    <TableCell colSpan={hasPermission('manage_alert_rules') ? 5 : 4} className="p-12 text-center">
                      <Bell className="w-8 h-8 text-zinc-800 mx-auto mb-3" />
                      <p className="text-sm text-zinc-500">
                        {lang === 'fr' ? 'Aucune règle configurée. Cliquez sur "Nouvelle Règle" pour commencer.' : 'No alert rules configured. Click "New Rule" to start.'}
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  rules.map(rule => (
                    <TableRow key={rule.id} className="border-zinc-800/50 hover:bg-zinc-900/20 transition-colors" data-testid={`rule-row-${rule.id}`}>
                      <TableCell className="text-sm font-medium text-white">{rule.name}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1.5 py-1">
                          <Badge variant="outline" className="text-[9px] font-mono uppercase bg-emerald-500/5 text-emerald-400 border-emerald-500/20 px-2 py-0">Level: {rule.level}</Badge>
                          {rule.project_id && <Badge variant="outline" className="text-[9px] font-mono bg-blue-500/5 text-blue-400 border-blue-500/20 px-2 py-0">Project: {projects.find(p => p.id === rule.project_id)?.name || 'Match'}</Badge>}
                          {rule.channel && <Badge variant="outline" className="text-[9px] font-mono bg-cyan-500/5 text-cyan-400 border-cyan-500/20 px-2 py-0">Channel: {rule.channel}</Badge>}
                          {rule.container_name && <Badge variant="outline" className="text-[9px] font-mono bg-purple-500/5 text-purple-400 border-purple-500/20 px-2 py-0">Docker: {rule.container_name}</Badge>}
                          {rule.message_pattern && <Badge variant="outline" className="text-[9px] font-mono bg-amber-500/5 text-amber-400 border-amber-500/20 px-2 py-0">Show: {rule.message_pattern}</Badge>}
                          {rule.exclude_pattern && <Badge variant="outline" className="text-[9px] font-mono bg-rose-500/5 text-rose-400 border-rose-500/20 px-2 py-0">Hide: {rule.exclude_pattern}</Badge>}
                          {rule.metadata_key && <Badge variant="outline" className="text-[9px] font-mono bg-indigo-500/5 text-indigo-400 border-indigo-500/20 px-2 py-0">Meta: {rule.metadata_key}={rule.metadata_value}</Badge>}
                        </div>
                      </TableCell>
                      <TableCell className="text-[11px] text-zinc-500 max-w-[200px] truncate font-mono">
                        {(rule.emails || []).join(', ')}
                      </TableCell>
                      <TableCell>
                        <Badge variant={rule.enabled ? 'default' : 'secondary'}
                          className={rule.enabled ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px] px-2 h-5' : 'bg-zinc-800 text-zinc-500 text-[10px] px-2 h-5'}>
                          {rule.enabled ? 'Enabled' : 'Disabled'}
                        </Badge>
                      </TableCell>
                      {hasPermission('manage_alert_rules') && (
                        <TableCell className="text-right pr-4">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="sm" onClick={() => openEditRule(rule)}
                              className="h-8 w-8 p-0 text-zinc-500 hover:text-white" data-testid={`edit-rule-${rule.id}`}>
                              <Edit2 className="w-3.5 h-3.5" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => {
                              setSelectedRuleId(rule.id);
                              setShowRuleDeleteModal(true);
                            }}
                              className="h-8 w-8 p-0 text-zinc-500 hover:text-red-400" data-testid={`delete-rule-${rule.id}`}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
              </Table>
            </div>
          
          {rulesTotal > 99 && (
            <div className="flex justify-between items-center mt-4 text-xs text-zinc-500">
              <p>Page {rulesPage} of {Math.ceil(rulesTotal / 99)}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setRulesPage(p => Math.max(1, p - 1))} disabled={rulesPage === 1} className="border-zinc-800 text-zinc-400">{t('prev')}</Button>
                <Button variant="outline" size="sm" onClick={() => setRulesPage(p => p + 1)} disabled={rulesPage * 99 >= rulesTotal} className="border-zinc-800 text-zinc-400">{t('next')}</Button>
              </div>
            </div>
          )}
            </CardContent>
          </Card>

          {/* Global Notification Preferences */}
          <Card className="mt-8 bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800">
              <CardHeader>
                <CardTitle className="text-sm text-zinc-900 dark:text-white flex items-center gap-2">
                  <Bell className="w-4 h-4 text-zinc-400" />
                  {lang === 'fr' ? 'Préférences Globales de Notification' : 'Global Notification Preferences'}
                </CardTitle>
                <CardDescription className="text-xs text-zinc-500">
                  {lang === 'fr' 
                    ? 'Déterminez quelles actions administratives déclenchent des notifications par email' 
                    : 'Control which administrative actions trigger automated email notifications'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
                    <div className="space-y-0.5">
                      <Label className="text-sm text-zinc-900 dark:text-zinc-200">
                        {lang === 'fr' ? 'Changement de Rôle' : 'Role Changes'}
                      </Label>
                      <p className="text-[11px] text-zinc-500">
                        {lang === 'fr' ? 'Promotion ou rétrogradation de rôle' : 'Notify when a user is promoted or demoted'}
                      </p>
                    </div>
                    <Switch 
                      checked={appSettings?.notify_role_change} 
                      onCheckedChange={(checked) => setAppSettings({...appSettings, notify_role_change: checked})}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
                    <div className="space-y-0.5">
                      <Label className="text-sm text-zinc-900 dark:text-zinc-200">
                        {lang === 'fr' ? 'Accès aux Projets' : 'Project Access'}
                      </Label>
                      <p className="text-[11px] text-zinc-500">
                        {lang === 'fr' ? 'Attribution ou retrait d\'accès projet' : 'Notify when project access is granted or revoked'}
                      </p>
                    </div>
                    <Switch 
                      checked={appSettings?.notify_project_access} 
                      onCheckedChange={(checked) => setAppSettings({...appSettings, notify_project_access: checked})}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
                    <div className="space-y-0.5">
                      <Label className="text-sm text-zinc-900 dark:text-zinc-200">
                        {lang === 'fr' ? 'Changement de Permissions' : 'Permission Changes'}
                      </Label>
                      <p className="text-[11px] text-zinc-500">
                        {lang === 'fr' ? 'Modification des droits spécifiques' : 'Notify when specific permissions are updated'}
                      </p>
                    </div>
                    <Switch 
                      checked={appSettings?.notify_permission_change} 
                      onCheckedChange={(checked) => setAppSettings({...appSettings, notify_permission_change: checked})}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
                    <div className="space-y-0.5">
                      <Label className="text-sm text-zinc-900 dark:text-zinc-200">
                        {lang === 'fr' ? 'Changement de Statut' : 'Status Changes'}
                      </Label>
                      <p className="text-[11px] text-zinc-500">
                        {lang === 'fr' ? 'Activation ou désactivation du compte' : 'Notify when a user account is activated or deactivated'}
                      </p>
                    </div>
                    <Switch 
                      checked={appSettings?.notify_status_change} 
                      onCheckedChange={(checked) => setAppSettings({...appSettings, notify_status_change: checked})}
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button 
                    onClick={handleAppSettingsSave} 
                    disabled={savingApp}
                    size="sm"
                    variant="default"
                    className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    {savingApp ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Save className="w-3.5 h-3.5" />
                    )}
                    {lang === 'fr' ? 'Enregistrer les préférences' : 'Save Preferences'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── APP CUSTOMIZATION ─────── */}
          <TabsContent value="customization" className="mt-4 space-y-4">
            <Card className="bg-zinc-950 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-sm text-white flex items-center gap-2">
                  <Moon className="w-4 h-4 text-zinc-400" /> Appearance
                </CardTitle>
                <CardDescription className="text-xs text-zinc-500">Choose your preferred theme</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <Button variant={theme === 'dark' ? 'default' : 'outline'} size="sm"
                    onClick={() => handleThemeChange('dark')} data-testid="theme-dark-btn"
                    className={theme === 'dark' ? 'bg-zinc-800 text-white' : 'border-zinc-800 text-zinc-400'}>
                    <Moon className="w-4 h-4 mr-2" /> Dark
                  </Button>
                  <Button variant={theme === 'light' ? 'default' : 'outline'} size="sm"
                    onClick={() => handleThemeChange('light')} data-testid="theme-light-btn"
                    className={theme === 'light' ? 'bg-zinc-200 text-zinc-900' : 'border-zinc-800 text-zinc-400'}>
                    <Sun className="w-4 h-4 mr-2" /> Light
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* App Identity */}
            <Card className="bg-zinc-950 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-sm text-white flex items-center gap-2">
                  <Settings className="w-4 h-4 text-zinc-400" /> {t('appIdentity')}
                </CardTitle>
                <CardDescription className="text-xs text-zinc-500">
                  {isAdmin ? t('appIdentityDescription') : t('languageSettingsDescription')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-6">
                  {/* Language & Name */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-xs text-zinc-400">{t('language')}</Label>
                      <Select 
                        value={lang || 'en'} 
                        onValueChange={(v) => {
                          setAppSettings(prev => ({ ...prev, language: v }));
                          setLang(v);
                          localStorage.setItem('logforge_lang', v);
                        }}
                      >
                        <SelectTrigger className="bg-zinc-900 border-zinc-800 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                          <SelectItem value="en">English (EN)</SelectItem>
                          <SelectItem value="fr">Français (FR)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {isAdmin && (
                      <div className="space-y-2">
                        <Label className="text-xs text-zinc-400">{t('appName')}</Label>
                        <Input
                          value={appSettings?.app_name || ''}
                          onChange={(e) => setAppSettings(prev => ({ ...prev, app_name: e.target.value }))}
                          placeholder={appSettings?.app_name || 'LogForge'}
                          className="bg-zinc-900 border-zinc-800 text-white"
                        />
                      </div>
                    )}
                  </div>

                  {isAdmin && (
                    <>
                      <Separator className="bg-zinc-800" />

                      {/* Primary Color */}
                      <div className="space-y-4">
                        <Label className="text-xs text-zinc-400 flex items-center gap-2">
                          <Palette className="w-3.5 h-3.5" /> {t('globalPrimaryColor')}
                          <Badge variant="outline" className="text-[10px] py-0 border-zinc-700 text-zinc-500 ml-1">
                            {lang === 'fr' ? 'S\'applique à tous les utilisateurs' : 'Applies to all users'}
                          </Badge>
                        </Label>
                        <div className="flex items-center gap-3">
                          <div className="relative w-8 h-8 rounded overflow-hidden border border-zinc-700">
                            <input
                              type="color"
                              value={appColor}
                              onChange={handleColorChange}
                              className="absolute inset-[-10px] w-[50px] h-[50px] cursor-pointer"
                            />
                          </div>
                          <Input
                            value={appColor}
                            onChange={handleColorChange}
                            className="w-24 bg-zinc-900 border-zinc-800 text-white font-mono text-xs uppercase"
                            maxLength={7}
                          />
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleColorChange({ target: { value: '#10b981' } })} 
                            className="border-zinc-800 text-zinc-400 hover:text-white"
                          >
                            {lang === 'fr' ? 'Réinitialiser' : 'Reset'}
                          </Button>
                        </div>
                        <div className="flex gap-2">
                          {['#10b981', '#6366f1', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899'].map(c => (
                            <button
                              key={c}
                              title={c}
                              onClick={() => handleColorChange({ target: { value: c } })}
                              className="w-5 h-5 rounded-full border-2 transition-transform hover:scale-125"
                              style={{ backgroundColor: c, borderColor: appColor === c ? 'white' : 'transparent' }}
                            />
                          ))}
                        </div>
                      </div>

                      <Separator className="bg-zinc-800" />

                      <Button
                        onClick={() => setShowAppSettingsUpdateModal(true)}
                        disabled={savingApp}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white w-full md:w-auto"
                      >
                        {savingApp ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                        {t('saveAppSettings')}
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {isAdmin && (
              <Card className="bg-zinc-950 border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-sm text-white flex items-center gap-2">
                    <Image className="w-4 h-4 text-zinc-400" /> App Logo
                  </CardTitle>
                  <CardDescription className="text-xs text-zinc-500">Upload a custom logo (PNG, SVG, JPEG, max 2MB)</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-6">
                    <div className="w-20 h-20 rounded-xl border border-zinc-700 bg-zinc-900 flex items-center justify-center overflow-hidden shrink-0">
                      {appSettings.logo_url ? (
                        <img src={appSettings.logo_url} alt="App logo" className="w-full h-full object-contain p-1" />
                      ) : (
                        <Image className="w-8 h-8 text-zinc-700" />
                      )}
                    </div>
                    <div className="space-y-3">
                      <input
                        ref={logoInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleLogoUpload}
                      />
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline"
                          onClick={() => logoInputRef.current?.click()}
                          disabled={logoUploading}
                          className="border-zinc-700 text-zinc-300 hover:text-white">
                          {logoUploading ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Upload className="w-3.5 h-3.5 mr-1.5" />}
                          {logoUploading ? 'Uploading...' : 'Upload Logo'}
                        </Button>
                        {appSettings.logo_url && (
                          <Button size="sm" variant="ghost"
                            onClick={handleRemoveLogo}
                            className="text-red-400 hover:text-red-300 hover:bg-red-400/10">
                            <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Remove
                          </Button>
                        )}
                      </div>
                      <p className="text-xs text-zinc-600">Recommended: 256×256px, transparent background</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            {isAdmin && (
              <Card className="bg-zinc-950 border-zinc-800 mt-4">
                <CardHeader>
                  <CardTitle className="text-sm text-white flex items-center gap-2">
                    <Sun className="w-4 h-4 text-zinc-400" /> {lang === 'fr' ? 'Mode visuel avancé' : 'Advanced Visual Mode'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-zinc-900/50 rounded-xl border border-zinc-800/50">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <Label className="text-sm font-medium text-white">{t('materialMode')}</Label>
                      </div>
                      <p className="text-xs text-zinc-500">{t('materialModeDescription')}</p>
                    </div>
                    <Switch
                      checked={appSettings.material_mode || false}
                      onCheckedChange={async (val) => {
                        const updated = { ...appSettings, material_mode: val };
                        setAppSettings(updated);
                        setGlobalAppSettings(updated);
                        try {
                          await api.put('/settings/app', { material_mode: val });
                          toast.success(lang === 'fr' ? 'Mode Material mis à jour' : 'Material Mode updated');
                        } catch (e) {
                          toast.error('Failed to update Material Mode');
                        }
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>


        {/* ── DASHBOARD CUSTOMIZATION ─────── */}
        <TabsContent value="dashboard" className="mt-4 space-y-4">
          <Card className="bg-zinc-950 border-zinc-800">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm text-white flex items-center gap-2">
                  <LayoutDashboard className="w-4 h-4 text-zinc-400" /> {lang === 'fr' ? 'Personnalisation du Tableau de Bord' : 'Dashboard Customization'}
                </CardTitle>
                <CardDescription className="text-xs text-zinc-500">
                  {lang === 'fr' ? 'Configurez les graphes que vous souhaitez voir sur votre tableau de bord.' : 'Configure the graphs you want to see on your dashboard.'}
                </CardDescription>
              </div>
              <Button onClick={addWidget} size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                <Plus className="w-4 h-4 mr-2" /> {lang === 'fr' ? 'Ajouter' : 'Add Widget'}
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {dashboardWidgets.length === 0 ? (
                <div className="text-center p-6 border border-dashed border-zinc-800 rounded-lg text-zinc-500 text-sm">
                  {lang === 'fr' ? 'Aucun graphe configuré. La vue par défaut s\'affichera.' : 'No graphs configured. The default view will be displayed.'}
                </div>
              ) : (
                <div className="space-y-4">
                  {dashboardWidgets.map((widget, index) => (
                    <div key={widget.id} className="p-4 border border-zinc-800 bg-zinc-900/50 rounded-lg space-y-4 relative">
                      <Button variant="ghost" size="sm" className="absolute top-2 right-2 h-8 w-8 p-0 text-zinc-500 hover:text-red-400" onClick={() => removeWidget(widget.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mr-8">
                        <div className="space-y-2">
                          <Label className="text-xs text-zinc-400">{lang === 'fr' ? 'Titre' : 'Title'}</Label>
                          <Input value={widget.title} onChange={(e) => updateWidget(widget.id, 'title', e.target.value)} className="bg-zinc-900 border-zinc-800 text-white" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs text-zinc-400">{lang === 'fr' ? 'Type de graphe' : 'Graph Type'}</Label>
                          <Select value={widget.type} onValueChange={(v) => updateWidget(widget.id, 'type', v)}>
                            <SelectTrigger className="bg-zinc-900 border-zinc-800 text-white"><SelectValue /></SelectTrigger>
                            <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                              <SelectItem value="area">Area Chart</SelectItem>
                              <SelectItem value="bar">Bar Chart</SelectItem>
                              <SelectItem value="pie">Pie Chart</SelectItem>
                              <SelectItem value="line">Line Chart</SelectItem>
                              <SelectItem value="radar">Radar Chart</SelectItem>
                              <SelectItem value="composed">Composed Chart</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs text-zinc-400">{lang === 'fr' ? 'Données' : 'Data Source'}</Label>
                          <Select value={widget.dataSource} onValueChange={(v) => updateWidget(widget.id, 'dataSource', v)}>
                            <SelectTrigger className="bg-zinc-900 border-zinc-800 text-white"><SelectValue /></SelectTrigger>
                            <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                              <SelectItem value="timeline_count">{lang === 'fr' ? 'Événements (Chronologie)' : 'Events over time'}</SelectItem>
                              <SelectItem value="timeline_errors">{lang === 'fr' ? 'Erreurs (Chronologie)' : 'Errors over time'}</SelectItem>
                              <SelectItem value="timeline_both">{lang === 'fr' ? 'Évènements & Erreurs (Chronologie)' : 'Events & Errors over time'}</SelectItem>
                              <SelectItem value="level_distribution">{lang === 'fr' ? 'Répartition par Niveau' : 'Level Distribution'}</SelectItem>
                              <SelectItem value="project_load">{lang === 'fr' ? 'Charge par Projet' : 'Load by Project'}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <Button onClick={() => setShowDashboardUpdateModal(true)} disabled={savingDashboard} className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white">
                {savingDashboard ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Settings className="w-4 h-4 mr-2" />}
                {lang === 'fr' ? 'Sauvegarder les préférences' : 'Save Preferences'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── ROLES & PERMISSIONS (Admin only) ─────── */}
        {isAdmin && (
          <TabsContent value="roles" className="mt-4 space-y-4">
            <div className="flex items-center gap-3 p-3 bg-violet-500/10 border border-violet-500/20 rounded-lg">
              <Shield className="w-4 h-4 text-violet-400 shrink-0" />
              <p className="text-xs text-violet-300">
                {lang === 'fr' ? (
                  <>Les administrateurs ont <strong>toutes les permissions</strong> par défaut. Celles-ci ne s'appliquent qu'aux comptes <strong>membres</strong>.</>
                ) : (
                  <>Admins have <strong>all permissions</strong> automatically. Individual permissions only apply to <strong>member</strong> accounts.</>
                )}
              </p>
            </div>

            {rolesLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 text-zinc-500 animate-spin" />
              </div>
            ) : (
              <div className={`border rounded-lg overflow-hidden ${theme === 'dark' ? 'border-zinc-800 bg-zinc-400/5' : 'border-zinc-200 bg-zinc-50'}`}>
                <Table>
                  <TableHeader>
                    <TableRow className={`${theme === 'dark' ? 'border-zinc-800 hover:bg-transparent' : 'border-zinc-200 hover:bg-transparent'}`}>
                      <TableHead className="text-zinc-500 text-xs font-mono py-4 pl-4 w-[280px]">{lang === 'fr' ? 'Utilisateur' : 'User'}</TableHead>
                      <TableHead className="text-zinc-500 text-xs font-mono py-4 px-2 w-[140px]">{lang === 'fr' ? 'Rôle' : 'Role'}</TableHead>
                      <TableHead className="text-zinc-500 text-xs font-mono py-4 px-2 text-center w-[100px]">{lang === 'fr' ? 'Statut' : 'Status'}</TableHead>
                      <TableHead className="text-zinc-500 text-xs font-mono py-4 px-2 text-center w-[120px]">{lang === 'fr' ? 'Permissions' : 'Permissions'}</TableHead>
                      <TableHead className="text-zinc-500 text-xs font-mono py-4 px-2 text-center w-[140px]">{lang === 'fr' ? 'Accès Projets' : 'Project Access'}</TableHead>
                      <TableHead className="text-zinc-500 text-xs font-mono py-4 px-2 text-center w-[120px]">{lang === 'fr' ? 'Réinit. MDP' : 'Password Reset'}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allUsers.map(u => {
                      const isSelf = u.id === user?.id;
                      const isUserAdmin = u.role === 'admin';
                      return (
                        <TableRow key={u.id} className="border-zinc-800/50">
                          <TableCell>
                            <div>
                              <p className="text-sm text-white font-medium flex items-center gap-2">
                                {u.name}
                                {isSelf && <Badge variant="outline" className="text-[10px] py-0 border-zinc-700 text-zinc-500">You</Badge>}
                              </p>
                              <p className="text-xs text-zinc-500">{u.email}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Select
                              value={u.role}
                              onValueChange={(val) => !isSelf && handleUpdateRole(u.id, val)}
                              disabled={isSelf}
                            >
                              <SelectTrigger className="w-28 bg-zinc-900 border-zinc-700 text-xs h-7">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="admin">
                                  <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-violet-400" /> Admin</span>
                                </SelectItem>
                                <SelectItem value="member">
                                  <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-zinc-400" /> Member</span>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex justify-center">
                              <Switch 
                                checked={u.is_active !== false}
                                onCheckedChange={() => {
                                  if (!isSelf) {
                                    setUserToToggleStatus(u);
                                    setStatusModalOpen(true);
                                  }
                                }}
                                disabled={isSelf}
                                className="scale-75 data-[state=checked]:bg-emerald-500"
                              />
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex justify-center">
                              {isUserAdmin ? (
                                <Badge variant="outline" className="text-[10px] py-0.5 border-amber-500/30 text-amber-500 font-mono">Superuser</Badge>
                              ) : (
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-7 text-xs text-zinc-400 hover:text-emerald-500 gap-1.5"
                                  onClick={() => {
                                    setSelectedPermissionUser(u);
                                    setPermissionsModalOpen(true);
                                  }}
                                >
                                  <Shield className="w-3.5 h-3.5" />
                                  {lang === 'fr' ? 'Gérer' : 'Manage'}
                                </Button>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex justify-center">
                              {isUserAdmin ? (
                                <Badge variant="outline" className="text-[10px] py-0.5 border-emerald-500/30 text-emerald-400 font-mono italic">All Access</Badge>
                              ) : (
                                <Button variant="ghost" size="sm" className="h-7 text-xs text-zinc-400 hover:text-emerald-500 gap-1.5" onClick={() => {
                                  setSelectedAccessUser(u);
                                  setTempAllowedProjects(u.allowed_projects || []);
                                  setProjectAccessModalOpen(true);
                                }}>
                                  <LayoutDashboard className="w-3.5 h-3.5" />
                                  {lang === 'fr' ? 'Accès' : 'Access'} ({(u.allowed_projects || []).length})
                                </Button>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex justify-center">
                              {!isSelf && (
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-7 w-7 p-0 text-zinc-500 hover:text-amber-500" 
                                  onClick={() => { setUserToReset(u); setResetModalOpen(true); }}
                                  title={lang === 'fr' ? 'Réinitialiser le mot de passe' : 'Reset Password'}
                                >
                                  <Mail className="w-3.5 h-3.5" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
            
            {usersTotal > 99 && (
              <div className="flex justify-between items-center mt-4 text-xs text-zinc-500">
                <p>Page {usersPage} of {Math.ceil(usersTotal / 99)} ({usersTotal} total)</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setUsersPage(p => Math.max(1, p - 1))} disabled={usersPage === 1} className="border-zinc-800 text-zinc-400">{t('prev')}</Button>
                  <Button variant="outline" size="sm" onClick={() => setUsersPage(p => p + 1)} disabled={usersPage * 99 >= usersTotal} className="border-zinc-800 text-zinc-400">{t('next')}</Button>
                </div>
              </div>
            )}
          </TabsContent>
        )}

        {/* ── DOCKER AGENT ─────────────────────────── */}
        {isAdmin && (
          <TabsContent value="agent" className="mt-4 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Keys Management */}
              <div className="lg:col-span-2 space-y-6">
                <Card className="bg-zinc-950 border-zinc-800">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-sm text-white flex items-center gap-2">
                        <Terminal className="w-4 h-4 text-zinc-400" /> {lang === 'fr' ? 'Clés d\'Agent Globales' : 'Global Agent Keys'}
                      </CardTitle>
                      <CardDescription className="text-xs text-zinc-500">
                        {lang === 'fr' ? 'Gérez les clés permettant aux agents externes de pousser des logs.' : 'Manage keys that allow external agents to push logs.'}
                      </CardDescription>
                    </div>
                    <Button onClick={() => setShowAgentKeyGenerateModal(true)} size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                      <Plus className="w-4 h-4 mr-2" /> {lang === 'fr' ? 'Générer une clé' : 'Generate Key'}
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {newAgentKey && (
                      <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-medium text-emerald-400 flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4" /> {lang === 'fr' ? 'Nouvelle clé générée !' : 'New key generated!'}
                          </p>
                          <Button variant="ghost" size="sm" className="h-6 text-emerald-400 hover:bg-emerald-500/10" onClick={() => setNewAgentKey(null)}>
                            {lang === 'fr' ? 'Fermer' : 'Dismiss'}
                          </Button>
                        </div>
                        <p className="text-[11px] text-emerald-500/70">
                          {lang === 'fr' ? 'Copiez cette clé maintenant. Elle ne sera plus jamais affichée pour des raisons de sécurité.' : 'Copy this key now. It will never be shown again for security reasons.'}
                        </p>
                        <div className="flex items-center gap-2 bg-zinc-900 rounded px-3 py-2 border border-emerald-500/30">
                          <code className="text-xs font-mono text-white flex-1 truncate">{newAgentKey}</code>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-zinc-400 hover:text-white" 
                            onClick={() => { navigator.clipboard.writeText(newAgentKey); toast.success('Copied!'); }}>
                            <Copy className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    )}

                    {agentKeysLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 text-zinc-600 animate-spin" />
                      </div>
                    ) : agentKeys.length === 0 ? (
                      <div className="text-center py-12 border border-dashed border-zinc-800 rounded-lg">
                        <Zap className="w-10 h-10 text-zinc-800 mx-auto mb-3" />
                        <p className="text-sm text-zinc-500">{lang === 'fr' ? 'Aucune clé d\'agent active.' : 'No active agent keys.'}</p>
                      </div>
                    ) : (
                      <div className="border border-zinc-800 rounded-lg overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow className="border-zinc-800 hover:bg-transparent">
                              <TableHead className="text-xs font-mono text-zinc-500">Prefix</TableHead>
                              <TableHead className="text-xs font-mono text-zinc-500">Status</TableHead>
                              <TableHead className="text-xs font-mono text-zinc-500">Expires At</TableHead>
                              <TableHead className="text-xs font-mono text-zinc-500">Last Seen</TableHead>
                              <TableHead className="text-xs font-mono text-zinc-500 w-[100px]">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {agentKeys.map(key => (
                              <TableRow key={key.id} className="border-zinc-800/50">
                                <TableCell className="font-mono text-xs text-white">{key.key_prefix}</TableCell>
                                <TableCell>
                                  <Badge className={key.status === 'expired' 
                                    ? "bg-red-500/10 text-red-500 border-red-500/20 text-[10px]" 
                                    : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px]"}>
                                    {key.status === 'expired' ? (lang === 'fr' ? 'Expirée' : 'Expired') : key.status}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-xs text-zinc-500 font-mono">
                                  {key.expires_at ? (
                                    <span className={new Date() > new Date(key.expires_at) ? 'text-red-400' : 'text-zinc-500'}>
                                       {new Date(key.expires_at).toLocaleDateString()}
                                    </span>
                                  ) : (
                                    <span className="text-zinc-700">Never</span>
                                  )}
                                </TableCell>
                                <TableCell className="text-xs text-zinc-500">
                                  {key.last_seen_at ? new Date(key.last_seen_at).toLocaleString() : 'Never'}
                                </TableCell>
                                <TableCell>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-zinc-500 hover:text-red-400" 
                                    onClick={() => { setSelectedAgentKeyId(key.id); setShowAgentRevokeModal(true); }}>
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="bg-zinc-950 border-zinc-800">
                  <CardHeader>
                    <CardTitle className="text-sm text-white flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-zinc-400" /> {lang === 'fr' ? 'Guide de Déploiement' : 'Deployment Guide'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <p className="text-xs text-zinc-400 font-medium">{lang === 'fr' ? '1. Préparez vos conteneurs' : '1. Prepare your containers'}</p>
                        <p className="text-[11px] text-zinc-500 leading-relaxed">
                            {lang === 'fr' ? "L'agent collecte tous les logs par défaut. Pour router les logs vers un projet spécifique, ajoutez ce label à vos conteneurs :" : "The agent collects all logs by default. To route logs to a specific project, add this label to your containers:"}
                        </p>
                        <div className="bg-zinc-900 px-3 py-2 rounded border border-zinc-800 flex items-center justify-between">
                            <code className="text-[11px] text-emerald-400">logforge.project_id=VOTRE_ID_DE_PROJET</code>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => { navigator.clipboard.writeText('logforge.project_id='); toast('Copied base label'); }}>
                                <Copy className="w-3 h-3 text-zinc-500" />
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <p className="text-xs text-zinc-400 font-medium">{lang === 'fr' ? '2. Lancez l\'agent LogForge' : '2. Run LogForge Agent'}</p>
                        <div className="bg-zinc-900 p-3 rounded border border-zinc-800 relative group">
                            <pre className="text-[10px] text-zinc-400 overflow-x-auto">
{`docker run -d \\
  --name logforge-agent \\
  --restart always \\
  -v /var/run/docker.sock:/var/run/docker.sock \\
  -e LOGFORGE_URL=${window.location.origin} \\
  -e LOGFORGE_KEY=VOTRE_CLE_AGENT \\
  logforge/agent:latest`}
                            </pre>
                            <Button variant="ghost" size="sm" className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity" 
                                onClick={() => { 
                                    navigator.clipboard.writeText(`docker run -d --name logforge-agent -v /var/run/docker.sock:/var/run/docker.sock -e LOGFORGE_URL=${window.location.origin} -e LOGFORGE_KEY=YOUR_KEY logforge/agent:latest`);
                                    toast.success('Command copied');
                                }}>
                                <Copy className="w-3.5 h-3.5 text-zinc-400" />
                            </Button>
                        </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar Info */}
              <div className="space-y-6">
                <Card className="bg-zinc-950 border-zinc-800 overflow-hidden relative">
                  <div className="absolute top-0 right-0 p-4 opacity-5">
                    <Container className="w-24 h-24 rotate-12" />
                  </div>
                  <CardHeader>
                    <CardTitle className="text-xs font-mono uppercase tracking-widest text-zinc-500">Agent Status</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-3">
                         <div className={`w-3 h-3 rounded-full ${agentKeys.some(k => k.last_seen_at && (new Date() - new Date(k.last_seen_at) < 60000)) ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-zinc-800 animate-pulse'}`} />
                         <span className="text-sm font-medium text-white">
                            {agentKeys.some(k => k.last_seen_at && (new Date() - new Date(k.last_seen_at) < 60000)) ? 'Connected' : 'Waiting for Agent'}
                         </span>
                    </div>
                    <p className="text-[11px] text-zinc-500 leading-relaxed">
                        {lang === 'fr' 
                            ? "L'agent LogForge collecte automatiquement les logs Standard Output (stdout/stderr) de tous vos conteneurs Docker sans aucune modification de code."
                            : "LogForge Agent automatically collects Standard Output (stdout/stderr) logs from all your Docker containers without any code modification."}
                    </p>
                    <Separator className="bg-zinc-900" />
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-[10px]">
                            <span className="text-zinc-500">Auto-Discovery</span>
                            <span className="text-emerald-500">Active</span>
                        </div>
                        <div className="flex items-center justify-between text-[10px]">
                            <span className="text-zinc-500">Real-time Ingestion</span>
                            <span className="text-emerald-500">Active</span>
                        </div>
                    </div>
                  </CardContent>
                </Card>
                <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-lg space-y-2">
                    <div className="flex items-center gap-2 text-amber-500">
                        <AlertCircle className="w-4 h-4" />
                        <span className="text-xs font-medium">{lang === 'fr' ? 'Notes Importantes' : 'Important Notes'}</span>
                    </div>
                    <ul className="text-[10px] text-zinc-500 space-y-1 list-disc pl-3">
                        <li>{lang === 'fr' ? 'L\'agent doit avoir accès au socket Docker (/var/run/docker.sock).' : 'Agent must have access to Docker socket (/var/run/docker.sock).'}</li>
                        <li>{lang === 'fr' ? 'La clé agent est partagée pour toute l\'instance.' : 'Agent key is shared platform-wide.'}</li>
                        <li>{lang === 'fr' ? 'Utilisez les labels pour isoler vos projets.' : 'Use labels to isolate your projects.'}</li>
                    </ul>
                </div>
              </div>
            </div>
          </TabsContent>
        )}

        {isAdmin && (
          <TabsContent value="invitations" className="mt-4 space-y-4">

            {/* Send invitations card */}
            <Card className="bg-zinc-950 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-sm text-white flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-emerald-400" /> {t('inviteMembers')}
                </CardTitle>
                <CardDescription className="text-xs text-zinc-500">
                  {lang === 'fr'
                    ? 'Invitez des membres à rejoindre votre compagnie par email. Chaque personne recevra un lien d\'inscription.'
                    : 'Invite members to join your company by email. Each person will receive a registration link.'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={inviteEmails}
                    onChange={(e) => setInviteEmails(e.target.value)}
                    placeholder={t('inviteEmailsPlaceholder')}
                    className="bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-600 flex-1"
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleInvite(); } }}
                  />
                  <Button
                    onClick={handleInvite}
                    disabled={inviting || !inviteEmails.trim()}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white shrink-0"
                  >
                    {inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    <span className="ml-2 hidden sm:inline">{inviting ? t('sending') : t('sendInvitations')}</span>
                  </Button>
                </div>
                <p className="text-[11px] text-zinc-600">
                  {lang === 'fr'
                    ? 'Séparez plusieurs adresses par des virgules. Requiert une configuration SMTP active.'
                    : 'Separate multiple addresses with commas. Requires an active SMTP configuration.'}
                </p>
              </CardContent>
            </Card>

            {/* Invitations list */}
            <Card className="bg-zinc-950 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-sm text-white flex items-center gap-2">
                  <MailCheck className="w-4 h-4 text-zinc-400" />
                  {lang === 'fr' ? 'Invitations envoyées' : 'Sent Invitations'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {invitationsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-5 h-5 animate-spin text-zinc-500" />
                  </div>
                ) : invitations.length === 0 ? (
                  <p className="text-xs text-zinc-600 text-center py-6">{t('noInvitations')}</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-zinc-800">
                        <TableHead className="text-zinc-500 text-xs">Email</TableHead>
                        <TableHead className="text-zinc-500 text-xs">Status</TableHead>
                        <TableHead className="text-zinc-500 text-xs hidden sm:table-cell">{t('invitedBy')}</TableHead>
                        <TableHead className="text-zinc-500 text-xs hidden md:table-cell">{t('expiresOn')}</TableHead>
                        <TableHead className="text-zinc-500 text-xs text-right">{t('actions')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invitations.map((inv) => {
                        const isExpired = inv.status === 'expired' ||
                          (inv.status === 'pending' && new Date(inv.expires_at) < new Date());
                        const statusKey = isExpired ? 'expired' : inv.status;
                        return (
                          <TableRow key={inv.id} className="border-zinc-900">
                            <TableCell className="text-zinc-300 text-xs font-mono">{inv.email}</TableCell>
                            <TableCell>
                              <Badge className={`text-[10px] font-medium ${
                                statusKey === 'accepted'
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                  : statusKey === 'expired'
                                    ? 'bg-zinc-800 text-zinc-500 border-zinc-700'
                                    : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                              }`}>
                                {statusKey === 'accepted' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                                {statusKey === 'expired' && <XCircle className="w-3 h-3 mr-1" />}
                                {statusKey === 'pending' && <Clock className="w-3 h-3 mr-1" />}
                                {t(`invitationStatus_${statusKey}`)}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-zinc-500 text-xs hidden sm:table-cell">
                              {inv.invited_by_name || '—'}
                            </TableCell>
                            <TableCell className="text-zinc-500 text-xs hidden md:table-cell">
                              {inv.expires_at ? new Date(inv.expires_at).toLocaleDateString() : '—'}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                {inv.status !== 'accepted' && (
                                  <Button
                                    variant="ghost" size="sm"
                                    className="h-7 px-2 text-xs text-zinc-400 hover:text-white"
                                    disabled={resendingId === inv.id}
                                    onClick={() => handleResendInvitation(inv.id)}
                                  >
                                    {resendingId === inv.id
                                      ? <Loader2 className="w-3 h-3 animate-spin" />
                                      : <RefreshCw className="w-3 h-3" />}
                                    <span className="ml-1 hidden sm:inline">{t('resendInvitation')}</span>
                                  </Button>
                                )}
                                {inv.status !== 'accepted' && (
                                  <Button
                                    variant="ghost" size="sm"
                                    className="h-7 px-2 text-xs text-red-500 hover:text-red-400 hover:bg-red-500/5"
                                    onClick={() => {
                                      setSelectedInvitationId(inv.id);
                                      setShowDeleteInvitationModal(true);
                                    }}
                                  >
                                    <X className="w-3 h-3" />
                                    <span className="ml-1 hidden sm:inline">{t('cancelInvitation')}</span>
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {isAdmin && (
          <TabsContent value="security" className="mt-4 space-y-4">
            <Card className="bg-zinc-950 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-sm text-white flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-400" /> {t('adminRecoveryTitle')}
                </CardTitle>
                <CardDescription className="text-xs text-zinc-500">
                  {t('adminRecoveryDesc')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-zinc-300 flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-emerald-400" /> {t('adminRecoveryCmdTitle')}
                    </p>
                  </div>
                  <p className="text-[11px] text-zinc-500">
                    {t('adminRecoveryCmdDesc')}
                  </p>
                  <div className="flex items-center gap-2 bg-zinc-950 rounded px-3 py-2 border border-zinc-800 group relative">
                    <code className="text-xs font-mono text-emerald-400 flex-1 truncate">
                      python3 scripts/reset_admin_password.py --email [ADMIN_EMAIL] --password [NEW_PASSWORD]
                    </code>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-zinc-400 hover:text-white" 
                      onClick={() => { 
                        navigator.clipboard.writeText('python3 scripts/reset_admin_password.py --email admin@example.com --password newpassword'); 
                        toast.success('Command copied!'); 
                      }}>
                      <Copy className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-3 bg-amber-500/5 border border-amber-500/10 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-amber-500">Important</p>
                    <ul className="text-[10px] text-zinc-500 space-y-1 list-disc pl-3">
                      <li>{lang === 'fr' ? 'Cette commande réinitialise directement le mot de passe dans la base de données.' : 'This command resets the password directly in the database.'}</li>
                      <li>{lang === 'fr' ? 'Utilisez cette méthode si le SMTP n\'est pas encore configuré.' : 'Use this method if SMTP is not yet configured.'}</li>
                      <li>{lang === 'fr' ? 'L\'email doit correspondre à un utilisateur existant avec le rôle admin.' : 'The email must match an existing user with the admin role.'}</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      <ConfirmModal
        open={showRuleDeleteModal}
        onOpenChange={setShowRuleDeleteModal}
        title="Delete Alert Rule"
        description={lang === 'fr' ? 'Êtes-vous sûr de vouloir supprimer cette règle d\'alerte ? Vous ne recevrez plus de notifications pour ces événements.' : 'Are you sure you want to delete this alert rule? You will no longer receive notifications for these events.'}
        onConfirm={() => handleRuleDelete(selectedRuleId)}
      />
      <ConfirmModal
        open={showRuleUpdateModal}
        onOpenChange={setShowRuleUpdateModal}
        title="Update Alert Rule"
        description={lang === 'fr' ? 'Êtes-vous sûr de vouloir enregistrer ces modifications pour cette règle ?' : 'Are you sure you want to save these changes to the alert rule?'}
        onConfirm={handleRuleSave}
        confirmText="Update"
        variant="primary"
      />
      <ConfirmModal
        open={showSmtpUpdateModal}
        onOpenChange={setShowSmtpUpdateModal}
        title="Update SMTP Configuration"
        description={lang === 'fr' ? 'Êtes-vous sûr de vouloir mettre à jour les paramètres SMTP ? Cela affectera l\'envoi des alertes.' : 'Are you sure you want to update the SMTP settings? This will affect how alerts are sent.'}
        onConfirm={handleSmtpSave}
        confirmText="Update"
        variant="primary"
      />
      <ConfirmModal
        open={statusModalOpen}
        onOpenChange={setStatusModalOpen}
        title={userToToggleStatus?.is_active === false ? (lang === 'fr' ? 'Activer le compte' : 'Activate Account') : (lang === 'fr' ? 'Désactiver le compte' : 'Deactivate Account')}
        description={userToToggleStatus?.is_active === false 
          ? (lang === 'fr' ? `Voulez-vous vraiment réactiver le compte de ${userToToggleStatus?.name} ?` : `Are you sure you want to reactivate ${userToToggleStatus?.name}'s account?`)
          : (lang === 'fr' ? `Voulez-vous vraiment désactiver le compte de ${userToToggleStatus?.name} ? L'utilisateur sera immédiatement déconnecté.` : `Are you sure you want to deactivate ${userToToggleStatus?.name}'s account? The user will be immediately logged out.`)}
        onConfirm={handleToggleStatus}
        confirmText={userToToggleStatus?.is_active === false ? (lang === 'fr' ? 'Activer' : 'Activate') : (lang === 'fr' ? 'Désactiver' : 'Deactivate')}
        variant={userToToggleStatus?.is_active === false ? 'primary' : 'danger'}
      />
      <ConfirmModal
        open={showAgentRevokeModal}
        onOpenChange={setShowAgentRevokeModal}
        title={lang === 'fr' ? 'Révoquer la clé agent' : 'Revoke Agent Key'}
        description={lang === 'fr' ? 'Êtes-vous sûr de vouloir révoquer cette clé ? Les agents utilisant cette clé ne pourront plus pousser de logs.' : 'Are you sure you want to revoke this key? Agents using this key will no longer be able to push logs.'}
        onConfirm={() => handleRevokeAgentKey(selectedAgentKeyId)}
        confirmText={lang === 'fr' ? 'Révoquer' : 'Revoke'}
        variant="danger"
      />
      <Dialog open={projectAccessModalOpen} onOpenChange={setProjectAccessModalOpen}>
        <DialogContent className="bg-zinc-950 border-zinc-800 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white">{lang === 'fr' ? 'Accès Projets' : 'Project Access'} - {selectedAccessUser?.name}</DialogTitle>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto space-y-2 py-4">
            <p className="text-sm text-zinc-400">
              {lang === 'fr' ? 'Sélectionnez les projets auxquels ce membre a accès. Il ne verra que les logs et canaux de ces projets.' : 'Select which projects this member can access. They will only see logs and channels for these projects.'}
            </p>
            {projects.length === 0 ? (
              <p className="text-sm text-zinc-500 text-center">No projects available.</p>
            ) : (
              projects.map(p => {
                const hasAccess = tempAllowedProjects.includes(p.id);
                return (
                  <div key={p.id} className="flex items-center justify-between p-3 border border-zinc-800 rounded-lg hover:border-zinc-700 cursor-pointer bg-zinc-900/50" onClick={() => toggleTempProject(p.id)}>
                    <div className="flex items-center gap-3">
                      {hasAccess ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <div className="w-4 h-4 rounded-full border border-zinc-600" />}
                      <span className="text-sm text-zinc-300 font-medium">{p.name}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <DialogFooter className="mt-6 border-t border-zinc-900 pt-4">
            <Button variant="ghost" className="text-zinc-400" onClick={() => setProjectAccessModalOpen(false)}>{t('cancel')}</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setShowProjectAccessUpdateModal(true)}>{lang === 'fr' ? 'Enregistrer l\'Accès' : 'Save Access'}</Button>
        </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmModal 
        open={showRuleCreateModal}
        onOpenChange={setShowRuleCreateModal}
        title="Create Alert Rule"
        description={lang === 'fr' ? 'Êtes-vous sûr de vouloir créer cette nouvelle règle d\'alerte ?' : 'Are you sure you want to create this new alert rule?'}
        onConfirm={handleRuleSave}
        confirmText="Create"
        variant="primary"
      />

      <ConfirmModal 
        open={showAppSettingsUpdateModal}
        onOpenChange={setShowAppSettingsUpdateModal}
        title="Update App Settings"
        description={lang === 'fr' ? 'Êtes-vous sûr de vouloir mettre à jour les paramètres globaux de l\'application ? Cela affectera tous les utilisateurs.' : 'Are you sure you want to update the global app settings? This will affect all users.'}
        onConfirm={handleAppSettingsSave}
        confirmText="Save"
        variant="primary"
      />

      <ConfirmModal 
        open={showDashboardUpdateModal}
        onOpenChange={setShowDashboardUpdateModal}
        title="Update Dashboard Preferences"
        description={lang === 'fr' ? 'Êtes-vous sûr de vouloir enregistrer la disposition des widgets de votre tableau de bord ?' : 'Are you sure you want to save your dashboard widget layout?'}
        onConfirm={handleSaveDashboard}
        confirmText="Save"
        variant="primary"
      />

      <ConfirmModal 
        open={showProjectAccessUpdateModal}
        onOpenChange={setShowProjectAccessUpdateModal}
        title="Update Project Access"
        description={lang === 'fr' ? 'Êtes-vous sûr de vouloir mettre à jour les permissions d\'accès aux projets pour cet utilisateur ?' : 'Are you sure you want to update the project access permissions for this user?'}
        onConfirm={handleSaveAllowedProjects}
        confirmText="Update"
        variant="primary"
      />

      <Dialog open={showAgentKeyGenerateModal} onOpenChange={setShowAgentKeyGenerateModal}>
        <DialogContent className="bg-zinc-950 border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-white">{lang === 'fr' ? 'Générer une nouvelle clé agent' : 'Generate new agent key'}</DialogTitle>
            <DialogDescription>
              {lang === 'fr' 
                ? 'Configurez la durée de validité de cette clé. Une fois expirée, l\'agent ne pourra plus envoyer de logs.' 
                : 'Configure the validity period of this key. Once expired, the agent will no longer be able to send logs.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-xs text-zinc-400">{lang === 'fr' ? 'Durée de validité' : 'Validity period'}</Label>
              <Select value={agentKeyExpOption} onValueChange={setAgentKeyExpOption}>
                <SelectTrigger className="bg-zinc-900 border-zinc-800 text-white focus:ring-emerald-500/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                  <SelectItem value="7">{lang === 'fr' ? '7 Jours' : '7 Days'}</SelectItem>
                  <SelectItem value="30">{lang === 'fr' ? '30 Jours' : '30 Days'}</SelectItem>
                  <SelectItem value="90">{lang === 'fr' ? '90 Jours' : '90 Days'}</SelectItem>
                  <SelectItem value="365">{lang === 'fr' ? '1 An' : '1 Year'}</SelectItem>
                  <SelectItem value="custom">{lang === 'fr' ? 'Personnalisé' : 'Custom'}</SelectItem>
                  <SelectItem value="never">{lang === 'fr' ? 'Jamais' : 'Never'}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {agentKeyExpOption === 'custom' && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
                 <Label className="text-xs text-zinc-400">{lang === 'fr' ? 'Date d\'expiration' : 'Expiration date'}</Label>
                 <Input 
                   type="datetime-local" 
                   value={customExpDate} 
                   onChange={(e) => setCustomExpDate(e.target.value)}
                   min={new Date(Date.now() + 3600000 - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)}
                   max={new Date(Date.now() + (31536000000 * 2) - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)}
                   className="bg-zinc-900 border-zinc-800 text-white focus:border-emerald-500/50"
                 />
                 <p className="text-[10px] text-zinc-500">Min: 1 hour, Max: 2 years</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" className="text-zinc-400" onClick={() => setShowAgentKeyGenerateModal(false)}>{t('cancel')}</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white transition-colors" onClick={() => {
              setShowAgentKeyGenerateModal(false);
              handleGenerateAgentKey();
            }}>{lang === 'fr' ? 'Confirmer et Générer' : 'Confirm and Generate'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={permissionsModalOpen} onOpenChange={setPermissionsModalOpen}>
        <DialogContent className={`${theme === 'dark' ? 'bg-[#09090b] border-zinc-800/80 shadow-emerald-500/10' : 'bg-white border-zinc-200 shadow-xl'} max-w-md p-0 overflow-hidden shadow-2xl`}>
          <div className={`${theme === 'dark' ? 'bg-gradient-to-tr from-emerald-500/10 via-zinc-950 to-zinc-950 border-zinc-800/50' : 'bg-gradient-to-tr from-emerald-50 via-white to-white border-zinc-100'} p-6 border-b`}>
            <DialogHeader>
              <div className="flex items-center gap-3 mb-1">
                <div className={`p-2 rounded-lg border ${theme === 'dark' ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-emerald-50 border-emerald-100'}`}>
                  <Shield className="w-5 h-5 text-emerald-500" />
                </div>
                <div>
                  <DialogTitle className={`text-lg font-bold tracking-tight ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>
                    {lang === 'fr' ? 'Permissions Plateforme' : 'Platform Permissions'}
                  </DialogTitle>
                  <DialogDescription className="text-zinc-500 text-[11px] font-medium leading-none mt-1">
                    {selectedPermissionUser?.name} • {selectedPermissionUser?.email}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
          </div>

          <div className={`p-6 space-y-3 ${theme === 'dark' ? 'bg-[#09090b]' : 'bg-white'}`}>
            <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-4 ml-1">
              {lang === 'fr' ? 'Modules Accessibles' : 'Accessible Modules'}
            </p>
            {PERMISSIONS.map(p => {
              const granted = (selectedPermissionUser?.permissions || []).includes(p.key);
              return (
                <div 
                  key={p.key} 
                  className={`group flex items-center justify-between p-4 border rounded-2xl transition-all duration-300 ${
                    granted 
                    ? (theme === 'dark' ? 'bg-emerald-500/[0.03] border-emerald-500/30' : 'bg-emerald-50/50 border-emerald-200/60') 
                    : (theme === 'dark' ? 'bg-zinc-900/40 border-zinc-800/50 hover:bg-zinc-900/60 hover:border-zinc-700' : 'bg-zinc-50 border-zinc-100 hover:bg-zinc-100/50 hover:border-zinc-200')
                  }`}
                >
                  <div className="space-y-1.5 flex-1 pr-4">
                    <div className="flex items-center gap-2">
                      <p className={`text-sm font-bold transition-colors ${granted ? 'text-emerald-500' : (theme === 'dark' ? 'text-zinc-200' : 'text-zinc-800')}`}>
                        {lang === 'fr' ? p.label_fr : p.label}
                      </p>
                      {granted && <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />}
                    </div>
                    <p className={`text-[11px] leading-snug font-medium ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-500'}`}>
                      {lang === 'fr' ? p.description_fr : p.description}
                    </p>
                  </div>
                  <div className="relative">
                    <Switch 
                      checked={granted}
                      onCheckedChange={(checked) => handleUpdatePermission(selectedPermissionUser?.id, p.key, checked)}
                      className={`scale-100 transition-all ${
                        granted 
                        ? 'data-[state=checked]:bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]' 
                        : (theme === 'dark' ? 'data-[state=unchecked]:bg-zinc-800' : 'data-[state=unchecked]:bg-zinc-200')
                      }`}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className={`p-6 border-t ${theme === 'dark' ? 'bg-zinc-950/50 border-zinc-800/50' : 'bg-zinc-50/50 border-zinc-100'}`}>
            <Button 
              className={`w-full text-xs font-bold h-10 tracking-wide transition-all ${
                theme === 'dark' 
                ? 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800' 
                : 'bg-white hover:bg-zinc-50 text-zinc-600 border border-zinc-200'
              }`} 
              onClick={() => setPermissionsModalOpen(false)}
            >
              {lang === 'fr' ? 'Fermer' : 'Close'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmModal
        open={resetModalOpen}
        onOpenChange={setResetModalOpen}
        title={lang === 'fr' ? "Réinitialiser le mot de passe" : "Reset Password"}
        description={lang === 'fr'
          ? `Êtes-vous sûr de vouloir envoyer un e-mail de réinitialisation de mot de passe à ${userToReset?.email} ?`
          : `Are you sure you want to send a password reset email to ${userToReset?.email}?`}
        onConfirm={handleTriggerPasswordReset}
        confirmText={lang === 'fr' ? "Envoyer" : "Send Email"}
        variant="primary"
        loading={resettingPassword}
      />

      <ConfirmModal
        open={showDeleteInvitationModal}
        onOpenChange={(open) => { setShowDeleteInvitationModal(open); if (!open) setSelectedInvitationId(null); }}
        title={t('deleteInvitationConfirmTitle')}
        description={t('deleteInvitationConfirmDesc')}
        onConfirm={() => handleDeleteInvitation(selectedInvitationId)}
        confirmText={t('cancelInvitation')}
        variant="destructive"
      />
    </div>
  );
}
