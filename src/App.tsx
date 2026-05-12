import { useState } from "react";
import { Box, Sparkles, MessageCircleHeart, Lightbulb, LogIn, Loader2, LogOut } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Inventory } from "./components/Inventory";
import { Marketing } from "./components/Marketing";
import { CRM } from "./components/CRM";
import { Mentor } from "./components/Mentor";
import { useAuth } from "./lib/auth";

type Tab = "inventory" | "marketing" | "crm" | "mentor";

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>("inventory");
  const { user, loading, error, signIn, logOut } = useAuth();

  const tabs = [
    { id: "inventory", label: "Inventario", icon: Box },
    { id: "marketing", label: "Marketing", icon: Sparkles },
    { id: "crm", label: "CRM", icon: MessageCircleHeart },
    { id: "mentor", label: "Mentora", icon: Lightbulb },
  ] as const;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-xl border border-red-100 text-center space-y-4">
          <div className="text-red-500 font-bold">⚠️ Error de Configuración</div>
          <p className="text-slate-500 text-sm">{error}</p>
          <p className="text-xs text-slate-400">Si estás en Vercel, asegúrate de haber incluido todos los archivos y configurado las variables de entorno.</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="bg-slate-50 min-h-screen flex justify-center items-center p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-xl border border-slate-100 text-center space-y-6">
          <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-2">
            <Sparkles className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-rose-500 to-fuchsia-600">
            Comando Central Aroma
          </h1>
          <p className="text-slate-500 text-sm">
            Inicia sesión o regístrate para gestionar tu inventario y usar los asistentes de IA.
          </p>
          <button 
            onClick={signIn}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-md active:scale-95"
          >
            <LogIn className="w-5 h-5" />
            Ingresar con Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen font-sans sm:bg-slate-200 flex justify-center items-center">
      {/* Mobile App Container */}
      <div className="w-full h-screen sm:h-[850px] sm:w-[400px] sm:rounded-[3rem] bg-slate-50 sm:shadow-2xl overflow-hidden relative flex flex-col border-[8px] border-white sm:border-slate-800">
        
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-lg border-b border-slate-100 px-6 py-5 sticky top-0 z-10 shrink-0 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-rose-500 to-fuchsia-600">
              Comando Central
            </h1>
            <p className="text-xs font-semibold text-slate-400 mt-0.5">SISTEMA INTELIGENTE</p>
          </div>
          <button onClick={logOut} className="p-2 bg-slate-50 border border-slate-100 text-slate-400 rounded-full hover:bg-slate-100 transition-colors" title="Cerrar Sessión">
            <LogOut className="w-4 h-4" />
          </button>
        </header>

        {/* Dynamic Content */}
        <main className="flex-1 overflow-y-auto px-5 py-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === "inventory" && <Inventory />}
              {activeTab === "marketing" && <Marketing />}
              {activeTab === "crm" && <CRM />}
              {activeTab === "mentor" && <Mentor />}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Bottom Navigation */}
        <nav className="bg-white border-t border-slate-100 pb-safe shrink-0 px-2 pt-2 pb-6 sm:pb-4 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.05)]">
          <div className="flex justify-around items-center">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex flex-col items-center gap-1 p-2 rounded-2xl w-20 transition-all ${
                    isActive ? "text-rose-600 bg-rose-50/50" : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  <Icon className={`w-6 h-6 ${isActive ? "fill-rose-100" : ""}`} />
                  <span className={`text-[10px] font-semibold ${isActive ? "opacity-100" : "opacity-80"}`}>
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
