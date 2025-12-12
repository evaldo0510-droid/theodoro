import React, { useState, useEffect } from 'react';
import { X, ChevronRight, Camera, Sparkles, ScanFace, Shirt, Ruler } from 'lucide-react';

interface OnboardingProps {
  onComplete: () => void;
}

const steps = [
  {
    title: "Bem-vindo ao Atelier do Teodoro",
    description: "Você acaba de entrar no VizuHalizando, um espaço exclusivo onde a tecnologia encontra a arte do 'Sob Medida'.",
    icon: Sparkles,
    color: "bg-indigo-600"
  },
  {
    title: "Curadoria do Especialista",
    description: "Teodoro guiará sua jornada de estilo. Analisamos seus traços com precisão de alfaiate para sugerir o que realmente valoriza você.",
    icon: Ruler,
    color: "bg-slate-800"
  },
  {
    title: "Análise Visagista",
    description: "Identificamos sua biometria e tom de pele para criar uma identidade visual única, do corte de cabelo à paleta de cores.",
    icon: ScanFace,
    color: "bg-indigo-500"
  },
  {
    title: "Seu Estilo, Sob Medida",
    description: "Visualize looks exclusivos e receba recomendações personalizadas como se estivesse em uma consultoria presencial.",
    icon: Shirt,
    color: "bg-emerald-600"
  }
];

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem('vizu_teodoro_intro_seen');
    if (!seen) {
      setIsOpen(true);
    } else {
        onComplete();
    }
  }, [onComplete]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(curr => curr + 1);
    } else {
      handleClose();
    }
  };

  const handleClose = () => {
    localStorage.setItem('vizu_teodoro_intro_seen', 'true');
    setIsOpen(false);
    setTimeout(onComplete, 300);
  };

  if (!isOpen) return null;

  const StepIcon = steps[currentStep].icon;

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl relative border border-white/20 dark:border-slate-700">
        <button 
          onClick={handleClose} 
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors z-10"
        >
          <X className="w-5 h-5 text-white/80 mix-blend-difference" />
        </button>

        <div className="flex flex-col h-[500px]">
          {/* Illustration Area */}
          <div className={`h-[55%] ${steps[currentStep].color} flex items-center justify-center relative overflow-hidden transition-colors duration-500`}>
             <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
             <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/40" />
             
             <div className="relative z-10 flex flex-col items-center gap-4">
                <div className="bg-white/10 p-6 rounded-full backdrop-blur-md shadow-xl border border-white/20 animate-fade-in">
                    <StepIcon className="w-12 h-12 text-white drop-shadow-lg" />
                </div>
                {currentStep === 0 && (
                     <div className="bg-white/90 text-slate-900 px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                        VIZU x TEODORO
                     </div>
                )}
             </div>
          </div>

          {/* Content Area */}
          <div className="h-[45%] p-8 flex flex-col justify-between bg-white dark:bg-slate-900 relative">
            <div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3 transition-all duration-300 font-serif tracking-tight">
                {steps[currentStep].title}
              </h3>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-sm transition-all duration-300">
                {steps[currentStep].description}
              </p>
            </div>

            <div className="flex items-center justify-between mt-4">
              <div className="flex gap-2">
                {steps.map((_, idx) => (
                  <div 
                    key={idx} 
                    className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentStep ? `w-6 ${steps[currentStep].color.replace('bg-', 'bg-')}` : 'w-2 bg-slate-200 dark:bg-slate-700'}`}
                  />
                ))}
              </div>
              
              <button 
                onClick={handleNext} 
                className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-lg text-sm"
              >
                {currentStep === steps.length - 1 ? 'Entrar no Atelier' : 'Próximo'}
                {currentStep !== steps.length - 1 && <ChevronRight className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};