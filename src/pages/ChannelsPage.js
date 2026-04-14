import { useState, useEffect, useCallback } from 'react';
import api from '../lib/api';
import { useLanguage } from '../lib/LanguageContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Plus, Trash2, Edit2, Hash } from 'lucide-react';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import { ConfirmModal } from '../components/ui/confirm-modal';
import { LogLoader } from '../components/ui/log-loader';

export default function ChannelsPage() {
  const { t, lang } = useLanguage();
  const [initialLoading, setInitialLoading] = useState(true);
  const [channels, setChannels] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editChannel, setEditChannel] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', project_id: '' });
  
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    api.get('/projects/').then(r => setProjects(r.data.projects || [])).catch(() => {});
  }, []);

  const fetchChannels = useCallback(async () => {
    try {
      const params = selectedProject !== 'all' ? { project_id: selectedProject, page, size: 99 } : { page, size: 99 };
      const res = await api.get('/channels/', { params });
      setChannels(res.data.channels || []);
      setTotal(res.data.total || 0);
    } catch (e) { toast.error('Failed to load channels'); }
    finally { setInitialLoading(false); }
  }, [selectedProject, page]);
  
  useEffect(() => { setPage(1); fetchChannels(); }, [selectedProject, fetchChannels]);
  
  useEffect(() => { fetchChannels(); }, [page, fetchChannels]);

  const handleSave = async () => {
    try {
      if (editChannel) {
        await api.put(`/channels/${editChannel.id}`, { name: form.name, description: form.description });
        toast.success('Channel updated');
      } else {
        await api.post('/channels/', form);
        toast.success('Channel created');
      }
      setDialogOpen(false);
      setEditChannel(null);
      setForm({ name: '', description: '', project_id: '' });
      fetchChannels();
    } catch (e) { toast.error(e.response?.data?.detail || 'Failed to save channel'); }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/channels/${id}`);
      toast.success('Channel deleted');
      fetchChannels();
    } catch (e) { toast.error('Failed to delete channel'); }
  };

  const openEdit = (ch) => {
    setEditChannel(ch);
    setForm({ name: ch.name, description: ch.description, project_id: ch.project_id });
    setDialogOpen(true);
  };

  const openNew = () => {
    setEditChannel(null);
    setForm({ name: '', description: '', project_id: projects[0]?.id || '' });
    setDialogOpen(true);
  };

  const getProjectName = (pid) => projects.find(p => p.id === pid)?.name || pid;

  return (
    <div className="p-6 space-y-6" data-testid="channels-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-mono font-bold tracking-tight text-white">{t('channels')}</h1>
          <p className="text-sm text-zinc-500 mt-1">{t('segmentLogs') || 'Segment logs by logical categories'}</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedProject} onValueChange={setSelectedProject}>
            <SelectTrigger className="w-[180px] bg-zinc-900 border-zinc-800 text-zinc-300" data-testid="channel-project-filter">
              <SelectValue placeholder={t('allProjects')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{lang === 'fr' ? 'Tous les Projets' : 'All Projects'}</SelectItem>
              {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openNew} data-testid="create-channel-btn"
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                disabled={projects.length === 0}>
                <Plus className="w-4 h-4 mr-2" /> {t('newChannel')}
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-zinc-950 border-zinc-800">
              <DialogHeader>
                <DialogTitle className="text-white">{editChannel ? (lang === 'fr' ? 'Modifier le Canal' : 'Edit Channel') : (lang === 'fr' ? 'Créer un Canal' : 'Create Channel')}</DialogTitle>
              </DialogHeader>
                <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label className="text-xs text-zinc-400">{lang === 'fr' ? 'Nom' : 'Name'}</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. auth, payments, notifications" data-testid="channel-name-input"
                    className="bg-zinc-900 border-zinc-800 text-white" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-zinc-400">{lang === 'fr' ? 'Description' : 'Description'}</Label>
                  <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder={lang === 'fr' ? 'Description (optionnelle)' : 'Optional description'} data-testid="channel-desc-input"
                    className="bg-zinc-900 border-zinc-800 text-white" />
                </div>
                {!editChannel && (
                  <div className="space-y-2">
                    <Label className="text-xs text-zinc-400">{lang === 'fr' ? 'Projet' : 'Project'}</Label>
                    <Select value={form.project_id} onValueChange={(v) => setForm({ ...form, project_id: v })}>
                      <SelectTrigger className="bg-zinc-900 border-zinc-800 text-zinc-300" data-testid="channel-project-select">
                        <SelectValue placeholder={lang === 'fr' ? 'Sélectionnez un projet' : 'Select project'} />
                      </SelectTrigger>
                      <SelectContent>
                        {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <Button onClick={() => {
                  if (editChannel) {
                    setShowUpdateModal(true);
                  } else {
                    setShowCreateModal(true);
                  }
                }} data-testid="save-channel-btn"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                  {editChannel ? (lang === 'fr' ? 'Mettre à jour' : 'Update') : (lang === 'fr' ? 'Créer le Canal' : 'Create Channel')}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {initialLoading ? (
        <div className="border border-zinc-800 rounded-lg overflow-hidden bg-zinc-950 flex flex-col items-center justify-center min-h-[300px]">
          <LogLoader text={lang === 'fr' ? 'Chargement des canaux' : 'Loading channels'} />
        </div>
      ) : channels.length === 0 ? (
        <Card className="bg-zinc-950 border-zinc-800">
          <CardContent className="p-12 text-center">
            <Hash className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
            <p className="text-zinc-400 text-sm">
              {projects.length === 0 ? 'Create a project first, then add channels.' : 'No channels yet. Create one to segment your logs.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="border border-zinc-800 rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-zinc-800 hover:bg-transparent">
                <TableHead className="text-zinc-500 text-xs font-mono">{lang === 'fr' ? 'Nom' : 'Name'}</TableHead>
                <TableHead className="text-zinc-500 text-xs font-mono">{lang === 'fr' ? 'Description' : 'Description'}</TableHead>
                <TableHead className="text-zinc-500 text-xs font-mono">{lang === 'fr' ? 'Projet' : 'Project'}</TableHead>
                <TableHead className="text-zinc-500 text-xs font-mono w-[140px]">{lang === 'fr' ? 'Créé le' : 'Created'}</TableHead>
                <TableHead className="text-zinc-500 text-xs font-mono w-[80px]">{lang === 'fr' ? 'Actions' : 'Actions'}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {channels.map(ch => (
                <TableRow key={ch.id} className="border-zinc-800/50" data-testid={`channel-row-${ch.id}`}>
                  <TableCell className="font-mono text-sm text-white">
                    <div className="flex items-center gap-2">
                      <Hash className="w-3.5 h-3.5 text-zinc-600" /> {ch.name}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-zinc-500">{ch.description || '-'}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-[10px] bg-zinc-800 text-zinc-400">{getProjectName(ch.project_id)}</Badge>
                  </TableCell>
                  <TableCell className="text-xs text-zinc-500 font-mono">
                    {ch.created_at ? format(parseISO(ch.created_at), 'MMM dd, yyyy') : ''}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(ch)} data-testid={`edit-channel-${ch.id}`}
                        className="h-7 w-7 p-0 text-zinc-500 hover:text-white">
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => {
                        setSelectedId(ch.id);
                        setShowDeleteModal(true);
                      }} data-testid={`delete-channel-${ch.id}`}
                        className="h-7 w-7 p-0 text-zinc-500 hover:text-red-400">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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
        title="Delete Channel"
        description={lang === 'fr' ? 'Êtes-vous sûr de vouloir supprimer ce channel ? Les logs ne seront plus segmentés dans cette catégorie.' : 'Are you sure you want to delete this channel? This will stop segmenting logs into this category.'}
        onConfirm={() => handleDelete(selectedId)}
      />

      <ConfirmModal 
        open={showUpdateModal}
        onOpenChange={setShowUpdateModal}
        title="Update Channel"
        description={lang === 'fr' ? 'Êtes-vous sûr de vouloir enregistrer ces modifications pour ce channel ?' : 'Are you sure you want to save these changes to the channel?'}
        onConfirm={handleSave}
        confirmText="Update"
        variant="primary"
      />

      <ConfirmModal 
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        title="Create Channel"
        description={lang === 'fr' ? 'Êtes-vous sûr de vouloir créer ce nouveau channel ?' : 'Are you sure you want to create this new channel?'}
        onConfirm={handleSave}
        confirmText="Create"
        variant="primary"
      />
    </div>
  );
}
