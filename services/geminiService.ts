import { GoogleGenAI } from "@google/genai";
import type { AnalysisResult, ImageQualityResult, UserPreferences, UserMetrics } from "../types";

// Initialize Gemini Client Lazily (Singleton Pattern)
let ai: GoogleGenAI | null = null;

const getAi = () => {
  if (!ai) {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        throw new Error("API Key not found. Please check process.env.API_KEY");
    }
    try {
        ai = new GoogleGenAI({ apiKey });
    } catch (e) {
        console.error("Failed to initialize GoogleGenAI client:", e);
        throw new Error("Falha ao inicializar serviço de IA. Tente recarregar a página.");
    }
  }
  return ai;
};

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper: Resize Image Client-Side
export const resizeBase64Image = (base64Str: string, maxWidth: number = 800, quality: number = 0.8): Promise<string> => {
    return new Promise((resolve) => {
        if (typeof window === 'undefined' || typeof document === 'undefined') {
            resolve(base64Str);
            return;
        }

        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = `data:image/jpeg;base64,${base64Str}`;
        
        img.onload = () => {
            try {
                let width = img.width;
                let height = img.height;
                
                if (width <= maxWidth) {
                    resolve(base64Str);
                    return;
                }

                const ratio = maxWidth / width;
                width = maxWidth;
                height = height * ratio;
                
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.drawImage(img, 0, 0, width, height);
                    const resizedDataUrl = canvas.toDataURL('image/jpeg', quality);
                    resolve(resizedDataUrl.split(',')[1]);
                } else {
                    resolve(base64Str);
                }
            } catch (e) {
                console.warn("Image resize failed", e);
                resolve(base64Str);
            }
        };

        img.onerror = () => {
            console.warn("Image load failed for resize");
            resolve(base64Str);
        };
    });
};

const retryWithBackoff = async <T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> => {
  try {
    return await fn();
  } catch (error: any) {
    const msg = (error.message || JSON.stringify(error)).toLowerCase();
    const status = error.status || error.response?.status;
    const isTransient = status === 429 || status === 503 || status === 500 || msg.includes('429') || msg.includes('quota') || msg.includes('xhr error') || msg.includes('network');

    if (retries > 0 && isTransient) {
      console.warn(`API Error. Retrying in ${delay}ms...`);
      await wait(delay);
      return retryWithBackoff(fn, retries - 1, delay * 2);
    }
    throw error;
  }
};

const handleGeminiError = (error: any) => {
  console.error("Gemini API Error:", error);
  const msg = (error.message || "").toLowerCase();
  if (msg.includes('429') || msg.includes('quota')) throw new Error("Muitas solicitações. Aguarde um momento.");
  if (msg.includes('xhr') || msg.includes('network') || msg.includes('fetch')) throw new Error("Erro de conexão. Verifique sua internet.");
  throw new Error("Falha no processamento da IA. Tente novamente.");
};

export const validateImageQuality = async (base64Image: string): Promise<ImageQualityResult> => {
  try {
    const resizedImage = await resizeBase64Image(base64Image, 400, 0.7);
    const prompt = `Analyze image quality for face analysis. JSON only: { "isValid": boolean, "score": number, "issues": string[], "advice": string, "details": { "lighting": "Good"|"Poor"|"Too Dark"|"Too Bright", "focus": "Sharp"|"Blurry", "framing": "Good"|"Bad" } }`;

    const client = getAi();
    const response = await retryWithBackoff<any>(() => client.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ inlineData: { mimeType: "image/jpeg", data: resizedImage } }, { text: prompt }],
      config: { responseMimeType: "application/json" }
    }));

    return JSON.parse(response.text!) as ImageQualityResult;
  } catch (error) {
    console.warn("Quality check fallback", error);
    return { isValid: true, score: 100, issues: [], advice: "", details: { lighting: 'Good', focus: 'Sharp', framing: 'Good' } };
  }
};

