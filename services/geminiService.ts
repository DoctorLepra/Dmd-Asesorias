import { GoogleGenAI, Modality } from "@google/genai";
import type { LiveCallbacks } from '@google/genai';
import { supabase } from '../lib/supabaseClient.ts';

// Variable para guardar la instancia (Singleton)
let aiInstance: GoogleGenAI | null = null;

// Función auxiliar para obtener la instancia de IA solo cuando se necesita
const getAI = (): GoogleGenAI => {
  if (aiInstance) return aiInstance;

  // Accedemos a la variable de entorno aquí, no en el nivel superior
  const apiKey = process.env.API_KEY;

  if (!apiKey) {
    console.error("API_KEY no está configurada en las variables de entorno.");
    throw new Error("La configuración de API Key falta. Contacte al administrador.");
  }

  aiInstance = new GoogleGenAI({ apiKey });
  return aiInstance;
};

interface ImageInput {
  base64: string;
  mimeType: string;
}

export const DEFAULT_SYSTEM_INSTRUCTION = `Eres un asistente virtual de soporte técnico para la empresa 'DMD'. Tu única especialización es ser un experto de máximo nivel en nuestros sistemas de software contable: **Contapyme** y **Agrowin**. Tu misión es diagnosticar y proporcionar soluciones precisas, claras y paso a paso a los problemas de los usuarios relacionados EXCLUSIVAMENTE con estos dos programas. Analiza la descripción del problema y, si se proporciona, la captura de pantalla adjunta para diagnosticar el error. Responde en español. Utiliza un tono profesional pero amigable. Formatea tu respuesta con títulos, listas numeradas o con viñetas y texto en negrita para que sea fácil de seguir. Empieza siempre con un saludo cordial. Si la pregunta no se relaciona con Contapyme o Agrowin, o si no conoces la respuesta, indica amablemente que solo puedes ayudar con esos sistemas y sugiere contactar a un asesor humano. Al final de esa respuesta amable, y solo en ese caso, añade la etiqueta especial: [SUPPORT_BUTTON]`;

// Fetch modular instructions from DB and combine them
const fetchSystemInstruction = async (): Promise<string> => {
    try {
        const { data, error } = await supabase
            .from('ai_knowledge_base')
            .select('title, content')
            .eq('is_active', true)
            .order('created_at', { ascending: true });
        
        let combinedInstructions = "";

        if (error || !data || data.length === 0) {
            console.warn("Using default system instruction (DB fetch empty or failed).");
            // Fallback to legacy check if new table is empty (to avoid breaking change during migration)
            const { data: legacyData } = await supabase.from('app_config').select('value').eq('key', 'ai_system_instruction').single();
            if (legacyData) {
               combinedInstructions = legacyData.value;
            } else {
               combinedInstructions = DEFAULT_SYSTEM_INSTRUCTION;
            }
        } else {
            // Combine all active instructions
            // Note: We always prepend the core identity if it's not explicitly in the DB, 
            // but usually the DB should contain the "Identity" as a row.
            // For safety, we can assume the DB has full control.
             combinedInstructions = data.map(item => `--- ${item.title} ---\n${item.content}`).join("\n\n");
        }
        
        return combinedInstructions;
    } catch (e) {
        console.error("Error fetching system instruction:", e);
        return DEFAULT_SYSTEM_INSTRUCTION;
    }
}

const getSolution = async (problemDescription: string, image?: ImageInput): Promise<string> => {
  try {
    // Inicializamos aquí. Si falla, cae en el catch y no rompe la app.
    const ai = getAI(); 
    
    // Fetch dynamic instruction
    const systemInstruction = await fetchSystemInstruction();

    const textPart = { text: problemDescription };
    
    const parts: any[] = [textPart];
    if (image) {
      parts.push({
        inlineData: {
          data: image.base64,
          mimeType: image.mimeType,
        },
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts },
      config: {
          systemInstruction,
      },
    });
    return response.text || "";
  } catch (error: any) {
    console.error("Error generating solution:", error);
    if (error.message.includes("API Key")) {
        return "Error de configuración del sistema: Falta la API Key. Por favor contacte soporte.";
    }
    return "Lo sentimos, ha ocurrido un error al intentar generar una solución. Por favor, inténtalo de nuevo más tarde. Si el problema persiste, puedes contactar a nuestro equipo de soporte. [SUPPORT_BUTTON]";
  }
};

