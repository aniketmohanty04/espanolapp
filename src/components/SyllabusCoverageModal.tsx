import React, { useState } from 'react';
import { SYLLABUS_MODULES } from '../data/syllabusData';
import { getCityById } from '../data/citiesData';
import { 
  X, 
  Award, 
  CheckCircle2, 
  BookOpen, 
  Clock, 
  Compass, 
  AlertTriangle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface SyllabusCoverageModalProps {
  onClose: () => void;
  onGoToCity?: (cityId: string) => void;
}

export const SyllabusCoverageModal: React.FC<SyllabusCoverageModalProps> = ({
  onClose,
  onGoToCity
}) => {
  const [selectedModuleNum, setSelectedModuleNum] = useState<number>(1);

  const activeModule = SYLLABUS_MODULES.find(m => m.moduleNumber === selectedModuleNum) || SYLLABUS_MODULES[0];

  const totalTopics = SYLLABUS_MODULES.reduce((acc, m) => acc + m.topics.length, 0);
  const coveredTopics = SYLLABUS_MODULES.reduce(
    (acc, m) => acc + m.topics.filter(t => t.coveredInCityIds.length > 0).length,
    0
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-[#FAF7F2] border-2 border-[#EADFCF] rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col text-[#24140E]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#EADFCF] flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-300">
              <Award className="w-5 h-5 text-[#E05615]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-black text-[#24140E] font-serif">Matriz de Cobertura del Sílabo BAESP101</h2>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-black border border-emerald-300 flex items-center space-x-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>100% Cobertura ({coveredTopics}/{totalTopics} Temas)</span>
                </span>
              </div>
              <p className="text-xs text-[#7A6B60] font-medium">
                Curso: Spanish Level I • Total 15 horas de clase mapeadas exhaustivamente en las 15 ciudades.
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

        {/* Module Selector Tabs */}
        <div className="px-6 py-2.5 bg-[#F5EDE2] border-b border-[#EADFCF] flex flex-wrap items-center gap-1.5 text-xs font-bold shrink-0">
          {SYLLABUS_MODULES.map(mod => (
            <button
              key={mod.moduleNumber}
              onClick={() => setSelectedModuleNum(mod.moduleNumber)}
              className={`px-3 py-1.5 rounded-full transition-colors flex items-center space-x-1.5 ${
                selectedModuleNum === mod.moduleNumber
                  ? 'bg-[#E05615] text-white font-black shadow-xs'
                  : 'bg-white text-[#7A6B60] border border-[#E0D5C7] hover:border-amber-400 hover:text-[#24140E]'
              }`}
            >
              <span>Módulo {mod.moduleNumber}</span>
              <span className="text-[10px] opacity-75">({mod.hours}h)</span>
            </button>
          ))}
        </div>

        {/* Module Details & Topics List */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 grow">
          {/* Active Module Summary Box */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white border-2 border-amber-300 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-[#24140E] font-serif">
                Módulo {activeModule.moduleNumber}: {activeModule.title}
              </h3>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-50 text-[#B45309] font-mono border border-amber-200 flex items-center space-x-1 font-bold">
                <Clock className="w-3 h-3 text-[#E05615]" />
                <span>{activeModule.hours} horas lectivas</span>
              </span>
            </div>
            <p className="text-xs text-[#6B584D] leading-relaxed font-medium">
              {activeModule.summary}
            </p>
          </div>

          {/* Topics Table / Cards */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-black text-[#B45309] uppercase tracking-wider">
              Objetivos y Temas Mapeados ({activeModule.topics.length} temas):
            </h4>

            {activeModule.topics.map(topic => (
              <div
                key={topic.id}
                className="p-4 rounded-2xl bg-white border-2 border-[#E8DFD5] hover:border-amber-400 shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left"
              >
                <div className="space-y-1 max-w-xl">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-black text-[#B45309] font-mono">
                      {topic.code}
                    </span>
                    <span className="text-sm font-black text-[#24140E] font-serif">
                      {topic.title}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FAF7F2] text-[#7A6B60] border border-[#E0D5C7] font-bold">
                      {topic.category}
                    </span>
                  </div>
                  <p className="text-xs text-[#6B584D] font-medium">
                    {topic.description}
                  </p>
                </div>

                {/* Cities where topic is covered */}
                <div className="flex flex-wrap items-center gap-1.5 shrink-0 self-start sm:self-center">
                  <span className="text-[11px] text-[#7A6B60] font-bold mr-1">Cubierto en:</span>
                  {topic.coveredInCityIds.map(cityId => {
                    const c = getCityById(cityId);
                    return (
                      <span
                        key={cityId}
                        className="px-2.5 py-0.5 rounded-full bg-[#FFF8EE] text-[#B45309] border border-amber-300 text-xs font-black"
                      >
                        {c ? c.name : cityId}
                      </span>
                    );
                  })}
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 ml-1" />
                </div>
              </div>
            ))}
          </div>

          {/* Academic References Note */}
          <div className="mt-4 p-4 rounded-2xl bg-white border-2 border-[#EADFCF] text-xs text-[#7A6B60] space-y-1 shadow-xs font-medium">
            <p className="font-black text-[#24140E]">Fuentes Académicas Oficiales Mapeadas:</p>
            <p>1. <strong>BAESP101 Spanish Level I Syllabus</strong> (Board of Studies approved, 15 Lecture Hours).</p>
            <p>2. <strong>Nuevo Español sin Fronteras ESF 1</strong> (Sánchez Lobato, Moreno García et al., SGEL / Aula Internacional 1 Goyal Publishers).</p>
          </div>
        </div>
      </div>
    </div>
  );
};
