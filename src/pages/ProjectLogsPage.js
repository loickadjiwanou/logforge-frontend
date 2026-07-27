import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import api from "../lib/api";
import { useLanguage } from "../lib/LanguageContext";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Card, CardContent } from "../components/ui/card";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  X,
  RefreshCw,
  ArrowLeft,
  FolderKanban,
  Container,
  Copy,
  Hash,
  Zap,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import { PageLoader } from "../components/ui/page-loader";
import { AutoRefreshControl } from "../components/ui/AutoRefreshControl";
import { LogLoader } from "../components/ui/log-loader";

const LEVEL_COLORS = {
  critical: "bg-red-900/40 text-red-300 border-red-800/50",
  error: "bg-red-900/30 text-red-400 border-red-900/50",
  warning: "bg-yellow-900/30 text-yellow-400 border-yellow-900/50",
  info: "bg-blue-900/30 text-blue-400 border-blue-900/50",
  debug: "bg-zinc-800/50 text-zinc-400 border-zinc-700/50",
};

const ENV_COLORS = {
  production: "bg-emerald-900/30 text-emerald-400 border-emerald-900/50",
  staging: "bg-yellow-900/30 text-yellow-400 border-yellow-900/50",
  development: "bg-blue-900/30 text-blue-400 border-blue-900/50",
};