async function* getSolutionStream(problemDescription: string, image?: ImageInput): AsyncGenerator<string> {
  try {
    const ai = getAI();
    // Fetch dynamic instruction
    const systemInstruction = await fetchSystemInstruction();
    
    const textPart = { text: problemDescription };
    const parts: any[] = [textPart];
    if (image) {
      parts.push({
        inlineData: {
          data: image.base64,
          mimeType: image.mimeType,
        },
      });
    }

    const response = await ai.models.generateContentStream({
      model: 'gemini-2.5-flash',
      contents: { parts },
      config: {
        systemInstruction,
      },
    });

    for await (const chunk of response) {
      if (chunk.text) {
        yield chunk.text;
      }
    }
  } catch (error) {
    console.error("Error generating streaming solution:", error);
    yield "Lo sentimos, ha ocurrido un error técnico (posiblemente falta de API Key o conexión).";
  }
}


const startChatSession = async (callbacks: LiveCallbacks) => {
    // Si falla getAI(), lanzará error que debe ser capturado por el componente que llama a esta función
    const systemInstruction = await fetchSystemInstruction();
    const ai = getAI();
    return ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks,
        config: {
            responseModalities: [Modality.AUDIO],
            inputAudioTranscription: {},
            outputAudioTranscription: {},
            systemInstruction,
        },
    });
};


const generateNewsletter = async (topic: string): Promise<string> => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Genera un boletín informativo sobre el siguiente tema: ${topic}`,
      config: {
          systemInstruction: `Eres un experto en marketing y comunicación para 'DMD', una empresa de software de contabilidad. Tu tarea es generar borradores de boletines informativos (newsletters) atractivos y profesionales. El tono debe ser informativo y positivo, destacando los beneficios para el cliente. Responde en español. Estructura el boletín con:
1.  **Título llamativo**.
2.  **Una breve introducción** que enganche al lector.
3.  **Una sección principal** (usando listas o párrafos) que detalle las novedades, mejoras o el tema principal.
4.  **Una llamada a la acción (Call to Action)** al final, como invitar a probar las nuevas funciones o contactar para más información.
5.  **Una despedida cordial**.`,
      },
    });
    return response.text || "";
  } catch (error) {
    console.error("Error generating newsletter:", error);
    return "Lo sentimos, ha ocurrido un error al intentar generar el boletín. Verifique la configuración de la API Key.";
  }
};

interface InventoryItem {
  code: string;
  quantity: number;
  cost: number;
}

const extractInventoryData = async (image: ImageInput): Promise<InventoryItem[]> => {
    try {
        const ai = getAI();
        const prompt = `Analiza esta imagen de un reporte de inventario. Extrae SOLO los items que parezcan ser productos con sus cantidades y costos/precios.
        Devuelve un array JSON puro sin formato markdown.
        Estructura esperada: [{ "code": "string", "quantity": number, "cost": number }]
        Si no encuentras columna de costo, usa 0. Si hay códigos repetidos, listalos individualmente.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    { text: prompt },
                    { inlineData: { data: image.base64, mimeType: image.mimeType } }
                ]
            }
        });

        const text = response.text || "[]";
        // Limpiar markdown si la IA lo incluye
        const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleanJson);
    } catch (error) {
        console.error("Error extracting inventory data:", error);
        throw new Error("No se pudieron extraer los datos del inventario. Asegúrate de que la imagen sea legible.");
    }
};

export const geminiService = {
  getSolution,
  generateNewsletter,
  startChatSession,
  getSolutionStream,
  extractInventoryData,
  DEFAULT_SYSTEM_INSTRUCTION
};