import React, { useState } from 'react';
import { Modal } from './Modal';
import { BookOpen, Check, Scissors, Palette, User, Sparkles, Smile, Triangle, Circle, Square, Diamond, Glasses } from 'lucide-react';

interface VisagismGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type FaceShapeKey = 'Oval' | 'Redondo' | 'Quadrado' | 'Retangular' | 'Triangular' | 'Triângulo Invertido' | 'Hexagonal' | 'Coração';

const FACE_SHAPES: Record<FaceShapeKey, {
  description: string;
  impression: string;
  temperament: string;
  svgPath: React.ReactNode;
  recommendations: {
    Masculino: {
      hair: string;
      beard: string;
      accessories: string;
    },
    Feminino: {
      hair: string;
      makeup: string;
      accessories: string;
    }
  }
}> = {
  'Oval': {
    description: "Equilibrado, levemente mais largo nas maçãs, afilando suavemente para o queixo.",
    impression: "Equilíbrio, suavidade e diplomacia. Considerado o formato 'ideal' pela simetria.",
    temperament: "Misto (Equilíbrio)",
    svgPath: <ellipse cx="50" cy="50" rx="30" ry="45" stroke="currentColor" strokeWidth="2" fill="none" />,
    recommendations: {
      'Masculino': {
        hair: "Priorize volume no topo (Quiff, Pompadour) com laterais baixas para alongar a silhueta verticalmente.",
        beard: "Cavanhaques levemente alongados ou barba desenhada focada no queixo. Evite costeletas largas.",
        accessories: "Óculos de qualquer formato, mas modelos 'Aviador' reforçam a linha vertical."
      },
      'Feminino': {
        hair: "Cortes longos em camadas verticais ou 'Long Bob' assimétrico. Volume no topo da cabeça favorece o alongamento.",
        makeup: "Ilumine a zona T (centro da testa e queixo) para verticalizar o olhar. Contorno suave.",
        accessories: "Brincos longos e lineares. Colares em 'V' aprofundam o alongamento do pescoço."
      }
    }
  },
  'Redondo': {
    description: "Largura e altura similares. Sem ângulos definidos, bochechas preenchidas.",
    impression: "Jovialidade, acessibilidade, doçura. Pode parecer infantil.",
    temperament: "Fleumático / Sanguíneo",
    svgPath: <circle cx="50" cy="50" r="35" stroke="currentColor" strokeWidth="2" fill="none" />,
    recommendations: {
      'Masculino': {
        hair: "Laterais curtas, volume no topo (Pompadour). Evite franjas retas.",
        beard: "Barba quadrada ou cavanhaque alongado para criar ângulos.",
        accessories: "Óculos retangulares/quadrados com linhas retas."
      },
      'Feminino': {
        hair: "Long Bob assimétrico, camadas longas. Volume no topo.",
        makeup: "Contour lateral e abaixo das maçãs para esculpir.",
        accessories: "Brincos longos verticais. Óculos gatinho ou angulares."
      }
    }
  },
  'Quadrado': {
    description: "Testa, maçãs e maxilar com larguras similares. Maxilar bem definido.",
    impression: "Força, segurança, autoridade e liderança.",
    temperament: "Colérico",
    svgPath: <rect x="20" y="20" width="60" height="60" rx="5" stroke="currentColor" strokeWidth="2" fill="none" />,
    recommendations: {
      'Masculino': {
        hair: "Cortes clássicos, curtos laterais. Textura no topo suaviza.",
        beard: "Barba por fazer (Stubble) ou desenhada arredondando levemente.",
        accessories: "Óculos redondos/ovais (suaviza) ou quadrados (reforça)."
      },
      'Feminino': {
        hair: "Ondas suaves, cortes repicados abaixo do queixo. Franja lateral.",
        makeup: "Blush nas maçãs, iluminador no centro para verticalizar.",
        accessories: "Brincos redondos, argolas. Óculos gatinho ou redondos."
      }
    }
  },
  'Retangular': {
    description: "Similar ao quadrado, mas alongado. Testa alta e maxilar reto.",
    impression: "Intelecto, tradição, seriedade. Pode parecer distante.",
    temperament: "Melancólico",
    svgPath: <rect x="25" y="15" width="50" height="70" rx="5" stroke="currentColor" strokeWidth="2" fill="none" />,
    recommendations: {
      'Masculino': {
        hair: "Franjas funcionam bem para encurtar. Evite laterais muito raspadas.",
        beard: "Barba cheia nas laterais e curta no queixo.",
        accessories: "Óculos grandes, estilo Aviador ou Wayfarer."
      },
      'Feminino': {
        hair: "Franja reta ou lateral. Volume nas laterais (ondas).",
        makeup: "Contorno na raiz e queixo para 'encurtar'. Blush horizontal.",
        accessories: "Brincos largos, pedras grandes. Colares curtos."
      }
    }
  },
  'Triangular': {
    description: "Maxilar mais largo que a testa. Base do rosto dominante.",
    impression: "Estabilidade, praticidade, autoridade na base.",
    temperament: "Fleumático (Terra)",
    svgPath: <path d="M50 20 L80 80 L20 80 Z" stroke="currentColor" strokeWidth="2" fill="none" strokeLinejoin="round" />,
    recommendations: {
      'Masculino': {
        hair: "Volume nas laterais superiores. Textura. Evite raspar muito.",
        beard: "Barba completa, aparada nas laterais do maxilar.",
        accessories: "Óculos Browline (detalhe superior) chamam atenção aos olhos."
      },
      'Feminino': {
        hair: "Volume no topo e têmporas. Franjas volumosas.",
        makeup: "Iluminar testa e têmporas. Escurecer levemente maxilar.",
        accessories: "Brincos pequenos ou invertidos. Colares compridos."
      }
    }
  },
  'Triângulo Invertido': {
    description: "Testa larga e queixo fino. Formato de 'V'.",
    impression: "Dinamismo, criatividade, leveza. Pode parecer instável.",
    temperament: "Sanguíneo (Ar)",
    svgPath: <path d="M20 20 L80 20 L50 80 Z" stroke="currentColor" strokeWidth="2" fill="none" strokeLinejoin="round" />,
    recommendations: {
      'Masculino': {
        hair: "Franjas ou topetes baixos. Evite volume lateral no topo.",
        beard: "Barba 'Full Beard' ajuda a dar peso ao queixo fino.",
        accessories: "Óculos arredondados. Evite armações muito largas."
      },
      'Feminino': {
        hair: "Bob cut (chanel) no queixo, ondas nas pontas.",
        makeup: "Contorno suave na testa. Iluminador na mandíbula.",
        accessories: "Brincos em gota (largos na base) equilibram."
      }
    }
  },
  'Hexagonal': {
    description: "Maçãs largas, testa e queixo estreitos. Anguloso.",
    impression: "Sofisticação, exotismo, direção. Dramático.",
    temperament: "Misto (Sanguíneo/Colérico)",
    svgPath: <polygon points="50,15 85,50 50,85 15,50" stroke="currentColor" strokeWidth="2" fill="none" />,
    recommendations: {
      'Masculino': {
        hair: "Topetes com volume, laterais médias.",
        beard: "Barba preenche maxilar se queixo for muito pontudo.",
        accessories: "Óculos ovais ou retangulares suaves."
      },
      'Feminino': {
        hair: "Cortes que mostrem as maçãs, ou franjas laterais.",
        makeup: "Iluminar centro da testa/queixo. Suavizar ponta das maçãs.",
        accessories: "Argolas funcionam bem. Evite brincos muito finos."
      }
    }
  },
  'Coração': {
     description: "Triângulo invertido com pico da viúva arredondado.",
     impression: "Romantismo, sensibilidade e charme.",
     temperament: "Sanguíneo",
     svgPath: <path d="M50 80 C20 50 10 30 30 20 C40 15 50 30 50 30 C50 30 60 15 70 20 C90 30 80 50 50 80" stroke="currentColor" strokeWidth="2" fill="none" />,
     recommendations: {
        'Masculino': {
           hair: "Cortes que suavizem a testa. Franjas despojadas.",
           beard: "Barba cheia equilibra queixo estreito.",
           accessories: "Armações leves, sem aro ou metal fino."
        },
        'Feminino': {
           hair: "Longo com camadas no queixo. Curtain bangs.",
           makeup: "Foco nos olhos. Batons suaves.",
           accessories: "Brincos pendentes com volume na base."
        }
     }
  }
};

