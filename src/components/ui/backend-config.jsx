import { useState } from 'react';
import { Server, CheckCircle2, XCircle, Loader2, X } from 'lucide-react';
import { getBackendUrl } from '@/lib/api';

/**
 * Floating button + modal to configure the backend URL.
 * Only rendered when running inside the Electron shell
 * (window.electronAPI?.isElectron === true).
 */
export default function BackendConfig() {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState(() => getBackendUrl());
  const [status, setStatus] = useState(null); // null | 'testing' | 'ok' | 'error'
  const [errorMsg, setErrorMsg] = useState('');

  if (!window.electronAPI?.isElectron) return null;

  const handleTest = async () => {
    setStatus('testing');
    setErrorMsg('');
    const base = url.trim().replace(/\/$/, '');
    try {
      const res = await fetch(`${base}/api/health`, { signal: AbortSignal.timeout(5000) });
      if (res.ok) {
        setStatus('ok');
      } else {
        setStatus('error');
        setErrorMsg(`HTTP ${res.status}`);
      }
    } catch (e) {
      setStatus('error');
      setErrorMsg(e.message || 'Unreachable');
    }
  };

  const handleSave = () => {
    const base = url.trim().replace(/\/$/, '');
    localStorage.setItem('logforge_backend_url', base);
    setOpen(false);
    window.location.reload();
  };

  const handleOpen = () => {
    setUrl(getBackendUrl());
    setStatus(null);
    setErrorMsg('');
    setOpen(true);
  };

  return (
    <>
      {/* Icon-only trigger */}
      <button
        onClick={handleOpen}
        title="Configure backend"
        className="p-1.5 rounded-md text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800/60 transition-all"
      >
        <Server className="w-3.5 h-3.5" />
      </button>

      {/* Modal overlay */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-950 shadow-2xl p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-zinc-400" />
                <span className="font-semibold text-white text-sm">Backend Configuration</span>
              </div>
              <button onClick={() => setOpen(false)} className="text-zinc-600 hover:text-zinc-300 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Description */}
            <p className="text-xs text-zinc-500 mb-5 leading-relaxed">
              Enter the URL of your LogForge backend. The app will connect to this address for all API calls.
            </p>

            {/* Input */}
            <div className="mb-4">
              <label className="block text-xs text-zinc-400 mb-1.5">Backend URL</label>
              <input
                type="url"
                value={url}
                onChange={(e) => { setUrl(e.target.value); setStatus(null); }}
                placeholder="http://localhost:8000"
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors"
              />
            </div>

            {/* Connection status */}
            {status && (
              <div className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs mb-4 ${
                status === 'ok'      ? 'bg-green-950/50 border border-green-900/50 text-green-400' :
                status === 'error'   ? 'bg-red-950/50 border border-red-900/50 text-red-400' :
                                       'bg-zinc-900 border border-zinc-800 text-zinc-400'
              }`}>
                {status === 'testing' && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {status === 'ok'      && <CheckCircle2 className="w-3.5 h-3.5" />}
                {status === 'error'   && <XCircle className="w-3.5 h-3.5" />}
                <span>
                  {status === 'testing' && 'Testing connection…'}
                  {status === 'ok'      && 'Connection successful'}
                  {status === 'error'   && `Connection failed${errorMsg ? ` — ${errorMsg}` : ''}`}
                </span>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 justify-end">
              <button
                onClick={handleTest}
                disabled={status === 'testing' || !url.trim()}
                className="rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-xs text-zinc-300 hover:text-white hover:border-zinc-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                {status === 'testing' ? 'Testing…' : 'Test connection'}
              </button>
              <button
                onClick={handleSave}
                disabled={!url.trim()}
                className="rounded-lg bg-white px-4 py-2 text-xs font-medium text-zinc-950 hover:bg-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                Save & Reload
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
