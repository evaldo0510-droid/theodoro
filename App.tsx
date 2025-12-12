import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, Upload, Share2, Sparkles, User as UserIcon, 
  Loader2, Download, LogOut, X, Menu, SwitchCamera,
  Check, Plus, Trash2, ArrowRight, Layout, Grid, SplitSquareHorizontal,
  BookOpen, Wand2, Eye, ScanFace, Timer, Heart, Edit3, Grid3X3, RefreshCw,
  Info, ShoppingBag, ExternalLink, Palette, Sun, Snowflake
} from 'lucide-react';
import { Onboarding } from './components/Onboarding';
import { AuthModal } from './components/AuthModal';
import { Modal } from './components/Modal';
import { VisagismGuideModal } from './components/VisagismGuideModal';
import { TeodoroProfile } from './components/TeodoroProfile';
import { ComparisonView } from './components/ComparisonView';
import { analyzeImageWithGemini, generateVisualEdit } from './services/geminiService';
import type { AnalysisResult, OutfitSuggestion, UserRole, SkinTone, ColorPalette, UserMetrics } from './types';

// Constants for Skin Tone Logic (Reused)
const SKIN_TONE_DATA: Record<SkinTone, { description: string; palettes: ColorPalette[]; makeup: string }> = {
    'Quente': {
        description: "Pele com fundo amarelado ou dourado. Bronzeia-se facilmente.",
        palettes: [
            { hex: "#D4AF37", nome: "Dourado" }, { hex: "#FF7F50", nome: "Coral" },
            { hex: "#8B4513", nome: "Terra" }, { hex: "#556B2F", nome: "Verde Oliva" }
        ],
        makeup: "Tons terrosos, pêssego, dourado e bronzer. Batons alaranjados ou vermelhos quentes."
    },
    'Frio': {
        description: "Pele com fundo rosado ou azulado. Queima-se facilmente ao sol.",
        palettes: [
            { hex: "#000080", nome: "Azul Marinho" }, { hex: "#C0C0C0", nome: "Prata" },
            { hex: "#800080", nome: "Roxo" }, { hex: "#DC143C", nome: "Vermelho Cereja" }
        ],
        makeup: "Tons de rosa, prata, cinza e azul. Batons em tons de frutas vermelhas ou rosa frio."
    },
    'Neutro': {
        description: "Equilíbrio entre quente e frio. Versátil com quase todas as cores.",
        palettes: [
            { hex: "#40E0D0", nome: "Turquesa" }, { hex: "#FF69B4", nome: "Rosa Médio" },
            { hex: "#F5F5DC", nome: "Bege" }, { hex: "#708090", nome: "Cinza Ardósia" }
        ],
        makeup: "Pode transitar entre tons quentes e frios. Foco em iluminar naturalmente."
    },
    'Oliva': {
        description: "Fundo esverdeado ou amarelado frio. Comum em peles médias a escuras.",
        palettes: [
            { hex: "#2F4F4F", nome: "Verde Escuro" }, { hex: "#800000", nome: "Vinho" },
            { hex: "#4B0082", nome: "Índigo" }, { hex: "#DAA520", nome: "Ocre" }
        ],
        makeup: "Tons de ameixa, beringela e metálicos profundos. Evite tons pastéis muito claros."
    }
};

// Simple Toast Component (Internal)
const Toast = ({ msg, type }: { msg: string, type: 'success' | 'error' }) => (
  <div className={`fixed top-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg shadow-lg text-white font-medium z-[1000] animate-fade-in ${
    type === 'success' ? 'bg-green-600' : 'bg-red-600'
  }`}>
    {msg}
  </div>
);

