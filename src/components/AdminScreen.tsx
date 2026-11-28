import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  City, 
  Level, 
  Question, 
  QuestionType, 
  DifficultyTier 
} from '../types';
import { 
  isAdminAuthenticated, 
  authenticateAdmin, 
  loginAdminServer,
  verifyAdminSessionServer,
  logoutAdmin, 
  getLockoutRemainingSeconds,
  getAdminEmail
} from '../services/adminAuthService';
import { 
  getActiveCurriculum, 
  isCustomCurriculumActive, 
  saveQuestion, 
  deleteQuestion, 
  saveLevel, 
  deleteLevel, 
  resetCurriculumToDefault, 
  exportCurriculumJson, 
  importCurriculumJson,
  sanitizeText,
  validateQuestion,
  validateLevel,
  syncCurriculumToCloud
} from '../services/adminCurriculumService';
import { 
  Shield, 
  Lock, 
  Key, 
  LogOut, 
  ArrowLeft, 
  Plus, 
  Edit3, 
  Trash2, 
  RotateCcw, 
  Download, 
  Upload, 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  Volume2, 
  HelpCircle, 
  BookOpen, 
  Sparkles,
  Layers,
  Database,
  Eye,
  X,
  FileCode,
  Check
} from 'lucide-react';

interface AdminScreenProps {
  onBackToGame: () => void;
  initialScreen?: 'admin-login' | 'admin-dashboard' | 'admin';
}

