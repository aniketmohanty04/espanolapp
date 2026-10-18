import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { STUDY_SCHEDULE_35_DAYS } from '../data/studyPlanData';
import { ALL_CITIES } from '../data/citiesData';
import { 
  X, 
  Calendar, 
  CheckCircle, 
  Circle, 
  Compass, 
  Trophy, 
  ArrowRight,
  Flame
} from 'lucide-react';

interface StudyPlanModalProps {
  onClose: () => void;
  onGoToCity: (cityId: string) => void;
  onGoToFestival: () => void;
}

export const StudyPlanModal: React.FC<StudyPlanModalProps> = ({
  onClose,
  onGoToCity,
  onGoToFestival
}) => {
  const { progress, completeStudyDay } = useGame();
  const [selectedModule, setSelectedModule] = useState<number | 'all'>('all');

  const filteredDays = STUDY_SCHEDULE_35_DAYS.filter(d => {
    if (selectedModule === 'all') return true;
    return d.moduleNumber === selectedModule;
  });

  const completedCount = progress.completedStudyDays.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-[#FAF7F2] border-2 border-[#EADFCF] rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col text-[#24140E]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#EADFCF] flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-300">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-black text-[#24140E] font-serif">Plan de Estudio de 35 Días</h2>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-black border border-emerald-300">
                  {completedCount} / 35 Completados
                </span>
              </div>
              <p className="text-xs text-[#7A6B60] font-medium">
                Secuencia diaria guiada que cubre el 100% del sílabo BAESP101 Nivel I.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-[#FAF7F2] text-[#6B584D] hover:text-[#24140E] hover:bg-[#F2ECE1] border border-[#EADFCF] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Module Filter Pills */}
        <div className="px-6 py-2.5 bg-[#F5EDE2] border-b border-[#EADFCF] flex flex-wrap items-center gap-1.5 text-xs font-bold shrink-0">
          <button
            onClick={() => setSelectedModule('all')}
            className={`px-3 py-1.5 rounded-full transition-colors ${
              selectedModule === 'all'
                ? 'bg-[#E05615] text-white font-black shadow-xs'
                : 'bg-white text-[#7A6B60] border border-[#E0D5C7] hover:border-amber-400 hover:text-[#24140E]'
            }`}
          >
            Todos los 35 Días
          </button>
          {[1, 2, 3, 4, 5].map(modNum => (
            <button
              key={modNum}
              onClick={() => setSelectedModule(modNum)}
              className={`px-3 py-1.5 rounded-full transition-colors ${
                selectedModule === modNum
                  ? 'bg-[#E05615] text-white font-black shadow-xs'
                  : 'bg-white text-[#7A6B60] border border-[#E0D5C7] hover:border-amber-400 hover:text-[#24140E]'
              }`}
            >
              Módulo {modNum}
            </button>
          ))}
        </div>

        {/* Days List */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-3 grow">
          {filteredDays.map(day => {
            const isCompleted = progress.completedStudyDays.includes(day.dayNumber);
            const city = ALL_CITIES.find(c => c.name.toLowerCase() === day.targetCity.toLowerCase());

            return (
              <div
                key={day.dayNumber}
                className={`p-4 sm:p-5 rounded-2xl border-2 transition-all text-left flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs ${
                  day.isMilestone
                    ? 'bg-[#FFF8EE] border-amber-300'
                    : isCompleted
                    ? 'bg-emerald-50/30 border-emerald-200'
                    : 'bg-white border-[#E8DFD5] hover:border-amber-400'
                }`}
              >
                <div className="flex items-start space-x-3.5 max-w-2xl">
                  <button
                    onClick={() => completeStudyDay(day.dayNumber)}
                    className="mt-0.5 text-[#8C7A6B] hover:text-emerald-600 transition-colors shrink-0"
                    title={isCompleted ? 'Día completado (+50 monedas ya ganadas)' : 'Marcar día como completado (+50 monedas)'}
                  >
                    {isCompleted ? (
                      <CheckCircle className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <Circle className="w-5 h-5 text-[#D5C7B7] hover:text-[#E05615]" />
                    )}
                  </button>

                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-black text-[#B45309]">
                        Día {day.dayNumber}
                      </span>
                      <span className="text-xs text-[#8C7A6B]">•</span>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#FAF7F2] border border-[#E0D5C7] text-[#7A6B60] font-bold">
                        Módulo {day.moduleNumber}
                      </span>
                      {day.isMilestone && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-[#B45309] border border-amber-300 font-black flex items-center space-x-1">
                          <Trophy className="w-3 h-3 text-[#E05615]" />
                          <span>Hito de Evaluación</span>
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm sm:text-base font-black text-[#24140E] font-serif">
                      {day.title}
                    </h3>
                    <p className="text-xs text-[#6B584D] font-medium leading-relaxed">
                      <strong className="text-[#24140E]">Objetivo:</strong> {day.objective}
                    </p>
                    <p className="text-[11px] text-[#7A6B60]">
                      Destino: <span className="text-[#B45309] font-black">{day.targetCity}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
                  {day.targetCity === 'La Gran Fiesta' ? (
                    <button
                      onClick={() => {
                        onClose();
                        onGoToFestival();
                      }}
                      className="px-4 py-2 rounded-full bg-gradient-to-r from-[#E05615] via-[#EA580C] to-[#F3B33D] hover:from-[#C2410C] hover:to-[#E05615] text-white font-black text-xs flex items-center space-x-1 shadow-sm transition-all"
                    >
                      <span>Ir a la Fiesta</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  ) : city ? (
                    <button
                      onClick={() => {
                        onClose();
                        onGoToCity(city.id);
                      }}
                      className="px-4 py-2 rounded-full bg-[#FAF7F2] hover:bg-[#F2ECE1] text-[#24140E] text-xs font-black border border-[#E0D5C7] flex items-center space-x-1 transition-colors shadow-xs"
                    >
                      <span>Ir a {city.name}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-[#E05615]" />
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
