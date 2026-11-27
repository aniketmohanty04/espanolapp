import React from 'react';
import { Compass, Home, ShieldAlert } from 'lucide-react';

interface NotFoundScreenProps {
  onBackToHome: () => void;
}

export const NotFoundScreen: React.FC<NotFoundScreenProps> = ({ onBackToHome }) => {
  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 selection:bg-[#E05615] selection:text-white"
      style={{
        background: 'linear-gradient(135deg, #FAF7F2 0%, #F5EFEB 100%)'
      }}
    >
      <div className="w-full max-w-md text-center p-8 bg-white border-2 border-[#EADFCF] rounded-3xl shadow-xl">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shadow-sm">
          <Compass className="w-8 h-8 animate-pulse" />
        </div>

        <span className="text-xs font-black uppercase tracking-widest text-[#E05615] mb-2 block">
          Error 404 • Ruta no encontrada
        </span>

        <h1 className="text-3xl font-black font-serif text-[#24140E] mb-3">
          ¿Te has perdido por España?
        </h1>

        <p className="text-sm text-[#7D6B5E] leading-relaxed mb-6">
          La página o recurso que estás intentando buscar no existe, ha sido movido o no está disponible en este servidor.
        </p>

        <div className="pt-2 border-t border-[#F2ECE1]">
          <button
            onClick={onBackToHome}
            className="w-full py-3 px-5 rounded-2xl bg-[#E05615] hover:bg-[#C2410C] text-white font-bold text-sm shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer hover:scale-[1.02]"
          >
            <Home className="w-4 h-4" />
            <span>Volver a la Aventura</span>
          </button>
        </div>

        <p className="text-[11px] text-[#A89A8E] mt-4">
          ¡Aventura Española! • Sistema protegido
        </p>
      </div>
    </div>
  );
};
