import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, User, Sparkles, AlertCircle, CheckCircle2, KeyRound } from 'lucide-react';
import { useGame } from '../context/GameContext';

interface AuthScreenProps {
  mode: 'login' | 'register';
  onSwitchMode: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  mode,
  onSwitchMode
}) => {
  const { loginUser, registerUser } = useGame();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        const res = await loginUser(email, password);
        if (!res.success) {
          setError(res.error || 'Credenciales no válidas. Por favor, revisa tus datos.');
        } else {
          setSuccessMsg('¡Bienvenido de vuelta! Cargando tu progreso guardado...');
        }
      } else {
        const res = await registerUser(email, password, name);
        if (!res.success) {
          setError(res.error || 'No se pudo crear la cuenta.');
        } else {
          setSuccessMsg('¡Cuenta creada con éxito! Iniciando tu aventura...');
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error en la autenticación.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 selection:bg-[#E05615] selection:text-white"
      style={{
        background: 'linear-gradient(135deg, #1e130c 0%, #2e1a10 40%, #4a2818 100%)'
      }}
    >
      {/* Decorative architectural silhouettes */}
      <div className="fixed bottom-0 left-0 right-0 h-40 opacity-15 pointer-events-none">
        <svg viewBox="0 0 1200 120" className="w-full h-full" preserveAspectRatio="none">
          <path 
            d="M0,120 L0,80 L40,80 L40,60 L50,40 L60,60 L80,60 L80,50 L100,50 L100,70 L140,70 L140,40 L150,20 L160,40 L180,40 L180,55 L220,55 L220,30 L240,30 L240,65 L280,65 L280,45 L290,25 L300,45 L320,45 L320,75 L360,75 L360,50 L380,50 L380,35 L390,15 L400,35 L420,35 L420,60 L460,60 L460,40 L480,40 L480,70 L520,70 L520,55 L540,55 L540,45 L550,30 L560,45 L580,45 L580,65 L620,65 L620,50 L640,50 L640,75 L680,75 L680,55 L700,55 L700,40 L710,20 L720,40 L740,40 L740,60 L780,60 L780,45 L800,45 L800,70 L840,70 L840,50 L860,50 L860,35 L870,15 L880,35 L900,35 L900,55 L940,55 L940,40 L960,40 L960,65 L1000,65 L1000,50 L1020,50 L1020,75 L1060,75 L1060,55 L1080,55 L1080,40 L1090,25 L1100,40 L1120,40 L1120,60 L1160,60 L1160,80 L1200,80 L1200,120 Z" 
            fill="#C85A3B" 
          />
        </svg>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Auth Card */}
        <div className="bg-[#FAF7F2] rounded-3xl border-4 border-[#EADFCF] shadow-2xl p-6 sm:p-8 text-[#24140E]">
          {/* Card Header & Brand Motif */}
          <div className="text-center mb-6">
            <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-gradient-to-tr from-[#E05615] to-[#F3B33D] flex items-center justify-center text-white shadow-lg shadow-orange-500/30">
              <KeyRound className="w-6 h-6" />
            </div>
            
            <p className="text-xs font-black uppercase tracking-widest text-[#E05615] mb-1">¡Aventura Española!</p>
            <h1 className="text-2xl sm:text-3xl font-black font-serif text-[#24140E] tracking-tight">
              {mode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'}
            </h1>
            <p className="text-xs sm:text-sm text-[#7D6B5E] mt-1.5 font-medium leading-relaxed">
              {mode === 'login' 
                ? 'Introduce tu correo y contraseña para retomar tu aventura exactamente donde la dejaste.' 
                : 'Crea tu cuenta para comenzar tu viaje por las ciudades de España.'}
            </p>
          </div>

          {/* Error Notice */}
          {error && (
            <div className="mb-4 p-3.5 rounded-2xl bg-rose-50 border-2 border-rose-300 text-rose-800 text-xs flex items-start space-x-2.5 animate-shake">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="font-semibold leading-relaxed">
                {error}
              </div>
            </div>
          )}

          {/* Success Notice */}
          {successMsg && (
            <div className="mb-4 p-3.5 rounded-2xl bg-emerald-50 border-2 border-emerald-300 text-emerald-800 text-xs flex items-start space-x-2.5 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="font-bold leading-relaxed">
                {successMsg}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Display Name (register only) */}
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-black text-[#524136] uppercase tracking-wider mb-1.5">
                  Nombre del Aventurero
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C7A6B]" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej. Mateo o Sofía"
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white border-2 border-[#E0D5C7] text-[#24140E] placeholder-slate-400 focus:border-[#E05615] focus:outline-none transition-colors text-sm font-semibold shadow-xs"
                  />
                </div>
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-xs font-black text-[#524136] uppercase tracking-wider mb-1.5">
                Correo Electrónico (Email)
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C7A6B]" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejemplo@aventura.es"
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white border-2 border-[#E0D5C7] text-[#24140E] placeholder-slate-400 focus:border-[#E05615] focus:outline-none transition-colors text-sm font-semibold shadow-xs"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-black text-[#524136] uppercase tracking-wider mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C7A6B]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 4 caracteres"
                  className="w-full pl-10 pr-12 py-3 rounded-2xl bg-white border-2 border-[#E0D5C7] text-[#24140E] placeholder-slate-400 focus:border-[#E05615] focus:outline-none transition-colors text-sm font-semibold shadow-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8C7A6B] hover:text-[#24140E] transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Cloud Persistence Guarantee Info Pill */}
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-400/40 text-[11px] text-[#78350F] flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
              <p>
                Tu progreso (niveles superados, estrellas, monedas y racha) se sincroniza directamente en la nube.
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#E05615] to-[#EA580C] hover:from-[#C2410C] hover:to-[#C85A3B] text-white font-black text-sm sm:text-base shadow-lg shadow-orange-500/25 transition-transform hover:scale-102 active:scale-98 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <span>Comprobando datos...</span>
              ) : mode === 'login' ? (
                <span>Iniciar Sesión y Cargar Progreso</span>
              ) : (
                <span>Crear Cuenta y Empezar</span>
              )}
            </button>
          </form>

          {/* Mode Switcher */}
          <div className="mt-6 pt-5 border-t border-[#EADFCF] text-center text-xs font-semibold text-[#7D6B5E]">
            {mode === 'login' ? '¿Aún no tienes cuenta? ' : '¿Ya tienes una cuenta registrada? '}
            <button
              type="button"
              onClick={() => {
                setError(null);
                setSuccessMsg(null);
                onSwitchMode();
              }}
              className="text-[#E05615] hover:text-[#C2410C] font-black underline transition-colors cursor-pointer ml-1"
            >
              {mode === 'login' ? 'Regístrate Aquí' : 'Inicia Sesión'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
