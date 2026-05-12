import { GoogleGenerativeAI } from "@google/generative-ai";

const getApiKey = () => {
  const key = import.meta.env.VITE_GEMINI_API_KEY;
  if (!key) {
    console.warn("VITE_GEMINI_API_KEY no está configurada.");
    return "";
  }
  return key;
};

const ai = new GoogleGenerativeAI(getApiKey());

export async function callGemini(prompt: string, systemInstruction: string) {
  const key = getApiKey();
  if (!key) {
    throw new Error("La clave de API de Gemini no está configurada. Por favor, añádela en la configuración.");
  }
  
  try {
    const model = ai.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction: systemInstruction,
    });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error llamando a Gemini:", error);
    throw new Error("Hubo un error al procesar tu solicitud con IA.");
  }
}
