import { useState } from "react";
import { Loader2, MessageCircleHeart, Copy, Check } from "lucide-react";
import { callGemini } from "../lib/gemini";
import Markdown from "react-markdown";

export function CRM() {
  const [clientName, setClientName] = useState("");
  const [lastPurchase, setLastPurchase] = useState("");
  const [daysSince, setDaysSince] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (!clientName || !lastPurchase || !daysSince) return;
    setLoading(true);
    setResult(null);

    const prompt = `Clienta: ${clientName}\nÚltima Compra: ${lastPurchase}\nDías desde su compra: ${daysSince} días`;
    const sysPrompt = "Eres un Cerrador de Ventas Premium especializado en productos artesanales y de lujo accesible (wax melts/placas aromáticas). Tu objetivo es redactar un mensaje corto, persuasivo, cálido y elegante para enviar por WhatsApp. Quieres lograr que esta clienta anterior te vuelva a comprar, invitándola a conocer un lanzamiento nuevo o preguntándole simpáticamente si necesita reponer sus ceras porque ya pasaron días desde su última compra. No uses lenguaje frío, corporativo ni uses hashtags.";

    try {
      const resp = await callGemini(prompt, sysPrompt);
      setResult(resp || "No se pudo generar la respuesta.");
    } catch (e) {
      setResult("Ocurrió un error.");
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
      <div className="bg-gradient-to-br from-teal-100 to-emerald-50 p-6 rounded-3xl border border-teal-200">
        <MessageCircleHeart className="w-8 h-8 text-teal-600 mb-3" />
        <h2 className="text-2xl font-bold text-teal-950 mb-2">CRM y Ventas</h2>
        <p className="text-teal-800 text-sm">
          Aumenta tu recompras con mensajes de WhatsApp premium generados por IA diseñados para convertir.
        </p>
      </div>

      <div className="space-y-4 px-1">
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-slate-700 ml-1">Nombre de la Clienta</label>
          <input
            type="text"
            className="w-full bg-white border border-slate-200 px-4 py-3 rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-400 transition-all shadow-sm"
            placeholder="Ej. Valeria"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-slate-700 ml-1">¿Qué compró la última vez?</label>
          <input
            type="text"
            className="w-full bg-white border border-slate-200 px-4 py-3 rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-400 transition-all shadow-sm"
            placeholder="Ej. Box de 6 placas de cera botánicas"
            value={lastPurchase}
            onChange={(e) => setLastPurchase(e.target.value)}
          />
        </div>
        
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-slate-700 ml-1">Días desde su compra</label>
          <input
            type="number"
            className="w-full bg-white border border-slate-200 px-4 py-3 rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-400 transition-all shadow-sm"
            placeholder="Ej. 30"
            value={daysSince}
            onChange={(e) => setDaysSince(e.target.value)}
          />
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading || !clientName || !lastPurchase || !daysSince}
          className="w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-semibold py-4 rounded-2xl transition-all shadow-md active:scale-[0.98]"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>La IA está procesando...</span>
            </>
          ) : (
            <>
              <MessageCircleHeart className="w-5 h-5" />
              <span>Generar Mensaje WhatsApp</span>
            </>
          )}
        </button>
      </div>

      {result && (
        <div className="bg-white border text-left border-teal-100 rounded-3xl p-5 shadow-lg relative animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-teal-900 border-b border-teal-100 pb-2 flex-1">Mensaje Listo para Enviar</h3>
            <button 
              onClick={copyToClipboard}
              className="p-2 ml-4 bg-teal-50 text-teal-600 rounded-xl hover:bg-teal-100 transition-colors"
            >
              {copied ? <Check className="w-5 h-5 text-green-600" /> : <Copy className="w-5 h-5" />}
            </button>
          </div>
          <div className="prose prose-sm prose-p:leading-relaxed prose-teal">
             <Markdown>{result}</Markdown>
          </div>
        </div>
      )}
    </div>
  );
}
