import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLanguage } from '../lib/LanguageContext';
import api from '../lib/api';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Search, ChevronLeft, ChevronRight, X, RefreshCw, Container, Zap } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { PageLoader } from '../components/ui/page-loader';
import { AutoRefreshControl } from '../components/ui/AutoRefreshControl';
import { LogLoader } from '../components/ui/log-loader';

const LEVEL_COLORS = {
  critical: 'bg-red-900/40 text-red-300 border-red-800/50',
  error: 'bg-red-900/30 text-red-400 border-red-900/50',
  warning: 'bg-yellow-900/30 text-yellow-400 border-yellow-900/50',
  info: 'bg-blue-900/30 text-blue-400 border-blue-900/50',
  debug: 'bg-zinc-800/50 text-zinc-400 border-zinc-700/50',
};

export default function DockerLogsPage() {
  const { t, lang } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(50);
  const [loading, setLoading] = useState(false);
  const [forbidden, setForbidden] = useState(false);
  const [containers, setContainers] = useState([]);
  const [filters, setFilters] = useState({
    level: searchParams.get('level') || '', 
    container_name: searchParams.get('container_name') || '', 
    search: searchParams.get('search') || '', 
    date_from: searchParams.get('date_from') || '', 
    date_to: searchParams.get('date_to') || ''
  });
  const [refreshInterval, setRefreshInterval] = useState(searchParams.get('refresh') || 'off');
  const navigate = useNavigate();

  const handleRefreshChange = (val) => {
    setRefreshInterval(val);
    const newParams = new URLSearchParams(searchParams);
    if (val && val !== 'off') newParams.set('refresh', val);
    else newParams.delete('refresh');
    setSearchParams(newParams);
  };

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, size };
      Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v; });
      const res = await api.get('/logs/docker', { params });
      setLogs(res.data.logs || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      if (err.response?.status === 403) {
        setForbidden(true);
      } else {
        console.error('Failed to fetch docker logs', err);
      }
    } finally {
      setLoading(false);
    }
  }, [page, size, filters]);

  const loadContainers = useCallback(async () => {
    try {
      const res = await api.get('/logs/docker/containers');
      setContainers(res.data.containers || []);
    } catch (e) {
      if (e.response?.status === 403) setForbidden(true);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
    loadContainers();
  }, [fetchLogs, loadContainers]);

  useEffect(() => {
    if (refreshInterval === 'off') return;
    const intervalIdx = setInterval(() => {
        fetchLogs();
        loadContainers();
    }, parseInt(refreshInterval));
    return () => clearInterval(intervalIdx);
  }, [fetchLogs, loadContainers, refreshInterval]);

  const updateFilter = (key, value) => {
    setFilters(prev => {
      const next = { ...prev, [key]: value };
      const newParams = new URLSearchParams(searchParams);

      // Strict Guard: Prevent selecting an invalid range (Start > End)
      if (key === 'date_from' && next.date_to && new Date(value).getTime() > new Date(next.date_to).getTime()) {
        return prev; // Block invalid selection
      }
      if (key === 'date_to' && next.date_from && new Date(value).getTime() < new Date(next.date_from).getTime()) {
        return prev; // Block invalid selection
      }

      // We're now using min/max constraints on the UI inputs directly.
      // So we just focus on syncing the state and URL parameters.

      if (value) newParams.set(key, value);
      else newParams.delete(key);
      
      setSearchParams(newParams);
      return next;
    });
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({ level: '', container_name: '', search: '', date_from: '', date_to: '' });
    setPage(1);
    setSearchParams({});
  };

  const totalPages = Math.ceil(total / size);
  const hasActiveFilters = filters.search || filters.level || filters.container_name || filters.date_from || filters.date_to;

  if (forbidden) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
        <Container className="w-12 h-12 text-zinc-700" />
        <h2 className="text-lg font-semibold text-white">
          {lang === 'fr' ? 'Accès restreint' : 'Restricted Access'}
        </h2>
        <p className="text-sm text-zinc-500 max-w-sm">
          {lang === 'fr'
            ? "Vous n'avez pas la permission d'accéder aux logs Docker. Contactez un administrateur pour obtenir l'accès."
            : "You don't have permission to access Docker Logs. Contact an administrator to request access."}
        </p>
        <p className="text-xs text-zinc-600 font-mono">view_docker_logs</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4" data-testid="docker-logs-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-mono font-bold tracking-tight text-white flex items-center gap-2">
            <Container className="w-6 h-6 text-emerald-500" /> {t('dockerLogs')}
          </h1>
          <p className="text-sm text-zinc-500 mt-1">{total.toLocaleString()} {t('eventsFound')}</p>
        </div>
        <div className="flex items-center gap-3">
            <AutoRefreshControl value={refreshInterval} onValueChange={handleRefreshChange} />
            <Button variant="outline" size="sm" onClick={fetchLogs} data-testid="refresh-logs-btn"
            className="border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800">
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> {t('refresh')}
            </Button>
        </div>
      </div>

      <div className="filter-container flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <Input
            placeholder={t('searchLogs')} value={filters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
            className="pl-10 bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600"
          />
        </div>
        <Select value={filters.container_name || 'all'} onValueChange={(v) => updateFilter('container_name', v === 'all' ? '' : v)}>
          <SelectTrigger className="w-[200px] bg-zinc-900 border-zinc-800 text-zinc-300">
            <SelectValue placeholder={t('containers')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{lang === 'fr' ? 'Tous les conteneurs' : 'All Containers'}</SelectItem>
            {containers.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filters.level || 'all'} onValueChange={(v) => updateFilter('level', v === 'all' ? '' : v)}>
          <SelectTrigger className="w-[130px] bg-zinc-900 border-zinc-800 text-zinc-300">
            <SelectValue placeholder={t('level')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('allLevels')}</SelectItem>
            {['debug', 'info', 'warning', 'error', 'critical'].map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2">
            <Input
            type="datetime-local"
            value={filters.date_from}
            onChange={(e) => updateFilter('date_from', e.target.value)}
            max={filters.date_to}
            className="w-[185px] bg-zinc-900 border-zinc-800 text-zinc-300 text-xs"
            />
            <span className="text-zinc-600 text-xs text-zinc-500">→</span>
            <Input
            type="datetime-local"
            value={filters.date_to}
            onChange={(e) => updateFilter('date_to', e.target.value)}
            min={filters.date_from}
            className="w-[185px] bg-zinc-900 border-zinc-800 text-zinc-300 text-xs"
            />
        </div>
        {hasActiveFilters && (
          <Button variant="outline" size="sm" onClick={clearFilters} className="text-zinc-500 hover:text-white border-zinc-800">
            <X className="w-4 h-4 mr-1" /> {t('clear')}
          </Button>
        )}
      </div>

      <div className={`border border-zinc-800 rounded-lg overflow-hidden relative ${loading ? 'min-h-[400px]' : ''}`}>
        {loading && logs.length > 0 && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/20 backdrop-blur-[1px]">
            <div className="flex flex-col items-center gap-2 bg-zinc-900/80 p-4 rounded-xl border border-zinc-800 shadow-2xl">
              <LogLoader className="flex flex-col items-center gap-3" />
            </div>
          </div>
        )}
        <Table>
          <TableHeader>
            <TableRow className="border-zinc-800 hover:bg-transparent">
              <TableHead className="text-zinc-500 text-xs font-mono w-[80px]">{t('level')}</TableHead>
              <TableHead className="text-zinc-500 text-xs font-mono w-[180px]">{t('containers')}</TableHead>
              <TableHead className="text-zinc-500 text-xs font-mono">{t('message')}</TableHead>
              <TableHead className="text-zinc-500 text-xs font-mono w-[140px]">Image</TableHead>
              <TableHead className="text-zinc-500 text-xs font-mono w-[120px]">{t('project')}</TableHead>
              <TableHead className="text-zinc-500 text-xs font-mono w-[140px]">{t('time')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-zinc-600 py-16">
                  {loading ? (
                    <PageLoader />
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                        <Container className="w-8 h-8 opacity-20" />
                        <span>{t('noLogsFound')}</span>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              logs.map(log => (
                <TableRow key={log.id} onClick={() => navigate(`/logs/${log.id}`)}
                  className="border-zinc-800/50 hover:bg-zinc-900/50 cursor-pointer">
                  <TableCell>
                     <Badge variant="outline" className={`text-[10px] px-1.5 py-0 font-mono ${LEVEL_COLORS[log.level] || LEVEL_COLORS.info}`}>
                       {log.level}
                     </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-[11px] text-zinc-400">
                    <div className="flex items-center gap-2">
                        <Zap className="w-3 h-3 text-emerald-500" />
                        <span className="truncate max-w-[160px]">{log.metadata?.container_name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-zinc-300 max-w-[400px] truncate">
                    {log.message}
                  </TableCell>
                  <TableCell className="text-[10px] text-zinc-500 font-mono truncate max-w-[120px]">
                    {log.metadata?.image?.split('/').pop()}
                  </TableCell>
                  <TableCell className="text-xs text-zinc-500 italic">
                    {log.project_name !== 'Docker Logs' ? log.project_name : '-'}
                  </TableCell>
                  <TableCell className="text-xs text-zinc-500 font-mono">
                    {log.timestamp ? format(parseISO(log.timestamp), 'MMM dd HH:mm:ss') : ''}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <p className="text-xs text-zinc-500">
              {t('pageOf').replace('{page}', page).replace('{totalPages}', totalPages).replace('{total}', total)}
            </p>
            <Select value={String(size)} onValueChange={(v) => { setSize(Number(v)); setPage(1); }}>
              <SelectTrigger className="h-8 w-[130px] min-w-[130px] bg-zinc-900 border-zinc-800 text-[10px] text-zinc-400">
                <SelectValue placeholder="Page Size" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="20">20 / page</SelectItem>
                <SelectItem value="50">50 / page</SelectItem>
                <SelectItem value="100">100 / page</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1} className="border-zinc-800 text-zinc-400 hover:text-white">
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages} className="border-zinc-800 text-zinc-400 hover:text-white">
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
