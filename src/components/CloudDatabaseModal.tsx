import React, { useState, useEffect } from 'react';
import { 
  Cloud, 
  Database, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Copy, 
  Check, 
  ExternalLink, 
  ShieldCheck, 
  Zap, 
  X,
  Server
} from 'lucide-react';
import { supabaseService, SupabaseConfig } from '../services/supabaseClient';
import { authDatabaseService } from '../services/authDatabaseService';

interface CloudDatabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CloudDatabaseModal: React.FC<CloudDatabaseModalProps> = ({ isOpen, onClose }) => {
  const [config, setConfig] = useState<SupabaseConfig>(() => supabaseService.getConfig());
  const [urlInput, setUrlInput] = useState('');
  const [keyInput, setKeyInput] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    tableReady: boolean;
    latencyMs?: number;
  } | null>(null);
  
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const current = supabaseService.getConfig();
      setConfig(current);
      setUrlInput(current.url);
      setKeyInput(current.anonKey);
      setTestResult(null);
      setSyncResult(null);

      // Auto-test if already configured
      if (current.isConfigured) {
        setTesting(true);
        supabaseService.testConnection().then(res => {
          setTestResult(res);
          setTesting(false);
        });
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    setSyncResult(null);

    const res = await supabaseService.testConnection(urlInput, keyInput);
    setTestResult(res);
    setTesting(false);
  };

  const handleSaveAndConnect = async () => {
    supabaseService.saveConfig(urlInput, keyInput);
    const updated = supabaseService.getConfig();
    setConfig(updated);
    
    setTesting(true);
    const res = await supabaseService.testConnection();
    setTestResult(res);
    setTesting(false);
  };

  const handleDisconnect = () => {
    supabaseService.clearConfig();
    const updated = supabaseService.getConfig();
    setConfig(updated);
    setUrlInput('');
    setKeyInput('');
    setTestResult(null);
    setSyncResult('Modo local activado. Los datos se guardan en el almacenamiento local del navegador.');
  };

  const handleSyncToCloud = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await authDatabaseService.syncAllToCloud();
      if (res.success) {
        setSyncResult(`¡Éxito! ${res.syncedCount} cuenta(s) y partidas sincronizadas con Supabase.`);
      } else {
        setSyncResult(`Error al sincronizar: ${res.error || 'Verifica la conexión'}`);
      }
    } catch (err: any) {
      setSyncResult(`Error: ${err.message}`);
    } finally {
      setSyncing(false);
    }
  };

  const sqlCode = `-- ¡Aventura Española! Supabase Schema
create table if not exists public.player_progress (
  id text primary key,
  email text unique not null,
  display_name text not null default 'Viajero',
  password_hash text not null,
  progress jsonb not null default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists player_progress_email_idx on public.player_progress (lower(email));
alter table public.player_progress enable row level security;

create policy "Allow game anon select" on public.player_progress for select using (true);
create policy "Allow game anon insert" on public.player_progress for insert with check (true);
create policy "Allow game anon update" on public.player_progress for update using (true);`;

  const handleCopySql = () => {
    navigator.clipboard.writeText(sqlCode);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-xl max-h-[90vh] flex flex-col bg-[#FAF7F2] rounded-3xl border-3 border-[#24140E] shadow-[0_12px_0_0_#24140E] overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 bg-[#24140E] text-[#FAF7F2] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#E05615] flex items-center justify-center border-2 border-white/20 shadow-inner">
              <Cloud className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-wide flex items-center gap-2">
                Base de Datos en la Nube
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#3ECF8E] text-[#0A1A12] font-black uppercase">
                  Supabase
                </span>
              </h2>
              <p className="text-xs text-[#E8DCC4]">Sincronización remota para jugar desde cualquier dispositivo</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content body */}
        <div className="p-6 overflow-y-auto space-y-5">
          
          {/* Status banner */}
          <div className={`p-4 rounded-2xl border-2 flex items-start gap-3.5 transition-all ${
            config.isConfigured && testResult?.success && testResult?.tableReady
              ? 'bg-[#EBF7EE] border-[#3ECF8E] text-[#14532D]'
              : config.isConfigured && testResult?.success && !testResult?.tableReady
              ? 'bg-[#FEFCE8] border-[#EAB308] text-[#854D0E]'
              : config.isConfigured
              ? 'bg-[#FEF2F2] border-[#EF4444] text-[#991B1B]'
              : 'bg-[#FFF7ED] border-[#FDBA74] text-[#9A3412]'
          }`}>
            {config.isConfigured && testResult?.success && testResult?.tableReady ? (
              <CheckCircle2 className="w-6 h-6 text-[#16A34A] flex-shrink-0 mt-0.5" />
            ) : config.isConfigured && testResult?.success && !testResult?.tableReady ? (
              <AlertCircle className="w-6 h-6 text-[#CA8A04] flex-shrink-0 mt-0.5" />
            ) : (
              <Server className="w-6 h-6 text-[#EA580C] flex-shrink-0 mt-0.5" />
            )}
            
            <div className="flex-1 text-sm">
              <div className="font-bold flex items-center gap-2">
                {config.isConfigured ? 'Conexión a Supabase Activa' : 'Modo Base de Datos Local'}
                {config.source === 'env' && (
                  <span className="text-[10px] bg-black/10 px-2 py-0.5 rounded-full uppercase">Configurado vía .env</span>
                )}
                {config.source === 'storage' && (
                  <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full uppercase">Guardado en App</span>
                )}
              </div>
              <p className="text-xs mt-1 opacity-90">
                {testResult 
                  ? testResult.message 
                  : config.isConfigured 
                  ? 'Verificando estado de la conexión...' 
                  : 'Tus partidas se guardan localmente en tu navegador. Conecta Supabase para sincronizar partidas entre tu móvil, tablet y PC.'}
              </p>
              {testResult?.latencyMs && (
                <div className="mt-1 flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700">
                  <Zap className="w-3.5 h-3.5" /> Latencia de consulta: {testResult.latencyMs} ms
                </div>
              )}
            </div>
          </div>

          {/* Connection form */}
          <div className="bg-white p-5 rounded-2xl border-2 border-[#24140E]/15 shadow-sm space-y-4">
            <h3 className="text-sm font-black text-[#24140E] uppercase tracking-wider flex items-center gap-2">
              <Database className="w-4 h-4 text-[#E05615]" /> Credenciales de tu Proyecto Supabase
            </h3>

            <div>
              <label className="block text-xs font-bold text-[#24140E] mb-1">
                Project URL (URL del Proyecto)
              </label>
              <input
                type="text"
                placeholder="https://xyzabcdefghijklmno.supabase.co"
                value={urlInput}
                onChange={e => setUrlInput(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border-2 border-[#24140E]/20 text-xs font-mono focus:border-[#E05615] focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#24140E] mb-1">
                Anon Public Key (Clave Pública Anónima)
              </label>
              <input
                type="password"
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                value={keyInput}
                onChange={e => setKeyInput(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border-2 border-[#24140E]/20 text-xs font-mono focus:border-[#E05615] focus:outline-none transition-colors"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleSaveAndConnect}
                disabled={testing || !urlInput.trim() || !keyInput.trim()}
                className="flex-1 min-w-[140px] px-4 py-2.5 bg-[#3ECF8E] hover:bg-[#34b77c] disabled:opacity-50 text-[#072416] font-black text-xs rounded-xl border-2 border-[#0A1A12] shadow-[0_2px_0_0_#0A1A12] flex items-center justify-center gap-2 transition-transform active:translate-y-0.5 cursor-pointer"
              >
                {testing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                Guardar y Conectar
              </button>

              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testing || !urlInput.trim() || !keyInput.trim()}
                className="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 disabled:opacity-50 text-stone-800 font-bold text-xs rounded-xl border-2 border-[#24140E]/30 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {testing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5 text-amber-600" />}
                Probar Ping
              </button>

              {config.isConfigured && (
                <button
                  type="button"
                  onClick={handleDisconnect}
                  className="px-3 py-2.5 text-xs text-red-600 hover:bg-red-50 font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Desconectar
                </button>
              )}
            </div>
          </div>

          {/* Sync Local Data to Cloud */}
          {config.isConfigured && (
            <div className="bg-[#FAF0E6] p-4 rounded-2xl border-2 border-[#E05615]/30 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-black text-[#24140E] uppercase tracking-wider">
                    Sincronización Manual
                  </h4>
                  <p className="text-[11px] text-[#664229]">
                    Sube las cuentas y el progreso local acumulado a tu base de datos remota.
                  </p>
                </div>
                <button
                  onClick={handleSyncToCloud}
                  disabled={syncing}
                  className="px-3 py-2 bg-[#E05615] hover:bg-[#c94a10] disabled:opacity-50 text-white font-black text-xs rounded-xl border-2 border-[#24140E] shadow-[0_2px_0_0_#24140E] flex items-center gap-1.5 cursor-pointer transition-transform active:translate-y-0.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
                  {syncing ? 'Sincronizando...' : 'Sincronizar Ya'}
                </button>
              </div>

              {syncResult && (
                <div className="text-xs p-2.5 rounded-lg bg-white/80 border border-[#24140E]/20 text-[#24140E] font-medium">
                  {syncResult}
                </div>
              )}
            </div>
          )}

          {/* Setup Instructions & SQL Copy */}
          <div className="bg-white p-4 rounded-2xl border-2 border-[#24140E]/15 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black text-[#24140E] uppercase tracking-wider flex items-center gap-2">
                <span>¿Primera vez? Script SQL para Supabase</span>
              </h4>
              <button
                type="button"
                onClick={handleCopySql}
                className="px-3 py-1.5 bg-[#FAF7F2] hover:bg-[#F0EBE1] text-[#24140E] font-bold text-xs rounded-lg border border-[#24140E]/30 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {copiedSql ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedSql ? '¡Copiado!' : 'Copiar SQL'}
              </button>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed">
              1. Ve a <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="text-[#E05615] font-bold underline inline-flex items-center gap-0.5">Supabase Dashboard <ExternalLink className="w-2.5 h-2.5" /></a>.<br/>
              2. Abre tu proyecto y entra en el menú <strong>SQL Editor</strong>.<br/>
              3. Pega y ejecuta el script para crear la tabla <code className="bg-stone-100 px-1 py-0.5 rounded text-[11px] font-mono">player_progress</code>.<br/>
              4. Obtén tu URL y clave en <strong>Project Settings → API</strong>.
            </p>

            <pre className="text-[10px] p-2.5 bg-stone-900 text-stone-200 rounded-xl overflow-x-auto font-mono max-h-24">
              {sqlCode}
            </pre>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-[#F0EBE1] border-t-2 border-[#24140E]/15 flex items-center justify-between text-xs text-stone-600">
          <div className="flex items-center gap-2 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Contraseñas cifradas con SHA-256 + Salt
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#24140E] hover:bg-[#3D2319] text-[#FAF7F2] font-black rounded-xl transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};
