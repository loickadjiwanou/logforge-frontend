import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../lib/LanguageContext';
import api, { WS_URL } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { ScrollArea } from '../components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { 
  Activity, AlertTriangle, Bug, Info, Terminal, TrendingUp, Clock, 
  ArrowRight, Layers, Hash, PieChart as PieIcon, BarChart3, ShieldAlert, Loader2
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  CartesianGrid, BarChart, Bar, Cell, PieChart, Pie, LineChart, Line,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ComposedChart
} from 'recharts';
import { useAuth } from '../lib/AuthContext';
import { format, parseISO } from 'date-fns';
import { LogLoader } from '../components/ui/log-loader';

const LEVEL_COLORS = {
  critical: 'bg-red-900/40 text-red-300 border-red-800/50',
  error: 'bg-red-900/30 text-red-400 border-red-900/50',
  warning: 'bg-yellow-900/30 text-yellow-400 border-yellow-900/50',
  info: 'bg-blue-900/30 text-blue-400 border-blue-900/50',
  debug: 'bg-zinc-800/50 text-zinc-400 border-zinc-700/50',
};

const CHART_COLORS = {
  critical: '#dc2626',
  error: '#ef4444',
  warning: '#f59e0b',
  info: '#3b82f6',
  debug: '#71717a',
};

