import React from 'react';
import { RefreshCw, zap } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { useLanguage } from '../../lib/LanguageContext';
import { Badge } from './badge';

const REFRESH_OPTIONS = [
  { label: 'Off', value: 'off' },
  { label: '5s', value: '5000' },
  { label: '10s', value: '10000' },
  { label: '30s', value: '30000' },
  { label: '1m', value: '60000' },
  { label: '5m', value: '300000' },
];

export function AutoRefreshControl({ value, onValueChange }) {
  const { t } = useLanguage();

  return (
    <div className="flex items-center gap-2">
      <div className="auto-refresh-toggle flex items-center gap-1.5 px-2 py-1 rounded-md bg-zinc-900/50 border border-zinc-800">
        <RefreshCw className={`w-3.5 h-3.5 text-zinc-500 ${value !== 'off' ? 'animate-spin-slow' : ''}`} />
        <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider hidden sm:inline-block">
          {t('autoRefresh')}
        </span>
        
        <Select value={value} onValueChange={onValueChange}>
          <SelectTrigger className="h-7 min-w-[80px] w-auto bg-transparent border-none focus:ring-0 text-xs font-mono text-zinc-300 px-2 pr-6">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-zinc-950 border-zinc-800">
            {REFRESH_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value} className="text-xs font-mono">
                {opt.value === 'off' ? t('refreshOff') : opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {value !== 'off' && (
          <div className="flex items-center gap-1.5 ml-1">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-tighter">Live</span>
          </div>
        )}
      </div>
    </div>
  );
}