export const analyzeImageWithGemini = async (base64Image: string, metrics?: UserMetrics, preferences?: UserPreferences): Promise<AnalysisResult> => {
  try {
    const resizedImage = await resizeBase64Image(base64Image, 800, 0.8);
    
    let contextString = "";
    if (metrics) {
        if (metrics.height) contextString += `\n- HEIGHT: ${metrics.height}m`;
        if (metrics.weight) contextString += `\n- WEIGHT: ${metrics.weight}kg`;
    }
    if (preferences) {
        if (preferences.favoriteStyles.length > 0) contextString += `\n- PREFERRED STYLES: ${preferences.favoriteStyles.join(", ")}`;
        if (preferences.favoriteColors) contextString += `\n- PREFERRED COLORS: ${preferences.favoriteColors}`;
        if (preferences.avoidItems) contextString += `\n- AVOID/HATE: ${preferences.avoidItems}`;
    }

    const prompt = `
      ROLE: You are TEODORO, a master tailor and stylist. You provide "Sob Medida" (Bespoke) advice but ALSO act as a PERSONAL SHOPPER for partner stores.
      
      CONTEXT:
      ${contextString}
      
      TASK: Conduct a premium styling analysis. Return JSON.
      
      1. GENDER & BIOMETRICS:
         - Identify gender. Determine Face Shape & Skin Undertone.

      2. SILHOUETTE & PROPORTIONS (CRITICAL):
         - STRICTLY USE the provided Height and Weight to drive the style advice.
         - IF SHORT (< 1.70m men / < 1.60m women): Focus on ELONGATION strategies (monochromatic palettes, vertical stripes, high-waisted cuts, avoid heavy breaks or cuffed hems).
         - IF TALL (> 1.85m men / > 1.75m women): Focus on VISUAL BREAKS (cuffed pants, belts, color blocking, horizontal details) to balance the frame.
         - IF WEIGHT INDICATES ROBUSTNESS: Prioritize structure, verticality, and fabrics that shape without clinging.
         - IF WEIGHT INDICATES SLIMNESS: Suggest layering, textured fabrics, and horizontal lines to add visual presence.

      3. BODY MORPHOLOGY:
         - Classify Biotype: Ampulheta, Triângulo, Triângulo Invertido, Retângulo, Oval.
         - Explain how cuts interact with the specific metrics provided (Height/Weight).

      4. OUTFIT STRATEGY (4x Looks):
         - Mix of "Sob Medida" (Ideal world) and "Partner Store" (Practical).
         - PARTNER: The official partner is "RIACHUELO".
         - MANDATORY: For EACH item in the 'sugestoes_roupa' array, you MUST include a 'partner_suggestion' object.
         - 'partner_suggestion.storeName': MUST BE "Riachuelo".
         - 'partner_suggestion.productName': Use a concise version of the 'titulo' (e.g., "Vestido Longo Floral" or "Blazer Slim Azul").
         - 'partner_suggestion.link': Generate a valid search URL for Riachuelo using the key terms from the suggestion.
           Format: https://www.riachuelo.com.br/busca?q={encoded_search_terms} 
           (Replace spaces with + or %20).
      
      Output Schema:
      {
        "quality_check": { "valid": boolean, "reason": string },
        "genero": "Masculino" | "Feminino",
        "formato_rosto_detalhado": string,
        "analise_facial": string, 
        "analise_pele": string,
        "tom_pele_detectado": "Quente" | "Frio" | "Neutro" | "Oliva",
        "biotipo": "Ampulheta" | "Triângulo" | "Triângulo Invertido" | "Retângulo" | "Oval",
        "analise_corporal": string,
        "paleta_cores": [{ "hex": string, "nome": string }],
        "visagismo": {
          "cabelo": { "estilo": string, "detalhes": string, "motivo": string },
          "barba_ou_make": { "estilo": string, "detalhes": string, "motivo": string },
          "acessorios": [string]
        },
        "otica": { "armacao": string, "material": string, "detalhes": string, "motivo": string },
        "sugestoes_roupa": [{ 
            "titulo": string, 
            "detalhes": string, 
            "ocasiao": string, 
            "motivo": string, 
            "visagismo_sugerido": string, 
            "termos_busca": string,
            "partner_suggestion": {
                "storeName": "Riachuelo",
                "productName": string, 
                "link": string
            }
        }]
      }
    `;

    const client = getAi();
    const response = await retryWithBackoff<any>(() => client.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ inlineData: { mimeType: "image/jpeg", data: resizedImage } }, { text: prompt }],
      config: { responseMimeType: "application/json", temperature: 0.4 }
    }));

    const cleanText = response.text!.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanText) as AnalysisResult;

  } catch (error) {
    handleGeminiError(error);
    throw error;
  }
};

export const generateVisualEdit = async (
  base64Image: string, 
  itemDescription: string, 
  modification: string,
  visagismSuggestion: string | null = null,
  constraints: { biotype: string; palette: string } | null = null,
  userRefinementPrompt: string | null = null
): Promise<string> => {
  try {
    const resizedImage = await resizeBase64Image(base64Image, 1024, 0.85);
    
    let prompt = `Photo Retouch. High Fashion Editorial Style. Edit: ${itemDescription}. Keep identity. Realistic. 8k. Texture details: High.`;
    if (modification) prompt += ` Modification: ${modification}.`;
    
    // Add user refinement if present
    if (userRefinementPrompt) {
        prompt += ` REFINEMENT REQUEST: ${userRefinementPrompt}. IMPORTANT: Apply this change specifically.`;
    }

    const client = getAi();
    const response = await retryWithBackoff<any>(() => client.models.generateContent({
        model: "gemini-2.5-flash-image",
        contents: [{ inlineData: { mimeType: "image/jpeg", data: resizedImage } }, { text: prompt }],
    }));

    const parts = response.candidates?.[0]?.content?.parts;
    if (parts) {
        for (const part of parts) {
            if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
        }
    }
    throw new Error("Falha na geração da imagem.");
  } catch (error) {
    handleGeminiError(error);
    throw error;
  }
};