export default function App() {
  const [user, setUser] = useState<{ displayName: string | null; email: string | null; photoURL: string | null; uid: string } | null>(null);
  const [image, setImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  
  // User Metrics (Input before analysis)
  const [metrics, setMetrics] = useState<UserMetrics>({ height: '', weight: '' });
  
  // Skin Tone State
  const [currentSkinTone, setCurrentSkinTone] = useState<SkinTone>('Neutro');
  
  // States required for Dossier
  const [isGeneratingDossier, setIsGeneratingDossier] = useState(false);
  
  // States for Comparison Feature
  const [selectedOutfits, setSelectedOutfits] = useState<OutfitSuggestion[]>([]);
  const [showComparison, setShowComparison] = useState(false);
  const [isGeneratingComparison, setIsGeneratingComparison] = useState(false);

  // States for Outfit Generation (Virtual Try-On)
  const [generatingOutfitIndex, setGeneratingOutfitIndex] = useState<number | null>(null);
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);
  const [viewingOutfitIndex, setViewingOutfitIndex] = useState<number | null>(null);
  const [refinementPrompt, setRefinementPrompt] = useState("");
  const [isRefining, setIsRefining] = useState(false);

  // States for Visagism Guide & Teodoro Profile
  const [showVisagismGuide, setShowVisagismGuide] = useState(false);
  const [showTeodoroProfile, setShowTeodoroProfile] = useState(false);

  // Camera States
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [isFlashing, setIsFlashing] = useState(false);
  const [timerDuration, setTimerDuration] = useState<0 | 3 | 10>(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [showGrid, setShowGrid] = useState(false);
  const [colorTemp, setColorTemp] = useState<number>(0); // Range: -50 (Cool) to 50 (Warm)
  const videoRef = useRef<HTMLVideoElement>(null);

  // UI States
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [showAuth, setShowAuth] = useState(false);
  const [toast, setToast] = useState<{ msg: string, type: 'success'|'error' } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper: Toast
  const addToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Helper: Save Image
  const handleSaveOrShareImage = async (dataUrl: string, filename: string) => {
    try {
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = `${filename}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        addToast("Imagem salva com sucesso!", "success");
    } catch (e) {
        console.error(e);
        addToast("Erro ao salvar imagem", "error");
    }
  };

  // Helper: Get Color Overlay Style based on Temperature
  const getTempOverlayColor = (temp: number) => {
      if (temp === 0) return 'rgba(0,0,0,0)';
      
      // Calculate intensity (0 to 0.4 opacity max)
      const intensity = Math.abs(temp) / 100 * 0.8; 
      
      if (temp > 0) {
          // Warm: Amber/Orange
          return `rgba(255, 160, 20, ${intensity})`;
      } else {
          // Cool: Deep Sky Blue
          return `rgba(20, 120, 255, ${intensity})`;
      }
  };

  // Centralized Analysis Logic
  const runAnalysis = async (base64Image: string) => {
    setIsAnalyzing(true);
    setAnalysisResult(null);
    setSelectedOutfits([]); 
    try {
      const rawBase64 = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;
      const result = await analyzeImageWithGemini(rawBase64, metrics, undefined);
      setAnalysisResult(result);
      if (result.tom_pele_detectado) {
          setCurrentSkinTone(result.tom_pele_detectado);
      }
      addToast("Análise do Atelier concluída!", "success");
    } catch (err: any) {
      console.error(err);
      addToast(err.message || "Erro na análise", "error");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      setImage(base64);
      await runAnalysis(base64);
    };
    reader.readAsDataURL(file);
  };

  // --- SKIN TONE UPDATE LOGIC ---
  const handleSkinToneChange = (tone: SkinTone) => {
      if (!analysisResult) return;
      setCurrentSkinTone(tone);
      const updatedData = SKIN_TONE_DATA[tone];
      const newResult = { 
          ...analysisResult,
          analise_pele: `Tom Ajustado Manualmente: ${tone}. ${updatedData.description}`,
          paleta_cores: updatedData.palettes,
          visagismo: {
              ...analysisResult.visagismo,
              barba_ou_make: {
                  ...analysisResult.visagismo.barba_ou_make,
                  detalhes: updatedData.makeup,
                  motivo: `Recalculado para subtom ${tone}`
              }
          }
      };
      setAnalysisResult(newResult);
      addToast(`Paleta recalculada para: ${tone}`, "success");
  };

  // --- OUTFIT GENERATION & REFINEMENT ---
  const handleGenerateLook = async (index: number, outfit: OutfitSuggestion, customRefinement?: string, silent = false) => {
    if (!image || !analysisResult) return;
    
    if (customRefinement) {
        setIsRefining(true);
    } else {
        setGeneratingOutfitIndex(index);
    }

    try {
        const rawBase64 = image.includes(',') ? image.split(',')[1] : image;
        
        // Construct prompt using Teodoro's style
        const modificationPrompt = `Expert Tailor Request: Wear high-fashion outfit: ${outfit.titulo}. Details: ${outfit.detalhes}. Style: ${outfit.ocasiao}. Perfectly fit for biotype: ${analysisResult.biotipo}. Maintain sophisticated look. Keep face identity and pose.`;
        
        const generatedImage = await generateVisualEdit(
            rawBase64,
            "clothing", 
            modificationPrompt,
            outfit.visagismo_sugerido,
            { biotype: analysisResult.biotipo, palette: "harmonious" },
            customRefinement
        );

        // Update state logic must handle concurrent updates for batch processing
        setAnalysisResult((prev) => {
            if (!prev) return null;
            const newSuggestions = [...prev.sugestoes_roupa];
            newSuggestions[index] = { 
                ...outfit, 
                generatedImage: `data:image/png;base64,${generatedImage.includes('base64,') ? generatedImage.split(',')[1] : generatedImage}`,
                lastModificationPrompt: customRefinement
            };
            return { ...prev, sugestoes_roupa: newSuggestions };
        });
        
        if (customRefinement) {
             setRefinementPrompt(""); 
             addToast("Look refinado sob medida!", "success");
        } else if (!silent) {
             addToast("Look gerado com sucesso!", "success");
             setViewingOutfitIndex(index);
        }

    } catch (e: any) {
        console.error(e);
        if (!silent) addToast(e.message || "Erro ao gerar visualização do look.", "error");
    } finally {
        if (!silent) setGeneratingOutfitIndex(null);
        setIsRefining(false);
    }
  };

  // --- BATCH GENERATION ---
  const handleGenerateAllLooks = async () => {
      if (!analysisResult) return;
      setIsGeneratingAll(true);
      addToast("Iniciando Provador Mágico...", "success");

      // Generate sequentially to avoid rate limits or overwhelming the client
      for (let i = 0; i < analysisResult.sugestoes_roupa.length; i++) {
          const outfit = analysisResult.sugestoes_roupa[i];
          if (!outfit.generatedImage) {
              setGeneratingOutfitIndex(i);
              await handleGenerateLook(i, outfit, undefined, true);
          }
      }
      
      setGeneratingOutfitIndex(null);
      setIsGeneratingAll(false);
      addToast("Todos os provadores liberados!", "success");
  };

  // --- SHARE LOOK LOGIC ---
  const handleShareLook = async (outfit: OutfitSuggestion) => {
    if (!image) return;
    addToast("Preparando imagem do atelier...", "success");
    try {
        const canvas = document.createElement('canvas');
        canvas.width = 1080;
        canvas.height = 1080;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Load Images
        const originalImg = new Image();
        originalImg.crossOrigin = "anonymous";
        originalImg.src = image;
        await new Promise(r => originalImg.onload = r);

        // Draw Images
        if (outfit.generatedImage) {
            const genImg = new Image();
            genImg.crossOrigin = "anonymous";
            genImg.src = outfit.generatedImage;
            await new Promise(r => genImg.onload = r);
            ctx.drawImage(originalImg, 0, 0, 540, 800, 0, 0, 540, 800); 
            ctx.drawImage(genImg, 0, 0, 540, 800, 540, 0, 540, 800);
        } else {
             ctx.drawImage(originalImg, 0, 0, 1080, 800);
        }
        
        // Footer Overlay - Styled for Teodoro
        ctx.fillStyle = "#0f172a"; // Dark Slate
        ctx.fillRect(0, 800, 1080, 280);
        
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 40px 'Inter', sans-serif";
        ctx.fillText(outfit.titulo, 50, 860);
        
        ctx.font = "italic 30px 'Times New Roman', serif"; // Serif font for elegance
        ctx.fillStyle = "#a5b4fc";
        ctx.fillText(`Teodoro Atelier • ${outfit.ocasiao.toUpperCase()}`, 50, 910);
        
        ctx.font = "24px 'Inter', sans-serif";
        ctx.fillStyle = "#94a3b8";
        
        const words = outfit.detalhes.split(' ');
        let line = '';
        let y = 960;
        for (let n = 0; n < words.length; n++) {
             if (ctx.measureText(line + words[n]).width > 980) {
                 ctx.fillText(line, 50, y);
                 line = words[n] + ' ';
                 y += 35;
             } else {
                 line += words[n] + ' ';
             }
        }
        ctx.fillText(line, 50, y);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        
        if (navigator.share) {
             const blob = await (await fetch(dataUrl)).blob();
             const file = new File([blob], "vizu-teodoro-look.jpg", { type: "image/jpeg" });
             await navigator.share({
                 title: `Vizu x Teodoro: ${outfit.titulo}`,
                 text: `Sugestão sob medida do Atelier Teodoro: ${outfit.detalhes}`,
                 files: [file]
             });
        } else {
             await handleSaveOrShareImage(dataUrl, `Vizu-Teodoro-${outfit.titulo.replace(/\s/g,'-')}`);
        }

    } catch (e) {
        console.error(e);
        addToast("Erro ao compartilhar. Tente salvar.", "error");
    }
  };

  const toggleOutfitFavorite = (index: number) => {
    if (!analysisResult) return;
    const newSuggestions = [...analysisResult.sugestoes_roupa];
    newSuggestions[index] = { 
        ...newSuggestions[index], 
        isFavorite: !newSuggestions[index].isFavorite 
    };
    setAnalysisResult({ ...analysisResult, sugestoes_roupa: newSuggestions });
  };

  const updateOutfitNote = (index: number, note: string) => {
      if (!analysisResult) return;
      const newSuggestions = [...analysisResult.sugestoes_roupa];
      newSuggestions[index] = { 
          ...newSuggestions[index], 
          userNote: note 
      };
      setAnalysisResult({ ...analysisResult, sugestoes_roupa: newSuggestions });
  };

  // --- CAMERA LOGIC ---
  const startCamera = async (mode: 'user' | 'environment' = 'user') => {
    try {
      if (videoRef.current && videoRef.current.srcObject) {
         const stream = videoRef.current.srcObject as MediaStream;
         stream.getTracks().forEach(track => track.stop());
      }
      setIsCameraOpen(true);
      setFacingMode(mode);
      setTimeout(async () => {
          try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: mode, width: { ideal: 1920 }, height: { ideal: 1080 } } 
            });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
          } catch (innerErr) {
             console.error("Camera error:", innerErr);
             addToast("Erro ao iniciar câmera.", "error");
             setIsCameraOpen(false);
          }
      }, 100);
    } catch (err) {
      console.error(err);
      addToast("Erro de permissão.", "error");
      setIsCameraOpen(false);
    }
  };

  const switchCamera = () => {
      const newMode = facingMode === 'user' ? 'environment' : 'user';
      startCamera(newMode);
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraOpen(false);
    setCountdown(null);
    setColorTemp(0); // Reset temp
  };

  const capturePhoto = () => {
    setIsFlashing(true);
    setTimeout(() => setIsFlashing(false), 150);

    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        if (facingMode === 'user') {
            ctx.translate(canvas.width, 0);
            ctx.scale(-1, 1);
        }
        ctx.drawImage(videoRef.current, 0, 0);

        // --- Apply Color Temp Burn-in ---
        if (colorTemp !== 0) {
            ctx.globalCompositeOperation = 'overlay'; // Blend mode similar to CSS
            ctx.fillStyle = getTempOverlayColor(colorTemp);
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.globalCompositeOperation = 'source-over'; // Reset
        }

        const base64 = canvas.toDataURL('image/jpeg', 0.9);
        setTimeout(() => {
            setImage(base64);
            stopCamera();
            runAnalysis(base64);
        }, 200);
      }
    }
  };

  const handleCaptureClick = () => {
     if (timerDuration === 0) capturePhoto();
     else setCountdown(timerDuration);
  };

  useEffect(() => {
    if (countdown === null) return;
    if (countdown > 0) {
      const timerId = setTimeout(() => setCountdown(prev => prev! - 1), 1000);
      return () => clearTimeout(timerId);
    } 
    if (countdown === 0) {
       capturePhoto();
       setCountdown(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countdown]);

  const toggleOutfitSelection = (outfit: OutfitSuggestion) => {
    const isSelected = selectedOutfits.some(o => o.titulo === outfit.titulo);
    if (isSelected) {
        setSelectedOutfits(prev => prev.filter(o => o.titulo !== outfit.titulo));
    } else {
        if (selectedOutfits.length >= 3) {
            addToast("Selecione no máximo 3 looks.", "error");
            return;
        }
        setSelectedOutfits(prev => [...prev, outfit]);
    }
  };

  const handleExportComparison = async () => {
    if (selectedOutfits.length === 0) return;
    setIsGeneratingComparison(true);
    try {
        const canvas = document.createElement('canvas');
        canvas.width = 1920;
        canvas.height = 1080; 
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        // Header Teodoro Style
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
        gradient.addColorStop(0, "#1e1b4b"); // Indigo 950
        gradient.addColorStop(1, "#312e81"); // Indigo 900
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, 150);
        
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 50px 'Inter', sans-serif";
        ctx.textAlign = "center";
        const userName = user?.displayName ? user.displayName.toUpperCase().split(' ')[0] : 'CLIENTE';
        ctx.fillText("FERNANDO THEODORO & VIZU", canvas.width / 2, 70);
        
        ctx.font = "italic 30px 'Inter', sans-serif";
        ctx.fillStyle = "rgba(255,255,255,0.8)";
        ctx.fillText(`ANÁLISE SOB MEDIDA PARA ${userName}`, canvas.width / 2, 115);
        
        const count = selectedOutfits.length;
        const colWidth = canvas.width / count;
        const startY = 210;
        const margin = 40;

        selectedOutfits.forEach((outfit, index) => {
             const colX = index * colWidth;
             const contentX = colX + margin;
             
             // Simple representation for canvas export (abbreviated for file size limits, in real app would draw full details)
             ctx.fillStyle = "#1e293b";
             ctx.font = "bold 30px 'Inter', sans-serif";
             ctx.textAlign = "left";
             ctx.fillText(outfit.titulo, contentX, startY);
        });

        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        await handleSaveOrShareImage(dataUrl, `Vizu-Theodoro-Board-${userName}`);
    } catch (e) {
        addToast("Erro ao gerar comparativo", "error");
    } finally {
        setIsGeneratingComparison(false);
    }
  };

  const handleExportAnalysis = async () => {
    if (!analysisResult) return;
    setIsGeneratingDossier(true);
    try {
        const canvas = document.createElement('canvas');
        canvas.width = 1080;
        canvas.height = 1920; 
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = "#1e1b4b"; // Darker bespoke branding
        ctx.fillRect(0, 0, canvas.width, 220);
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 60px 'Inter', sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(`DOSSIÊ SOB MEDIDA`, canvas.width / 2, 100);
        ctx.font = "italic 40px 'Inter', sans-serif";
        ctx.fillText(`Curadoria por Fernando Theodoro`, canvas.width / 2, 160);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        await handleSaveOrShareImage(dataUrl, `Vizu-Dossier-Theodoro`);
    } catch (e) {
        addToast("Erro ao gerar dossiê", "error");
    } finally {
        setIsGeneratingDossier(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans transition-colors duration-300 pb-24">
      {/* Navbar */}
      <div className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
             <div className="bg-indigo-600 rounded-lg p-1.5">
                 <Sparkles className="w-5 h-5 text-white" />
             </div>
             <div>
                 <h1 className="text-lg font-bold text-slate-900 dark:text-white leading-none">
                    Vizu <span className="text-indigo-600 font-serif italic">& Theodoro</span>
                 </h1>
                 <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Atelier Digital</p>
             </div>
          </div>

          <div className="flex items-center gap-2">
             <button
               onClick={() => setShowTeodoroProfile(true)}
               className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors mr-1"
             >
                <Info className="w-4 h-4" />
                <span className="hidden sm:inline">O Especialista</span>
             </button>

             <button
               onClick={() => setShowVisagismGuide(true)}
               className="hidden md:flex items-center gap-2 px-4 py-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 rounded-full hover:bg-indigo-100 transition-colors border border-indigo-100 dark:border-indigo-800"
             >
               <BookOpen className="w-4 h-4" />
               Guia Visagismo
             </button>
             
             <button 
                onClick={() => setShowAuth(true)}
                className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
             >
                {user ? (
                <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-bold">
                    {user.displayName ? user.displayName[0] : 'U'}
                </div>
                ) : (
                <UserIcon className="w-6 h-6 text-slate-600 dark:text-slate-400" />
                )}
             </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-5xl">
         {/* Welcome / Upload Section */}
         {!image && !isCameraOpen && (
             <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8 animate-fade-in relative">
                 {/* Decorative background element */}
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[100px] -z-10 pointer-events-none"></div>

                 <h2 className="text-4xl md:text-6xl font-bold text-slate-900 dark:text-white leading-tight font-serif">
                    Fernando Theodoro <span className="italic text-indigo-600">& Vizu</span>
                 </h2>
                 <p className="text-lg md:text-xl font-medium text-slate-800 dark:text-slate-200 italic font-serif">
                    "Penso no fator humano primeiro e a tecnologia depois."
                 </p>
                 <p className="text-slate-600 dark:text-slate-300 text-base max-w-lg leading-relaxed mt-2">
                    Seu visual sob medida na alfaiataria do futuro.
                 </p>
                 
                 {/* User Metrics Input */}
                 <div className="w-full max-w-md bg-white dark:bg-slate-900 p-4 rounded-xl shadow-md border border-slate-200 dark:border-slate-800 mt-6 grid grid-cols-2 gap-4">
                     <div>
                         <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Altura (m)</label>
                         <input 
                            type="number" 
                            step="0.01"
                            placeholder="Ex: 1.75"
                            value={metrics.height}
                            onChange={(e) => setMetrics({...metrics, height: e.target.value})}
                            className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                         />
                     </div>
                     <div>
                         <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Peso (kg)</label>
                         <input 
                            type="number" 
                            placeholder="Ex: 80"
                            value={metrics.weight}
                            onChange={(e) => setMetrics({...metrics, weight: e.target.value})}
                            className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                         />
                     </div>
                 </div>

                 <div className="flex flex-col sm:flex-row gap-4 mt-4">
                    <button 
                       onClick={() => fileInputRef.current?.click()}
                       className="flex items-center justify-center gap-3 px-8 py-4 bg-slate-900 hover:bg-black text-white rounded-2xl font-bold shadow-xl shadow-slate-500/20 transition-all hover:scale-105"
                    >
                       <Upload className="w-5 h-5" />
                       Carregar Foto
                    </button>
                    
                    <button 
                       onClick={() => startCamera('user')}
                       className="flex items-center justify-center gap-3 px-8 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700 rounded-2xl font-bold transition-all hover:scale-105"
                    >
                       <Camera className="w-5 h-5" />
                       Espelho Digital
                    </button>

                    <input 
                       ref={fileInputRef}
                       type="file" 
                       accept="image/*"
                       className="hidden"
                       onChange={handleImageUpload}
                    />
                 </div>

                 {/* Teodoro Badge */}
                 <div 
                    onClick={() => setShowTeodoroProfile(true)}
                    className="mt-8 flex items-center gap-3 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-full border border-indigo-100 dark:border-indigo-800 cursor-pointer hover:bg-indigo-100 transition-colors"
                 >
                     <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-serif font-bold">T</div>
                     <div className="text-left">
                         <p className="text-[10px] uppercase font-bold text-indigo-500">Curadoria</p>
                         <p className="text-xs font-bold text-indigo-900 dark:text-indigo-200">Conheça Fernando</p>
                     </div>
                 </div>
             </div>
         )}

         {/* Full Screen Camera View */}
         {isCameraOpen && (
             <div className="fixed inset-0 z-[60] bg-black flex flex-col">
                 <div className="relative flex-1 overflow-hidden group/camera">
                    <video 
                      ref={videoRef} 
                      autoPlay 
                      playsInline 
                      muted 
                      className={`w-full h-full object-cover transition-transform duration-300 ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
                    />
                    
                    {/* Live Filter Overlay */}
                    <div 
                        className="absolute inset-0 pointer-events-none transition-colors duration-100 mix-blend-overlay"
                        style={{ backgroundColor: getTempOverlayColor(colorTemp) }}
                    />
                    
                    <div className={`absolute inset-0 bg-white pointer-events-none transition-opacity duration-150 ${isFlashing ? 'opacity-100' : 'opacity-0'}`} />

                    {/* Countdown Overlay */}
                    {countdown !== null && (
                        <div className="absolute inset-0 flex items-center justify-center z-50 bg-black/20 backdrop-blur-sm animate-in fade-in zoom-in duration-300">
                            <span className="text-9xl font-black text-white drop-shadow-2xl animate-pulse">
                                {countdown}
                            </span>
                        </div>
                    )}

                    {/* Grid Overlay */}
                    {showGrid && (
                        <div className="absolute inset-0 pointer-events-none z-10 grid grid-cols-3 grid-rows-3 opacity-30">
                            <div className="border-r border-b border-white"></div>
                            <div className="border-r border-b border-white"></div>
                            <div className="border-b border-white"></div>
                            <div className="border-r border-b border-white"></div>
                            <div className="border-r border-b border-white"></div>
                            <div className="border-b border-white"></div>
                            <div className="border-r border-white"></div>
                            <div className="border-r border-white"></div>
                            <div className=""></div>
                        </div>
                    )}

                    {/* Face Guide */}
                    <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center opacity-40">
                        <div className="w-[280px] h-[380px] border-2 border-white/50 rounded-[50%] border-dashed shadow-2xl"></div>
                        <p className="text-white/80 mt-4 text-sm font-medium bg-black/20 px-3 py-1 rounded-full backdrop-blur-sm">
                            Posicione o rosto no centro
                        </p>
                    </div>

                    {/* Top Controls */}
                    <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-start z-20 bg-gradient-to-b from-black/60 to-transparent h-24">
                        <button 
                           onClick={stopCamera}
                           className="p-3 bg-black/20 text-white rounded-full backdrop-blur-md hover:bg-black/40 transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>

                        <div className="flex gap-4">
                            <button 
                               onClick={() => setShowGrid(!showGrid)}
                               className={`p-3 rounded-full backdrop-blur-md transition-all ${
                                   showGrid ? 'bg-indigo-600 text-white' : 'bg-black/20 text-white hover:bg-black/40'
                               }`}
                            >
                                <Grid3X3 className="w-5 h-5" />
                            </button>
                            <button 
                               onClick={() => setTimerDuration(prev => prev === 0 ? 3 : prev === 3 ? 10 : 0)}
                               className={`flex items-center gap-1.5 px-3 py-2 rounded-full backdrop-blur-md transition-all ${
                                   timerDuration > 0 ? 'bg-indigo-600 text-white' : 'bg-black/20 text-white hover:bg-black/40'
                               }`}
                            >
                                <Timer className="w-5 h-5" />
                                <span className="text-sm font-bold w-4">{timerDuration > 0 ? timerDuration : ''}</span>
                            </button>
                        </div>
                    </div>

                    {/* Bottom Controls */}
                    <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex flex-col justify-end pb-8 z-20">
                        
                        {/* Temp Slider */}
                        <div className="flex items-center justify-center gap-4 mb-6 px-8">
                            <Snowflake className={`w-4 h-4 ${colorTemp < 0 ? 'text-blue-400' : 'text-white/50'}`} />
                            <input 
                                type="range" 
                                min="-50" 
                                max="50" 
                                value={colorTemp}
                                onChange={(e) => setColorTemp(parseInt(e.target.value))}
                                className="w-64 h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-white hover:accent-indigo-400"
                            />
                            <Sun className={`w-4 h-4 ${colorTemp > 0 ? 'text-orange-400' : 'text-white/50'}`} />
                        </div>

                        <div className="flex items-center justify-around px-8">
                            <button 
                                onClick={() => { stopCamera(); fileInputRef.current?.click(); }}
                                className="w-12 h-12 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white/80 hover:bg-white/20 transition-all"
                            >
                                <Upload className="w-5 h-5" />
                            </button>
                            <button 
                            onClick={handleCaptureClick}
                            disabled={countdown !== null}
                            className={`w-20 h-20 rounded-full border-4 border-white flex items-center justify-center transition-all shadow-lg ${
                                countdown !== null ? 'bg-red-500 scale-90' : 'bg-white/20 hover:bg-white/40 active:scale-95'
                            }`}
                            >
                                <div className={`w-16 h-16 bg-white rounded-full transition-all ${countdown !== null ? 'animate-pulse' : ''}`}></div>
                            </button>
                            <button 
                                onClick={switchCamera}
                                className="w-12 h-12 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white/80 hover:bg-white/20 hover:rotate-180 transition-all duration-500"
                            >
                                <SwitchCamera className="w-6 h-6" />
                            </button>
                        </div>
                    </div>
                 </div>
             </div>
         )}

         {/* Analysis View */}
         {image && (
             <div className="animate-fade-in space-y-8">
                 <div className="flex flex-col md:flex-row gap-8 items-start">
                     <div className="w-full md:w-1/3 space-y-4">
                         <div className="relative aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl bg-slate-200 dark:bg-slate-800 border-2 border-indigo-600/20">
                             <img src={image} alt="User" className="w-full h-full object-cover" />
                             <button 
                               onClick={() => setImage(null)}
                               className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                             >
                                <X className="w-4 h-4" />
                             </button>
                             {/* Teodoro Stamp */}
                             <div className="absolute bottom-4 left-4 px-3 py-1 bg-black/60 backdrop-blur-md rounded-lg border border-white/10 text-white text-[10px] font-bold uppercase tracking-widest">
                                 Em Análise
                             </div>
                         </div>
                     </div>

                     <div className="w-full md:w-2/3 space-y-6">
                         {isAnalyzing ? (
                             <div className="flex flex-col items-center justify-center h-64 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
                                 <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
                                 <p className="text-slate-500 dark:text-slate-400 font-medium animate-pulse">
                                     Teodoro está analisando suas proporções...
                                 </p>
                             </div>
                         ) : analysisResult ? (
                             <>
                                 {/* Summary Card */}
                                 <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 space-y-6 relative overflow-hidden">
                                     {/* Decorative accent */}
                                     <div className="absolute top-0 left-0 w-1 h-full bg-indigo-600"></div>

                                     <div>
                                         <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2 font-serif">O Veredito do Especialista</h3>
                                         <div className="grid grid-cols-2 gap-4">
                                             <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                                                 <span className="text-xs text-slate-400 uppercase font-bold">Rosto</span>
                                                 <p className="font-semibold text-slate-700 dark:text-slate-200">{analysisResult.formato_rosto_detalhado}</p>
                                             </div>
                                             <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                                                  <span className="text-xs text-slate-400 uppercase font-bold">Biotipo</span>
                                                  <p className="font-semibold text-slate-700 dark:text-slate-200 line-clamp-1">
                                                      {analysisResult.biotipo || "Em análise"}
                                                  </p>
                                             </div>
                                         </div>
                                     </div>
                                     
                                     <div className="space-y-4">
                                        <div className="bg-orange-50 dark:bg-orange-900/10 p-4 rounded-xl border border-orange-100 dark:border-orange-900/20">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="flex items-center gap-2">
                                                    <Palette className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                                                    <h4 className="font-bold text-orange-800 dark:text-orange-200 text-sm">Refinamento de Tom de Pele</h4>
                                                </div>
                                                <span className="text-[10px] text-orange-600/70 dark:text-orange-300/70 font-semibold bg-orange-100 dark:bg-orange-900/30 px-2 py-0.5 rounded-full">
                                                    Ajuste Manual
                                                </span>
                                            </div>

                                            {/* Interactive Skin Tone Buttons */}
                                            <div className="flex flex-wrap gap-2 mb-4">
                                                {Object.keys(SKIN_TONE_DATA).map((tone) => (
                                                    <button
                                                        key={tone}
                                                        onClick={() => handleSkinToneChange(tone as SkinTone)}
                                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center gap-1.5 ${
                                                            currentSkinTone === tone
                                                            ? 'bg-orange-600 text-white border-orange-600 shadow-md transform scale-105'
                                                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-orange-300 dark:hover:border-orange-700'
                                                        }`}
                                                    >
                                                        <div className={`w-2 h-2 rounded-full ${
                                                            currentSkinTone === tone ? 'bg-white' : 'bg-orange-500/50'
                                                        }`} />
                                                        {tone}
                                                    </button>
                                                ))}
                                            </div>

                                            <div className="p-3 bg-white/60 dark:bg-black/20 rounded-lg mb-3">
                                                 <p className="text-slate-600 dark:text-slate-300 text-xs italic leading-relaxed">
                                                     "{analysisResult.analise_pele}"
                                                 </p>
                                            </div>
                                            
                                            <div className="mt-3">
                                                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase block mb-2">Paleta Sugerida (Recalculada)</span>
                                                <div className="flex gap-3">
                                                    {analysisResult.paleta_cores.map((color, idx) => (
                                                        <div key={idx} className="group relative">
                                                            <div className="w-10 h-10 rounded-xl border-2 border-white dark:border-slate-700 shadow-sm transition-transform hover:scale-110" style={{ backgroundColor: color.hex }} />
                                                            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black/80 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-opacity z-10">
                                                                {color.nome}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <h4 className="font-bold text-slate-700 dark:text-slate-200 text-sm mb-1">Geometria Corporal</h4>
                                            <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-sm text-justify">
                                                 {analysisResult.analise_corporal}
                                            </p>
                                        </div>
                                     </div>

                                     <button 
                                         onClick={handleExportAnalysis}
                                         disabled={isGeneratingDossier}
                                         className="w-full py-3 bg-slate-900 dark:bg-white hover:opacity-90 text-white dark:text-slate-900 rounded-xl font-bold transition-all flex items-center justify-center gap-2 text-sm shadow-lg"
                                     >
                                         {isGeneratingDossier ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                                         Baixar Dossiê Teodoro
                                     </button>
                                 </div>

                                 {/* OUTFIT LIST SECTION */}
                                 <div className="space-y-4">
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                        <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                            <Grid className="w-5 h-5 text-indigo-500" />
                                            Seleção Sob Medida
                                        </h3>
                                        
                                        {/* Generate All Button */}
                                        <button 
                                            onClick={handleGenerateAllLooks}
                                            disabled={isGeneratingAll || generatingOutfitIndex !== null}
                                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg flex items-center gap-2 shadow-lg disabled:opacity-50 transition-all"
                                        >
                                            {isGeneratingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                                            Provador Mágico (Gerar Todos)
                                        </button>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {analysisResult.sugestoes_roupa.map((outfit, idx) => {
                                            const isSelected = selectedOutfits.some(o => o.titulo === outfit.titulo);
                                            const isGeneratingThis = generatingOutfitIndex === idx;

                                            return (
                                                <div 
                                                    key={idx}
                                                    onClick={() => toggleOutfitSelection(outfit)}
                                                    className={`relative p-5 rounded-2xl border-2 transition-all cursor-pointer group flex flex-col justify-between ${
                                                        isSelected 
                                                        ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20' 
                                                        : 'border-transparent bg-white dark:bg-slate-900 hover:border-slate-200 dark:hover:border-slate-700'
                                                    }`}
                                                >
                                                    <div>
                                                        <div className="flex justify-between items-start mb-2">
                                                            <span className="inline-block px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                                                                {outfit.ocasiao}
                                                            </span>
                                                            <div className="flex gap-2">
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); handleShareLook(outfit); }}
                                                                    className="p-1.5 rounded-full text-slate-300 hover:text-indigo-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                                                >
                                                                    <Share2 className="w-4 h-4" />
                                                                </button>

                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); toggleOutfitFavorite(idx); }}
                                                                    className={`p-1.5 rounded-full transition-colors ${
                                                                        outfit.isFavorite 
                                                                        ? 'text-red-500 bg-red-50 dark:bg-red-900/20' 
                                                                        : 'text-slate-300 hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                                                                    }`}
                                                                >
                                                                    <Heart className={`w-4 h-4 ${outfit.isFavorite ? 'fill-current' : ''}`} />
                                                                </button>
                                                                
                                                                <div className={`w-6 h-6 rounded-full flex items-center justify-center border transition-colors ${
                                                                    isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 text-transparent'
                                                                }`}>
                                                                    <Check className="w-3.5 h-3.5" />
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Bespoke vs Partner Badge */}
                                                        <div className="flex gap-2 mb-2">
                                                            <span className="text-[10px] bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full font-bold">Sob Medida</span>
                                                        </div>

                                                        <h4 className="font-bold text-slate-800 dark:text-white mb-2 leading-tight pr-6 font-serif">
                                                            {outfit.titulo}
                                                        </h4>
                                                        <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-3 mb-4">
                                                            {outfit.detalhes}
                                                        </p>

                                                        {/* Partner Suggestion Link */}
                                                        {outfit.partner_suggestion && (
                                                            <div className="mb-4" onClick={(e) => e.stopPropagation()}>
                                                                <a 
                                                                    href={outfit.partner_suggestion.link}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="block w-full text-center py-2 px-4 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
                                                                >
                                                                    <ShoppingBag className="w-3 h-3" />
                                                                    Comprar na {outfit.partner_suggestion.storeName}
                                                                    <ExternalLink className="w-3 h-3 text-slate-400" />
                                                                </a>
                                                            </div>
                                                        )}

                                                        {outfit.isFavorite && (
                                                            <div className="mb-4 animate-fade-in" onClick={e => e.stopPropagation()}>
                                                                <div className="relative">
                                                                    <Edit3 className="absolute left-2 top-2.5 w-3 h-3 text-slate-400" />
                                                                    <input 
                                                                        type="text" 
                                                                        value={outfit.userNote || ''}
                                                                        onChange={(e) => updateOutfitNote(idx, e.target.value)}
                                                                        placeholder="Nota para o alfaiate..."
                                                                        className="w-full pl-7 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:border-indigo-500 text-slate-600 dark:text-slate-300"
                                                                    />
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="mt-auto pt-2 border-t border-slate-100 dark:border-slate-800" onClick={(e) => e.stopPropagation()}>
                                                        {outfit.generatedImage ? (
                                                            <button
                                                                onClick={() => setViewingOutfitIndex(idx)}
                                                                className="w-full flex items-center justify-center gap-2 py-2 text-xs font-bold text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
                                                            >
                                                                <Eye className="w-4 h-4" />
                                                                Ver Prova Virtual
                                                            </button>
                                                        ) : (
                                                            <button
                                                                onClick={() => handleGenerateLook(idx, outfit)}
                                                                disabled={isGeneratingThis || generatingOutfitIndex !== null}
                                                                className={`w-full flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${
                                                                    isGeneratingThis 
                                                                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                                                                    : 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/30'
                                                                }`}
                                                            >
                                                                {isGeneratingThis ? (
                                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                                ) : (
                                                                    <Wand2 className="w-4 h-4" />
                                                                )}
                                                                {isGeneratingThis ? 'Criando...' : 'Provar no Corpo'}
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                 </div>
                             </>
                         ) : null}
                     </div>
                 </div>
             </div>
         )}
      </div>

      {selectedOutfits.length > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 animate-fade-in">
              <div className="bg-slate-900 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-4 border border-slate-700">
                  <span className="font-bold text-sm">
                      {selectedOutfits.length} / 3 Selecionados
                  </span>
                  <div className="h-4 w-px bg-white/20" />
                  <button 
                    onClick={() => setShowComparison(true)}
                    className="flex items-center gap-2 font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                      <SplitSquareHorizontal className="w-4 h-4" />
                      Comparar
                  </button>
                  {selectedOutfits.length > 0 && (
                     <button 
                        onClick={() => setSelectedOutfits([])}
                        className="ml-2 p-1 hover:bg-white/10 rounded-full text-slate-400 hover:text-red-400 transition-colors"
                     >
                        <X className="w-4 h-4" />
                     </button>
                  )}
              </div>
          </div>
      )}

      {/* COMPARISON MODAL */}
      <Modal 
         isOpen={showComparison} 
         onClose={() => setShowComparison(false)}
         title="Board Comparativo"
         icon={SplitSquareHorizontal}
         sizeClass="max-w-6xl"
      >
          <div className="space-y-6 pb-4">
              <div className={`grid grid-cols-1 ${selectedOutfits.length === 2 ? 'md:grid-cols-2' : selectedOutfits.length === 3 ? 'md:grid-cols-3' : 'md:grid-cols-1'} gap-6`}>
                  {selectedOutfits.map((outfit, idx) => (
                      <div key={idx} className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 flex flex-col h-full shadow-sm">
                          <div className="mb-4">
                              <span className="text-xs font-bold tracking-wider text-indigo-600 dark:text-indigo-400 uppercase bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1 rounded-full">
                                  {outfit.ocasiao}
                              </span>
                          </div>
                          <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4 min-h-[3.5rem] font-serif">
                              {outfit.titulo}
                          </h3>
                          
                          <div className="space-y-4 flex-1">
                              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl">
                                  <span className="block text-xs font-bold text-slate-400 uppercase mb-1">Por que funciona</span>
                                  <p className="text-sm text-slate-700 dark:text-slate-300">
                                      {outfit.motivo}
                                  </p>
                              </div>

                              <div>
                                  <span className="block text-xs font-bold text-slate-400 uppercase mb-2">Detalhes de Alfaiataria</span>
                                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                                      {outfit.detalhes}
                                  </p>
                              </div>
                              
                              {/* Partner Link in Comparison */}
                              {outfit.partner_suggestion && (
                                  <div className="pt-4 mt-2 border-t border-slate-200 dark:border-slate-700">
                                       <a 
                                            href={outfit.partner_suggestion.link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="block w-full text-center py-2 px-4 bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-lg text-xs font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                                        >
                                            <ShoppingBag className="w-3 h-3" />
                                            Comprar na {outfit.partner_suggestion.storeName}
                                        </a>
                                  </div>
                              )}
                          </div>
                      </div>
                  ))}
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-800">
                  <button
                    onClick={handleExportComparison}
                    disabled={isGeneratingComparison}
                    className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/30 transition-all"
                  >
                      {isGeneratingComparison ? <Loader2 className="w-5 h-5 animate-spin" /> : <Layout className="w-5 h-5" />}
                      Exportar Board
                  </button>
              </div>
          </div>
      </Modal>

      {/* Generated Look View Modal with Refinement */}
      {viewingOutfitIndex !== null && analysisResult && (
        <Modal
            isOpen={true}
            onClose={() => setViewingOutfitIndex(null)}
            title={`Prova Virtual: ${analysisResult.sugestoes_roupa[viewingOutfitIndex].titulo}`}
            icon={Sparkles}
            sizeClass="max-w-5xl h-[95vh]"
        >
            <div className="flex flex-col h-full gap-4">
                <div className="flex-1 w-full relative min-h-[60vh] rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                    <ComparisonView
                        generatedSrc={analysisResult.sugestoes_roupa[viewingOutfitIndex].generatedImage!}
                        originalSrc={image!}
                        alt="Look Gerado"
                        onSave={() => addToast("Imagem salva na galeria!", "success")}
                        onExpand={() => {}} 
                        isSaving={false}
                    />
                </div>
                
                {/* Refinement Control */}
                <div className="flex flex-col md:flex-row gap-4 items-center bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                    <div className="flex-1 w-full">
                        <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Solicitar Ajuste ao Teodoro</label>
                        <div className="flex gap-2">
                            <input 
                                type="text" 
                                value={refinementPrompt}
                                onChange={(e) => setRefinementPrompt(e.target.value)}
                                placeholder="Ex: Ajustar o caimento, mudar tecido para linho..."
                                className="flex-1 px-4 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                            />
                            <button
                                onClick={() => handleGenerateLook(viewingOutfitIndex, analysisResult.sugestoes_roupa[viewingOutfitIndex], refinementPrompt)}
                                disabled={isRefining || !refinementPrompt.trim()}
                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isRefining ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                                Refinar
                            </button>
                        </div>
                    </div>
                    <div className="flex gap-2 self-end md:self-center">
                        <button
                            onClick={() => setViewingOutfitIndex(null)}
                            className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-sm"
                        >
                            Fechar
                        </button>
                    </div>
                </div>
            </div>
        </Modal>
      )}

      {/* Overlays */}
      <VisagismGuideModal 
        isOpen={showVisagismGuide}
        onClose={() => setShowVisagismGuide(false)}
      />
      <TeodoroProfile 
        isOpen={showTeodoroProfile}
        onClose={() => setShowTeodoroProfile(false)}
      />
      {showOnboarding && <Onboarding onComplete={() => setShowOnboarding(false)} />}
      <AuthModal 
        isOpen={showAuth} 
        onClose={() => setShowAuth(false)} 
        onMockLogin={(u) => setUser(u)}
      />
      {toast && <Toast msg={toast.msg} type={toast.type} />}
    </div>
  );
}