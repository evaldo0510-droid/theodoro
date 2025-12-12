import React from 'react';
import { Modal } from './Modal';
import { User, Award, Scissors, Star } from 'lucide-react';

interface TeodoroProfileProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TeodoroProfile: React.FC<TeodoroProfileProps> = ({ isOpen, onClose }) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Conheça o Especialista"
      icon={User}
      sizeClass="max-w-2xl"
      colorClass="bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-black"
    >
      <div className="flex flex-col gap-6">
        
        {/* Profile Header */}
        <div className="flex flex-col md:flex-row items-center gap-6 p-6 bg-slate-900 rounded-2xl text-white shadow-xl relative overflow-hidden">
             {/* Abstract Background Pattern */}
             <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600 rounded-full blur-[80px] opacity-20 -mr-16 -mt-16 pointer-events-none"></div>
             
             <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-indigo-400 to-slate-600 p-1 shadow-2xl flex-shrink-0">
                 <div className="w-full h-full rounded-full bg-slate-800 flex items-center justify-center overflow-hidden">
                     {/* Placeholder for Teodoro's Avatar if available, using Icon for now */}
                     <span className="text-3xl font-serif font-bold text-indigo-200">T</span>
                 </div>
             </div>
             
             <div className="text-center md:text-left z-10">
                 <div className="inline-block px-3 py-1 bg-indigo-500/20 border border-indigo-500/30 rounded-full text-indigo-300 text-xs font-bold mb-2 tracking-wider uppercase">
                     Especialista Sob Medida
                 </div>
                 <h2 className="text-3xl font-bold font-serif mb-2">Teodoro</h2>
                 <p className="text-slate-300 text-sm leading-relaxed max-w-sm">
                     "O estilo não é apenas sobre o que você veste, mas sobre como cada peça se comunica com quem você é."
                 </p>
             </div>
        </div>

        {/* Bio Section */}
        <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-indigo-600" />
                Sobre o Especialista
            </h3>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-sm text-justify">
                Com uma trajetória dedicada à excelência da alfaiataria e ao estudo profundo do visagismo, Teodoro se estabeleceu como uma referência em consultoria de imagem <strong>"Sob Medida"</strong>. 
                Sua filosofia une a precisão técnica dos cortes clássicos com a modernidade da análise biométrica, garantindo que cada recomendação seja matematicamente harmoniosa e esteticamente impecável.
            </p>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-sm text-justify">
                No VizuHalizando, Teodoro traz sua curadoria exclusiva para o ambiente digital, permitindo que você experimente a atenção aos detalhes de um atelier privado, onde quer que esteja.
            </p>
        </div>

        {/* Expertise Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 flex items-start gap-3">
                <Scissors className="w-5 h-5 text-indigo-500 mt-1" />
                <div>
                    <h4 className="font-bold text-slate-800 dark:text-white text-sm">Alfaiataria & Ajustes</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Domínio total sobre caimentos, tecidos e proporções corporais.
                    </p>
                </div>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 flex items-start gap-3">
                <Star className="w-5 h-5 text-amber-500 mt-1" />
                <div>
                    <h4 className="font-bold text-slate-800 dark:text-white text-sm">Visagismo Avançado</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Análise geométrica facial para harmonização de imagem pessoal.
                    </p>
                </div>
            </div>
        </div>

        {/* Footer CTA */}
        <div className="mt-4 pt-6 border-t border-slate-100 dark:border-slate-800 text-center">
            <button 
                onClick={onClose}
                className="px-8 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold hover:scale-105 transition-transform shadow-lg"
            >
                Entrar no Atelier Digital
            </button>
        </div>

      </div>
    </Modal>
  );
};