export const VisagismGuideModal: React.FC<VisagismGuideModalProps> = ({ isOpen, onClose }) => {
  const [selectedShape, setSelectedShape] = useState<FaceShapeKey>('Oval');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Consultoria Visagista Avançada"
      icon={BookOpen}
      sizeClass="max-w-7xl"
    >
      <div className="flex flex-col gap-6">
        
        {/* Intro Section */}
        <div className="bg-indigo-50 dark:bg-indigo-900/20 p-6 rounded-2xl border border-indigo-100 dark:border-indigo-800">
          <div className="flex items-start gap-4">
              <div className="p-3 bg-white dark:bg-slate-800 rounded-full shadow-sm">
                <Sparkles className="w-6 h-6 text-indigo-500" />
              </div>
              <div>
                <h4 className="font-bold text-indigo-900 dark:text-indigo-300 text-lg mb-1">
                    Harmonização Facial & Identidade
                </h4>
                <p className="text-sm text-indigo-800 dark:text-indigo-200 leading-relaxed max-w-3xl">
                    Cada formato de rosto expressa um temperamento. Use estas referências visuais para escolher cortes e acessórios que equilibrem suas proporções ou reforcem sua mensagem pessoal.
                </p>
              </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">
            {/* Sidebar: Face Shape Selector */}
            <div className="lg:col-span-3 space-y-2 lg:border-r lg:border-slate-100 dark:lg:border-slate-800 lg:pr-4">
                <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-2">Formatos</h5>
                <div className="grid grid-cols-2 lg:grid-cols-1 gap-2">
                    {(Object.keys(FACE_SHAPES) as FaceShapeKey[]).map((shape) => (
                        <button
                            key={shape}
                            onClick={() => setSelectedShape(shape)}
                            className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                                selectedShape === shape
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md transform scale-105'
                                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                            }`}
                        >
                            <div className={`w-6 h-6 flex-shrink-0 ${selectedShape === shape ? 'text-white' : 'text-slate-400'}`}>
                                <svg viewBox="0 0 100 100" className="w-full h-full fill-current opacity-20">
                                    {FACE_SHAPES[shape].svgPath}
                                </svg>
                            </div>
                            <span className="font-semibold text-sm truncate">{shape}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-9 flex flex-col gap-6">
                {/* Header Card */}
                <div className="flex items-center gap-6 p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden">
                    <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-indigo-50 dark:from-indigo-900/20 to-transparent pointer-events-none" />
                    
                    <div className="w-24 h-24 flex-shrink-0 text-indigo-600 dark:text-indigo-400 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-full border-4 border-white dark:border-slate-800 shadow-xl">
                        <svg viewBox="0 0 100 100" className="w-full h-full stroke-current fill-none" strokeWidth="3">
                            {FACE_SHAPES[selectedShape].svgPath}
                        </svg>
                    </div>
                    
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">{selectedShape}</h2>
                            <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-xs font-bold text-slate-500 uppercase tracking-wide">
                                {FACE_SHAPES[selectedShape].temperament}
                            </span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-400 text-lg leading-relaxed">
                            {FACE_SHAPES[selectedShape].description}
                        </p>
                        <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400 mt-2">
                            Mensagem: {FACE_SHAPES[selectedShape].impression}
                        </p>
                    </div>
                </div>

                {/* Comparison Grid */}
                <div className="grid md:grid-cols-2 gap-6">
                    {/* Masculine Column */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 pb-2 border-b-2 border-slate-200 dark:border-slate-700">
                            <User className="w-5 h-5 text-blue-600" />
                            <h3 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-sm">Masculino</h3>
                        </div>
                        
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-4 hover:border-blue-200 transition-colors">
                            <div className="flex gap-3">
                                <Scissors className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                                <div>
                                    <h5 className="font-bold text-slate-800 dark:text-slate-200 text-sm">Cabelo</h5>
                                    <p className="text-slate-600 dark:text-slate-400 text-sm">{FACE_SHAPES[selectedShape].recommendations.Masculino.hair}</p>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <Smile className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                                <div>
                                    <h5 className="font-bold text-slate-800 dark:text-slate-200 text-sm">Barba</h5>
                                    <p className="text-slate-600 dark:text-slate-400 text-sm">{FACE_SHAPES[selectedShape].recommendations.Masculino.beard}</p>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <Glasses className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                                <div>
                                    <h5 className="font-bold text-slate-800 dark:text-slate-200 text-sm">Óculos</h5>
                                    <p className="text-slate-600 dark:text-slate-400 text-sm">{FACE_SHAPES[selectedShape].recommendations.Masculino.accessories}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Feminine Column */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 pb-2 border-b-2 border-slate-200 dark:border-slate-700">
                            <User className="w-5 h-5 text-pink-600" />
                            <h3 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-sm">Feminino</h3>
                        </div>

                        <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-4 hover:border-pink-200 transition-colors">
                            <div className="flex gap-3">
                                <Scissors className="w-5 h-5 text-pink-500 flex-shrink-0 mt-0.5" />
                                <div>
                                    <h5 className="font-bold text-slate-800 dark:text-slate-200 text-sm">Cabelo</h5>
                                    <p className="text-slate-600 dark:text-slate-400 text-sm">{FACE_SHAPES[selectedShape].recommendations.Feminino.hair}</p>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <Palette className="w-5 h-5 text-pink-500 flex-shrink-0 mt-0.5" />
                                <div>
                                    <h5 className="font-bold text-slate-800 dark:text-slate-200 text-sm">Maquiagem</h5>
                                    <p className="text-slate-600 dark:text-slate-400 text-sm">{FACE_SHAPES[selectedShape].recommendations.Feminino.makeup}</p>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <Glasses className="w-5 h-5 text-pink-500 flex-shrink-0 mt-0.5" />
                                <div>
                                    <h5 className="font-bold text-slate-800 dark:text-slate-200 text-sm">Acessórios</h5>
                                    <p className="text-slate-600 dark:text-slate-400 text-sm">{FACE_SHAPES[selectedShape].recommendations.Feminino.accessories}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </Modal>
  );
};