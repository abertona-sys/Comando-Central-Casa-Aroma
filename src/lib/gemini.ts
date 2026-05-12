import { GoogleGenAI } from "@google/genai";

export async function callGemini(prompt: string, systemInstruction: string) {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error("La clave de API de Gemini no está configurada. Por favor, añádela como variable de entorno (GEMINI_API_KEY) en la configuración.");
  }
  
  // Create a new instance right before making the call as per guidelines
  const ai = new GoogleGenAI({ apiKey });
  
  try {
    console.log("Iniciando llamada a Gemini...");
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
      },
    });

    return response.text; // Accessing property, not a method
  } catch (error: any) {
    console.error("Error llamando a Gemini:", error);
    // Handle specific errors as per guidelines
    if (error.message?.includes("PERMISSION_DENIED") || error.message?.includes("API_KEY_INVALID")) {
      throw new Error("Clave de API inválida o permiso denegado. Revisa la configuración de Secretos.");
    }
    throw new Error(error.message || "Hubo un error al procesar tu solicitud con IA.");
  }
}