export default function DashboardPage() {
  const { user } = useAuth();
  const { t, lang } = useLanguage();
  const [stats, setStats] = useState({ total: 0, by_level: {}, timeline: [], by_project: {} });
  const [initialLoading, setInitialLoading] = useState(true);
  const [recentLogs, setRecentLogs] = useState([]);
  const [projects, setProjects] = useState([]);
  const [channels, setChannels] = useState([]);
  const [selectedProject, setSelectedProject] = useState('all');
  const wsRef = useRef(null);
  const navigate = useNavigate();

  const fetchData = useCallback(async (isInitial = false) => {
    if (isInitial) setInitialLoading(true);
    try {
      const params = selectedProject !== 'all' ? { project_id: selectedProject } : {};
      const [statsRes, logsRes, projectsRes, channelsRes] = await Promise.all([
        api.get('/logs/stats', { params }),
        api.get('/logs', { params: { ...params, size: 20 } }),
        api.get('/projects/'),
        api.get('/channels/')
      ]);
      const statsData = statsRes.data || { total: 0, by_level: {}, timeline: [], by_project: {} };
      setStats(statsData);
      setRecentLogs(logsRes.data?.logs || []);
      setProjects(projectsRes.data?.projects || []);
      setChannels(channelsRes.data?.channels || []);
    } catch (err) {
      console.error('Failed to fetch dashboard data', err);
    } finally {
      if (isInitial) setInitialLoading(false);
    }
  }, [selectedProject]);

  useEffect(() => {
    fetchData(true);
    const interval = setInterval(() => fetchData(false), 15000);
    return () => clearInterval(interval);
  }, [fetchData]);

  useEffect(() => {
    let ws;
    try {
      // Robust construction: only append if not already present in WS_URL
      const fullWsUrl = WS_URL.includes('/api/ws/logs') ? WS_URL : `${WS_URL}/api/ws/logs`;
      console.log('Connecting to WebSocket:', fullWsUrl);
      ws = new WebSocket(fullWsUrl);
      
      ws.onopen = () => {
        // Subscribe to the selected project or 'all'
        const msg = { type: 'subscribe', project_id: selectedProject };
        ws.send(JSON.stringify(msg));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'new_log') {
            setRecentLogs(prev => [data.log, ...prev].slice(0, 20));
            setStats(prev => ({
              ...prev, total: prev.total + 1,
              by_level: { ...prev.by_level, [data.log.level]: (prev.by_level[data.log.level] || 0) + 1 }
            }));
          }
        } catch (e) { /* ignore */ }
      };
      ws.onerror = () => {
        console.warn("WebSocket error occurred.");
      };
      wsRef.current = ws;
    } catch (e) {
      console.error("Failed to initialize WebSocket:", e);
    }

    return () => { if (wsRef.current) wsRef.current.close(); };
  }, [selectedProject]);

  const statCards = [
    { label: t('totalEvents'), value: stats.total, icon: Activity, accent: 'text-white', path: '/logs' },
    { label: t('critical'), value: stats.by_level?.critical || 0, icon: ShieldAlert, accent: 'text-red-500', path: '/logs?level=critical' },
    { label: t('errors'), value: stats.by_level?.error || 0, icon: Bug, accent: 'text-red-400', path: '/logs?level=error' },
    { label: t('warnings'), value: stats.by_level?.warning || 0, icon: AlertTriangle, accent: 'text-yellow-400', path: '/logs?level=warning' },
  ];

  const levelData = Object.entries(stats.by_level || {}).map(([name, value]) => ({
    name, value, color: CHART_COLORS[name] || '#71717a'
  })).sort((a, b) => b.value - a.value);

  const projectData = Object.entries(stats.by_project || {}).map(([name, value]) => ({
    name, value
  })).sort((a, b) => b.value - a.value).slice(0, 5);

  const renderCustomChart = (widget) => {
    let data = [];
    let XKey = "name";
    let YKeys = [];
    let colors = [];
    let isPie = false;
    
    if (widget.dataSource === 'timeline_count') {
      data = stats.timeline || [];
      XKey = "hour"; YKeys = ["count"]; colors = ["#22c55e"];
    } else if (widget.dataSource === 'timeline_errors') {
      data = stats.timeline || [];
      XKey = "hour"; YKeys = ["errors"]; colors = ["#ef4444"];
    } else if (widget.dataSource === 'timeline_both') {
      data = stats.timeline || [];
      XKey = "hour"; YKeys = ["count", "errors"]; colors = ["#22c55e", "#ef4444"];
    } else if (widget.dataSource === 'level_distribution') {
      data = levelData;
      YKeys = ["value"]; colors = ["#8b5cf6"]; isPie = true;
    } else if (widget.dataSource === 'project_load') {
      data = projectData;
      YKeys = ["value"]; colors = ["#3b82f6"]; isPie = true;
    }

    if (!data.length) return <div className="h-full flex items-center justify-center text-zinc-600 text-sm italic">{t('noDataAvailable')}</div>;

    const tooltipStyle = { backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '6px', fontSize: '11px', color: 'hsl(var(--foreground))' };

    if (widget.type === 'radar') {
      return (
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
            <PolarGrid stroke="#3f3f46" />
            <PolarAngleAxis dataKey={XKey} tick={{ fill: '#71717a', fontSize: 10 }} />
            <PolarRadiusAxis angle={30} domain={['auto', 'auto']} tick={{ fill: '#71717a', fontSize: 10 }} />
            <Tooltip contentStyle={tooltipStyle} />
            {YKeys.map((key, i) => (
              <Radar key={key} dataKey={key} stroke={colors[i]} fill={colors[i]} fillOpacity={0.4} />
            ))}
          </RadarChart>
        </ResponsiveContainer>
      );
    }

    if (widget.type === 'pie') {
      return (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip contentStyle={tooltipStyle} />
            <Pie data={data} dataKey={YKeys[0]} nameKey={XKey} cx="50%" cy="50%" outerRadius={80} fill={colors[0]}>
              {data.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color || colors[index % colors.length]} />)}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      );
    }

    const Chart = widget.type === 'area' ? AreaChart : widget.type === 'line' ? LineChart : widget.type === 'composed' ? ComposedChart : BarChart;

    return (
      <ResponsiveContainer width="100%" height="100%">
        <Chart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#d4d4d8" className="dark:stroke-zinc-800" vertical={false} />
          <XAxis 
            dataKey={XKey} 
            stroke="#71717a" 
            tick={{ fontSize: 9, fill: 'currentColor' }} 
            tickFormatter={(v) => {
              if (!v || XKey !== 'hour') return v;
              const s = String(v);
              return s.length >= 16 ? s.slice(11, 16) : s;
            }} 
            axisLine={false} 
            tickLine={false} 
          />
          <YAxis stroke="#71717a" tick={{ fontSize: 9, fill: 'currentColor' }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={tooltipStyle} />
          {YKeys.map((key, i) => {
            if (widget.type === 'area') {
              return <Area key={key} type="monotone" dataKey={key} stroke={colors[i]} fill={`${colors[i]}33`} strokeWidth={2} />;
            } else if (widget.type === 'line') {
              return <Line key={key} type="monotone" dataKey={key} stroke={colors[i]} strokeWidth={2} dot={false} />;
            } else if (widget.type === 'composed') {
              if (i === 0) return <Bar key={key} dataKey={key} fill={colors[i]} radius={[4, 4, 0, 0]} />;
              return <Line key={key} type="monotone" dataKey={key} stroke={colors[i]} strokeWidth={2} dot={false} />;
            } else {
              return (
                <Bar key={key} dataKey={key} fill={colors[i]} radius={[4, 4, 0, 0]}>
                  {data.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color || colors[i]} />)}
                </Bar>
              );
            }
          })}
        </Chart>
      </ResponsiveContainer>
    );
  };

  const customWidgets = user?.dashboard_config?.widgets || [];

  if (initialLoading) {
    const loaderText = lang === 'fr' ? 'Chargement du dashboard' : 'Loading dashboard';
    return (
      <div className="flex flex-col items-center justify-center min-h-[75vh] animate-in fade-in duration-500" data-testid="dashboard-loading">
        <LogLoader text={loaderText} />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-500" data-testid="dashboard-page">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-mono font-bold tracking-tight text-white flex items-center gap-2">
            {/* <Activity className="w-6 h-6 text-emerald-500" /> */}{t('dashboard')}
          </h1>
          <p className="text-sm text-zinc-500 mt-1">{t('integrateLogForge')}</p>
        </div>
        <div className="flex items-center gap-3">
          <Card className="bg-zinc-900/50 border-zinc-800 px-3 py-1.5 flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-xs font-mono text-zinc-400">{projects.length} <span className="text-[10px] text-zinc-600">{t('projects')}</span></span>
            </div>
            <div className="w-[1px] h-4 bg-zinc-800" />
            <div className="flex items-center gap-2">
              <Hash className="w-3.5 h-3.5 text-purple-400" />
              <span className="text-xs font-mono text-zinc-400">{channels.length} <span className="text-[10px] text-zinc-600">{t('channels')}</span></span>
            </div>
          </Card>
          <Select value={selectedProject} onValueChange={setSelectedProject}>
            <SelectTrigger className="w-[180px] bg-zinc-950 border-zinc-800 text-zinc-300" data-testid="dashboard-project-filter">
              <SelectValue placeholder={t('allProjects')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('allProjects')}</SelectItem>
              {projects.map(p => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon, accent, path }) => (
          <Card key={label} 
            onClick={() => navigate(path)}
            className="bg-zinc-950 border-zinc-800 hover:border-zinc-600 cursor-pointer transition-all hover:bg-zinc-900/50 group overflow-hidden relative" 
            data-testid={`stat-${label.toLowerCase().replace(/\s+/g, '-')}`}>
            <div className={`absolute top-0 right-0 w-16 h-16 opacity-10 -mr-4 -mt-4 transform rotate-12 transition-transform group-hover:scale-110`}>
                <Icon className={`w-full h-full ${accent}`} />
            </div>
            <CardContent className="p-5 relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.1em]">{label}</p>
                  <p className={`text-3xl font-mono font-bold mt-1 ${accent}`}>{(value || 0).toLocaleString()}</p>
                </div>
                <div className={`p-2 rounded-lg bg-zinc-900 border border-zinc-800 group-hover:border-zinc-700 transition-colors`}>
                    <Icon className={`w-5 h-5 ${accent}`} strokeWidth={2} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 bg-zinc-950 border-zinc-800 overflow-hidden">
          <CardHeader className="pb-2 border-b border-zinc-900 bg-zinc-900/20">
            <CardTitle className="text-xs font-bold flex items-center gap-2 text-zinc-400 uppercase tracking-widest">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-500" /> {t('ingestionActivity')}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-[270px]">
              {(stats.timeline || []).length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-zinc-600 text-sm gap-2">
                  <Activity className="w-8 h-8 opacity-20" />
                  {t('noActivityData')}
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats.timeline || []}>
                    <defs>
                      <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorErrors" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#d4d4d8" className="dark:stroke-zinc-800" vertical={false} />
                    <XAxis 
                      dataKey="hour" 
                      stroke="#71717a" 
                      tick={{ fontSize: 9, fill: 'currentColor' }}
                      tickFormatter={(v) => {
                        const s = String(v || '');
                        return s.length >= 16 ? s.slice(11, 16) : s;
                      }} 
                      axisLine={false} 
                      tickLine={false} 
                    />
                    <YAxis stroke="#71717a" tick={{ fontSize: 9, fill: 'currentColor' }} axisLine={false} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))', 
                        borderRadius: '6px', 
                        fontSize: '11px',
                        color: 'hsl(var(--foreground))'
                      }}
                      itemStyle={{ color: 'hsl(var(--foreground))' }}
                      labelStyle={{ color: 'hsl(var(--muted-foreground))' }}
                      cursor={{ stroke: 'hsl(var(--border))' }} 
                    />
                    <Area type="monotone" dataKey="count" stroke="#22c55e" fill="url(#colorCount)" strokeWidth={2} name={t('totalEvents')} />
                    <Area type="monotone" dataKey="errors" stroke="#ef4444" fill="url(#colorErrors)" strokeWidth={2} name={t('errors')} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-50/70 dark:bg-zinc-950/40 border-zinc-200 dark:border-zinc-900/50 backdrop-blur-sm shadow-xl overflow-hidden flex flex-col">
          <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-900/50 bg-zinc-100/60 dark:bg-zinc-900/20 shrink-0">
            <CardTitle className="text-[10px] font-bold flex items-center gap-2 text-zinc-400 uppercase tracking-widest">
              <Clock className="w-3 h-3 text-blue-400" /> {t('realTimeFeed')}
              <span className="ml-auto flex items-center gap-1.5 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                </span>
                <span className="text-[8px] text-emerald-500 font-mono uppercase tracking-tighter font-bold">{t('live')}</span>
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {/* Column Headers */}
            <div className="grid grid-cols-[1fr_70px] px-4 py-1.5 border-b border-zinc-100 dark:border-zinc-900/50 bg-transparent sticky top-0 z-10 shrink-0">
                <span className="text-[8px] uppercase tracking-widest text-zinc-400 dark:text-zinc-600 font-bold">{lang === 'fr' ? 'LOG MESSAGE' : 'LOG MESSAGE'}</span>
                <span className="text-[8px] uppercase tracking-widest text-zinc-400 dark:text-zinc-600 font-bold text-right">{lang === 'fr' ? 'HEURE' : 'TIME'}</span>
            </div>
            
            <ScrollArea className="h-[270px]">
              {recentLogs.length === 0 ? (
                <div className="p-8 text-center text-zinc-600 text-sm flex flex-col items-center gap-2">
                  <Terminal className="w-8 h-8 opacity-20" />
                  {t('awaitingLogs')}
                </div>
              ) : (
                <div className="flex flex-col">
                  {recentLogs.map((log, idx) => (
                    <div key={log.id} onClick={() => navigate(`/logs/${log.id}`)}
                      className={`grid grid-cols-[1fr_70px] px-4 py-2 hover:bg-zinc-100/50 dark:hover:bg-zinc-800/20 cursor-pointer group transition-colors border-zinc-100 dark:border-zinc-900/50 ${idx !== recentLogs.length - 1 ? 'border-b' : ''}`}
                      data-testid={`feed-log-${log.id}`}>
                      {/* Left: Message & Meta */}
                      <div className="min-w-0 pr-2">
                         <div className="flex items-center gap-2">
                            <div className={`w-1 h-3.5 rounded-full shrink-0 ${log.level === 'error' || log.level === 'critical' ? 'bg-red-500' : log.level === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'}`} />
                            <p className="text-[11px] font-mono text-zinc-700 dark:text-zinc-300 leading-normal truncate">{log.message}</p>
                         </div>
                         <div className="flex items-center gap-2 mt-1 ml-3 opacity-40 group-hover:opacity-100 transition-opacity">
                            <span className="text-[8px] text-zinc-500 font-mono uppercase tracking-tighter shrink-0">{log.project_name}</span>
                            <span className="text-[8px] text-zinc-600 font-mono italic">@{log.channel}</span>
                         </div>
                      </div>
                      
                      {/* Right: Timestamp */}
                      <div className="text-right pt-0.5">
                        <span className="text-[10px] text-zinc-600 font-mono group-hover:text-zinc-400 transition-colors">
                          {(() => {
                            if (!log.timestamp) return '--:--:--';
                            try {
                              const date = parseISO(log.timestamp);
                              return isNaN(date.getTime()) ? '--:--:--' : format(date, 'HH:mm:ss');
                            } catch (e) { return '--:--:--'; }
                          })()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-zinc-950 border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold flex items-center gap-2 text-zinc-400 uppercase tracking-widest">
              <BarChart3 className="w-3.5 h-3.5 text-zinc-400" /> {t('eventDistribution')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[240px] pt-4">
              {levelData.length === 0 ? (
                 <div className="h-full flex items-center justify-center text-zinc-600 text-sm italic">{t('noDataAvailable')}</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={levelData} layout="vertical" margin={{ left: 0, right: 30 }}>
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" stroke="#71717a" fontSize={10} axisLine={false} tickLine={false} width={70} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))', 
                        borderRadius: '6px', 
                        fontSize: '11px',
                        color: 'hsl(var(--foreground))'
                      }}
                      itemStyle={{ color: 'hsl(var(--foreground))' }}
                      cursor={{ fill: 'hsl(var(--accent))', fillOpacity: 0.1 }} 
                    />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                      {levelData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-950 border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold flex items-center gap-2 text-zinc-400 uppercase tracking-widest">
              <PieIcon className="w-3.5 h-3.5 text-zinc-400" /> {t('loadBySource')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[240px] pt-4">
                {projectData.length === 0 ? (
                     <div className="h-full flex items-center justify-center text-zinc-600 text-sm italic">{t('noDataAvailable')}</div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={projectData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#d4d4d8" className="dark:stroke-zinc-800" vertical={false} />
                            <XAxis dataKey="name" stroke="#71717a" tick={{ fontSize: 9, fill: 'currentColor' }} axisLine={false} tickLine={false} />
                            <YAxis stroke="#71717a" tick={{ fontSize: 9, fill: 'currentColor' }} axisLine={false} tickLine={false} />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: 'hsl(var(--card))', 
                                border: '1px solid hsl(var(--border))', 
                                borderRadius: '6px', 
                                fontSize: '11px',
                                color: 'hsl(var(--foreground))'
                              }}
                              itemStyle={{ color: 'hsl(var(--foreground))' }}
                            />
                            <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </div>
          </CardContent>
        </Card>
      </div>

      {customWidgets.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {customWidgets.map((widget) => (
            <Card key={widget.id} className="bg-zinc-950 border-zinc-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold flex items-center gap-2 text-zinc-400 uppercase tracking-widest">
                  {widget.type === 'pie' ? <PieIcon className="w-3.5 h-3.5" /> : <BarChart3 className="w-3.5 h-3.5" />} {widget.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[250px] pt-4">
                  {renderCustomChart(widget)}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
