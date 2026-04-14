import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../lib/AuthContext';
import { useLanguage } from '../lib/LanguageContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Plus, Copy, RefreshCw, Trash2, Edit2, Key, FolderKanban, List, Hash } from 'lucide-react';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import { PageLoader } from '../components/ui/page-loader';
import { LogLoader } from '../components/ui/log-loader';
import { ConfirmModal } from '../components/ui/confirm-modal';

export default function ProjectsPage() {
  const { t, lang } = useLanguage();
  const navigate = useNavigate();
  const { hasPermission, isAdmin } = useAuth();
  const [projects, setProjects] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editProject, setEditProject] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', environment: 'production' });
  
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showRegenModal, setShowRegenModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/projects/', { params: { page, size: 99 } });
      setProjects(res.data.projects || []);
      setTotal(res.data.total || 0);
    } catch (e) { toast.error('Failed to load projects'); }
    finally { setLoading(false); }
  }, [page]);

  useEffect(() => { 
    fetchProjects(); 
  }, [fetchProjects]);

  const handleSave = async () => {
    try {
      if (editProject) {
        await api.put(`/projects/${editProject.id}`, form);
        toast.success('Project updated');
      } else {
        await api.post('/projects/', form);
        toast.success('Project created');
      }
      setDialogOpen(false);
      setEditProject(null);
      setForm({ name: '', description: '', environment: 'production' });
      fetchProjects();
    } catch (e) { toast.error(e.response?.data?.detail || 'Failed to save project'); }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/projects/${id}`);
      toast.success('Project deleted');
      fetchProjects();
    } catch (e) { toast.error('Failed to delete project'); }
  };

  const handleRegenKey = async (id) => {
    try {
      const res = await api.post(`/projects/${id}/regenerate-key`);
      toast.success('API key regenerated');
      fetchProjects();
    } catch (e) { toast.error('Failed to regenerate key'); }
  };

  const copyKey = (key) => {
    navigator.clipboard.writeText(key);
    toast.success('API key copied');
  };

  const copyId = (id) => {
    navigator.clipboard.writeText(id);
    toast.success('Project ID copied');
  };

  const openEdit = (project) => {
    setEditProject(project);
    setForm({ name: project.name, description: project.description, environment: project.environment });
    setDialogOpen(true);
  };

  const openNew = () => {
    setEditProject(null);
    setForm({ name: '', description: '', environment: 'production' });
    setDialogOpen(true);
  };

  return (
    <div className="p-6 space-y-6" data-testid="projects-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-mono font-bold tracking-tight text-white">{t('projects')}</h1>
          <p className="text-sm text-zinc-500 mt-1">{t('integrateLogForge')}</p>
        </div>
        {isAdmin && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openNew} data-testid="create-project-btn"
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                disabled={loading}>
                <Plus className="w-4 h-4 mr-2" /> {t('newProject')}
              </Button>
            </DialogTrigger>
          <DialogContent className="bg-zinc-950 border-zinc-800">
            <DialogHeader>
              <DialogTitle className="text-white">{editProject ? t('edit') : t('signup')} {t('project')}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label className="text-xs text-zinc-400">Name</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="My App" data-testid="project-name-input"
                  className="bg-zinc-900 border-zinc-800 text-white" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-zinc-400">Description</Label>
                <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Optional description" data-testid="project-desc-input"
                  className="bg-zinc-900 border-zinc-800 text-white" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-zinc-400">Environment</Label>
                <Select value={form.environment} onValueChange={(v) => setForm({ ...form, environment: v })}>
                  <SelectTrigger className="bg-zinc-900 border-zinc-800 text-zinc-300" data-testid="project-env-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="production">Production</SelectItem>
                    <SelectItem value="staging">Staging</SelectItem>
                    <SelectItem value="development">Development</SelectItem>
                  </SelectContent>
                </Select>
              </div>
               <Button onClick={() => {
                  if (editProject) {
                    setShowUpdateModal(true);
                  } else {
                    setShowCreateModal(true);
                  }
                }} data-testid="save-project-btn"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                  {editProject ? t('edit') : t('signup')} {t('project')}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {loading ? (
        <div className="border border-zinc-800 rounded-lg bg-zinc-950 flex flex-col items-center justify-center min-h-[300px]">
          <LogLoader text={lang === 'fr' ? 'Chargement des projets' : 'Loading projects'} />
        </div>
      ) : projects.length === 0 ? (
        <Card className="bg-zinc-950 border-zinc-800">
          <CardContent className="p-12 text-center">
            <FolderKanban className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
            <p className="text-zinc-400 text-sm">No projects yet. Create your first project to start monitoring.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects.map(project => (
            <Card
              key={project.id}
              className="bg-zinc-950 border-zinc-800 hover:border-zinc-700 transition-colors cursor-pointer group"
              data-testid={`project-card-${project.id}`}
              onClick={() => navigate(`/projects/${project.id}/logs`)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base font-semibold text-white group-hover:text-[hsl(var(--app-primary))] transition-colors">
                      {project.name}
                    </CardTitle>
                    {project.description && <p className="text-xs text-zinc-500 mt-1">{project.description}</p>}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost" size="sm"
                      onClick={(e) => { e.stopPropagation(); navigate(`/projects/${project.id}/logs`); }}
                      data-testid={`view-logs-${project.id}`}
                      className="text-zinc-500 hover:text-[hsl(var(--app-primary))] h-7 px-2 text-[11px] gap-1"
                    >
                      <List className="w-3.5 h-3.5" /> Logs
                    </Button>
                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); openEdit(project); }} data-testid={`edit-project-${project.id}`}
                      className="text-zinc-500 hover:text-white h-7 w-7 p-0">
                      <Edit2 className="w-3.5 h-3.5" />
                    </Button>
                    {hasPermission('delete_projects') && (
                      <Button variant="ghost" size="sm" onClick={(e) => {
                        e.stopPropagation();
                        setSelectedId(project.id);
                        setShowDeleteModal(true);
                      }} data-testid={`delete-project-${project.id}`}
                        className="text-zinc-500 hover:text-red-400 h-7 w-7 p-0">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-[10px] bg-zinc-800 text-zinc-400">{project.environment}</Badge>
                  <span className="text-[10px] text-zinc-600">{project.created_at ? format(parseISO(project.created_at), 'MMM dd, yyyy') : ''}</span>
                </div>
                <div className="flex items-center gap-2 bg-zinc-900/50 rounded-md px-3 py-2 border border-zinc-800" onClick={(e) => e.stopPropagation()}>
                  <Key className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
                  <code className="text-[11px] font-mono text-zinc-400 truncate flex-1" data-testid={`api-key-${project.id}`}>
                    {project.api_key}
                  </code>
                  <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); copyKey(project.api_key); }}
                    data-testid={`copy-key-${project.id}`} className="h-6 w-6 p-0 text-zinc-500 hover:text-white">
                    <Copy className="w-3 h-3" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={(e) => { 
                    e.stopPropagation(); 
                    setSelectedId(project.id);
                    setShowRegenModal(true);
                  }}
                    data-testid={`regen-key-${project.id}`} className="h-6 w-6 p-0 text-zinc-500 hover:text-yellow-400">
                    <RefreshCw className="w-3 h-3" />
                  </Button>
                </div>
                <div className="flex items-center gap-2 bg-zinc-900/30 rounded-md px-3 py-1.5 border border-zinc-800/50" onClick={(e) => e.stopPropagation()}>
                  <Hash className="w-3 h-3 text-zinc-700 shrink-0" />
                  <span className="text-[10px] font-mono text-zinc-500 truncate flex-1">
                    ID: {project.id}
                  </span>
                  <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); copyId(project.id); }}
                    className="h-5 w-5 p-0 text-zinc-600 hover:text-white">
                    <Copy className="w-2.5 h-2.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {total > 99 && (
        <div className="flex justify-between items-center mt-6 text-xs text-zinc-500">
          <p>Page {page} of {Math.ceil(total / 99)} ({total} total)</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="border-zinc-800 text-zinc-400">{t('prev')}</Button>
            <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page * 99 >= total} className="border-zinc-800 text-zinc-400">{t('next')}</Button>
          </div>
        </div>
      )}

      <ConfirmModal 
        open={showDeleteModal}
        onOpenChange={setShowDeleteModal}
        title="Delete Project"
        description={lang === 'fr' ? 'Êtes-vous sûr de vouloir supprimer ce projet ? Tous les logs associés seront définitivement supprimés. Cette action est irréversible.' : 'Are you sure you want to delete this project? All associated logs will be permanently deleted. This action cannot be undone.'}
        onConfirm={() => handleDelete(selectedId)}
      />

      <ConfirmModal 
        open={showRegenModal}
        onOpenChange={setShowRegenModal}
        title="Regenerate API Key"
        description={lang === 'fr' ? 'Êtes-vous sûr de vouloir régénérer la clé API ? L\'ancienne clé cessera de fonctionner immédiatement, rendant inopérantes vos intégrations existantes.' : 'Are you sure you want to regenerate the API key? The old key will stop working immediately, breaking existing integrations.'}
        onConfirm={() => handleRegenKey(selectedId)}
        confirmText="Regenerate"
      />

      <ConfirmModal 
        open={showUpdateModal}
        onOpenChange={setShowUpdateModal}
        title="Update Project"
        description={lang === 'fr' ? 'Êtes-vous sûr de vouloir enregistrer ces modifications pour ce projet ?' : 'Are you sure you want to save these changes to the project?'}
        onConfirm={handleSave}
        confirmText="Update"
        variant="primary"
      />

      <ConfirmModal 
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        title="Create Project"
        description={lang === 'fr' ? 'Êtes-vous sûr de vouloir créer ce nouveau projet ?' : 'Are you sure you want to create this new project?'}
        onConfirm={handleSave}
        confirmText="Create"
        variant="primary"
      />
    </div>
  );
}
