import { useState } from "react";
import { Loader2, Sparkles, Copy, Check } from "lucide-react";
import { callGemini } from "../lib/gemini";
import Markdown from "react-markdown";

export function Marketing() {
  const [product, setProduct] = useState("");
  const [niche, setNiche] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (!product || !niche) return;
    setLoading(true);
    setResult(null);

    const prompt = `Producto: ${product}\nNicho u Ocasión: ${niche}`;
    const sysPrompt = "Eres un Experto Copywriter de respuesta directa especializado en venta de productos aromáticos artesanales. Tu objetivo es escribir un guion para un Reel de Instagram/TikTok de exactamente 15 segundos. Debe ser un guion muy visual (qué se muestra en cámara) y muy persuasivo (qué texto va en pantalla o voz en off). El tono debe ser femenino, cálido, pero altamente vendedor. Estructura el guion: [0-3s Gancho], [4-10s Cuerpo/Propuesta], [11-15s Llamado a la Acción].";

    try {
      const resp = await callGemini(prompt, sysPrompt);
      setResult(resp || "No se pudo generar la respuesta.");
    } catch (e) {
      setResult("Ocurrió un error de red o de API.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (result) {
      navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6 pb-24">
      <div className="bg-gradient-to-br from-fuchsia-100 to-pink-50 p-6 rounded-3xl border border-fuchsia-200">
        <Sparkles className="w-8 h-8 text-fuchsia-600 mb-3" />
        <h2 className="text-2xl font-bold text-fuchsia-950 mb-2">Departamento de Marketing</h2>
        <p className="text-fuchsia-800 text-sm">
          Genera guiones virales de 15 segundos para tus redes sociales impulsados por IA.
        </p>
      </div>

      <div className="space-y-4 px-1">
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-slate-700 ml-1">¿Qué producto estás promocionando?</label>
          <input
            type="text"
            className="w-full bg-white border border-slate-200 px-4 py-3 rounded-2xl focus:outline-none focus:ring-2 focus:ring-fuchsia-400 focus:border-transparent transition-all shadow-sm"
            placeholder="Ej. Placa Aromática de Lavanda y Vainilla"
            value={product}
            onChange={(e) => setProduct(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-slate-700 ml-1">¿Cuál es tu nicho u ocasión especial?</label>
          <input
            type="text"
            className="w-full bg-white border border-slate-200 px-4 py-3 rounded-2xl focus:outline-none focus:ring-2 focus:ring-fuchsia-400 focus:border-transparent transition-all shadow-sm"
            placeholder="Ej. Souvenir para Baby Shower de nena"
            value={niche}
            onChange={(e) => setNiche(e.target.value)}
          />
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading || !product || !niche}
          className="w-full flex items-center justify-center gap-2 bg-fuchsia-600 hover:bg-fuchsia-700 disabled:opacity-50 text-white font-semibold py-4 rounded-2xl transition-all shadow-md active:scale-[0.98]"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>La IA está procesando...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              <span>Generar Guion de Reel</span>
            </>
          )}
        </button>
      </div>

      {result && (
        <div className="bg-white border text-left border-fuchsia-100 rounded-3xl p-5 shadow-lg relative animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-fuchsia-900 border-b border-fuchsia-100 pb-2 flex-1">Tu Guion</h3>
            <button 
              onClick={copyToClipboard}
              className="p-2 ml-4 bg-fuchsia-50 text-fuchsia-600 rounded-xl hover:bg-fuchsia-100 transition-colors"
            >
              {copied ? <Check className="w-5 h-5 text-green-600" /> : <Copy className="w-5 h-5" />}
            </button>
          </div>
          <div className="prose prose-sm prose-p:leading-relaxed prose-fuchsia">
             <Markdown>{result}</Markdown>
          </div>
        </div>
      )}
    </div>
  );
}
