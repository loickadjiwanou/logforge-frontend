import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../lib/api';
import { useLanguage } from '../lib/LanguageContext';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { ChevronRight, ChevronLeft, Layers, RefreshCw, Search, X } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';
import { PageLoader } from '../components/ui/page-loader';
import { AutoRefreshControl } from '../components/ui/AutoRefreshControl';
import { LogLoader } from '../components/ui/log-loader';

const LEVEL_COLORS = {
  critical: 'bg-red-900/40 text-red-300 border-red-800/50',
  error:    'bg-red-900/30 text-red-400 border-red-900/50',
  warning:  'bg-yellow-900/30 text-yellow-400 border-yellow-900/50',
  info:     'bg-blue-900/30 text-blue-400 border-blue-900/50',
  debug:    'bg-zinc-800/50 text-zinc-400 border-zinc-700/50',
};

export default function ErrorGroupsPage() {
  const { t, lang } = useLanguage();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [groups, setGroups] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [size] = useState(20);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ 
    level: searchParams.get('level') || '', 
    search: searchParams.get('search') || '', 
    tags: searchParams.get('tags') || '',
    date_from: searchParams.get('date_from') || '',
    date_to: searchParams.get('date_to') || ''
  });
  const [refreshInterval, setRefreshInterval] = useState(searchParams.get('refresh') || 'off');

  const handleRefreshChange = (val) => {
    setRefreshInterval(val);
    const newParams = new URLSearchParams(searchParams);
    if (val && val !== 'off') newParams.set('refresh', val);
    else newParams.delete('refresh');
    setSearchParams(newParams);
  };
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groupLogs, setGroupLogs] = useState([]);
  const [loadingGroupLogs, setLoadingGroupLogs] = useState(false);
  const [modalPage, setModalPage] = useState(1);
  const [modalTotal, setModalTotal] = useState(0);
  const modalSize = 50;

  // Fetch grouped logs
  const fetchGroups = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, size };
      Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v; });

      const res = await api.get('/logs/groups', { params });
      setGroups(res.data.groups || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      toast.error('Failed to load log groups');
    } finally {
      setLoading(false);
    }
  }, [page, size, filters]);

  useEffect(() => { fetchGroups(); }, [fetchGroups]);

  useEffect(() => {
    if (refreshInterval === 'off') return;
    const intervalId = setInterval(fetchGroups, parseInt(refreshInterval));
    return () => clearInterval(intervalId);
  }, [fetchGroups, refreshInterval]);

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
    setFilters({ level: '', search: '', tags: '', date_from: '', date_to: '' });
    setPage(1);
    setSearchParams({});
  };

  const fetchGroupLogs = useCallback(async () => {
    if (!selectedGroup) return;
    setLoadingGroupLogs(true);
    try {
      const params = { 
        grouped_hash: selectedGroup.grouped_hash, 
        size: modalSize, 
        page: modalPage 
      };
      
      // Propagate existing filters to modal fetch
      Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v; });

      const res = await api.get('/logs', { params });
      setGroupLogs(res.data.logs || []);
      setModalTotal(res.data.total || 0);
    } catch (err) {
      toast.error('Failed to load logs for this group');
    } finally {
      setLoadingGroupLogs(false);
    }
  }, [selectedGroup, modalPage, filters]);

  useEffect(() => {
    if (selectedGroup) {
      fetchGroupLogs();
    }
    // eslint-disable-next-line
  }, [fetchGroupLogs]);

  const handleGroupClick = async (group) => {
    // group is the latest_log from backend with extra 'count' and 'hash' fields
    if (group.count === 1) {
      navigate(`/logs/${group.id}`);
    } else {
      setModalPage(1);
      setSelectedGroup(group);
    }
  };

  const totalPages = Math.ceil(total / size);
  const hasActiveFilters = filters.search || filters.level || filters.tags || filters.date_from || filters.date_to;

  return (
    <div className="p-6 space-y-5" data-testid="log-groups-page">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            {/* <Layers className="w-5 h-5 text-red-400" strokeWidth={1.5} /> */}
            <h1 className="text-2xl font-mono font-bold tracking-tight text-white">{t('logGroups')}</h1>
          </div>
          <p className="text-sm text-zinc-500 mt-1">
            {t('recurringLogs')} — {total.toLocaleString()} {t('eventsFound')}
          </p>
        </div>
        <div className="flex items-center gap-3">
            <AutoRefreshControl value={refreshInterval} onValueChange={handleRefreshChange} />
            <Button
            variant="outline" size="sm"
            onClick={fetchGroups}
            data-testid="refresh-groups-btn"
            className="border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800"
            >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {t('refresh')}
            </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="bg-zinc-950 border-zinc-800">
        <CardContent className="p-4">
          <div className="filter-container flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-[300px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <Input
                placeholder={t('searchLogs')}
                value={filters.search}
                onChange={e => updateFilter('search', e.target.value)}
                data-testid="group-search-input"
                className="pl-10 bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600"
              />
            </div>

            {/* Level */}
            <Select value={filters.level || 'all'} onValueChange={v => updateFilter('level', v === 'all' ? '' : v)}>
              <SelectTrigger className="w-[130px] bg-zinc-900 border-zinc-800 text-zinc-300" data-testid="group-filter-level">
                <SelectValue placeholder={lang === 'fr' ? "Niveau" : "Level"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{lang === 'fr' ? "Tous les Niveaux" : "All Levels"}</SelectItem>
                {['debug', 'info', 'warning', 'error', 'critical'].map(l => (
                  <SelectItem key={l} value={l}>{l}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Tags */}
            <div className="relative flex-1 min-w-[150px] max-w-[250px]">
              <Input
                placeholder={lang === 'fr' ? "Filtrer par tags..." : "Filter by tags (comma separated)..."}
                value={filters.tags}
                onChange={e => updateFilter('tags', e.target.value)}
                data-testid="group-filter-tags"
                className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600 truncate"
              />
            </div>

            {/* Date Filters */}
            <div className="flex items-center gap-2">
              <Input
                type="datetime-local"
                value={filters.date_from}
                onChange={e => updateFilter('date_from', e.target.value)}
                title="Date From"
                max={filters.date_to}
                className="w-[185px] bg-zinc-900 border-zinc-800 text-zinc-300 text-xs"
              />
              <span className="text-zinc-600 text-xs text-zinc-500">→</span>
              <Input
                type="datetime-local"
                value={filters.date_to}
                onChange={e => updateFilter('date_to', e.target.value)}
                title="Date To"
                min={filters.date_from}
                className="w-[185px] bg-zinc-900 border-zinc-800 text-zinc-300 text-xs"
              />
            </div>

            {hasActiveFilters && (
              <Button variant="outline" size="sm" onClick={clearFilters}
                data-testid="clear-group-filters-btn"
                className="text-zinc-500 hover:text-white border-zinc-800">
                <X className="w-4 h-4 mr-1" /> {t('clear')}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Groups Table */}
      <div className={`border border-zinc-800 rounded-lg overflow-hidden relative ${loading ? 'min-h-[400px]' : ''}`}>
        {loading && groups.length > 0 && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/20 backdrop-blur-[1px]">
            <div className="flex flex-col items-center gap-2 bg-zinc-900/80 p-4 rounded-xl border border-zinc-800 shadow-2xl">
              <LogLoader className="flex flex-col items-center gap-3" />
            </div>
          </div>
        )}
        <Table>
          <TableHeader>
            <TableRow className="border-zinc-800 hover:bg-transparent">
              <TableHead className="text-zinc-500 text-xs font-mono w-[90px]">{lang === 'fr' ? 'Niveau' : 'Level'}</TableHead>
              <TableHead className="text-zinc-500 text-xs font-mono">{lang === 'fr' ? 'Message du Log' : 'Log Message'}</TableHead>
              <TableHead className="text-zinc-500 text-xs font-mono w-[80px] text-left">{lang === 'fr' ? 'Compte' : 'Count'}</TableHead>
              <TableHead className="text-zinc-500 text-xs font-mono w-[170px] pl-10">{lang === 'fr' ? 'Première fois' : 'First Seen'}</TableHead>
              <TableHead className="text-zinc-500 text-xs font-mono w-[140px]">{lang === 'fr' ? 'Dernière fois' : 'Last Seen'}</TableHead>
              <TableHead className="text-zinc-500 text-xs font-mono w-[40px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {groups.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-20">
                  {loading ? (
                    <PageLoader />
                  ) : (
                    <div className="flex flex-col items-center gap-3 text-zinc-600">
                      <Layers className="w-10 h-10 opacity-40" strokeWidth={1} />
                      <p className="text-sm">{t('noLogsFound')}</p>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              groups.map((group, i) => (
                <TableRow
                  key={group.grouped_hash}
                  onClick={() => handleGroupClick(group)}
                  className="border-zinc-800/50 hover:bg-zinc-900/50 cursor-pointer transition-colors"
                  data-testid={`group-row-${i}`}
                >
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`text-[10px] px-1.5 py-0 font-mono ${LEVEL_COLORS[group.level] || LEVEL_COLORS.error}`}
                    >
                      {group.level}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <p className="font-mono text-xs text-zinc-300 truncate max-w-[450px]">{group.message}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-zinc-600 font-mono">#{group.grouped_hash}</span>
                      {group.channel && (
                        <span className="text-[10px] text-zinc-700">· {group.channel}</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-left w-[80px]">
                    <Badge
                      variant="secondary"
                      className={`text-xs font-mono tabular-nums font-bold ${
                        group.count >= 10
                          ? 'bg-red-900/30 text-red-400 border border-red-900/40'
                          : 'bg-zinc-800 text-zinc-300'
                      }`}
                    >
                      {group.count}×
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-zinc-500 font-mono w-[170px] pl-10">
                    {group.first_seen ? format(parseISO(group.first_seen), 'MMM dd HH:mm') : ''}
                  </TableCell>
                  <TableCell className="text-xs text-zinc-500 font-mono w-[140px]">
                    {group.last_seen ? format(parseISO(group.last_seen), 'MMM dd HH:mm') : ''}
                  </TableCell>
                  <TableCell>
                    <ChevronRight className="w-4 h-4 text-zinc-700" />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-zinc-500">Page {page} of {totalPages}</p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="border-zinc-800 text-zinc-400 hover:text-white">
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="border-zinc-800 text-zinc-400 hover:text-white">
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Modal for Grouped Logs */}
      <Dialog open={!!selectedGroup} onOpenChange={(open) => !open && setSelectedGroup(null)}>
        <DialogContent className="max-w-4xl bg-zinc-950 border-zinc-800 text-white max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <Layers className="w-5 h-5 text-emerald-500" />
              {t('logOccurrences')}
            </DialogTitle>
            <DialogDescription className="text-zinc-400 font-mono text-xs truncate">
              {selectedGroup?.message}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-auto border border-zinc-800 rounded-md mt-4 relative min-h-[300px]">
            <Table>
              <TableHeader className="bg-zinc-900 sticky top-0 z-10">
                <TableRow className="border-zinc-800 hover:bg-transparent">
                  <TableHead className="text-zinc-500 text-xs w-[140px]">{lang === 'fr' ? 'Horodatage' : 'Timestamp'}</TableHead>
                  <TableHead className="text-zinc-500 text-xs text-center w-[100px]">{lang === 'fr' ? 'Environnement' : 'Environment'}</TableHead>
                  <TableHead className="text-zinc-500 text-xs">Message</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingGroupLogs ? (
                  <TableRow>
                     <TableCell colSpan={3} className="text-center py-20">
                       <div className="flex flex-col items-center gap-2">
                        <RefreshCw className="w-6 h-6 text-red-500 animate-spin" />
                        <p className="text-sm text-zinc-500">{t('loadingOccurrences')}</p>
                       </div>
                     </TableCell>
                  </TableRow>
                ) : groupLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-20 text-zinc-600 italic">
                      {t('noOccurrences')}
                    </TableCell>
                  </TableRow>
                ) : (
                  groupLogs.map((log) => (
                    <TableRow 
                      key={log.id} 
                      className="border-zinc-800/50 hover:bg-zinc-900/50 cursor-pointer transition-colors"
                      onClick={() => navigate(`/logs/${log.id}`)}
                    >
                      <TableCell className="text-xs text-zinc-400 font-mono">
                        {format(parseISO(log.timestamp), 'MMM dd, HH:mm:ss')}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="text-[10px] text-zinc-500 border-zinc-700 bg-zinc-900">
                           {log.environment}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-zinc-300 truncate max-w-[400px]">
                        {log.message}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Modal Pagination */}
          {modalTotal > modalSize && (
            <div className="flex items-center justify-between mt-4 px-1">
              <p className="text-xs text-zinc-500 font-mono">
                {((modalPage - 1) * modalSize) + 1} — {Math.min(modalPage * modalSize, modalTotal)} / {modalTotal} logs
              </p>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setModalPage(p => Math.max(1, p - 1))} 
                  disabled={modalPage === 1 || loadingGroupLogs}
                  className="border-zinc-800 h-8 text-zinc-400 hover:text-white"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-xs text-zinc-400 font-mono w-12 text-center">
                  {modalPage} / {Math.ceil(modalTotal / modalSize)}
                </span>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setModalPage(p => Math.min(Math.ceil(modalTotal / modalSize), p + 1))} 
                  disabled={modalPage === Math.ceil(modalTotal / modalSize) || loadingGroupLogs}
                  className="border-zinc-800 h-8 text-zinc-400 hover:text-white"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