export const AdminScreen: React.FC<AdminScreenProps> = ({ onBackToGame, initialScreen }) => {
  // Auth state — always verify with server before unlocking dashboard UI
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [emailInput, setEmailInput] = useState<string>('admin@aventura.es');
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSubmittingAuth, setIsSubmittingAuth] = useState<boolean>(false);
  const [lockoutSeconds, setLockoutSeconds] = useState<number>(getLockoutRemainingSeconds());

  // Check server session validity on mount
  useEffect(() => {
    let isMounted = true;
    verifyAdminSessionServer().then((valid) => {
      if (!isMounted) return;
      setIsAuthenticated(valid);
      if (!valid && initialScreen === 'admin-dashboard') {
        setAuthError('Invalid credentials or insufficient privileges.');
        if (typeof window !== 'undefined' && window.location.pathname !== '/admin/login') {
          window.history.replaceState(null, '', '/admin/login');
        }
      } else if (valid && typeof window !== 'undefined' && window.location.pathname !== '/admin/dashboard') {
        window.history.replaceState(null, '', '/admin/dashboard');
      }
    });
    return () => { isMounted = false; };
  }, [initialScreen]);

  // Keep route pathname in sync with authentication state
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (isAuthenticated) {
      if (window.location.pathname !== '/admin/dashboard') {
        window.history.replaceState(null, '', '/admin/dashboard');
      }
    } else {
      if (window.location.pathname !== '/admin/login') {
        window.history.replaceState(null, '', '/admin/login');
      }
    }
  }, [isAuthenticated]);

  // Navigation tab
  const [activeTab, setActiveTab] = useState<'questions' | 'levels' | 'tester' | 'security'>('questions');

  // Curriculum data
  const [cities, setCities] = useState<City[]>(getActiveCurriculum());
  const [selectedCityId, setSelectedCityId] = useState<string>('madrid');
  const [selectedLevelId, setSelectedLevelId] = useState<string>('madrid-1');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [hasCustomEdits, setHasCustomEdits] = useState<boolean>(isCustomCurriculumActive());

  // Modals & form state
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [isNewQuestion, setIsNewQuestion] = useState<boolean>(false);
  const [questionFormErrors, setQuestionFormErrors] = useState<string[]>([]);

  const [editingLevel, setEditingLevel] = useState<Level | null>(null);
  const [isNewLevel, setIsNewLevel] = useState<boolean>(false);
  const [levelFormErrors, setLevelFormErrors] = useState<string[]>([]);

  const [confirmResetOpen, setConfirmResetOpen] = useState<boolean>(false);
  const [isPublishingLive, setIsPublishingLive] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Question Tester state
  const [testingQuestionId, setTestingQuestionId] = useState<string | null>(null);
  const [testerAnswer, setTesterAnswer] = useState<string>('');
  const [testerResult, setTesterResult] = useState<{ correct: boolean; message: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Lockout countdown timer
  useEffect(() => {
    if (lockoutSeconds <= 0) return;
    const interval = setInterval(() => {
      setLockoutSeconds(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setAuthError(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutSeconds]);

  // Flash notification timer
  useEffect(() => {
    if (!notification) return;
    const timer = setTimeout(() => setNotification(null), 4000);
    return () => clearTimeout(timer);
  }, [notification]);

  // Refresh active curriculum
  const refreshCurriculum = () => {
    const fresh = getActiveCurriculum();
    setCities([...fresh]);
    setHasCustomEdits(isCustomCurriculumActive());
  };

  const selectedCity = useMemo(() => {
    return cities.find(c => c.id === selectedCityId) || cities[0];
  }, [cities, selectedCityId]);

  const selectedLevel = useMemo(() => {
    if (!selectedCity) return null;
    return selectedCity.levels.find(l => l.id === selectedLevelId) || selectedCity.levels[0] || null;
  }, [selectedCity, selectedLevelId]);

  // Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingAuth(true);
    setAuthError(null);

    const result = await loginAdminServer(emailInput, passwordInput);
    setIsSubmittingAuth(false);

    if (result.success) {
      setIsAuthenticated(true);
      setPasswordInput('');
      if (typeof window !== 'undefined') {
        window.history.replaceState(null, '', '/admin/dashboard');
      }
      refreshCurriculum();
    } else {
      setAuthError(result.error || 'Invalid credentials or insufficient privileges.');
      if (result.remainingSeconds) {
        setLockoutSeconds(result.remainingSeconds);
      }
    }
  };

  // Handle Logout
  const handleLogout = async () => {
    try {
      if (typeof window !== 'undefined') {
        await fetch('/api/admin/logout', { method: 'POST', credentials: 'include' });
      }
    } catch {
      // ignore
    }
    logoutAdmin();
    setIsAuthenticated(false);
    setPasswordInput('');
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', '/admin/login');
    }
  };

  // Handle Revert to Factory Defaults
  const handleResetToDefaults = () => {
    resetCurriculumToDefault();
    refreshCurriculum();
    setConfirmResetOpen(false);
    setNotification({
      message: '✓ Currículo restablecido a los valores oficiales de fábrica.',
      type: 'success'
    });
  };

  // Handle Publish Live to Cloud
  const handlePublishLive = async () => {
    setIsPublishingLive(true);
    const res = await syncCurriculumToCloud(getActiveCurriculum());
    setIsPublishingLive(false);
    if (res.success) {
      setNotification({
        message: '✓ Published live! All users will now see your updated curriculum.',
        type: 'success'
      });
    } else {
      setNotification({
        message: `Cloud sync failed: ${res.error || 'Unknown error'}`,
        type: 'error'
      });
    }
  };

  // Handle Export JSON
  const handleExportJson = () => {
    const jsonStr = exportCurriculumJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aventura_curriculo_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setNotification({
      message: '✓ Copia de seguridad del currículo descargada con éxito.',
      type: 'success'
    });
  };

  // Handle Import JSON
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = importCurriculumJson(content);
      if (res.success) {
        refreshCurriculum();
        setNotification({
          message: '✓ Currículo importado y validado correctamente.',
          type: 'success'
        });
      } else {
        setNotification({
          message: res.error || 'Error al importar currículo.',
          type: 'error'
        });
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Speech synthesis for Spanish testing
  const speakSpanish = (text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'es-ES';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Filtered questions
  const filteredQuestions = useMemo(() => {
    if (!selectedLevel) return [];
    let list = selectedLevel.questions;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(item => 
        item.prompt.toLowerCase().includes(q) ||
        (item.englishPrompt && item.englishPrompt.toLowerCase().includes(q)) ||
        (typeof item.correctAnswer === 'string' && item.correctAnswer.toLowerCase().includes(q)) ||
        item.explanation.toLowerCase().includes(q)
      );
    }
    return list;
  }, [selectedLevel, searchQuery]);

  // Save Question Action
  const handleSaveQuestionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuestion || !selectedCity || !selectedLevel) return;

    const validation = validateQuestion(editingQuestion);
    if (!validation.valid) {
      setQuestionFormErrors(validation.errors);
      return;
    }

    const saveRes = saveQuestion(selectedCity.id, selectedLevel.id, editingQuestion);
    if (saveRes.valid) {
      refreshCurriculum();
      setEditingQuestion(null);
      setQuestionFormErrors([]);
      setNotification({
        message: isNewQuestion ? '✓ Nueva pregunta añadida correctamente.' : '✓ Pregunta actualizada con éxito.',
        type: 'success'
      });
    } else {
      setQuestionFormErrors(saveRes.errors);
    }
  };

  // Delete Question Action
  const handleDeleteQuestion = (questionId: string) => {
    if (!selectedCity || !selectedLevel) return;
    if (window.confirm('¿Estás seguro de eliminar esta pregunta?')) {
      const ok = deleteQuestion(selectedCity.id, selectedLevel.id, questionId);
      if (ok) {
        refreshCurriculum();
        setNotification({ message: '✓ Pregunta eliminada.', type: 'info' });
      }
    }
  };

  // Save Level Action
  const handleSaveLevelSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLevel || !selectedCity) return;

    const validation = validateLevel(editingLevel);
    if (!validation.valid) {
      setLevelFormErrors(validation.errors);
      return;
    }

    const saveRes = saveLevel(selectedCity.id, editingLevel);
    if (saveRes.valid) {
      refreshCurriculum();
      setSelectedLevelId(editingLevel.id);
      setEditingLevel(null);
      setLevelFormErrors([]);
      setNotification({
        message: isNewLevel ? '✓ Nuevo nivel creado con éxito.' : '✓ Nivel actualizado correctamente.',
        type: 'success'
      });
    } else {
      setLevelFormErrors(saveRes.errors);
    }
  };

  // Delete Level Action
  const handleDeleteLevel = (levelId: string) => {
    if (!selectedCity) return;
    if (selectedCity.levels.length <= 1) {
      alert('Una ciudad debe tener al menos un nivel.');
      return;
    }
    if (window.confirm('¿Estás seguro de eliminar este nivel y todas sus preguntas?')) {
      const ok = deleteLevel(selectedCity.id, levelId);
      if (ok) {
        refreshCurriculum();
        const firstRemaining = selectedCity.levels.find(l => l.id !== levelId);
        if (firstRemaining) setSelectedLevelId(firstRemaining.id);
        setNotification({ message: '✓ Nivel eliminado.', type: 'info' });
      }
    }
  };

  /* =========================================================================
     RENDER: AUTHENTICATION GATE (IF NOT AUTHENTICATED)
     ========================================================================= */
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] text-[#24140E] flex flex-col justify-center items-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl border border-[#E0D5C7] shadow-xl p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-[#E05615]/10 rounded-2xl flex items-center justify-center mx-auto text-[#E05615] border border-[#E05615]/20 shadow-xs">
              <Shield className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-black font-serif text-[#24140E]">
              Portal de Administración
            </h1>
            <p className="text-xs text-[#7A6B60] leading-relaxed">
              Gestión segura del currículo A1, preguntas, respuestas y niveles de ¡Aventura Española!.
            </p>
          </div>

          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-start space-x-2">
            <Lock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div className="leading-tight">
              <strong>Protección Criptográfica Activa:</strong> Acceso restringido a administradores verificados. Las sesiones expiran automáticamente al cerrar la pestaña.
            </div>
          </div>

          {authError && (
            <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-xs text-rose-800 flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#4A3B32] mb-1">
                Correo Electrónico de Administrador
              </label>
              <input
                type="email"
                required
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                disabled={lockoutSeconds > 0 || isSubmittingAuth}
                placeholder="admin@aventura.es"
                className="w-full px-4 py-2.5 rounded-xl border border-[#D5C7B5] bg-[#FAF7F2] text-sm focus:outline-none focus:ring-2 focus:ring-[#E05615]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#4A3B32] mb-1">
                Contraseña Secreta de Administrador
              </label>
              <input
                type="password"
                required
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                disabled={lockoutSeconds > 0 || isSubmittingAuth}
                placeholder="••••••••••••"
                className="w-full px-4 py-2.5 rounded-xl border border-[#D5C7B5] bg-[#FAF7F2] text-sm focus:outline-none focus:ring-2 focus:ring-[#E05615]"
              />
            </div>

            <button
              type="submit"
              disabled={lockoutSeconds > 0 || isSubmittingAuth}
              className="w-full py-3 bg-[#E05615] hover:bg-[#C2410C] text-white rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
            >
              <Key className="w-4 h-4" />
              <span>
                {lockoutSeconds > 0 
                  ? `Bloqueado (${lockoutSeconds}s)` 
                  : isSubmittingAuth 
                  ? 'Verifying...' 
                  : 'Sign In to Admin Panel'}
              </span>
            </button>
          </form>

          <div className="pt-2 border-t border-[#EFE5D8] flex items-center justify-between">
            <button
              onClick={onBackToGame}
              className="text-xs text-[#7A6B60] hover:text-[#24140E] font-bold flex items-center space-x-1 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Game</span>
            </button>

            <span className="text-[10px] text-[#A89A8E]">
              SHA-256 + Salt • RLS Hardened
            </span>
          </div>
        </div>
      </div>
    );
  }

  /* =========================================================================
     RENDER: AUTHENTICATED ADMIN DASHBOARD
     ========================================================================= */
  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#24140E] flex flex-col font-sans">
      {/* Hidden File Input for JSON Import */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleImportFile} 
        accept=".json,application/json" 
        className="hidden" 
      />

      {/* Floating Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-2xl shadow-lg border text-sm font-bold flex items-center space-x-2 transition-all ${
          notification.type === 'success' ? 'bg-emerald-50 text-emerald-900 border-emerald-300' :
          notification.type === 'error' ? 'bg-rose-50 text-rose-900 border-rose-300' :
          'bg-amber-50 text-amber-900 border-amber-300'
        }`}>
          {notification.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4" />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Header Bar */}
      <header className="bg-white border-b border-[#E0D5C7] sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-[#E05615] text-white flex items-center justify-center shadow-xs">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="font-serif font-black text-base sm:text-lg text-[#24140E] leading-tight">
                  Panel de Administración
                </h1>
                {hasCustomEdits ? (
                  <span className="bg-amber-100 text-amber-900 text-[10px] font-black px-2 py-0.5 rounded-full border border-amber-300 flex items-center space-x-1">
                    <span>⚠️</span>
                    <span>Modificaciones Activas</span>
                  </span>
                ) : (
                  <span className="bg-emerald-100 text-emerald-900 text-[10px] font-black px-2 py-0.5 rounded-full border border-emerald-300 flex items-center space-x-1">
                    <span>✓</span>
                    <span>Currículo Oficial Fábrica</span>
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[#7A6B60]">
                Sesión: <span className="font-semibold text-[#24140E]">{getAdminEmail()}</span> • Acceso Protegido
              </p>
            </div>
          </div>

          {/* Quick Action Toolbar */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePublishLive}
              disabled={isPublishingLive}
              className="px-3 py-1.5 rounded-xl bg-[#E05615] hover:bg-[#c8490e] text-white text-xs font-bold flex items-center space-x-1.5 transition cursor-pointer disabled:opacity-60 shadow-xs"
              title="Publish current curriculum changes live to all users"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{isPublishingLive ? 'Publishing...' : 'Publish Live'}</span>
            </button>

            <button
              onClick={() => setConfirmResetOpen(true)}
              className="px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50/70 hover:bg-rose-100 text-rose-800 text-xs font-bold flex items-center space-x-1.5 transition cursor-pointer"
              title="Reset all curriculum to factory defaults"
            >
              <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
              <span className="hidden sm:inline">Reset to Defaults</span>
            </button>

            <button
              onClick={handleExportJson}
              className="px-3 py-1.5 rounded-xl border border-[#D5C7B5] bg-white hover:bg-[#F2ECE1] text-[#24140E] text-xs font-bold flex items-center space-x-1.5 transition cursor-pointer"
              title="Download JSON backup"
            >
              <Download className="w-3.5 h-3.5 text-[#E05615]" />
              <span className="hidden sm:inline">Export JSON</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 rounded-xl border border-[#D5C7B5] bg-white hover:bg-[#F2ECE1] text-[#24140E] text-xs font-bold flex items-center space-x-1.5 transition cursor-pointer"
              title="Upload JSON backup"
            >
              <Upload className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden sm:inline">Import JSON</span>
            </button>

            <div className="h-6 w-px bg-[#E0D5C7] mx-1" />

            <button
              onClick={onBackToGame}
              className="px-3.5 py-1.5 rounded-xl bg-[#E05615] hover:bg-[#C2410C] text-white text-xs font-bold flex items-center space-x-1.5 shadow-xs transition cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Test in Game</span>
            </button>

            <button
              onClick={handleLogout}
              className="p-1.5 rounded-xl border border-[#D5C7B5] bg-white hover:bg-rose-50 text-rose-600 transition cursor-pointer"
              title="Sign Out of Admin Panel"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex space-x-1 overflow-x-auto border-t border-[#F2ECE1]">
          <button
            onClick={() => setActiveTab('questions')}
            className={`px-4 py-2.5 text-xs font-bold flex items-center space-x-2 border-b-2 transition cursor-pointer ${
              activeTab === 'questions'
                ? 'border-[#E05615] text-[#E05615] bg-[#FAF7F2]/60'
                : 'border-transparent text-[#6B584D] hover:text-[#24140E]'
            }`}
          >
            <Edit3 className="w-4 h-4" />
            <span>Question Manager ({selectedLevel?.questions.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab('levels')}
            className={`px-4 py-2.5 text-xs font-bold flex items-center space-x-2 border-b-2 transition cursor-pointer ${
              activeTab === 'levels'
                ? 'border-[#E05615] text-[#E05615] bg-[#FAF7F2]/60'
                : 'border-transparent text-[#6B584D] hover:text-[#24140E]'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>City Levels ({selectedCity?.levels.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab('tester')}
            className={`px-4 py-2.5 text-xs font-bold flex items-center space-x-2 border-b-2 transition cursor-pointer ${
              activeTab === 'tester'
                ? 'border-[#E05615] text-[#E05615] bg-[#FAF7F2]/60'
                : 'border-transparent text-[#6B584D] hover:text-[#24140E]'
            }`}
          >
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span>Interactive Tester</span>
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`px-4 py-2.5 text-xs font-bold flex items-center space-x-2 border-b-2 transition cursor-pointer ${
              activeTab === 'security'
                ? 'border-[#E05615] text-[#E05615] bg-[#FAF7F2]/60'
                : 'border-transparent text-[#6B584D] hover:text-[#24140E]'
            }`}
          >
            <Database className="w-4 h-4 text-emerald-600" />
            <span>Security & RLS Policies</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 w-full grow">
        {/* =================================================================
           TAB 1: GESTIÓN DE PREGUNTAS Y RESPUESTAS
           ================================================================= */}
        {activeTab === 'questions' && (
          <div className="space-y-6">
            {/* Top Selector Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 bg-white p-4 rounded-2xl border border-[#E0D5C7] shadow-xs">
              <div className="sm:col-span-4">
                <label className="block text-[11px] font-bold text-[#6B584D] mb-1">
                  1. Seleccionar Ciudad (Módulo 1 a 5)
                </label>
                <select
                  value={selectedCityId}
                  onChange={(e) => {
                    setSelectedCityId(e.target.value);
                    const targetCity = cities.find(c => c.id === e.target.value);
                    if (targetCity && targetCity.levels.length > 0) {
                      setSelectedLevelId(targetCity.levels[0].id);
                    }
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-[#D5C7B5] bg-[#FAF7F2] text-xs font-bold text-[#24140E] focus:outline-none focus:ring-2 focus:ring-[#E05615]"
                >
                  {cities.map((c) => (
                    <option key={c.id} value={c.id}>
                      #{c.number} {c.name} ({c.region}) — Módulo {c.moduleIndex}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-5">
                <label className="block text-[11px] font-bold text-[#6B584D] mb-1">
                  2. Seleccionar Nivel del Sílabo
                </label>
                <select
                  value={selectedLevelId}
                  onChange={(e) => setSelectedLevelId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#D5C7B5] bg-[#FAF7F2] text-xs font-bold text-[#24140E] focus:outline-none focus:ring-2 focus:ring-[#E05615]"
                >
                  {selectedCity?.levels.map((lvl) => (
                    <option key={lvl.id} value={lvl.id}>
                      Nivel {lvl.levelNumber}: {lvl.title} [{lvl.syllabusTopic}] ({lvl.questions.length} preguntas)
                    </option>
                  ))}
                  {selectedCity?.bossMission && (
                    <option value="boss">
                      👑 Misión de Jefe: {selectedCity.bossMission.title} ({selectedCity.bossMission.questions.length} preguntas)
                    </option>
                  )}
                </select>
              </div>

              <div className="sm:col-span-3 flex items-end">
                <button
                  onClick={() => {
                    setIsNewQuestion(true);
                    setEditingQuestion({
                      id: `${selectedCity.id}-${selectedLevelId}-q${Date.now().toString().slice(-4)}`,
                      type: 'multiple-choice',
                      prompt: '',
                      englishPrompt: '',
                      audioText: '',
                      options: ['', '', '', ''],
                      correctAnswer: '',
                      explanation: '',
                      englishExplanation: '',
                      hints: [''],
                      syllabusRef: selectedLevel?.syllabusTopic || 'M1.General',
                      difficulty: selectedLevel?.tier || 'easy'
                    });
                    setQuestionFormErrors([]);
                  }}
                  className="w-full py-2 bg-[#E05615] hover:bg-[#C2410C] text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 shadow-xs transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Question</span>
                </button>
              </div>
            </div>

            {/* Level Information Banner */}
            {selectedLevel && (
              <div className="bg-[#FAF7F2] border border-[#E0D5C7] rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center space-x-2">
                    <span className="font-serif font-black text-sm text-[#24140E]">
                      {selectedLevel.title}
                    </span>
                    <span className="bg-orange-100 text-[#C2410C] text-[10px] font-bold px-2 py-0.5 rounded-md uppercase">
                      {selectedLevel.tier}
                    </span>
                  </div>
                  <p className="text-xs text-[#7A6B60]">
                    Sílabo A1: <strong className="text-[#24140E]">{selectedLevel.syllabusTopic}</strong> • Recompensa: {selectedLevel.xpReward} XP
                  </p>
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 text-[#A89A8E] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar preguntas o respuestas..."
                    className="w-full pl-8 pr-3 py-1.5 bg-white border border-[#D5C7B5] rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[#E05615]"
                  />
                </div>
              </div>
            )}

            {/* Questions List */}
            <div className="space-y-3">
              {filteredQuestions.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-[#D5C7B5] space-y-2">
                  <p className="text-sm font-bold text-[#7A6B60]">No hay preguntas en este nivel.</p>
                  <p className="text-xs text-[#A89A8E]">Pulsa en "Añadir Pregunta" para crear la primera.</p>
                </div>
              ) : (
                filteredQuestions.map((q, idx) => (
                  <div 
                    key={q.id}
                    className="bg-white rounded-2xl border border-[#E0D5C7] p-4 shadow-xs hover:border-[#E05615]/50 transition-all space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="w-6 h-6 rounded-lg bg-[#FAF7F2] border border-[#E0D5C7] flex items-center justify-center font-bold text-xs text-[#6B584D]">
                            {idx + 1}
                          </span>
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200 uppercase">
                            {q.type}
                          </span>
                          <span className="text-[10px] text-[#A89A8E] font-mono">
                            ID: {q.id}
                          </span>
                        </div>

                        <div className="pt-1">
                          <h4 className="font-bold text-sm text-[#24140E] flex items-center space-x-2">
                            <span>{q.prompt}</span>
                            {q.audioText && (
                              <button 
                                onClick={() => speakSpanish(q.audioText || q.prompt)}
                                title="Escuchar pronunciación"
                                className="p-1 rounded-md text-[#E05615] hover:bg-orange-50 transition cursor-pointer"
                              >
                                <Volume2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </h4>
                          {q.englishPrompt && (
                            <p className="text-xs text-[#7A6B60] italic">
                              "{q.englishPrompt}"
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center space-x-1.5 shrink-0">
                        <button
                          onClick={() => {
                            setTestingQuestionId(q.id);
                            setTesterAnswer('');
                            setTesterResult(null);
                            setActiveTab('tester');
                          }}
                          className="p-1.5 rounded-lg border border-[#D5C7B5] bg-[#FAF7F2] hover:bg-purple-50 text-purple-700 transition cursor-pointer"
                          title="Probar en el probador interactivo"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => {
                            setIsNewQuestion(false);
                            setEditingQuestion(JSON.parse(JSON.stringify(q)));
                            setQuestionFormErrors([]);
                          }}
                          className="p-1.5 rounded-lg border border-[#D5C7B5] bg-white hover:bg-amber-50 text-amber-700 transition cursor-pointer"
                          title="Editar pregunta"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleDeleteQuestion(q.id)}
                          className="p-1.5 rounded-lg border border-rose-200 bg-white hover:bg-rose-50 text-rose-600 transition cursor-pointer"
                          title="Eliminar pregunta"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Options Grid */}
                    {q.options && q.options.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        {q.options.map((opt, optIdx) => {
                          const isCorrect = Array.isArray(q.correctAnswer)
                            ? q.correctAnswer.includes(opt)
                            : q.correctAnswer === opt;
                          return (
                            <div 
                              key={optIdx}
                              className={`px-3 py-1.5 rounded-xl border text-xs flex items-center justify-between ${
                                isCorrect 
                                  ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-bold' 
                                  : 'bg-[#FAF7F2] border-[#EADFCF] text-[#4A3B32]'
                              }`}
                            >
                              <span>{opt}</span>
                              {isCorrect && (
                                <span className="text-[10px] text-emerald-700 font-extrabold flex items-center space-x-1">
                                  <Check className="w-3 h-3" />
                                  <span>CORRECTA</span>
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Non multiple choice correct answer */}
                    {(!q.options || q.options.length === 0) && (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 text-xs text-emerald-950">
                        <strong>Respuesta Correcta: </strong>
                        <span>{Array.isArray(q.correctAnswer) ? q.correctAnswer.join(' | ') : q.correctAnswer}</span>
                      </div>
                    )}

                    {/* Pedagogical Explanation Preview */}
                    <div className="bg-[#FAF7F2] rounded-xl p-2.5 text-xs text-[#52443B] space-y-0.5 border border-[#EFE5D8]">
                      <div>
                        <strong>💡 Explicación: </strong>
                        <span>{q.explanation}</span>
                      </div>
                      {q.englishExplanation && (
                        <div className="text-[11px] text-[#7A6B60]">
                          <strong>Regla de Gramática: </strong>
                          <span>{q.englishExplanation}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* =================================================================
           TAB 2: GESTIÓN DE NIVELES POR CIUDAD
           ================================================================= */}
        {activeTab === 'levels' && selectedCity && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-[#E0D5C7] shadow-xs">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{selectedCity.landmark}</span>
                <div>
                  <h3 className="font-serif font-black text-lg text-[#24140E]">
                    Niveles de {selectedCity.name}
                  </h3>
                  <p className="text-xs text-[#7A6B60]">
                    Región: {selectedCity.region} • Módulo {selectedCity.moduleIndex} ({selectedCity.moduleName})
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  const nextNum = selectedCity.levels.length + 1;
                  setIsNewLevel(true);
                  setEditingLevel({
                    id: `${selectedCity.id}-lvl-${nextNum}`,
                    cityId: selectedCity.id,
                    levelNumber: nextNum,
                    title: `Nivel ${nextNum}: Nuevo Desafío`,
                    subtitle: 'Vocabulario y gramática práctica',
                    tier: 'easy',
                    syllabusTopic: 'A1 Práctica',
                    description: 'Descripción del nuevo nivel.',
                    questions: [],
                    xpReward: 50,
                    coinReward: 50
                  });
                  setLevelFormErrors([]);
                }}
                className="px-4 py-2 bg-[#E05615] hover:bg-[#C2410C] text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-xs transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Level</span>
              </button>
            </div>

            {/* Level Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {selectedCity.levels.map((lvl) => (
                <div 
                  key={lvl.id}
                  className="bg-white rounded-2xl border border-[#E0D5C7] p-5 shadow-xs hover:border-[#E05615]/50 transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-[#C2410C] bg-orange-50 px-2 py-0.5 rounded-md border border-orange-200">
                          Nivel {lvl.levelNumber} • {lvl.tier}
                        </span>
                        <h4 className="font-serif font-black text-base text-[#24140E] mt-1">
                          {lvl.title}
                        </h4>
                        <p className="text-xs text-[#7A6B60] italic">
                          {lvl.subtitle}
                        </p>
                      </div>

                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => {
                            setIsNewLevel(false);
                            setEditingLevel(JSON.parse(JSON.stringify(lvl)));
                            setLevelFormErrors([]);
                          }}
                          className="p-1.5 rounded-lg border border-[#D5C7B5] bg-white hover:bg-amber-50 text-amber-700 transition cursor-pointer"
                          title="Editar nivel"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleDeleteLevel(lvl.id)}
                          className="p-1.5 rounded-lg border border-rose-200 bg-white hover:bg-rose-50 text-rose-600 transition cursor-pointer"
                          title="Eliminar nivel"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-[#4A3B32] leading-relaxed">
                      {lvl.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-[#EFE5D8] flex items-center justify-between text-xs">
                    <span className="font-bold text-[#E05615]">
                      Sílabo: {lvl.syllabusTopic}
                    </span>
                    <div className="flex items-center space-x-2 text-[#7A6B60]">
                      <span>{lvl.questions.length} preguntas</span>
                      <span>•</span>
                      <span>{lvl.xpReward} XP</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* =================================================================
           TAB 3: PROBADOR INTERACTIVO DE PREGUNTAS
           ================================================================= */}
        {activeTab === 'tester' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-[#E0D5C7] shadow-md space-y-4">
              <div className="flex items-center space-x-2 text-purple-700">
                <Sparkles className="w-5 h-5" />
                <h3 className="font-serif font-black text-lg text-[#24140E]">
                  Probador de Preguntas en Tiempo Real
                </h3>
              </div>
              <p className="text-xs text-[#7A6B60]">
                Verifica la experiencia del estudiante: reproducción de audio, opciones interactivas y retroalimentación pedagógica inmediata.
              </p>

              {/* Selector */}
              <div>
                <label className="block text-xs font-bold text-[#4A3B32] mb-1">
                  Pregunta a Probar:
                </label>
                <select
                  value={testingQuestionId || ''}
                  onChange={(e) => {
                    setTestingQuestionId(e.target.value);
                    setTesterAnswer('');
                    setTesterResult(null);
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-[#D5C7B5] bg-[#FAF7F2] text-xs font-bold text-[#24140E]"
                >
                  <option value="">-- Elige una pregunta del nivel actual --</option>
                  {selectedLevel?.questions.map((q, idx) => (
                    <option key={q.id} value={q.id}>
                      #{idx + 1}: {q.prompt.slice(0, 50)}... [{q.type}]
                    </option>
                  ))}
                </select>
              </div>

              {/* Active Question Preview */}
              {(() => {
                const q = selectedLevel?.questions.find(item => item.id === testingQuestionId);
                if (!q) return null;

                const checkSubmission = (ans: string) => {
                  const isCorrect = Array.isArray(q.correctAnswer)
                    ? q.correctAnswer.some(a => a.trim().toLowerCase() === ans.trim().toLowerCase())
                    : q.correctAnswer.trim().toLowerCase() === ans.trim().toLowerCase();

                  setTesterResult({
                    correct: isCorrect,
                    message: isCorrect ? '¡Correcto! Excelente dominio del español.' : 'Respuesta incorrecta. Revisa la explicación pedagógica.'
                  });
                };

                return (
                  <div className="pt-4 border-t border-[#EFE5D8] space-y-4">
                    <div className="p-4 bg-[#FAF7F2] rounded-2xl border border-[#E0D5C7] space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-wider bg-orange-100 text-[#C2410C] px-2 py-0.5 rounded-md">
                          {q.type}
                        </span>
                        <button
                          onClick={() => speakSpanish(q.audioText || q.prompt)}
                          className="px-2.5 py-1 bg-white hover:bg-orange-50 border border-[#D5C7B5] text-[#C2410C] rounded-lg text-xs font-bold flex items-center space-x-1 transition cursor-pointer"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                          <span>Escuchar</span>
                        </button>
                      </div>

                      <h4 className="font-serif font-black text-base text-[#24140E]">
                        {q.prompt}
                      </h4>
                      {q.englishPrompt && (
                        <p className="text-xs text-[#7A6B60] italic">
                          "{q.englishPrompt}"
                        </p>
                      )}
                    </div>

                    {/* Options or Text Input */}
                    {q.options && q.options.length > 0 ? (
                      <div className="space-y-2">
                        {q.options.map((opt, optIdx) => (
                          <button
                            key={optIdx}
                            onClick={() => {
                              setTesterAnswer(opt);
                              checkSubmission(opt);
                            }}
                            className={`w-full p-3 rounded-xl border text-xs font-bold text-left transition flex items-center justify-between cursor-pointer ${
                              testerAnswer === opt
                                ? 'border-[#E05615] bg-orange-50 text-[#E05615]'
                                : 'border-[#E0D5C7] bg-white hover:bg-[#FAF7F2] text-[#24140E]'
                            }`}
                          >
                            <span>{opt}</span>
                            {testerAnswer === opt && <Check className="w-4 h-4" />}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={testerAnswer}
                          onChange={(e) => setTesterAnswer(e.target.value)}
                          placeholder="Escribe tu respuesta en español..."
                          className="w-full px-4 py-2.5 rounded-xl border border-[#D5C7B5] bg-white text-xs font-bold"
                        />
                        <button
                          onClick={() => checkSubmission(testerAnswer)}
                          className="w-full py-2.5 bg-[#E05615] text-white rounded-xl text-xs font-bold"
                        >
                          Validar Respuesta
                        </button>
                      </div>
                    )}

                    {/* Feedback Output */}
                    {testerResult && (
                      <div className={`p-4 rounded-2xl border text-xs space-y-2 ${
                        testerResult.correct 
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-950' 
                          : 'bg-rose-50 border-rose-300 text-rose-950'
                      }`}>
                        <div className="flex items-center space-x-1.5 font-black text-sm">
                          {testerResult.correct ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-rose-600" />}
                          <span>{testerResult.message}</span>
                        </div>
                        <p><strong>💡 Explicación: </strong>{q.explanation}</p>
                        {q.englishExplanation && (
                          <p className="text-[11px] opacity-90"><strong>Regla: </strong>{q.englishExplanation}</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* =================================================================
           TAB 4: SEGURIDAD Y POLÍTICAS RLS DE SUPABASE
           ================================================================= */}
        {activeTab === 'security' && (
          <div className="space-y-6 max-w-4xl mx-auto">
            <div className="bg-white p-6 rounded-3xl border border-[#E0D5C7] shadow-xs space-y-4">
              <div className="flex items-center space-x-2 text-emerald-700">
                <Shield className="w-6 h-6" />
                <h3 className="font-serif font-black text-lg text-[#24140E]">
                  Auditoría de Seguridad y Checklist de Políticas RLS
                </h3>
              </div>
              <p className="text-xs text-[#7A6B60] leading-relaxed">
                Este panel implementa las 5 directrices esenciales de seguridad para aplicaciones educativas con backend Supabase en la nube.
              </p>

              {/* 5 Security Checkpoints Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-1">
                  <div className="flex items-center space-x-1.5 text-xs font-black text-emerald-900">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>1. Row-Level Security (RLS)</span>
                  </div>
                  <p className="text-[11px] text-emerald-950 leading-tight">
                    Tablas protegidas. Las claves anónimas públicas no pueden alterar registros ajenos ni modificar el currículo.
                  </p>
                </div>

                <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-1">
                  <div className="flex items-center space-x-1.5 text-xs font-black text-emerald-900">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>2. Control de Permisos y URL Tampering</span>
                  </div>
                  <p className="text-[11px] text-emerald-950 leading-tight">
                    Acceso al portal restringido por token de sesión en memoria/sessionStorage. Modificar IDs en la URL es rechazado.
                  </p>
                </div>

                <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-1">
                  <div className="flex items-center space-x-1.5 text-xs font-black text-emerald-900">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>3. Prevención de Secretos Hardcodeados</span>
                  </div>
                  <p className="text-[11px] text-emerald-950 leading-tight">
                    Verificación con SHA-256 + Salt y soporte nativo de variables de entorno (<code className="font-mono">VITE_ADMIN_SECRET_KEY</code>).
                  </p>
                </div>

                <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-1">
                  <div className="flex items-center space-x-1.5 text-xs font-black text-emerald-900">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>4. Validación Estricta Anti-XSS</span>
                  </div>
                  <p className="text-[11px] text-emerald-950 leading-tight">
                    Sanitización de cadenas HTML, verificación de longitud y renderizado seguro en texto plano.
                  </p>
                </div>
              </div>
            </div>

            {/* SQL Snippet for Supabase Editor */}
            <div className="bg-[#24140E] text-white p-6 rounded-3xl border border-[#3E281C] shadow-lg space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FileCode className="w-5 h-5 text-orange-400" />
                  <h4 className="font-mono text-sm font-bold text-orange-400">
                    supabase/admin_rls.sql — Políticas Recomendadas
                  </h4>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`-- Enforce RLS on Player Progress
alter table public.player_progress enable row level security;

-- Only permit users to access their own progress
drop policy if exists "Users own progress" on public.player_progress;
create policy "Users own progress" on public.player_progress
  for all using (auth.uid()::text = id);`);
                    setNotification({ message: '✓ SQL copiado al portapapeles', type: 'success' });
                  }}
                  className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-mono font-bold transition cursor-pointer"
                >
                  Copy SQL
                </button>
              </div>

              <pre className="text-xs font-mono bg-black/40 p-4 rounded-xl overflow-x-auto text-[#EADFCF] leading-relaxed">
{`-- 1. Habilitar RLS en todas las tablas
alter table public.player_progress enable row level security;
alter table public.gemini_rate_limits enable row level security;

-- 2. Política de aislamiento de jugadores: solo acceden a sus propios registros
drop policy if exists "Aislamiento de Jugador" on public.player_progress;
create policy "Aislamiento de Jugador" on public.player_progress
  for all
  using (auth.uid()::text = id);

-- 3. Tabla opcional para sincronización remota de currículo personalizado
create table if not exists public.curriculum_overrides (
  id text primary key default 'active_curriculum',
  data jsonb not null,
  updated_at timestamptz default now()
);

alter table public.curriculum_overrides enable row level security;

-- Lectura pública para jugadores, escritura exclusiva para el service_role (Admin)
create policy "Lectura pública de currículo" on public.curriculum_overrides
  for select using (true);

create policy "Escritura exclusiva admin" on public.curriculum_overrides
  for all to service_role using (true);`}
              </pre>
            </div>
          </div>
        )}
      </main>

      {/* =====================================================================
         MODAL: EDITAR / AÑADIR PREGUNTA
         ===================================================================== */}
      {editingQuestion && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-[#E0D5C7] shadow-2xl max-w-2xl w-full p-6 space-y-4 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#EFE5D8]">
              <h3 className="font-serif font-black text-lg text-[#24140E]">
                {isNewQuestion ? '➕ Añadir Nueva Pregunta' : '✏️ Editar Pregunta'}
              </h3>
              <button 
                onClick={() => setEditingQuestion(null)}
                className="p-1 rounded-full text-[#7A6B60] hover:bg-[#FAF7F2] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {questionFormErrors.length > 0 && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 space-y-1">
                <strong className="block font-bold">Errores de validación:</strong>
                <ul className="list-disc pl-4 space-y-0.5">
                  {questionFormErrors.map((err, i) => <li key={i}>{err}</li>)}
                </ul>
              </div>
            )}

            <form onSubmit={handleSaveQuestionSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#4A3B32] mb-1">ID Único</label>
                  <input
                    type="text"
                    required
                    value={editingQuestion.id}
                    onChange={(e) => setEditingQuestion({ ...editingQuestion, id: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-[#D5C7B5] bg-[#FAF7F2] text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#4A3B32] mb-1">Tipo de Pregunta</label>
                  <select
                    value={editingQuestion.type}
                    onChange={(e) => setEditingQuestion({ ...editingQuestion, type: e.target.value as QuestionType })}
                    className="w-full px-3 py-2 rounded-xl border border-[#D5C7B5] bg-[#FAF7F2] text-xs font-bold"
                  >
                    <option value="multiple-choice">Opción Múltiple (multiple-choice)</option>
                    <option value="fill-blank">Rellenar Espacio (fill-blank)</option>
                    <option value="word-order">Ordenar Palabras (word-order)</option>
                    <option value="dialogue">Diálogo (dialogue)</option>
                    <option value="listening">Escucha y Comprensión (listening)</option>
                    <option value="speaking">Pronunciación y Habla (speaking)</option>
                    <option value="true-false">Verdadero / Falso (true-false)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#4A3B32] mb-1">
                  Enunciado en Español (Prompt) *
                </label>
                <textarea
                  rows={2}
                  required
                  value={editingQuestion.prompt}
                  onChange={(e) => setEditingQuestion({ ...editingQuestion, prompt: e.target.value })}
                  placeholder="¿Cómo se saluda por la mañana en España?"
                  className="w-full px-3 py-2 rounded-xl border border-[#D5C7B5] bg-white text-xs font-medium focus:ring-1 focus:ring-[#E05615]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#4A3B32] mb-1">
                  Traducción o Pista en Inglés (English Prompt)
                </label>
                <input
                  type="text"
                  value={editingQuestion.englishPrompt || ''}
                  onChange={(e) => setEditingQuestion({ ...editingQuestion, englishPrompt: e.target.value })}
                  placeholder="How do you greet in the morning in Spain?"
                  className="w-full px-3 py-2 rounded-xl border border-[#D5C7B5] bg-white text-xs"
                />
              </div>

              {/* Multiple Choice Options Editor */}
              {editingQuestion.type === 'multiple-choice' && (
                <div className="space-y-2 bg-[#FAF7F2] p-3.5 rounded-2xl border border-[#E0D5C7]">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-[#4A3B32]">
                      Opciones de Respuesta y Selección de la Correcta
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const cur = editingQuestion.options || [];
                        if (cur.length < 6) {
                          setEditingQuestion({ ...editingQuestion, options: [...cur, ''] });
                        }
                      }}
                      className="text-[11px] text-[#E05615] font-bold hover:underline"
                    >
                      + Add Option
                    </button>
                  </div>

                  {(editingQuestion.options || []).map((opt, idx) => {
                    const isCorrect = Array.isArray(editingQuestion.correctAnswer)
                      ? editingQuestion.correctAnswer.includes(opt)
                      : editingQuestion.correctAnswer === opt;

                    return (
                      <div key={idx} className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="correct_answer_radio"
                          checked={Boolean(opt.trim() && isCorrect)}
                          onChange={() => setEditingQuestion({ ...editingQuestion, correctAnswer: opt })}
                          className="w-4 h-4 text-[#E05615] cursor-pointer"
                          title="Marcar como respuesta correcta"
                        />
                        <input
                          type="text"
                          required
                          value={opt}
                          onChange={(e) => {
                            const updated = [...(editingQuestion.options || [])];
                            const oldVal = updated[idx];
                            updated[idx] = e.target.value;
                            const nextQ = { ...editingQuestion, options: updated };
                            if (editingQuestion.correctAnswer === oldVal) {
                              nextQ.correctAnswer = updated[idx];
                            }
                            setEditingQuestion(nextQ);
                          }}
                          placeholder={`Opción ${idx + 1}`}
                          className="flex-1 px-3 py-1.5 rounded-xl border border-[#D5C7B5] bg-white text-xs"
                        />
                        {(editingQuestion.options || []).length > 2 && (
                          <button
                            type="button"
                            onClick={() => {
                              const updated = (editingQuestion.options || []).filter((_, i) => i !== idx);
                              setEditingQuestion({ ...editingQuestion, options: updated });
                            }}
                            className="p-1 text-rose-500 hover:bg-rose-50 rounded-lg cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Direct Correct Answer for non-multiple-choice */}
              {editingQuestion.type !== 'multiple-choice' && (
                <div>
                  <label className="block text-xs font-bold text-[#4A3B32] mb-1">
                    Respuesta Correcta *
                  </label>
                  <input
                    type="text"
                    required
                    value={Array.isArray(editingQuestion.correctAnswer) ? editingQuestion.correctAnswer.join(', ') : editingQuestion.correctAnswer}
                    onChange={(e) => setEditingQuestion({ ...editingQuestion, correctAnswer: e.target.value })}
                    placeholder="Respuesta exacta esperada"
                    className="w-full px-3 py-2 rounded-xl border border-[#D5C7B5] bg-white text-xs font-bold text-emerald-950"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-[#4A3B32] mb-1">
                  Explicación Pedagógica en Español *
                </label>
                <textarea
                  rows={2}
                  required
                  value={editingQuestion.explanation}
                  onChange={(e) => setEditingQuestion({ ...editingQuestion, explanation: e.target.value })}
                  placeholder="¡Buenos días! es el saludo habitual por la mañana..."
                  className="w-full px-3 py-2 rounded-xl border border-[#D5C7B5] bg-white text-xs focus:ring-1 focus:ring-[#E05615]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#4A3B32] mb-1">
                  Regla de Gramática o Nota en Inglés (English Explanation)
                </label>
                <input
                  type="text"
                  value={editingQuestion.englishExplanation || ''}
                  onChange={(e) => setEditingQuestion({ ...editingQuestion, englishExplanation: e.target.value })}
                  placeholder="Buenos días is plural and uses 'buenos' matching 'días'..."
                  className="w-full px-3 py-2 rounded-xl border border-[#D5C7B5] bg-white text-xs"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-[#EFE5D8]">
                <button
                  type="button"
                  onClick={() => setEditingQuestion(null)}
                  className="px-4 py-2 rounded-xl border border-[#D5C7B5] bg-white text-xs font-bold text-[#6B584D] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#E05615] hover:bg-[#C2410C] text-white text-xs font-bold shadow-xs transition cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
         MODAL: EDITAR / AÑADIR NIVEL
         ===================================================================== */}
      {editingLevel && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#E0D5C7] shadow-2xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#EFE5D8]">
              <h3 className="font-serif font-black text-lg text-[#24140E]">
                {isNewLevel ? '➕ Crear Nuevo Nivel' : '✏️ Editar Nivel'}
              </h3>
              <button 
                onClick={() => setEditingLevel(null)}
                className="p-1 rounded-full text-[#7A6B60] hover:bg-[#FAF7F2] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {levelFormErrors.length > 0 && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 space-y-1">
                <strong className="block font-bold">Errores de validación:</strong>
                <ul className="list-disc pl-4 space-y-0.5">
                  {levelFormErrors.map((err, i) => <li key={i}>{err}</li>)}
                </ul>
              </div>
            )}

            <form onSubmit={handleSaveLevelSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#4A3B32] mb-1">ID del Nivel</label>
                  <input
                    type="text"
                    required
                    value={editingLevel.id}
                    onChange={(e) => setEditingLevel({ ...editingLevel, id: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-[#D5C7B5] bg-[#FAF7F2] text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#4A3B32] mb-1">Número de Nivel (1..N)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={editingLevel.levelNumber}
                    onChange={(e) => setEditingLevel({ ...editingLevel, levelNumber: parseInt(e.target.value, 10) || 1 })}
                    className="w-full px-3 py-2 rounded-xl border border-[#D5C7B5] bg-white text-xs font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#4A3B32] mb-1">Título del Nivel *</label>
                <input
                  type="text"
                  required
                  value={editingLevel.title}
                  onChange={(e) => setEditingLevel({ ...editingLevel, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-[#D5C7B5] bg-white text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#4A3B32] mb-1">Subtítulo Descriptivo</label>
                <input
                  type="text"
                  value={editingLevel.subtitle}
                  onChange={(e) => setEditingLevel({ ...editingLevel, subtitle: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-[#D5C7B5] bg-white text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#4A3B32] mb-1">Dificultad (Tier)</label>
                  <select
                    value={editingLevel.tier}
                    onChange={(e) => setEditingLevel({ ...editingLevel, tier: e.target.value as DifficultyTier })}
                    className="w-full px-3 py-2 rounded-xl border border-[#D5C7B5] bg-white text-xs font-bold"
                  >
                    <option value="easy">Principiante (easy)</option>
                    <option value="medium">Explorador (medium)</option>
                    <option value="tough">Aventurero (tough)</option>
                    <option value="hard">Maestro (hard)</option>
                    <option value="hot">Leyenda (hot)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#4A3B32] mb-1">Recompensa XP</label>
                  <input
                    type="number"
                    min={10}
                    max={1000}
                    value={editingLevel.xpReward}
                    onChange={(e) => setEditingLevel({ ...editingLevel, xpReward: parseInt(e.target.value, 10) || 50 })}
                    className="w-full px-3 py-2 rounded-xl border border-[#D5C7B5] bg-white text-xs font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#4A3B32] mb-1">Tema del Sílabo A1 *</label>
                <input
                  type="text"
                  required
                  value={editingLevel.syllabusTopic}
                  onChange={(e) => setEditingLevel({ ...editingLevel, syllabusTopic: e.target.value })}
                  placeholder="e.g. Saludos y Presentaciones"
                  className="w-full px-3 py-2 rounded-xl border border-[#D5C7B5] bg-white text-xs font-bold text-[#E05615]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#4A3B32] mb-1">Descripción del Desafío</label>
                <textarea
                  rows={2}
                  value={editingLevel.description}
                  onChange={(e) => setEditingLevel({ ...editingLevel, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-[#D5C7B5] bg-white text-xs"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-[#EFE5D8]">
                <button
                  type="button"
                  onClick={() => setEditingLevel(null)}
                  className="px-4 py-2 rounded-xl border border-[#D5C7B5] bg-white text-xs font-bold text-[#6B584D] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#E05615] hover:bg-[#C2410C] text-white text-xs font-bold shadow-xs transition cursor-pointer"
                >
                  Save Level
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
         MODAL: CONFIRMACIÓN DE RESTABLECER FÁBRICA
         ===================================================================== */}
      {confirmResetOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-rose-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center mx-auto">
              <RotateCcw className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="font-serif font-black text-lg text-[#24140E]">
                ¿Restablecer a Valores de Fábrica?
              </h3>
              <p className="text-xs text-[#7A6B60] leading-relaxed">
                Esta acción eliminará todas las modificaciones personalizadas y restaurará inmediatamente el conjunto de preguntas y niveles original de ¡Aventura Española!.
              </p>
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <button
                onClick={() => setConfirmResetOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-[#D5C7B5] bg-white text-xs font-bold text-[#6B584D] cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleResetToDefaults}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition cursor-pointer"
              >
                Yes, Reset All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
