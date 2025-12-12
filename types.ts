export interface ColorPalette {
  hex: string;
  nome: string;
}

export interface VisagismoDetails {
  estilo: string;
  detalhes: string;
  motivo: string;
}

export interface Visagismo {
  cabelo: VisagismoDetails;
  barba_ou_make: VisagismoDetails;
  acessorios: string[];
}

export interface Otica {
  armacao: string;
  material: string;
  detalhes: string;
  motivo: string;
}

export interface PartnerItem {
  storeName: string; // e.g., "Riachuelo"
  productName: string;
  link: string; // Direct link or search query
  priceEstimate?: string;
}

export interface OutfitSuggestion {
  titulo: string;
  detalhes: string;
  ocasiao: string;
  motivo: string;
  visagismo_sugerido: string;
  termos_busca: string; 
  partner_suggestion?: PartnerItem; // Link to partner store
  isFavorite?: boolean; 
  userNote?: string; 
  generatedImage?: string;
  lastModificationPrompt?: string; 
}

export interface QualityCheck {
  valid: boolean;
  reason: string;
}

export interface ImageQualityResult {
  isValid: boolean;
  score: number; // 0 to 100
  issues: string[];
  advice: string;
  details: {
    lighting: 'Good' | 'Poor' | 'Too Dark' | 'Too Bright';
    focus: 'Sharp' | 'Blurry';
    framing: 'Good' | 'Bad';
  };
}

export type SkinTone = 'Quente' | 'Frio' | 'Neutro' | 'Oliva';

export interface AnalysisResult {
  quality_check: QualityCheck; 
  genero: 'Masculino' | 'Feminino'; 
  formato_rosto_detalhado: string; 
  biotipo: string; 
  analise_facial: string;
  analise_pele: string;
  tom_pele_detectado?: SkinTone; 
  analise_corporal: string;
  paleta_cores: ColorPalette[];
  visagismo: Visagismo;
  otica: Otica;
  sugestoes_roupa: OutfitSuggestion[];
}

export interface UserMetrics {
  height: string; // e.g., "1.75"
  weight: string; // e.g., "80"
}

export interface UserPreferences {
  favoriteStyles: string[]; 
  favoriteColors: string;   
  avoidItems: string;       
}

export interface HistoryItem {
  id: string;
  result: AnalysisResult;
  context: string;
  clientName: string;
  mode: string;
  createdAt: any;
  thumbnail?: string; 
  originalImage?: string; 
  lastStyleSelected?: string | null;
  userPreferencesSnapshot?: UserPreferences; 
}

export type AnalysisContextType = "Corporativo" | "Social" | "Casual" | "Festa";

export type UserRole = 'client' | 'professional' | 'store';