import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLanguage } from '../lib/LanguageContext';
import api from '../lib/api';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Search, ChevronLeft, ChevronRight, X, RefreshCw, Container } from 'lucide-react';
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

export default function LogExplorerPage() {
  const { t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(50);
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState([]);
  const [channels, setChannels] = useState([]);
  const [filters, setFilters] = useState({
    project_id: searchParams.get('project_id') || '', 
    level: searchParams.get('level') || '', 
    channel: searchParams.get('channel') || '', 
    environment: searchParams.get('environment') || '', 
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
      const res = await api.get('/logs', { params });
      setLogs(res.data.logs || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      console.error('Failed to fetch logs', err);
    } finally {
      setLoading(false);
    }
  }, [page, size, filters]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  useEffect(() => {
    if (refreshInterval === 'off') return;
    const interval = setInterval(fetchLogs, parseInt(refreshInterval));
    return () => clearInterval(interval);
  }, [fetchLogs, refreshInterval]);

  useEffect(() => {
    const loadMeta = async () => {
      try {
        const [pRes, cRes] = await Promise.all([api.get('/projects/'), api.get('/channels/')]);
        setProjects(pRes.data.projects || []);
        setChannels(cRes.data.channels || []);
      } catch (e) { /* ignore */ }
    };
    loadMeta();
  }, []);

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

      // Sync state and URL
      if (value) newParams.set(key, value);
      else newParams.delete(key);
      
      setSearchParams(newParams);
      return next;
    });
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({ project_id: '', level: '', channel: '', environment: '', search: '', date_from: '', date_to: '' });
    setPage(1);
    setSearchParams({});
  };

  const totalPages = Math.ceil(total / size);
  const hasActiveFilters = filters.project_id || filters.level || filters.channel || filters.environment || filters.search || filters.date_from || filters.date_to;

  return (
    <div className="p-6 space-y-4" data-testid="log-explorer-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-mono font-bold tracking-tight text-white">{t('logExplorer')}</h1>
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
            data-testid="log-search-input"
            className="pl-10 bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600"
          />
        </div>
        <Select value={filters.project_id || 'all'} onValueChange={(v) => updateFilter('project_id', v === 'all' ? '' : v)}>
          <SelectTrigger className="w-[160px] bg-zinc-900 border-zinc-800 text-zinc-300" data-testid="filter-project">
            <SelectValue placeholder={t('project')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('allProjects')}</SelectItem>
            {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filters.level || 'all'} onValueChange={(v) => updateFilter('level', v === 'all' ? '' : v)}>
          <SelectTrigger className="w-[130px] bg-zinc-900 border-zinc-800 text-zinc-300" data-testid="filter-level">
            <SelectValue placeholder={t('level')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('allLevels')}</SelectItem>
            {['debug', 'info', 'warning', 'error', 'critical'].map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filters.channel || 'all'} onValueChange={(v) => updateFilter('channel', v === 'all' ? '' : v)}>
          <SelectTrigger className="w-[140px] bg-zinc-900 border-zinc-800 text-zinc-300" data-testid="filter-channel">
            <SelectValue placeholder={t('channel')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('allChannels')}</SelectItem>
            {channels.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filters.environment || 'all'} onValueChange={(v) => updateFilter('environment', v === 'all' ? '' : v)}>
          <SelectTrigger className="w-[140px] bg-zinc-900 border-zinc-800 text-zinc-300" data-testid="filter-env">
            <SelectValue placeholder={t('env')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('allEnvs')}</SelectItem>
            {['production', 'staging', 'development'].map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
          </SelectContent>
        </Select>
        <Input
          type="datetime-local"
          value={filters.date_from}
          onChange={(e) => updateFilter('date_from', e.target.value)}
          data-testid="filter-date-from"
          title="From date"
          max={filters.date_to}
          className="w-[185px] bg-zinc-900 border-zinc-800 text-zinc-300 text-xs"
        />
        <Input
          type="datetime-local"
          value={filters.date_to}
          onChange={(e) => updateFilter('date_to', e.target.value)}
          data-testid="filter-date-to"
          title="To date"
          min={filters.date_from}
          className="w-[185px] bg-zinc-900 border-zinc-800 text-zinc-300 text-xs"
        />
        {hasActiveFilters && (
          <Button variant="outline" size="sm" onClick={clearFilters} data-testid="clear-filters-btn"
            className="text-zinc-500 hover:text-white border-zinc-800">
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
              <TableHead className="text-zinc-500 text-xs font-mono">{t('message')}</TableHead>
              <TableHead className="text-zinc-500 text-xs font-mono w-[120px]">{t('project')}</TableHead>
              <TableHead className="text-zinc-500 text-xs font-mono w-[100px]">{t('channel')}</TableHead>
              <TableHead className="text-zinc-500 text-xs font-mono w-[90px]">{t('env')}</TableHead>
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
                    <span>{t('noLogsFound')}</span>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              logs.map(log => (
                <TableRow key={log.id} onClick={() => navigate(`/logs/${log.id}`)}
                  className="border-zinc-800/50 hover:bg-zinc-900/50 cursor-pointer"
                  data-testid={`log-row-${log.id}`}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                       <Badge variant="outline" className={`text-[10px] px-1.5 py-0 font-mono ${LEVEL_COLORS[log.level] || LEVEL_COLORS.info}`}>
                         {log.level}
                       </Badge>
                       {log.metadata?.source === 'docker-agent' && (
                         <Container className="w-3 h-3 text-emerald-500" title={log.metadata?.container_name || 'Docker Container'} />
                       )}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-zinc-300 max-w-[400px] truncate">
                    {log.metadata?.source === 'docker-agent' && (
                        <span className="text-[10px] text-zinc-600 mr-2 bg-zinc-800 px-1 rounded">
                            {log.metadata?.container_name}
                        </span>
                    )}
                    {log.message}
                  </TableCell>
                  <TableCell className="text-xs text-zinc-500">{log.project_name}</TableCell>
                  <TableCell className="text-xs text-zinc-500">{log.channel}</TableCell>
                  <TableCell className="text-xs text-zinc-500">{log.environment}</TableCell>
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
              <SelectTrigger className="h-8 w-[100px] bg-zinc-900 border-zinc-800 text-[10px] text-zinc-400">
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
              disabled={page === 1} data-testid="prev-page-btn"
              className="border-zinc-800 text-zinc-400 hover:text-white">
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages} data-testid="next-page-btn"
              className="border-zinc-800 text-zinc-400 hover:text-white">
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
