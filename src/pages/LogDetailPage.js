import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { ArrowLeft, Clock, Layers, Monitor, User, Tag, Hash, Trash2, PlayCircle, Cpu, HardDrive, Network, Globe, Mail, Shield, Terminal, Zap, Container } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';
import { PageLoader } from '../components/ui/page-loader';
import { ConfirmModal } from '../components/ui/confirm-modal';
import { useLanguage } from '../lib/LanguageContext';
import ReplayPlayer from '../components/ReplayPlayer';

const LEVEL_COLORS = {
  critical: 'bg-red-900/40 text-red-300 border-red-800/50',
  error: 'bg-red-900/30 text-red-400 border-red-900/50',
  warning: 'bg-yellow-900/30 text-yellow-400 border-yellow-900/50',
  info: 'bg-blue-900/30 text-blue-400 border-blue-900/50',
  debug: 'bg-zinc-800/50 text-zinc-400 border-zinc-700/50',
};

const Section = ({ title, icon: Icon, className, children }) => (
  <Card className={`bg-zinc-950 border-zinc-800 ${className || ''}`}>
    <CardHeader className="pb-2 pt-4 px-5">
      <CardTitle className="text-xs font-mono uppercase tracking-wider text-zinc-500 flex items-center gap-2">
        <Icon className="w-3.5 h-3.5" strokeWidth={1.5} /> {title}
      </CardTitle>
    </CardHeader>
    <CardContent className="px-5 pb-4">{children}</CardContent>
  </Card>
);

const JsonBlock = ({ data }) => (
  <pre className="code-block text-xs whitespace-pre-wrap break-all">
    {JSON.stringify(data, null, 2)}
  </pre>
);

const MetadataItem = ({ label, value, icon: Icon }) => {
  if (!value) return null;
  return (
    <div className="flex items-center gap-3 py-2 border-b border-zinc-900/50 last:border-0">
      {Icon && <Icon className="w-3.5 h-3.5 text-zinc-500" strokeWidth={1.5} />}
      <div className="flex flex-col">
        <span className="text-[10px] uppercase tracking-wider text-zinc-600 font-mono">{label}</span>
        <span className="text-xs text-zinc-300 font-mono">{value}</span>
      </div>
    </div>
  );
};