export default function ProjectLogsPage() {
  const { t, lang } = useLanguage();
  const { id: projectId } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [project, setProject] = useState(null);
  const [channels, setChannels] = useState([]);
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(30);
  const [loading, setLoading] = useState(false);
  const [projectLoading, setProjectLoading] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(
    searchParams.get("refresh") || "off",
  );
  const [containers, setContainers] = useState([]);
  const [showDockerView, setShowDockerView] = useState(false);

  const handleRefreshChange = (val) => {
    setRefreshInterval(val);
    const newParams = new URLSearchParams(searchParams);
    if (val && val !== "off") newParams.set("refresh", val);
    else newParams.delete("refresh");
    setSearchParams(newParams);
  };

  const [filters, setFilters] = useState({
    level: "",
    channel: "",
    environment: "",
    search: "",
    date_from: "",
    date_to: "",
    container_name: "",
  });

  // Load project info and channels
  useEffect(() => {
    const loadMeta = async () => {
      setProjectLoading(true);
      try {
        const [pRes, cRes] = await Promise.all([
          api.get(`/projects/${projectId}`),
          api.get("/channels/", { params: { project_id: projectId } }),
        ]);
        setProject(pRes.data);
        setChannels(cRes.data.channels || []);
      } catch (e) {
        toast.error("Project not found");
        navigate("/projects");
      } finally {
        setProjectLoading(false);
      }
    };
    loadMeta();
  }, [projectId, navigate]);

  // Load containers if project has docker logs
  const fetchContainers = useCallback(async () => {
    try {
      const res = await api.get("/logs/docker/containers", {
        params: { project_id: projectId },
      });
      setContainers(res.data.containers || []);
    } catch (e) {
      /* ignore */
    }
  }, [projectId]);

  useEffect(() => {
    fetchContainers();
  }, [fetchContainers]);

  // Load logs
  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, size, project_id: projectId };
      Object.entries(filters).forEach(([k, v]) => {
        if (v) params[k] = v;
      });
      const res = await api.get("/logs", { params });
      const fetchedLogs = res.data.logs || [];
      setLogs(fetchedLogs);
      setTotal(res.data.total || 0);

      if (
        !showDockerView &&
        fetchedLogs.some((l) => l.metadata?.source === "docker-agent")
      ) {
        setShowDockerView(true);
      }
    } catch (err) {
      console.error("Failed to fetch logs", err);
    } finally {
      setLoading(false);
    }
  }, [page, size, filters, projectId, showDockerView]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    if (refreshInterval === "off") return;
    const intervalIdx = setInterval(fetchLogs, parseInt(refreshInterval));
    return () => clearInterval(intervalIdx);
  }, [fetchLogs, refreshInterval]);

  const updateFilter = (key, value) => {
    setFilters((prev) => {
      const next = { ...prev, [key]: value };
      const newParams = new URLSearchParams(searchParams);

      // Strict Guard: Prevent selecting an invalid range (Start > End)
      if (
        key === "date_from" &&
        next.date_to &&
        new Date(value).getTime() > new Date(next.date_to).getTime()
      ) {
        return prev; // Block invalid selection
      }
      if (
        key === "date_to" &&
        next.date_from &&
        new Date(value).getTime() < new Date(next.date_from).getTime()
      ) {
        return prev; // Block invalid selection
      }

      if (value) newParams.set(key, value);
      else newParams.delete(key);

      setSearchParams(newParams);

      return next;
    });
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({
      level: "",
      channel: "",
      environment: "",
      search: "",
      date_from: "",
      date_to: "",
      container_name: "",
    });
    setPage(1);
  };

  const totalPages = Math.ceil(total / size);
  const hasActiveFilters =
    filters.search ||
    filters.level ||
    filters.channel ||
    filters.environment ||
    filters.date_from ||
    filters.date_to ||
    filters.container_name;

  if (projectLoading) {
    return <PageLoader />;
  }

  return (
    <div className="p-6 space-y-5" data-testid="project-logs-page">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/projects")}
            data-testid="back-to-projects-btn"
            className="text-zinc-400 hover:text-white mt-0.5"
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> {t("projects")}
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <FolderKanban className="w-5 h-5 text-emerald-500" />
              <h1 className="text-2xl font-mono font-bold tracking-tight text-white">
                {project?.name}
              </h1>
              <Badge
                variant="outline"
                className={`text-[10px] font-mono ${ENV_COLORS[project?.environment] || "text-zinc-400 border-zinc-700"}`}
              >
                {project?.environment}
              </Badge>
            </div>
            {project?.description && (
              <p className="text-sm text-zinc-500 mt-1 ml-7">
                {project.description}
              </p>
            )}
            <div className="flex items-center gap-3 mt-1.5 ml-7">
              <div className="flex items-center gap-1.5 bg-zinc-900/50 px-2 py-0.5 rounded border border-zinc-800">
                <Hash className="w-3 h-3 text-zinc-600" />
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-tight">
                  ID: {project?.id}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(project?.id);
                    toast.success("Project ID copied");
                  }}
                  className="h-4 w-4 p-0 text-zinc-600 hover:text-white"
                >
                  <Copy className="w-2.5 h-2.5" />
                </Button>
              </div>
              <p className="text-[11px] text-zinc-600 font-mono">
                {total.toLocaleString()} {t("eventsFound")}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <AutoRefreshControl
            value={refreshInterval}
            onValueChange={handleRefreshChange}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={fetchLogs}
            data-testid="refresh-project-logs-btn"
            className="border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800"
          >
            <RefreshCw
              className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            {t("refresh")}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="bg-zinc-950 border-zinc-800">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <Input
                placeholder="Search logs..."
                value={filters.search}
                onChange={(e) => updateFilter("search", e.target.value)}
                data-testid="project-log-search"
                className="pl-10 bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600"
              />
            </div>

            {/* Level */}
            <Select
              value={filters.level || "all"}
              onValueChange={(v) => updateFilter("level", v === "all" ? "" : v)}
            >
              <SelectTrigger
                className="w-[130px] bg-zinc-900 border-zinc-800 text-zinc-300"
                data-testid="filter-level"
              >
                <SelectValue placeholder="Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                {["debug", "info", "warning", "error", "critical"].map((l) => (
                  <SelectItem key={l} value={l}>
                    {l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Container (Docker only) */}
            {showDockerView && (
              <Select
                value={filters.container_name || "all"}
                onValueChange={(v) =>
                  updateFilter("container_name", v === "all" ? "" : v)
                }
              >
                <SelectTrigger
                  className="w-[160px] bg-zinc-900 border-zinc-800 text-zinc-300"
                  data-testid="filter-container"
                >
                  <SelectValue placeholder={t("containers")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {lang === "fr" ? "Tous les conteneurs" : "All Containers"}
                  </SelectItem>
                  {containers.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Channel (Only if NOT docker view or if results favor standard logs) */}
            {!showDockerView && (
              <Select
                value={filters.channel || "all"}
                onValueChange={(v) =>
                  updateFilter("channel", v === "all" ? "" : v)
                }
              >
                <SelectTrigger
                  className="w-[140px] bg-zinc-900 border-zinc-800 text-zinc-300"
                  data-testid="filter-channel"
                >
                  <SelectValue placeholder="Channel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Channels</SelectItem>
                  {channels.map((c) => (
                    <SelectItem key={c.id} value={c.name}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Environment (Only if NOT docker view) */}
            {!showDockerView && (
              <Select
                value={filters.environment || "all"}
                onValueChange={(v) =>
                  updateFilter("environment", v === "all" ? "" : v)
                }
              >
                <SelectTrigger
                  className="w-[140px] bg-zinc-900 border-zinc-800 text-zinc-300"
                  data-testid="filter-env"
                >
                  <SelectValue placeholder="Env" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Envs</SelectItem>
                  {["production", "staging", "development"].map((e) => (
                    <SelectItem key={e} value={e}>
                      {e}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Date From */}
            <Input
              type="datetime-local"
              value={filters.date_from}
              onChange={(e) => updateFilter("date_from", e.target.value)}
              data-testid="filter-date-from"
              title="From date"
              max={filters.date_to}
              className="w-[190px] bg-zinc-900 border-zinc-800 text-zinc-300 text-xs"
            />

            {/* Date To */}
            <Input
              type="datetime-local"
              value={filters.date_to}
              onChange={(e) => updateFilter("date_to", e.target.value)}
              data-testid="filter-date-to"
              title="To date"
              min={filters.date_from}
              className="w-[190px] bg-zinc-900 border-zinc-800 text-zinc-300 text-xs"
            />

            {/* Clear */}
            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                data-testid="clear-project-filters-btn"
                className="text-zinc-500 hover:text-white self-end"
              >
                <X className="w-4 h-4 mr-1" /> {t("clear")}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <div
        className={`border border-zinc-800 rounded-lg overflow-hidden relative ${loading ? "min-h-[400px]" : ""}`}
      >
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
              <TableHead className="text-zinc-500 text-xs font-mono w-[90px]">
                {t("level")}
              </TableHead>
              {showDockerView && (
                <TableHead className="text-zinc-500 text-xs font-mono w-[180px]">
                  {t("containers")}
                </TableHead>
              )}
              <TableHead className="text-zinc-500 text-xs font-mono">
                {t("message")}
              </TableHead>
              {!showDockerView && (
                <TableHead className="text-zinc-500 text-xs font-mono w-[110px]">
                  {t("channel")}
                </TableHead>
              )}
              {showDockerView && (
                <TableHead className="text-zinc-500 text-xs font-mono w-[140px]">
                  Image
                </TableHead>
              )}
              {!showDockerView && (
                <TableHead className="text-zinc-500 text-xs font-mono w-[100px]">
                  Env
                </TableHead>
              )}
              <TableHead className="text-zinc-500 text-xs font-mono w-[140px]">
                {t("time")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center text-zinc-600 py-16"
                >
                  {loading ? <PageLoader /> : <span>{t("noLogsFound")}</span>}
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow
                  key={log.id}
                  onClick={() => navigate(`/logs/${log.id}`)}
                  className="border-zinc-800/50 hover:bg-zinc-900/50 cursor-pointer transition-colors"
                  data-testid={`log-row-${log.id}`}
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={`text-[10px] px-1.5 py-0 font-mono ${LEVEL_COLORS[log.level] || LEVEL_COLORS.info}`}
                      >
                        {log.level}
                      </Badge>
                      {log.metadata?.source === "docker-agent" && (
                        <Container
                          className="w-3 h-3 text-emerald-500"
                          title={
                            log.metadata?.container_name || "Docker Container"
                          }
                        />
                      )}
                    </div>
                  </TableCell>
                  {showDockerView && (
                    <TableCell className="font-mono text-[11px] text-zinc-400">
                      {log.metadata?.source === "docker-agent" ? (
                        <div className="flex items-center gap-2">
                          <Zap className="w-3 h-3 text-emerald-500" />
                          <span className="truncate max-w-[160px]">
                            {log.metadata?.container_name}
                          </span>
                        </div>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                  )}
                  <TableCell className="font-mono text-xs text-zinc-300 max-w-[500px] truncate">
                    {log.message}
                  </TableCell>
                  {!showDockerView && (
                    <TableCell className="text-xs text-zinc-500">
                      {log.channel}
                    </TableCell>
                  )}
                  {showDockerView && (
                    <TableCell className="text-[10px] text-zinc-500 font-mono truncate max-w-[120px]">
                      {log.metadata?.image?.split("/").pop() || "-"}
                    </TableCell>
                  )}
                  {!showDockerView && (
                    <TableCell className="text-xs text-zinc-500">
                      {log.environment}
                    </TableCell>
                  )}
                  <TableCell className="text-xs text-zinc-500 font-mono">
                    {log.timestamp
                      ? format(parseISO(log.timestamp), "MMM dd HH:mm:ss")
                      : ""}
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
          <div className="flex items-center gap-4">
            <p className="text-xs text-zinc-500">
              {t("pageOf")
                .replace("{page}", page)
                .replace("{totalPages}", totalPages)
                .replace("{total}", total)}
            </p>
            <Select
              value={String(size)}
              onValueChange={(v) => {
                setSize(Number(v));
                setPage(1);
              }}
            >
              <SelectTrigger className="h-8 w-[130px] min-w-[130px] bg-zinc-900 border-zinc-800 text-[10px] text-zinc-400">
                <SelectValue placeholder="Page Size" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="20">20 / page</SelectItem>
                <SelectItem value="30">30 / page</SelectItem>
                <SelectItem value="50">50 / page</SelectItem>
                <SelectItem value="100">100 / page</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              data-testid="prev-page-btn"
              className="border-zinc-800 text-zinc-400 hover:text-white"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              data-testid="next-page-btn"
              className="border-zinc-800 text-zinc-400 hover:text-white"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
