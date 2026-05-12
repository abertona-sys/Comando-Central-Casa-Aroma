import { useState, useRef, useEffect } from "react";
import { Loader2, Send, Lightbulb } from "lucide-react";
import { callGemini } from "../lib/gemini";
import Markdown from "react-markdown";

type Message = { id: string; role: "user" | "mentor"; content: string };

export function Mentor() {
  const [messages, setMessages] = useState<Message[]>([
    { id: "1", role: "mentor", content: "¡Hola! Soy tu Mentora Aromática. ¿Tienes dudas sobre tu producción de wax melts, temperaturas de fusión, esencias o frosting?" }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    
    setMessages(prev => [...prev, { id: Date.now().toString(), role: "user", content: userMessage }]);
    setIsLoading(true);

    const sysPrompt = "Eres un Maestro Aromático y Químico experto en cera de soja, esencias y placas aromáticas (wax melts). Las usuarias te preguntarán problemas de producción (ej. frosting, sudoración de la cera, pérdida de aroma, túneles de quemado). Entrega soluciones altamente técnicas, precisas, paso a paso, pero siempre utilizando un tono extremadamente empático, tranquilizador y maternal. Tu objetivo es animarlas y darles la fórmula exacta (temperaturas, porcentajes) para solucionar su problema.";
    
    // Pass recent context as part of the prompt for a better chat simulation
    const context = messages.slice(-4).map(m => `${m.role === 'user' ? 'Clienta' : 'Mentora'}: ${m.content}`).join("\n");
    const fullPrompt = `${context}\nClienta: ${userMessage}\nMentora:`;

    try {
      const resp = await callGemini(fullPrompt, sysPrompt);
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: "mentor", content: resp || "Lo siento, tuve un problema." }]);
    } catch (e) {
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: "mentor", content: "Lo siento, hubo un error técnico de conexión." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] bg-slate-50 rounded-3xl overflow-hidden border border-slate-200">
      <div className="bg-gradient-to-r from-amber-200 to-orange-100 px-5 py-4 flex items-center gap-3 shrink-0">
        <Lightbulb className="w-6 h-6 text-amber-700" />
        <div>
          <h2 className="font-bold text-amber-950 leading-tight">Mentora Aromática</h2>
          <span className="text-xs font-medium text-amber-800 flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Online 24/7
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div 
              className={`max-w-[85%] rounded-2xl p-4 shadow-sm text-sm ${
                m.role === "user" 
                ? "bg-slate-800 text-white rounded-br-sm" 
                : "bg-white border border-slate-100 text-slate-800 rounded-bl-sm prose prose-sm prose-p:my-1 prose-strong:text-slate-900"
              }`}
            >
              <Markdown>{m.content}</Markdown>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
             <div className="bg-white border border-slate-100 rounded-2xl rounded-bl-sm p-4 shadow-sm flex items-center gap-2">
               <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
               <span className="text-xs text-slate-500 font-medium">Pensando...</span>
             </div>
          </div>
        )}
        <div ref={endOfMessagesRef} />
      </div>

      <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-100 shrink-0 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ej: ¿Por qué mi cera hizo frosting?"
          className="flex-1 bg-slate-50 border border-slate-200 rounded-full px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 transition-all"
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="bg-slate-900 text-white p-3 rounded-full hover:bg-slate-800 disabled:opacity-50 transition-colors shadow-sm"
        >
          <Send className="w-5 h-5 -ml-0.5 mt-0.5" />
        </button>
      </form>
    </div>
  );
}