export default function LogDetailPage() {
  const { t, lang } = useLanguage();
  const { id } = useParams();
  const navigate = useNavigate();
  const [log, setLog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [replayData, setReplayData] = useState(null);
  const [showReplay, setShowReplay] = useState(false);
  const [loadingReplay, setLoadingReplay] = useState(false);

  useEffect(() => {
    const fetchLog = async () => {
      try {
        const res = await api.get(`/logs/${id}`);
        setLog(res.data);
      } catch (err) {
        toast.error('Log not found');
        navigate('/logs');
      } finally {
        setLoading(false);
      }
    };
    fetchLog();
  }, [id, navigate]);

  const fetchReplay = async () => {
    if (replayData) {
      setShowReplay(!showReplay);
      return;
    }
    
    setLoadingReplay(true);
    try {
      const res = await api.get(`/logs/replay/${id}`);
      setReplayData(res.data.events);
      setShowReplay(true);
    } catch (err) {
      toast.error('Failed to load replay');
    } finally {
      setLoadingReplay(false);
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/logs/${id}`);
      toast.success('Log deleted');
      navigate('/logs');
    } catch (err) {
      toast.error('Failed to delete log');
    }
  };

  if (loading) return <PageLoader />;
  if (!log) return <div className="p-6 text-zinc-500 font-mono text-sm">{lang === 'fr' ? 'Log introuvable' : 'Log not found'}</div>;

  return (
    <div className="p-6 space-y-6 w-full max-w-full" data-testid="log-detail-page">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} data-testid="back-to-logs-btn"
            className="text-zinc-400 hover:text-white">
            <ArrowLeft className="w-4 h-4 mr-1" /> {t('back')}
          </Button>
          <Badge variant="outline" className={`text-xs px-2 py-0.5 font-mono ${LEVEL_COLORS[log.level] || LEVEL_COLORS.info}`}>
            {log.level?.toUpperCase()}
          </Badge>
          <span className="text-xs text-zinc-500 font-mono">{log.id}</span>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setShowDeleteModal(true)} data-testid="delete-log-btn"
          className="text-zinc-500 hover:text-red-400 hover:bg-red-500/10">
          <Trash2 className="w-4 h-4 mr-1" /> {t('delete')}
        </Button>
      </div>

      <ConfirmModal 
        open={showDeleteModal} 
        onOpenChange={setShowDeleteModal}
        title={lang === 'fr' ? 'Supprimer le Log' : 'Delete Log'}
        description={lang === 'fr' ? 'Êtes-vous sûr de vouloir supprimer ce log ? Cette action est irréversible.' : 'Are you sure you want to delete this log? This action cannot be undone.'}
        onConfirm={handleDelete}
      />

      <Card className="bg-zinc-950 border-zinc-800">
        <CardContent className="p-5">
          <p className="font-mono text-sm text-white leading-relaxed">{log.message}</p>
          <div className="flex flex-wrap items-center gap-4 mt-4 text-xs text-zinc-500">
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {log.timestamp ? format(parseISO(log.timestamp), 'PPpp') : 'N/A'}</span>
            <span className="flex items-center gap-1"><Layers className="w-3 h-3" /> {log.project_name}</span>
            <span className="flex items-center gap-1"><Hash className="w-3 h-3" /> {log.channel}</span>
            <span className="text-zinc-600">{log.environment}</span>
          </div>
        </CardContent>
      </Card>

      {log.alert_email_sent && (
        <Card className="bg-amber-500/10 border-amber-500/20">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 rounded-full text-amber-500">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm text-amber-500 font-medium tracking-wide">
                {lang === 'fr' ? 'Alerte E-mail Déclenchée' : 'Alert Email Triggered'}
              </p>
              <p className="text-xs text-amber-500/70 mt-0.5">
                {lang === 'fr' 
                  ? 'Ce log correspondait à une règle d\'alerte active et une notification a bien été expédiée.' 
                  : 'This log matched an active alert rule and an email notification was successfully sent.'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {log.has_replay && (
        <Section title="Session Replay" icon={PlayCircle}>
          <div className="space-y-4">
            <Button 
              onClick={fetchReplay} 
              variant="outline" 
              size="sm"
              className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"
              disabled={loadingReplay}
            >
              {loadingReplay ? (lang === 'fr' ? 'Chargement...' : 'Loading...') : (showReplay ? (lang === 'fr' ? 'Masquer Replay' : 'Hide Replay') : (lang === 'fr' ? 'Voir Replay' : 'Show Replay'))}
            </Button>
            
            {showReplay && replayData && (
              <div className="mt-4">
                <ReplayPlayer events={replayData} />
              </div>
            )}
          </div>
        </Section>
      )}

      {log.stack_trace && (
        <Section title={t('stackTrace')} icon={Layers}>
          <pre className="code-block text-xs whitespace-pre-wrap leading-relaxed">{log.stack_trace}</pre>
        </Section>
      )}

      {log.ingest_protocol && log.ingest_protocol.startsWith('gelf') && (
        <Section title="GELF Protocol Information" icon={Terminal} className="border-emerald-900/20 bg-emerald-900/5">
          <div className="grid grid-cols-2 gap-x-6">
            <MetadataItem label="Ingest Protocol" value={log.ingest_protocol.toUpperCase()} icon={Zap} />
            <MetadataItem label="GELF Version" value={log.gelf_version} icon={Hash} />
            <MetadataItem label="Source Host" value={log.source_host} icon={Monitor} />
            <MetadataItem label="Syslog Level" value={log.syslog_level} icon={Terminal} />
          </div>
        </Section>
      )}

      {log.metadata?.source === 'docker-agent' && (
        <Section title="Docker Agent Info" icon={Container} className="border-emerald-900/20 bg-emerald-900/5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
            <MetadataItem label="Container Name" value={log.metadata?.container_name} icon={Terminal} />
            <MetadataItem label="Image" value={log.metadata?.image} icon={Zap} />
            <MetadataItem label="Container ID" value={log.metadata?.container_id} icon={Hash} />
            <MetadataItem label="Log Source" value="LogForge Docker Agent" icon={Cpu} />
          </div>
          {log.metadata?.labels && Object.keys(log.metadata.labels).length > 0 && (
            <div className="mt-4 pt-4 border-t border-emerald-900/10">
              <p className="text-[10px] uppercase tracking-wider text-emerald-800 font-mono mb-2">Docker Labels</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(log.metadata.labels).map(([k, v]) => (
                  <Badge key={k} variant="outline" className="text-[10px] py-0 border-emerald-900/20 text-emerald-600 bg-emerald-500/5">
                    {k}={v}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </Section>
      )}

      {log.metadata && Object.keys(log.metadata).length > 0 && (
        <Section title={t('metadata')} icon={Tag}>
          <JsonBlock data={log.metadata} />
        </Section>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {log.user_info && Object.keys(log.user_info).length > 0 && (
          <Section title={lang === 'fr' ? 'Infos Utilisateur' : 'User Info'} icon={User} className={(!log.device_info || Object.keys(log.device_info).length === 0) ? "md:col-span-2" : ""}>
            <div className="grid grid-cols-2 gap-x-6">
              <MetadataItem label="User ID" value={log.user_info.id || log.user_info.user_id} icon={User} />
              <MetadataItem label="Email" value={log.user_info.email} icon={Mail} />
              <MetadataItem label={lang === 'fr' ? 'Nom' : 'Name'} value={log.user_info.name} icon={User} />
              <MetadataItem label={lang === 'fr' ? 'Rôle' : 'Role'} value={log.user_info.role} icon={Shield} />
            </div>
            {Object.keys(log.user_info).some(k => !['id', 'user_id', 'email', 'name', 'role'].includes(k)) && (
              <div className="mt-4 pt-4 border-t border-zinc-900">
                <JsonBlock data={Object.fromEntries(Object.entries(log.user_info).filter(([k]) => !['id', 'user_id', 'email', 'name', 'role'].includes(k)))} />
              </div>
            )}
          </Section>
        )}
        {log.device_info && Object.keys(log.device_info).length > 0 && (
          <Section title={t('deviceInfo')} icon={Monitor} className={(!log.user_info || Object.keys(log.user_info).length === 0) ? "md:col-span-2" : ""}>
            <div className="grid grid-cols-2 gap-x-6">
              <MetadataItem label={lang === 'fr' ? 'Adresse IP' : 'IP Address'} value={log.device_info.ip} icon={Network} />
              <MetadataItem label="OS / Platform" value={log.device_info.os || log.device_info.platform} icon={Monitor} />
              <MetadataItem label={lang === 'fr' ? 'Cœurs CPU' : 'CPU Cores'} value={log.device_info.cpu_cores || log.device_info.cpu} icon={Cpu} />
              <MetadataItem label={lang === 'fr' ? 'Mémoire' : 'Memory'} value={log.device_info.memory_total || log.device_info.memory} icon={HardDrive} />
              <MetadataItem label={lang === 'fr' ? 'Langue' : 'Language'} value={log.device_info.language} icon={Globe} />
              <MetadataItem label={lang === 'fr' ? 'Écran' : 'Screen'} value={log.device_info.screen} icon={Monitor} />
            </div>
            {Object.keys(log.device_info).some(k => !['ip', 'os', 'platform', 'cpu_cores', 'cpu', 'memory_total', 'memory', 'language', 'screen'].includes(k)) && (
              <div className="mt-4 pt-4 border-t border-zinc-900">
                <JsonBlock data={Object.fromEntries(Object.entries(log.device_info).filter(([k]) => !['ip', 'os', 'platform', 'cpu_cores', 'cpu', 'memory_total', 'memory', 'language', 'screen'].includes(k)))} />
              </div>
            )}
          </Section>
        )}
      </div>

      {log.tags && log.tags.length > 0 && (
        <Section title={t('tags')} icon={Tag}>
          <div className="flex flex-wrap gap-2">
            {log.tags.map((tag, i) => (
              <Badge key={i} variant="secondary" className="text-xs font-mono bg-zinc-800 text-zinc-300">{tag}</Badge>
            ))}
          </div>
        </Section>
      )}

      {log.grouped_hash && (
        <div className="text-xs text-zinc-600 font-mono">
          {lang === 'fr' ? 'Groupe d\'Erreur' : 'Error Group'}: {log.grouped_hash}
        </div>
      )}
    </div>
  );
}
