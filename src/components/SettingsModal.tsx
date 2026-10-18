import React, { useRef, useState } from 'react';
import { useGame } from '../context/GameContext';
import { 
  X, 
  Settings, 
  Download, 
  Upload, 
  RotateCcw, 
  User,
  BookOpen,
  HelpCircle,
  AlertTriangle,
  Bot,
  Sparkles,
  Key,
  Check,
  LogOut,
  UserCheck,
  Cloud
} from 'lucide-react';
import { getMaskedApiKey, getGeminiApiKey, setGeminiApiKey, DEFAULT_GEMINI_API_KEY } from '../services/geminiService';
import { supabaseService } from '../services/supabaseClient';

interface SettingsModalProps {
  onClose: () => void;
  onReplayTutorial?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ 
  onClose,
  onReplayTutorial 
}) => {
  const { 
    progress, 
    exportSaveFile, 
    importSaveFile, 
    resetAllProgress,
    logoutUser,
    currentUserEmail,
    setCurrentScreen 
  } = useGame();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [resetConfirm, setResetConfirm] = useState<boolean>(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [isEditingKey, setIsEditingKey] = useState<boolean>(false);
  const [apiKeyInput, setApiKeyInput] = useState<string>('');
  const [keySavedMessage, setKeySavedMessage] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await importSaveFile(file);
      setImportStatus('¡Progreso importado con éxito!');
      setTimeout(() => setImportStatus(null), 3000);
    } catch (err) {
      setImportStatus('Error: El archivo no es un progreso válido.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-lg bg-[#FAF7F2] border-2 border-[#EADFCF] rounded-3xl shadow-2xl overflow-hidden my-auto text-[#24140E]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#EADFCF] flex items-center justify-between bg-white">
          <div className="flex items-center space-x-2.5">
            <Settings className="w-5 h-5 text-[#E05615]" />
            <h2 className="text-base sm:text-lg font-black text-[#24140E] font-serif">
              Ajustes y Personalización
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-[#FAF7F2] text-[#6B584D] hover:text-[#24140E] hover:bg-[#F2ECE1] border border-[#EADFCF] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 text-left text-sm">
          {/* Account & Database Sync Card */}
          <div className="p-4 rounded-2xl bg-white border-2 border-[#E8DFD5] space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                  currentUserEmail ? 'bg-emerald-100 text-emerald-700 border border-emerald-300' : 'bg-amber-100 text-amber-700 border border-amber-300'
                }`}>
                  {currentUserEmail ? <UserCheck className="w-4 h-4" /> : <User className="w-4 h-4" />}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <p className="font-black text-[#24140E]">
                      {currentUserEmail ? 'Cuenta Registrada' : 'Modo Invitado'}
                    </p>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                      currentUserEmail ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-amber-50 text-amber-800 border-amber-300'
                    }`}>
                      {currentUserEmail ? 'Base de Datos Conectada' : 'Progreso Local'}
                    </span>
                  </div>
                  <p className="text-xs text-[#7A6B60]">
                    {currentUserEmail 
                      ? `Sincronizado con ${currentUserEmail}` 
                      : 'Tu progreso solo está en este navegador'}
                  </p>
                </div>
              </div>
            </div>

            {currentUserEmail ? (
              <button
                onClick={() => {
                  onClose();
                  logoutUser();
                }}
                className="w-full py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-black border border-rose-300 flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Cerrar Sesión ({currentUserEmail})</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  onClose();
                  setCurrentScreen('auth');
                }}
                className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-[#E05615] to-[#F3B33D] hover:from-[#C2410C] hover:to-[#E05615] text-white text-xs font-black flex items-center justify-center space-x-1.5 transition-all shadow-sm cursor-pointer"
              >
                <UserCheck className="w-4 h-4" />
                <span>Crear Cuenta o Iniciar Sesión para Guardar en la Nube</span>
              </button>
            )}
          </div>

          {/* Tutorial Quick Action */}
          {onReplayTutorial && (
            <div className="p-4 rounded-2xl bg-white border-2 border-[#E8DFD5] space-y-3 shadow-xs">
              <div>
                <p className="font-black text-[#24140E]">Guía del Viajero</p>
                <p className="text-xs text-[#7A6B60]">Vuelve a ver la guía de juego con Sofía</p>
              </div>
              <button
                onClick={() => {
                  onClose();
                  onReplayTutorial();
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-[#FAF7F2] hover:bg-[#F2ECE1] text-[#24140E] text-xs font-bold border border-[#E0D5C7] flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
              >
                <HelpCircle className="w-4 h-4 text-sky-600" />
                <span>Repetir Tutorial de Juego</span>
              </button>
            </div>
          )}

          {/* Gemini AI Companion (Camino) Configuration */}
          <div className="p-4 rounded-2xl bg-white border-2 border-emerald-300/80 space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-300 flex items-center justify-center text-base">
                  🤖
                </div>
                <div>
                  <div className="flex items-center space-x-1.5">
                    <p className="font-black text-[#24140E] text-xs sm:text-sm">Camino AI (Guía Inteligente)</p>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black border border-emerald-300">
                      Gemini 3.8 Flash
                    </span>
                  </div>
                  <p className="text-[11px] text-[#7A6B60]">Motor de conversación y aprendizaje de español activo</p>
                </div>
              </div>
              <Sparkles className="w-4 h-4 text-emerald-600" />
            </div>

            <div className="p-2.5 rounded-xl bg-[#FAF7F2] border border-[#EADFCF] flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2">
                <Key className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span className="text-[#7A6B60] text-[11px] font-bold">Clave API:</span>
                <span className="font-mono text-emerald-700 text-xs font-bold">{getMaskedApiKey()}</span>
              </div>
              <button
                onClick={() => {
                  setIsEditingKey(!isEditingKey);
                  setApiKeyInput(getGeminiApiKey());
                }}
                className="px-2.5 py-1 rounded-lg bg-white hover:bg-amber-50 text-[#24140E] text-[11px] font-bold border border-[#E0D5C7] transition-colors"
              >
                {isEditingKey ? 'Cerrar' : 'Modificar'}
              </button>
            </div>

            {isEditingKey && (
              <div className="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#EADFCF] space-y-2">
                <p className="text-[11px] text-[#524136] font-medium">
                  Introduce tu clave de API de Google Gemini:
                </p>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    placeholder="Introduce tu clave API de Gemini..."
                    className="flex-1 px-3 py-1.5 rounded-xl bg-white border border-[#E0D5C7] text-[#24140E] font-mono text-xs focus:outline-none focus:border-[#E05615]"
                  />
                  <button
                    onClick={() => {
                      setGeminiApiKey(apiKeyInput);
                      setIsEditingKey(false);
                      setKeySavedMessage('¡Clave guardada con éxito!');
                      setTimeout(() => setKeySavedMessage(null), 3000);
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center space-x-1 shadow-xs"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Guardar</span>
                  </button>
                </div>
                <button
                  onClick={() => {
                    setGeminiApiKey(null);
                    setApiKeyInput(DEFAULT_GEMINI_API_KEY);
                    setIsEditingKey(false);
                    setKeySavedMessage('¡Clave predeterminada restaurada!');
                    setTimeout(() => setKeySavedMessage(null), 3000);
                  }}
                  className="text-[10px] text-[#7A6B60] hover:text-[#E05615] underline font-bold"
                >
                  Restaurar clave predeterminada
                </button>
              </div>
            )}

            {keySavedMessage && (
              <p className="text-[11px] text-emerald-700 font-bold">{keySavedMessage}</p>
            )}
          </div>

          {/* Backup: Export / Import */}
          <div className="p-4 rounded-2xl bg-white border-2 border-[#E8DFD5] space-y-3 shadow-xs">
            <div>
              <p className="font-black text-[#24140E]">Persistencia y Copia de Seguridad</p>
              <p className="text-xs text-[#7A6B60]">Exporta tu progreso para no perder tus monedas ni niveles</p>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={exportSaveFile}
                className="flex-1 py-2 px-3 rounded-xl bg-[#FAF7F2] hover:bg-[#F2ECE1] text-[#24140E] text-xs font-bold border border-[#E0D5C7] flex items-center justify-center space-x-1.5 transition-colors"
              >
                <Download className="w-4 h-4 text-amber-500" />
                <span>Exportar Guardado</span>
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 py-2 px-3 rounded-xl bg-[#FAF7F2] hover:bg-[#F2ECE1] text-[#24140E] text-xs font-bold border border-[#E0D5C7] flex items-center justify-center space-x-1.5 transition-colors"
              >
                <Upload className="w-4 h-4 text-sky-600" />
                <span>Importar Guardado</span>
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            {importStatus && (
              <p className="text-xs text-amber-700 font-bold">{importStatus}</p>
            )}
          </div>

          {/* Reset progress */}
          <div className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-200 space-y-3">
            <div>
              <p className="font-black text-rose-950">Reiniciar Aventura</p>
              <p className="text-xs text-rose-700">Restablece todas las monedas, ciudades y niveles a su estado inicial</p>
            </div>

            {!resetConfirm ? (
              <button
                onClick={() => setResetConfirm(true)}
                className="py-2 px-4 rounded-xl bg-white hover:bg-rose-100 text-rose-700 text-xs font-black border border-rose-300 flex items-center space-x-1.5 transition-colors shadow-xs"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reiniciar Progreso</span>
              </button>
            ) : (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    resetAllProgress();
                    setResetConfirm(false);
                    onClose();
                  }}
                  className="py-1.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black shadow"
                >
                  Sí, borrar todo
                </button>
                <button
                  onClick={() => setResetConfirm(false)}
                  className="py-1.5 px-3 rounded-xl bg-white hover:bg-[#FAF7F2] text-[#6B584D] border border-[#E0D5C7] text-xs font-bold"
                >
                  Cancelar
                </button>
              </div>
            )}
          </div>

          {/* Academic Info */}
          <div className="text-[11px] text-[#7A6B60] text-center space-y-0.5 font-medium">
            <p>¡Aventura Española! Versión 1.0.0 Oficial</p>
            <p>Acreditado según el sílabo BAESP101 Spanish Level I</p>
          </div>
        </div>
      </div>
    </div>
  );
};
