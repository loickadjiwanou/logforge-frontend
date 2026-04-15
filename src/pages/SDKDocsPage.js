import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useLanguage } from '../lib/LanguageContext';
import api, { BACKEND_URL } from '../lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Copy, BookOpen, Terminal, Zap, Globe, Monitor, PlayCircle, Shield, Info, ArrowRight, Code, Container, Beaker } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Separator } from '../components/ui/separator';
import { toast } from 'sonner';

const CodeBlock = ({ code, lang }) => {
  const { lang: uiLang } = useLanguage();
  const copyCode = () => {
    navigator.clipboard.writeText(code);
    toast.success(uiLang === 'fr' ? 'Copié dans le presse-papiers' : 'Copied to clipboard');
  };
  return (
    <div className="relative group">
      <Button variant="ghost" size="sm" onClick={copyCode}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 h-7 px-2 text-zinc-500 hover:text-white bg-zinc-800/80"
        data-testid="copy-code-btn">
        <Copy className="w-3 h-3 mr-1" /> {uiLang === 'fr' ? 'Copier' : 'Copy'}
      </Button>
      <pre className="code-block overflow-x-auto">{code}</pre>
    </div>
  );
};

export default function SDKDocsPage() {
  const { t, lang, appSettings } = useLanguage();
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [testModalOpen, setTestModalOpen] = useState(false);

  useEffect(() => {
    api.get('/projects/').then(r => {
      const p = r.data.projects || [];
      setProjects(p);
      if (p.length > 0) setSelectedProject(p[0]);
    }).catch(() => {});
  }, []);

  const apiKey = '<YOUR_API_KEY>';
  const endpoint = BACKEND_URL;

  const sdkCode = `// ${appSettings?.app_name || 'LogForge'} JavaScript SDK
// Copy this into your project or host as a module

class LogForge {
  constructor({ apiKey, endpoint, environment = 'production', channel = 'default', enableReplay = false }) {
    this.apiKey = apiKey;
    this.endpoint = endpoint;
    this.environment = environment;
    this.channel = channel;
    this.enableReplay = enableReplay;
    this.queue = [];
    this.batchSize = 10;
    this.flushInterval = 5000;
    this.retryAttempts = 3;
    this.userInfo = null;
    
    // Session Replay
    this.events = [];
    this.maxEvents = 1000;

    this._setupAutocapture();
    this._startFlush();
    
    if (this.enableReplay) {
      this._setupReplay();
    }
  }

  log(level, message, options = {}) {
    const logId = crypto.randomUUID();
    const logItem = {
      id: logId,
      level,
      message,
      channel: options.channel || this.channel,
      environment: options.environment || this.environment,
      metadata: options.metadata || {},
      stack_trace: options.stackTrace || null,
      user_info: options.user || this.userInfo,
      device_info: this._getDeviceInfo(),
      tags: options.tags || []
    };

    this.queue.push(logItem);
    
    // If it's an error and replay is enabled, send the current buffer
    if ((level === 'error' || level === 'critical') && this.enableReplay) {
      this._sendReplay(logId);
    }

    if (this.queue.length >= this.batchSize) this.flush();
  }

  info(msg, opts)     { this.log('info', msg, opts); }
  warn(msg, opts)     { this.log('warning', msg, opts); }
  error(msg, opts)    { this.log('error', msg, opts); }
  debug(msg, opts)    { this.log('debug', msg, opts); }
  critical(msg, opts) { this.log('critical', msg, opts); }

  captureError(error, options = {}) {
    this.log('error', error.message, {
      ...options,
      stackTrace: error.stack,
      metadata: { ...options.metadata, errorName: error.name }
    });
  }

  setUser(info)        { this.userInfo = info; }
  setChannel(ch)       { this.channel = ch; }
  setEnvironment(env)  { this.environment = env; }

  async flush() {
    if (this.queue.length === 0) return;
    const batch = this.queue.splice(0, this.batchSize);

    for (let attempt = 0; attempt < this.retryAttempts; attempt++) {
      try {
        const res = await fetch(\`\${this.endpoint}/api/logs/ingest/batch\`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': this.apiKey
          },
          body: JSON.stringify({ logs: batch })
        });
        if (res.ok) return;
      } catch (e) {
        if (attempt === this.retryAttempts - 1) {
          this.queue.unshift(...batch);
        }
        await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
      }
    }
  }

  _setupReplay() {
    if (typeof window === 'undefined') return;
    
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/rrweb@latest/dist/rrweb.min.js';
    script.onload = () => {
      window.rrweb.record({
        emit: (event) => {
          this.events.push(event);
          if (this.events.length > this.maxEvents) {
            this.events.shift();
          }
        },
      });
    };
    document.head.appendChild(script);
  }

  async _sendReplay(logId) {
    if (this.events.length === 0) return;
    
    // Wait a bit to catch the actual error event and some context after
    setTimeout(async () => {
      try {
        await fetch(\`\${this.endpoint}/api/logs/replay\`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': this.apiKey
          },
          body: JSON.stringify({
            log_id: logId,
            events: this.events
          })
        });
      } catch (e) {
        console.error('Failed to send session replay', e);
      }
    }, 500);
  }

  _setupAutocapture() {
    if (typeof window === 'undefined') return;
    window.addEventListener('error', (e) => {
      this.captureError(e.error || new Error(e.message));
    });
    window.addEventListener('unhandledrejection', (e) => {
      this.captureError(
        e.reason instanceof Error ? e.reason : new Error(String(e.reason))
      );
    });
  }

  _getDeviceInfo() {
    if (typeof navigator === 'undefined') return {};
    return {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      screen: typeof screen !== 'undefined'
        ? \`\${screen.width}x\${screen.height}\` : null,
      memory: navigator.deviceMemory || null,
      cpu: navigator.hardwareConcurrency || null
    };
  }

  _startFlush() {
    setInterval(() => this.flush(), this.flushInterval);
  }
} `;

  const quickStartCode = `// Quick Start
const logger = new LogForge({
  apiKey: '${apiKey}',
  endpoint: '${endpoint}',
  environment: 'production',
  channel: 'default',
  enableReplay: true // Activate Session Replay
});

// Set current user context
logger.setUser({ id: 'user_123', email: 'john@example.com' });

// Send different log levels
logger.info('User signed in successfully');
logger.warn('Rate limit approaching', { metadata: { current: 95, max: 100 } });
logger.error('Payment failed', {
  metadata: { orderId: 'ORD-456', amount: 99.99 },
  tags: ['payments', 'critical-path']
});

// Capture caught errors
try {
  riskyOperation();
} catch (err) {
  logger.captureError(err, {
    channel: 'payments',
    metadata: { context: 'checkout' }
  });
}

// Switch channel for different modules
logger.setChannel('auth');
logger.info('OAuth token refreshed');`;

  const nodeCode = `// ${appSettings?.app_name || 'LogForge'} Node.js SDK
// Compatible with Node.js 18+ (using fetch)

class LogForge {
  constructor({ apiKey, endpoint, environment = 'production', channel = 'default' }) {
    this.apiKey = apiKey;
    this.endpoint = endpoint;
    this.environment = environment;
    this.channel = channel;
    this.queue = [];
    this.batchSize = 10;
    this.flushInterval = 5000;
  }

  log(level, message, options = {}) {
    const logItem = {
      level,
      message,
      channel: options.channel || this.channel,
      environment: options.environment || this.environment,
      metadata: options.metadata || {},
      stack_trace: options.stackTrace || null,
      user_info: options.user || null,
      device_info: {
        os: process.platform,
        architecture: process.arch,
        node_version: process.version,
        memory_total: Math.round(require('os').totalmem() / 1024 / 1024 / 1024) + 'GB',
        cpu_cores: require('os').cpus().length
      },
      tags: options.tags || []
    };
    this.queue.push(logItem);
    if (this.queue.length >= this.batchSize) this.flush();
  }

  info(msg, opts)     { this.log('info', msg, opts); }
  error(msg, opts)    { this.log('error', msg, opts); }

  async flush() {
    if (this.queue.length === 0) return;
    const batch = this.queue.splice(0, this.batchSize);
    try {
      await fetch(\`\${this.endpoint}/api/logs/ingest/batch\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-API-Key': this.apiKey },
        body: JSON.stringify({ logs: batch })
      });
    } catch (e) {
      console.error('LogForge: Failed to flush logs', e);
      this.queue.unshift(...batch);
    }
  }
}

// Usage:
const logger = new LogForge({ apiKey: '${apiKey}', endpoint: '${endpoint}' });
logger.info('Node.js service started');`;

  const rnCode = `// ${appSettings?.app_name || 'LogForge'} React Native SDK
// Lightweight client for Mobile (React Native)

class LogForge {
  constructor({ apiKey, endpoint, environment = 'production', channel = 'mobile' }) {
    this.apiKey = apiKey;
    this.endpoint = endpoint;
    this.environment = environment;
    this.channel = channel;
  }

  async log(level, message, options = {}) {
    try {
      await fetch(\`\${this.endpoint}/api/logs/ingest\`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey
        },
        body: JSON.stringify({
          level,
          message,
          channel: options.channel || this.channel,
          environment: options.environment || this.environment,
          metadata: options.metadata || {},
          stack_trace: options.stackTrace || null,
          user_info: options.user || null,
          device_info: {
            platform: 'mobile',
            // Note: Use 'react-native-device-info' for more details
          },
          tags: options.tags || []
        })
      });
    } catch (e) {
      console.error('LogForge: Error sending log', e);
    }
  }

  info(msg, opts) { this.log('info', msg, opts); }
  error(msg, opts) { this.log('error', msg, opts); }
}

// Usage:
const logger = new LogForge({ apiKey: '${apiKey}', endpoint: '${endpoint}' });
logger.info('Mobile app launched');`;

  const curlExamples = `# Single log ingestion
curl -X POST '${endpoint}/api/logs/ingest' \\
  -H 'Content-Type: application/json' \\
  -H 'X-API-Key: ${apiKey}' \\
  -d '{
    "level": "error",
    "message": "Database connection timeout",
    "channel": "database",
    "environment": "production",
    "metadata": {"host": "db-primary", "timeout_ms": 5000},
    "stack_trace": "Error: Connection timeout\\n    at connect (db.js:42)",
    "tags": ["database", "timeout"]
  }'

# Batch log ingestion
curl -X POST '${endpoint}/api/logs/ingest/batch' \\
  -H 'Content-Type: application/json' \\
  -H 'X-API-Key: ${apiKey}' \\
  -d '{
    "logs": [
      {"level": "info", "message": "Server started", "channel": "system"},
      {"level": "warning", "message": "Memory usage high", "channel": "system",
       "metadata": {"usage_percent": 87}}
    ]
  }'

# Query logs with filters
curl -X GET '${endpoint}/api/logs?level=error&channel=payments&size=10' \\
  -H 'Authorization: Bearer <YOUR_TOKEN>'

# Get log statistics
curl -X GET '${endpoint}/api/logs/stats' \\
  -H 'Authorization: Bearer <YOUR_TOKEN>'

# Ingest session replay events (rrweb events)
curl -X POST '${endpoint}/api/logs/replay' \\
  -H 'Content-Type: application/json' \\
  -H 'X-API-Key: ${apiKey}' \\
  -d '{
    "log_id": "ea6caa68-1def-4090-9ad1-e5cfa835f9e7",
    "events": [{"type": 1, "timestamp": 123456789}, {"type": 3, "data": {"x": 10, "y": 20}}]
  }'

# Retrieve session replay
curl -X GET '${endpoint}/api/logs/replay/ea6caa68-1def-4090-9ad1-e5cfa835f9e7' \\
  -H 'Authorization: Bearer <YOUR_TOKEN>'`;
  const gelfUdpExample = `# Send GELF via UDP (netcat or any GELF-compatible shipper)
# Make sure to include the _api_key custom field for authentication!
echo -n '{
  "version": "1.1",
  "host": "your-server-name",
  "short_message": "A short error message",
  "full_message": "Backtrace details\\n\\n...",
  "level": "error",
  "_api_key": "${apiKey}",
  "_channel": "system-logs",
  "_environment": "production"
}' | nc -u -w1 localhost 12201`;

  const gelfHttpExample = `# Send GELF via HTTP POST
# The payload is identical to /api/logs/ingest — authenticated via X-API-Key header
curl -X POST '${endpoint}/api/logs/gelf' \\
  -H 'Content-Type: application/json' \\
  -H 'X-API-Key: ${apiKey}' \\
  -d '{
    "level": "error",
    "message": "Database connection timeout",
    "channel": "backend",
    "environment": "production",
    "metadata": { "host": "db-primary", "timeout_ms": 5000 },
    "stack_trace": "Error: Connection timeout\\n    at connect (db.js:42)",
    "tags": ["database", "timeout"]
  }'`;

  const pythonQuickStart = `import requests
import time

class LogForge:
    def __init__(self, api_key, endpoint, environment="production", channel="default"):
        self.api_key = api_key
        self.endpoint = f"{endpoint}/api/logs/ingest"
        self.environment = environment
        self.channel = channel
        self.headers = {"X-API-Key": self.api_key, "Content-Type": "application/json"}
        self.user_info = None

    def set_user(self, user_id, email, name=None):
        self.user_info = {"id": user_id, "email": email, "name": name}

    def log(self, level, message, metadata=None, tags=None, stack_trace=None):
        payload = {
            "level": level,
            "message": message,
            "channel": self.channel,
            "environment": self.environment,
            "metadata": metadata or {},
            "tags": tags or [],
            "stack_trace": stack_trace,
            "user_info": self.user_info
        }
        try:
            requests.post(self.endpoint, json=payload, headers=self.headers, timeout=5)
        except Exception as e:
            print(f"Failed to send log to LogForge: {e}")

    def info(self, msg, **kwargs): self.log("info", msg, **kwargs)
    def warning(self, msg, **kwargs): self.log("warning", msg, **kwargs)
    def error(self, msg, **kwargs): self.log("error", msg, **kwargs)
    def critical(self, msg, **kwargs): self.log("critical", msg, **kwargs)

# Usage Example:
logger = LogForge(
    api_key="${apiKey}",
    endpoint="${endpoint}"
)

# Optional context
logger.set_user("user_89", "john@logforge.com")

try:
    1 / 0
except Exception as e:
    import traceback
    logger.error("Math computation failed", metadata={"operation": "divide"}, stack_trace=traceback.format_exc())
`;
  
  const replaySetupCode = `const logger = new LogForge({
  apiKey: 'YOUR_API_KEY',
  endpoint: '${endpoint}',
  enableReplay: true // 🚀 Activate Session Replay
});`;

  const replayManualCapture = `try {
  runRiskyTask();
} catch (error) {
  // Session Replay events are automatically attached 
  // to Error and Critical logs
  logger.error('Task failed', { error });
}`;

  const backendUrl = window.location.hostname === 'localhost' ? 'http://host.docker.internal:8000' : window.location.origin;

  const dockerAgentDocs = `docker run -d \\
  --name logforge-agent \\
  --restart unless-stopped \\
  -v /var/run/docker.sock:/var/run/docker.sock:ro \\
  -e LOGFORGE_URL=${backendUrl} \\
  -e LOGFORGE_KEY=YOUR_AGENT_KEY \\
  -e MAX_RETRIES=3 \\
  loickadj/logforge-agent:0.2.0`;

  const dockerAgentProjectRouting = `docker run -d \\
  --name project-app \\
  --label "logforge.project_id=${selectedProject?.id || 'YOUR_PROJECT_UUID'}" \\
  --label "logforge.channel=my-service" \\
  --label "logforge.environment=production" \\
  alpine sh -c 'while true; do echo "🚀 Project-Specific Log - $(date)"; sleep 2; done'`;

  return (
    <div className="p-6 space-y-6 w-full" data-testid="sdk-docs-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-mono font-bold tracking-tight text-white">{t('sdkDocs')}</h1>
          <p className="text-sm text-zinc-500 mt-1">{t('integrateLogForge')}</p>
        </div>
      </div>

      <Tabs defaultValue="sdk-ref">
        <TabsList className="bg-zinc-900 border-zinc-800">
          <TabsTrigger value="sdk-ref" className="data-[state=active]:bg-zinc-800 text-xs" data-testid="tab-sdk-ref">
            <BookOpen className="w-3.5 h-3.5 mr-1.5" /> {lang === 'fr' ? 'Référence SDK' : 'SDK Reference'}
          </TabsTrigger>
          <TabsTrigger value="quickstart" className="data-[state=active]:bg-zinc-800 text-xs" data-testid="tab-quickstart">
            <Zap className="w-3.5 h-3.5 mr-1.5" /> {lang === 'fr' ? 'Démarrage Rapide (JS)' : 'Quick Start (JS)'}
          </TabsTrigger>
          <TabsTrigger value="sdk" className="data-[state=active]:bg-zinc-800 text-xs" data-testid="tab-sdk">
            <Terminal className="w-3.5 h-3.5 mr-1.5" /> {lang === 'fr' ? 'SDK JavaScript' : 'JavaScript SDK'}
          </TabsTrigger>
          <TabsTrigger value="python" className="data-[state=active]:bg-zinc-800 text-xs" data-testid="tab-python">
            <Terminal className="w-3.5 h-3.5 mr-1.5" /> {lang === 'fr' ? 'SDK Python' : 'Python SDK'}
          </TabsTrigger>
          <TabsTrigger value="node" className="data-[state=active]:bg-zinc-800 text-xs" data-testid="tab-node">
            <Terminal className="w-3.5 h-3.5 mr-1.5" /> Node.js
          </TabsTrigger>
          <TabsTrigger value="rn" className="data-[state=active]:bg-zinc-800 text-xs" data-testid="tab-rn">
            <Monitor className="w-3.5 h-3.5 mr-1.5" /> React Native
          </TabsTrigger>
          <TabsTrigger value="rest" className="data-[state=active]:bg-zinc-800 text-xs" data-testid="tab-rest">
            <Globe className="w-3.5 h-3.5 mr-1.5" /> API REST
          </TabsTrigger>
          <TabsTrigger value="gelf" className="data-[state=active]:bg-zinc-800 text-xs" data-testid="tab-gelf">
            <Globe className="w-3.5 h-3.5 mr-1.5" /> GELF
          </TabsTrigger>
          <TabsTrigger value="replay" className="data-[state=active]:bg-zinc-800 text-xs" data-testid="tab-replay">
            <PlayCircle className="w-3.5 h-3.5 mr-1.5" /> {t('sessionReplay')}
          </TabsTrigger>
          <TabsTrigger value="docker" className="data-[state=active]:bg-zinc-800 text-xs" data-testid="tab-docker">
            <Container className="w-3.5 h-3.5 mr-1.5" /> Docker Agent
          </TabsTrigger>
        </TabsList>

        <TabsContent value="quickstart" className="space-y-4 mt-4">
          <Card className="bg-zinc-950 border-zinc-800">
            <CardHeader><CardTitle className="text-sm text-white">{lang === 'fr' ? 'Démarrage Rapide JS' : 'JavaScript Quick Start'}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                <Code className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-emerald-400">{lang === 'fr' ? 'Disponible sur npm' : 'Available on npm'}</p>
                  <code className="text-xs text-zinc-300 font-mono">npm install @loickadj/logforge-js</code>
                  <p className="text-[11px] text-zinc-500 pt-1">{lang === 'fr' ? 'Fonctionne dans le navigateur et Node.js 18+. Inclut les types TypeScript.' : 'Works in the browser and Node.js 18+. Includes TypeScript types.'}</p>
                </div>
              </div>
              <p className="text-sm text-zinc-400">
                {lang === 'fr' ? (
                  <>1. Installez le package via npm.<br/>2. Initialisez avec votre clé API et Endpoint.<br/>3. Commencez à envoyer des logs.</>
                ) : (
                  <>1. Install the package via npm.<br/>2. Initialize with your API key and endpoint.<br/>3. Start sending logs.</>
                )}
              </p>
              <CodeBlock code={quickStartCode} lang="javascript" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="python" className="space-y-4 mt-4">
          <Card className="bg-zinc-950 border-zinc-800">
            <CardHeader><CardTitle className="text-sm text-white">{lang === 'fr' ? 'SDK Python Officiel' : 'Official Python SDK'}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-zinc-400">
                {lang === 'fr' ? `Client officiel ${appSettings?.app_name || 'LogForge'} pour Python avec envoi asynchrone par lots et gestion des exceptions.` : `Official ${appSettings?.app_name || 'LogForge'} client for Python with asynchronous batch sending and exception handling.`}
              </p>
              <CodeBlock code={pythonQuickStart} lang="python" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="node" className="space-y-4 mt-4">
          <Card className="bg-zinc-950 border-zinc-800">
            <CardHeader><CardTitle className="text-sm text-white">SDK Node.js</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-zinc-400">
                {lang === 'fr' ? 'Optimisé pour les performances backend avec traitement par lots (batch) automatique. Compatible Node.js 18+.' : 'Optimized for backend performance with automated batching and minimal overhead. Compatible with Node.js 18+.'}
              </p>
              <CodeBlock code={nodeCode} lang="javascript" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rn" className="space-y-4 mt-4">
          <Card className="bg-zinc-950 border-zinc-800">
            <CardHeader><CardTitle className="text-sm text-white">SDK React Native</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-zinc-400">
                {lang === 'fr' ? 'Client léger conçu pour les environnements mobiles (iOS / Android).' : 'Lightweight client tailored for mobile environments.'}
              </p>
              <CodeBlock code={rnCode} lang="javascript" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sdk" className="space-y-4 mt-4">
          <Card className="bg-zinc-950 border-zinc-800">
            <CardHeader><CardTitle className="text-sm text-white">SDK JavaScript</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-zinc-400">
                {lang === 'fr' ? 'SDK complet avec capture automatique, gestion des lots (batch), réessais et détection de l\'appareil. Copiez cette classe dans votre projet.' : 'Full-featured SDK with auto-capture, batching, retry, and device info detection. Copy this class into your project or include it as a module.'}
              </p>
              <CodeBlock code={sdkCode} lang="javascript" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rest" className="space-y-4 mt-4">
          <Card className="bg-zinc-950 border-zinc-800">
            <CardHeader><CardTitle className="text-sm text-white">{lang === 'fr' ? 'Exemples d\'API REST' : 'REST API Examples'}</CardTitle></CardHeader>
            <CardContent>
              <CodeBlock code={curlExamples} lang="bash" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gelf" className="space-y-4 mt-4">
          <Card className="bg-zinc-950 border-zinc-800">
            <CardHeader><CardTitle className="text-sm text-white">{lang === 'fr' ? 'Protocole GELF (HTTP & UDP)' : 'GELF Protocol (HTTP & UDP)'}</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <p className="text-sm text-zinc-400">
                  {lang === 'fr' ? 'LogForge prend en charge le format standard GELF. Pour l\'UDP, ajoutez le champ personnalisé _api_key pour l\'authentification. Pour le HTTP, utilisez l\'en-tête X-API-Key.' : 'LogForge supports standard GELF format. For UDP, add the custom _api_key field for authentication. For HTTP, use the X-API-Key header.'}
                </p>
                <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-lg p-3">
                  <h5 className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-2">{lang === 'fr' ? 'Mapping des champs' : 'Field Mapping'}</h5>
                  <ul className="text-xs text-zinc-400 space-y-1 list-disc list-inside">
                    <li><code className="text-zinc-300">short_message</code> → {lang === 'fr' ? 'Message principal (Titre)' : 'Main Message (Title)'}</li>
                    <li><code className="text-zinc-300">full_message</code> → {lang === 'fr' ? 'Stack Trace (Section dédiée)' : 'Stack Trace (Dedicated section)'}</li>
                    <li><code className="text-zinc-300">host</code> → {lang === 'fr' ? 'Source Host & IP' : 'Source Host & IP'}</li>
                    <li><code className="text-zinc-300">_any_custom_field</code> → {lang === 'fr' ? 'Metadata' : 'Metadata'}</li>
                  </ul>
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider text-emerald-500/80">{lang === 'fr' ? 'Niveaux de Log (Support Dual)' : 'Log Levels (Dual Support)'}</h4>
                <p className="text-sm text-zinc-400">
                  {lang === 'fr' 
                    ? "LogForge accepte aussi bien les chaînes de caractères que les entiers syslog standard (0-7) pour le champ `level`."
                    : "LogForge accepts both string names and standard syslog integers (0-7) for the `level` field."}
                </p>
                <div className="bg-zinc-900/50 rounded-lg p-3 border border-zinc-800">
                  <table className="w-full text-xs font-mono">
                    <thead>
                      <tr className="text-zinc-500 border-b border-zinc-800">
                        <th className="text-left pb-2">String Level</th>
                        <th className="text-left pb-2">Syslog Value</th>
                        <th className="text-left pb-2">LogForge Mapping</th>
                      </tr>
                    </thead>
                    <tbody className="text-zinc-300">
                      <tr><td className="py-1">"critical"</td><td className="py-1">0, 1, 2</td><td className="py-1">CRITICAL</td></tr>
                      <tr><td className="py-1">"error"</td><td className="py-1">3</td><td className="py-1">ERROR</td></tr>
                      <tr><td className="py-1">"warning"</td><td className="py-1">4</td><td className="py-1">WARNING</td></tr>
                      <tr><td className="py-1">"info"</td><td className="py-1">5, 6</td><td className="py-1">INFO</td></tr>
                      <tr><td className="py-1">"debug"</td><td className="py-1">7</td><td className="py-1">DEBUG</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider text-emerald-500/80">{lang === 'fr' ? 'Exemple UDP' : 'UDP Example'}</h4>
                <CodeBlock code={gelfUdpExample} lang="bash" />
              </div>
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider text-emerald-500/80">{lang === 'fr' ? 'Exemple HTTP' : 'HTTP Example'}</h4>
                <CodeBlock code={gelfHttpExample} lang="bash" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="replay" className="space-y-4 mt-4">
          <Card className="bg-zinc-950 border-zinc-800">
            <CardHeader className="flex flex-row items-center gap-3 space-y-0">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500">
                <PlayCircle className="w-6 h-6" />
              </div>
              <div>
                <CardTitle className="text-sm text-white">{lang === 'fr' ? 'Session Replay' : 'Session Replay'}</CardTitle>
                <CardDescription className="text-xs text-zinc-500">
                  {lang === 'fr'
                    ? "Visualisez exactement ce qui s'est passé avant qu'une erreur ne survienne."
                    : "See exactly what happened before an error occurred."}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-zinc-900/30 border-zinc-800/50">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-[11px] font-mono text-emerald-500 flex items-center gap-2 uppercase tracking-wider">
                  <Zap className="w-3.5 h-3.5" /> {lang === 'fr' ? 'Automatique' : 'Automatic'}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 text-[11px] text-zinc-500 leading-relaxed">
                {lang === 'fr' 
                  ? "Enregistrement activé dès le début, envoyé uniquement sur erreur critique."
                  : "Recording starts early, only sent when critical errors occur."}
              </CardContent>
            </Card>
            <Card className="bg-zinc-900/30 border-zinc-800/50">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-[11px] font-mono text-blue-500 flex items-center gap-2 uppercase tracking-wider">
                  <Shield className="w-3.5 h-3.5" /> {lang === 'fr' ? 'Confidentialité' : 'Privacy'}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 text-[11px] text-zinc-500 leading-relaxed">
                {lang === 'fr' 
                  ? "Les champs sensibles sont automatiquement masqués pour protéger les données."
                  : "Sensitive inputs are automatically masked to protect user data."}
              </CardContent>
            </Card>
            <Card className="bg-zinc-900/30 border-zinc-800/50">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-[11px] font-mono text-purple-500 flex items-center gap-2 uppercase tracking-wider">
                  <Monitor className="w-3.5 h-3.5" /> {lang === 'fr' ? 'Zéro Impact' : 'Low Impact'}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 text-[11px] text-zinc-500 leading-relaxed">
                {lang === 'fr' 
                  ? "Chargement asynchrone pour préserver les performances de votre application."
                  : "Asynchronous loading to maintain your application's speed."}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Code className="w-4 h-4 text-emerald-500" />
                {lang === 'fr' ? 'Mise en place' : 'Implementation'}
              </h3>
              
              <div className="p-5 rounded-xl bg-zinc-900/50 border border-zinc-800 space-y-3">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider text-emerald-500/80">
                  1. {lang === 'fr' ? "Activation" : "Activation"}
                </h4>
                <p className="text-[13px] text-zinc-400">
                  {lang === 'fr' 
                    ? "Passez `enableReplay: true` dans le constructeur LogForge."
                    : "Pass `enableReplay: true` in the LogForge constructor."}
                </p>
                <CodeBlock code={replaySetupCode} lang="javascript" />
              </div>

              <div className="p-5 rounded-xl bg-zinc-900/50 border border-zinc-800 space-y-3">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider text-emerald-500/80">
                  2. {lang === 'fr' ? "Capture" : "Capture"}
                </h4>
                <p className="text-[13px] text-zinc-400">
                  {lang === 'fr' 
                    ? "Les erreurs captures via `error` ou `captureError` incluront le replay."
                    : "Errors captured via `error` or `captureError` will include the replay."}
                </p>
                <CodeBlock code={replayManualCapture} lang="javascript" />
              </div>
            </div>

            <div className="p-5 rounded-xl bg-emerald-500/5 border border-emerald-500/10 flex gap-4">
              <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-500 shrink-0 h-fit">
                <Info className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-white">
                  {lang === 'fr' ? 'Comment visionner ?' : 'How to watch?'}
                </h4>
                <p className="text-[13px] text-zinc-400 leading-relaxed">
                  {lang === 'fr'
                    ? "Ouvrez un log d'erreur dans l'Explorateur. Si dispo, le bouton 'Show Replay' sera visible en haut."
                    : "Open an error log in the Explorer. If available, the 'Show Replay' button will be visible at the top."}
                </p>
                <div className="flex items-center gap-2 text-[10px] font-mono text-emerald-500/80 uppercase tracking-widest pt-1">
                  Detail <ArrowRight className="w-2.5 h-2.5" /> Show Replay <ArrowRight className="w-2.5 h-2.5" /> Debug
                </div>
              </div>
            </div>
          </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="docker" className="space-y-4 mt-4">
          <Card className="bg-zinc-950 border-zinc-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                  <Container className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle className="text-sm text-white">Docker Agent Documentation</CardTitle>
                  <CardDescription className="text-xs text-zinc-500">
                    {lang === 'fr' ? 'Collecte automatique de logs pour tous vos conteneurs.' : 'Automatic log collection for all your containers.'}
                  </CardDescription>
                </div>
              </div>
              <Button onClick={() => setTestModalOpen(true)} variant="outline" size="sm" className="border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10 gap-2 h-8 px-3">
                <Beaker className="w-3.5 h-3.5" /> {lang === 'fr' ? 'Tester' : 'Test'}
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider text-emerald-500/80">
                  {lang === 'fr' ? '1. Concept' : '1. Concept'}
                </h3>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  {lang === 'fr' 
                    ? "L'agent Docker est un service léger qui s'exécute sur votre hôte Docker. Il écoute les logs de tous les autres conteneurs via le socket Docker et les transfère à LogForge en temps réel."
                    : "The Docker Agent is a lightweight service that runs on your Docker host. It listens to logs from all other containers via the Docker socket and forwards them to LogForge in real-time."}
                </p>
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-md p-3 mt-4 space-y-2">
                   <p className="text-[12px] font-bold text-amber-500">
                     {lang === 'fr' ? '⚠️ Important : Exécution et Docker Hub' : '⚠️ Important: Execution & Docker Hub'}
                   </p>
                   <p className="text-[11px] text-amber-500/90 leading-relaxed">
                     {lang === 'fr' 
                       ? "L'image de l'agent est hébergée publiquement sur Docker Hub (loickadj/logforge-agent). Vous n'avez pas besoin de la télécharger manuellement, la commande 'docker run' s'en chargera automatiquement. Cependant, n'utilisez JAMAIS l'interface graphique de Docker Desktop pour configurer ce conteneur : la configuration manuelle et stricte du volume (/var/run/docker.sock) entraînerait presque toujours des erreurs. Utilisez exclusivement les commandes Terminal ci-dessous." 
                       : "The agent image is hosted publicly on Docker Hub (loickadj/logforge-agent). You do not need to download it manually, the 'docker run' command will pull it automatically. However, NEVER use the Docker Desktop GUI to configure this container: manual translation of the strict volume mapping (/var/run/docker.sock) will almost certainly cause errors. Exclusively use the Terminal commands provided below."}
                   </p>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider text-emerald-500/80">
                  {lang === 'fr' ? '2. Option A : Monitoring Global (Vue Docker Logs)' : '2. Option A: Global Monitoring (Docker Logs View)'}
                </h3>
                <p className="text-sm text-zinc-400 leading-relaxed italic">
                  {lang === 'fr' 
                    ? "Déployez l'agent sans ID de projet par défaut pour collecter tous les logs de l'hôte dans la vue centrale 'Docker Logs'. Note : Les membres peuvent accéder à cette vue si la permission 'Voir Logs Docker' leur est accordée."
                    : "Deploy the agent without a default project ID to collect all host logs into the centralized 'Docker Logs' view. Note: Non-admin members can access this view if granted the 'View Docker Logs' permission."}
                </p>
                <CodeBlock code={dockerAgentDocs} lang="bash" />
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-md p-3 mt-2">
                   <p className="text-[11px] text-blue-400">
                     <span className="font-bold">{lang === 'fr' ? 'NB (Réseau) : ' : 'NB (Network): '}</span>
                     {lang === 'fr' 
                       ? "Si vous êtes en développement local, conservez l'URL http://host.docker.internal:8000 (qui permet au conteneur Docker de communiquer avec l'API sur le port de votre machine hôte). En production sur un serveur distant, remplacez cette valeur par l'URL publique de votre instance LogForge sans spécifier le port 8000 si vous passez par un reverse-proxy HTTPS." 
                       : "If developing locally, keep http://host.docker.internal:8000 (allows the Docker container to reach your host's API port). In production, replace this with your public LogForge instance URL, stripping the port 8000 if behind an HTTPS reverse proxy."}
                   </p>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider text-emerald-500/80">
                  {lang === 'fr' ? '3. Option B : Routage par Projet (Explorateur de Projet)' : '3. Option B: Project-Specific Routing (Project Explorer)'}
                </h3>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  {lang === 'fr' 
                    ? "Ajoutez des labels à vos conteneurs applicatifs pour isoler les logs dans des projets spécifiques. Ces logs apparaîtront TOUJOURS dans la vue globale Docker Logs."
                    : "Add labels to your application containers to isolate logs into specific projects. These logs will ALSO appear in the global Docker Logs view."}
                </p>
                
                <div className="bg-zinc-900/50 rounded-lg p-4 border border-zinc-800 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-[10px] text-zinc-500 uppercase font-mono tracking-widest">Label</p>
                      <code className="text-xs text-emerald-400">logforge.project_id</code>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] text-zinc-500 uppercase font-mono tracking-widest">Description</p>
                      <p className="text-[11px] text-zinc-400">{lang === 'fr' ? "L'ID UUID du projet LogForge" : "The LogForge Project UUID"}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] text-zinc-500 uppercase font-mono tracking-widest">Label</p>
                      <code className="text-xs text-emerald-400">logforge.channel</code>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] text-zinc-500 uppercase font-mono tracking-widest">Description</p>
                      <p className="text-[11px] text-zinc-400">{lang === 'fr' ? "Le nom du canal (ex: billing-service)" : "The channel name (e.g., billing-service)"}</p>
                    </div>
                  </div>
                  <div className="space-y-2 border-t border-zinc-800 pt-3">
                    <p className="text-[11px] text-zinc-500">{lang === 'fr' ? "Exemple de lancement d'un conteneur routé :" : "Example of running a routed container:"}</p>
                    <CodeBlock code={dockerAgentProjectRouting} lang="bash" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ------------------------------------------------------------------ */}
        {/* SDK REFERENCE TAB                                                   */}
        {/* ------------------------------------------------------------------ */}
        <TabsContent value="sdk-ref" className="space-y-4 mt-4">
          <Card className="bg-zinc-950 border-zinc-800">
            <CardHeader className="flex flex-row items-center gap-3 space-y-0">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-sm text-white">{lang === 'fr' ? 'Référence Complète des SDKs' : 'Full SDK Reference'}</CardTitle>
                <CardDescription className="text-xs text-zinc-500">{lang === 'fr' ? 'Documentation officielle — @loickadj/logforge-js (npm) et logforge-py (PyPI) — v2.0.0' : 'Official documentation — @loickadj/logforge-js (npm) and logforge-py (PyPI) — v2.0.0'}</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">

              {/* ── JS SDK ── */}
              <div className="space-y-5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-yellow-500/90 flex items-center gap-2">
                  JavaScript SDK — @loickadj/logforge-js
                  <Badge variant="outline" className="text-yellow-500 border-yellow-500/30 text-[10px]">npm</Badge>
                </h3>

                <div className="space-y-2">
                  <p className="text-xs font-mono text-zinc-400 uppercase tracking-widest">{lang === 'fr' ? 'Installation' : 'Installation'}</p>
                  <CodeBlock code={`npm install @loickadj/logforge-js\n# yarn add @loickadj/logforge-js\n# pnpm add @loickadj/logforge-js`} lang="bash" />
                  <p className="text-[11px] text-zinc-500 flex items-center gap-1.5 pt-1">
                    <Info className="w-3 h-3 text-emerald-500" />
                    {lang === 'fr' ? 'TypeScript inclus — aucun package @types/ requis.' : 'TypeScript included — no @types/ package needed.'}
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-mono text-zinc-400 uppercase tracking-widest">{lang === 'fr' ? 'Initialisation' : 'Initialization'}</p>
                  <CodeBlock code={`import { LogForge } from '@loickadj/logforge-js';\n// CommonJS: const { LogForge } = require('@loickadj/logforge-js');\n\nconst logger = new LogForge({\n  apiKey: 'YOUR_PROJECT_API_KEY',\n  endpoint: 'https://logs.myapp.com',\n  environment: 'production',\n  channel: 'default',\n  autocapture: true,   // auto-capture uncaught errors\n  debug: false,\n});`} lang="javascript" />
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-mono text-zinc-400 uppercase tracking-widest">{lang === 'fr' ? 'Options du constructeur' : 'Constructor Options'}</p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-zinc-800 text-zinc-500">
                          <th className="text-left pb-2 pr-4 font-mono">option</th>
                          <th className="text-left pb-2 pr-4">type</th>
                          <th className="text-left pb-2 pr-4">défaut</th>
                          <th className="text-left pb-2">{lang === 'fr' ? 'description' : 'description'}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-900">
                        {[
                          ['apiKey','string','requis', lang === 'fr' ? 'Clé API du projet.' : 'Project API key.'],
                          ['endpoint','string','requis', lang === 'fr' ? 'URL de base du backend.' : 'Backend base URL.'],
                          ['environment','string','"production"', lang === 'fr' ? 'Tag d\'environnement.' : 'Environment tag.'],
                          ['channel','string','"default"', lang === 'fr' ? 'Canal par défaut.' : 'Default channel.'],
                          ['enableReplay','boolean','false', lang === 'fr' ? 'Session Replay (navigateur seulement).' : 'Session Replay (browser only).'],
                          ['batchSize','number','10', lang === 'fr' ? 'Logs max par batch.' : 'Max logs per batch.'],
                          ['flushInterval','number','5000', lang === 'fr' ? 'Intervalle d\'auto-flush (ms).' : 'Auto-flush interval (ms).'],
                          ['retryAttempts','number','3', lang === 'fr' ? 'Réessais avec backoff exponentiel.' : 'Retries with exponential backoff.'],
                          ['autocapture','boolean','true', lang === 'fr' ? 'Capture automatique des erreurs non gérées.' : 'Auto-capture uncaught errors.'],
                          ['debug','boolean','false', lang === 'fr' ? 'Afficher les erreurs internes du SDK.' : 'Log SDK-internal errors.'],
                        ].map(([opt, type, def, desc]) => (
                          <tr key={opt}>
                            <td className="py-1.5 pr-4 font-mono text-emerald-400">{opt}</td>
                            <td className="py-1.5 pr-4 text-zinc-500">{type}</td>
                            <td className="py-1.5 pr-4 text-zinc-600">{def}</td>
                            <td className="py-1.5 text-zinc-400 leading-relaxed">{desc}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-mono text-zinc-400 uppercase tracking-widest">{lang === 'fr' ? 'Méthodes de logging' : 'Logging Methods'}</p>
                  <CodeBlock code={`// Niveaux disponibles
logger.info('App started');
logger.warn('Rate limit at 90%', { metadata: { rate: 0.9 } });
logger.error('DB write failed', { tags: ['database'], metadata: { table: 'orders' } });
logger.debug('Cache hit', { metadata: { key: 'usr:42', ttl: 3600 } });
logger.critical('Elasticsearch unreachable');

// Capturer une erreur JavaScript (avec stack trace automatique)
try {
  await riskyOperation();
} catch (err) {
  logger.captureError(err, {
    channel: 'payments',
    metadata: { orderId: 'ORD-456' },
    tags: ['checkout'],
  });
}

// Contexte utilisateur persistant
logger.setUser({ id: 'user_123', email: 'alice@example.com', plan: 'pro' });
logger.clearUser();

// Changer le canal ou l'environnement par défaut
logger.setChannel('auth');
logger.setEnvironment('staging');

// Flush manuel et arrêt propre
await logger.flush();
await logger.shutdown(); // flush() + arrêt du timer`} lang="javascript" />
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-mono text-zinc-400 uppercase tracking-widest">{lang === 'fr' ? 'Options par entrée de log' : 'Per-Log Options'}</p>
                  <p className="text-[11px] text-zinc-500">{lang === 'fr' ? 'Chaque méthode accepte un objet options en second argument.' : 'Every method accepts an options object as second argument.'}</p>
                  <CodeBlock code={`logger.error('Payment failed', {\n  channel: 'payments',      // override du canal\n  environment: 'staging',   // override de l'env\n  metadata: { orderId: 'ORD-789', amount: 99.99 },\n  stackTrace: err.stack,    // stack trace manuelle\n  user: { id: 'usr_42' },   // override du contexte user\n  tags: ['payments', 'critical'],\n});`} lang="javascript" />
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-mono text-zinc-400 uppercase tracking-widest">Node.js — {lang === 'fr' ? 'Arrêt propre' : 'Graceful Shutdown'}</p>
                  <CodeBlock code={`// Appeler shutdown() avant la fin du processus pour ne perdre aucun log\nprocess.on('SIGTERM', async () => {\n  await logger.shutdown();\n  process.exit(0);\n});\n\n// Ou avec atexit-style :\nimport { shutdown } from '@loickadj/logforge-js';\nprocess.on('exit', () => logger.shutdown());`} lang="javascript" />
                </div>
              </div>

              <div className="border-t border-zinc-800" />

              {/* ── Python SDK ── */}
              <div className="space-y-5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-blue-400/90 flex items-center gap-2">
                  Python SDK — logforge-py
                  <Badge variant="outline" className="text-blue-400 border-blue-400/30 text-[10px]">PyPI</Badge>
                </h3>

                <div className="space-y-2">
                  <p className="text-xs font-mono text-zinc-400 uppercase tracking-widest">{lang === 'fr' ? 'Installation' : 'Installation'}</p>
                  <CodeBlock code={`# Avec requests (recommandé)\npip install logforge-py[requests]\n\n# Avec httpx\npip install logforge-py[httpx]\n\n# Les deux backends\npip install logforge-py[all]`} lang="bash" />
                  <p className="text-[11px] text-zinc-500 flex items-center gap-1.5 pt-1">
                    <Info className="w-3 h-3 text-emerald-500" />
                    {lang === 'fr' ? 'Aucune dépendance obligatoire — choisissez le backend HTTP que vous utilisez déjà.' : 'No hard dependency — pick the HTTP backend you already use.'}
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-mono text-zinc-400 uppercase tracking-widest">{lang === 'fr' ? 'Initialisation' : 'Initialization'}</p>
                  <CodeBlock code={`from logforge import LogForge\n\nlogger = LogForge(\n    api_key="YOUR_PROJECT_API_KEY",\n    endpoint="https://logs.myapp.com",\n    environment="production",\n    channel="default",\n    debug=False,\n)`} lang="python" />
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-mono text-zinc-400 uppercase tracking-widest">{lang === 'fr' ? 'Options du constructeur' : 'Constructor Options'}</p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-zinc-800 text-zinc-500">
                          <th className="text-left pb-2 pr-4 font-mono">option</th>
                          <th className="text-left pb-2 pr-4">type</th>
                          <th className="text-left pb-2 pr-4">défaut</th>
                          <th className="text-left pb-2">{lang === 'fr' ? 'description' : 'description'}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-900">
                        {[
                          ['api_key','str','requis', lang === 'fr' ? 'Clé API du projet.' : 'Project API key.'],
                          ['endpoint','str','requis', lang === 'fr' ? 'URL de base du backend.' : 'Backend base URL.'],
                          ['environment','str','"production"', lang === 'fr' ? 'Tag d\'environnement.' : 'Environment tag.'],
                          ['channel','str','"default"', lang === 'fr' ? 'Canal par défaut.' : 'Default channel.'],
                          ['batch_size','int','10', lang === 'fr' ? 'Logs max par batch.' : 'Max logs per batch.'],
                          ['flush_interval','float','5.0', lang === 'fr' ? 'Secondes entre deux flush auto.' : 'Seconds between auto-flushes.'],
                          ['retry_attempts','int','3', lang === 'fr' ? 'Réessais avec backoff exponentiel.' : 'Retries with exponential backoff.'],
                          ['timeout','float','10.0', lang === 'fr' ? 'Timeout HTTP en secondes.' : 'HTTP request timeout (s).'],
                          ['debug','bool','False', lang === 'fr' ? 'Erreurs SDK via logging Python.' : 'SDK errors via Python logging.'],
                        ].map(([opt, type, def, desc]) => (
                          <tr key={opt}>
                            <td className="py-1.5 pr-4 font-mono text-blue-400">{opt}</td>
                            <td className="py-1.5 pr-4 text-zinc-500">{type}</td>
                            <td className="py-1.5 pr-4 text-zinc-600">{def}</td>
                            <td className="py-1.5 text-zinc-400 leading-relaxed">{desc}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-mono text-zinc-400 uppercase tracking-widest">{lang === 'fr' ? 'Méthodes de logging' : 'Logging Methods'}</p>
                  <CodeBlock code={`# Niveaux disponibles
logger.info("App started")
logger.warning("Rate limit at 90%", metadata={"rate": 0.9})   # alias: warn()
logger.error("DB write failed", tags=["database"], metadata={"table": "orders"})
logger.debug("Cache hit", metadata={"key": "usr:42", "ttl": 3600})
logger.critical("Elasticsearch unreachable")

# Capturer une exception Python (avec traceback complet)
try:
    process_payment(order_id)
except Exception as exc:
    logger.capture_exception(
        exc,
        channel="payments",
        metadata={"order_id": order_id},
        tags=["checkout"],
    )

# Capture implicite — utilise sys.exc_info()
try:
    connect_to_db()
except ConnectionError:
    logger.capture_exception()  # pas d'argument nécessaire

# Contexte utilisateur persistant
logger.set_user("user_123", "alice@example.com", name="Alice", plan="pro")
logger.clear_user()

# Canal et environnement par défaut
logger.set_channel("auth")
logger.set_environment("staging")

# Flush et arrêt propre
logger.flush()     # bloquant — vide la queue
logger.shutdown()  # flush() + arrêt du thread`} lang="python" />
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-mono text-zinc-400 uppercase tracking-widest">{lang === 'fr' ? 'Options par entrée de log' : 'Per-Log Options'}</p>
                  <p className="text-[11px] text-zinc-500">{lang === 'fr' ? 'Chaque méthode accepte des arguments nommés optionnels.' : 'Every method accepts optional keyword arguments.'}</p>
                  <CodeBlock code={`logger.error(\n    "Payment failed",\n    channel="payments",      # override du canal\n    environment="staging",   # override de l'env\n    metadata={"order_id": "ORD-789", "amount": 99.99},\n    stack_trace="Traceback...",  # stack trace manuelle\n    user={"id": "usr_42"},       # override du contexte user\n    tags=["payments", "critical"],\n)`} lang="python" />
                </div>

                <div className="space-y-3">
                  <p className="text-xs font-mono text-zinc-400 uppercase tracking-widest">{lang === 'fr' ? 'Intégrations framework' : 'Framework Integrations'}</p>
                  <div>
                    <p className="text-[11px] font-semibold text-zinc-300 mb-2">Django</p>
                    <CodeBlock code={`# apps.py
import atexit, os
from django.apps import AppConfig
from logforge import LogForge

log = LogForge(api_key=os.environ["LOGFORGE_KEY"], endpoint=os.environ["LOGFORGE_URL"])

class MyAppConfig(AppConfig):
    name = "myapp"
    def ready(self):
        atexit.register(log.shutdown)

# views.py
def checkout(request):
    try:
        result = process_payment(request)
        log.info("Payment OK", metadata={"user": request.user.id})
        return JsonResponse(result)
    except Exception as exc:
        log.capture_exception(exc, metadata={"path": request.path})
        raise`} lang="python" />
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-zinc-300 mb-2">FastAPI</p>
                    <CodeBlock code={`from contextlib import asynccontextmanager
from fastapi import FastAPI
from logforge import LogForge
import os, time

logger = LogForge(api_key=os.environ["LOGFORGE_KEY"], endpoint=os.environ["LOGFORGE_URL"])

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("API starting")
    yield
    logger.shutdown()

app = FastAPI(lifespan=lifespan)

@app.middleware("http")
async def log_requests(request, call_next):
    start = time.time()
    response = await call_next(request)
    ms = round((time.time() - start) * 1000)
    logger.info(f"{request.method} {request.url.path}",
        metadata={"status": response.status_code, "ms": ms}, channel="http")
    return response`} lang="python" />
                  </div>
                </div>
              </div>

            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={testModalOpen} onOpenChange={setTestModalOpen}>
        <DialogContent className="bg-zinc-950 border-zinc-800 max-w-4xl max-h-[90vh] overflow-y-auto w-11/12">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Beaker className="w-5 h-5 text-emerald-500" />
              {lang === 'fr' ? 'Guide de Test : Agent Docker' : 'Test Guide: Docker Agent'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <section className="space-y-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center text-[10px]">1</span>
                {lang === 'fr' ? 'Déploiement de l\'Agent' : 'Deploy the Agent'}
              </h3>
              <p className="text-xs text-zinc-400">
                {lang === 'fr' ? 'Exécutez l\'agent sur votre hôte Docker. Assurez-vous d\'avoir généré une clé d\'agent dans les Paramètres.' : 'Run the agent on your Docker host. Ensure you have generated an agent key in Settings.'}
              </p>
              <CodeBlock code={dockerAgentDocs} lang="bash" />
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-md p-3 mt-2">
                 <p className="text-[11px] text-blue-400 leading-snug">
                   <span className="font-bold">{lang === 'fr' ? 'NB : ' : 'Note: '}</span>
                   {lang === 'fr' 
                     ? "Assurez-vous que LOGFORGE_URL pointe vers le port backend (généralement 8000). En local, host.docker.internal:8000 est requis. En production SSL, utilisez simplement votre domaine HTTPS sans le port." 
                     : "Ensure LOGFORGE_URL points to the backend port (usually 8000). For local dev, host.docker.internal:8000 is required. For SSL production, use your root HTTPS domain."}
                 </p>
              </div>
            </section>

            <Separator className="bg-zinc-900" />

            <section className="space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center text-[10px]">2</span>
                {lang === 'fr' ? 'Options de Test' : 'Testing Options'}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="bg-zinc-900/50 border-zinc-800 p-4 space-y-3">
                  <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-widest">{lang === 'fr' ? 'Option A : Global' : 'Option A: Global'}</h4>
                  <p className="text-[11px] text-zinc-500">
                    {lang === 'fr' ? 'Logs envoyés vers la vue globale "Docker Logs". Aucun ID de projet requis.' : 'Logs sent to the global "Docker Logs" view. No project ID required.'}
                  </p>
                  <CodeBlock code={`docker run -d --name global-test alpine sh -c '
while true; do 
  echo "🌍 Global Log - $(date)"; 
  sleep 3; 
done'`} lang="bash" />
                </Card>

                <Card className="bg-zinc-900/50 border-zinc-800 p-4 space-y-3">
                  <h4 className="text-xs font-bold text-blue-400 uppercase tracking-widest">{lang === 'fr' ? 'Option B : Projet' : 'Option B: Project'}</h4>
                  <p className="text-[11px] text-zinc-500">
                    {lang === 'fr' ? 'Logs routés vers un projet spécifique via le label Docker.' : 'Logs routed to a specific project using the Docker label.'}
                  </p>
                  <CodeBlock code={dockerAgentProjectRouting} lang="bash" />
                </Card>
              </div>
            </section>

            <Separator className="bg-zinc-900" />

            <section className="space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center text-[10px]">3</span>
                {lang === 'fr' ? 'Tester les Règles d\'Alerte' : 'Testing Alert Rules'}
              </h3>
              <p className="text-xs text-zinc-400">
                {lang === 'fr' ? 'Générez des logs récurrents vers un channel spécifique (ex: "spike") avec un niveau précis. Idéal pour vérifier la réception de vos emails (INFO/WARNING/ERROR).' : 'Generate recurring logs to a specific channel (e.g., "spike") with a specific level. Ideal for verifying your email notifications (INFO/WARNING/ERROR).'}
              </p>
              <CodeBlock code={`docker run -d \\
  --name test-info-spike \\
  --label logforge.enable=true \\
  --label logforge.channel=spike \\
  alpine \\
  sh -c "while true; do echo \\"INFO: [Spike] Routine check successful - $(date)\\"; sleep 60; done"`} lang="bash" />
            </section>

            <Separator className="bg-zinc-900" />

            <section className="space-y-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center text-[10px]">4</span>
                {lang === 'fr' ? 'Vérification' : 'Verification'}
              </h3>
              <ul className="text-xs text-zinc-400 space-y-2 list-disc list-inside">
                <li>{lang === 'fr' ? 'Vue Globale : Allez dans "Docker Logs" pour voir tous les flux.' : 'Global View: Go to "Docker Logs" to see all streams.'}</li>
                <li>{lang === 'fr' ? 'Vue Projet : Allez dans l\'explorateur de projet pour les flux labellisés.' : 'Project View: Go to the project explorer for labeled streams.'}</li>
                <li>{lang === 'fr' ? 'Dépannage : Vérifiez les logs avec `docker logs logforge-agent`.' : 'Troubleshooting: Check logs with `docker logs logforge-agent`.'}</li>
              </ul>
            </section>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
