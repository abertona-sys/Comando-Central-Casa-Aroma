import { useState, useEffect } from "react";
import { Loader2, MessageCircleHeart, Copy, Check, ShoppingCart, History, Trash2, Sparkles } from "lucide-react";
import { callGemini } from "../lib/gemini";
import Markdown from "react-markdown";
import { collection, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp, query, orderBy, increment, updateDoc, writeBatch } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../lib/auth";
import { handleFirestoreError, OperationType } from "../lib/firebaseError";

interface RecipeIngredient {
  itemId: string;
  itemName: string;
  amount: number;
  unit: string;
}

interface Recipe {
  id: string;
  name: string;
  ingredients: RecipeIngredient[];
}

interface Sale {
  id: string;
  clientName: string;
  productName: string;
  quantity: number;
  createdAt: any;
}

export function CRM() {
  const { user } = useAuth();
  const [clientName, setClientName] = useState("");
  const [selectedRecipeId, setSelectedRecipeId] = useState("");
  const [saleQty, setSaleQty] = useState("1");
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  
  // AI Message generation state
  const [lastPurchase, setLastPurchase] = useState("");
  const [daysSince, setDaysSince] = useState("");
  const [loadingAI, setLoadingAI] = useState(false);
  const [aiResult, setAiResult] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  
  const [recordingSale, setRecordingSale] = useState(false);

  useEffect(() => {
    if (!user) return;
    console.log("CRM: Subscribing to recipes and sales...");

    const qRecipes = query(collection(db, `users/${user.uid}/recipes`), orderBy("name", "asc"));
    const unsubRecipes = onSnapshot(qRecipes, (snapshot) => {
      setRecipes(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Recipe)));
    }, (error) => {
      console.error("CRM: Recipes error:", error);
      handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/recipes`);
    });

    const qSales = query(collection(db, `users/${user.uid}/sales`), orderBy("createdAt", "desc"));
    const unsubSales = onSnapshot(qSales, (snapshot) => {
      setSales(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Sale)));
      setLoadingHistory(false);
    }, (error) => {
      console.error("CRM: Sales error:", error);
      handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/sales`);
    });

    return () => {
      unsubRecipes();
      unsubSales();
    };
  }, [user]);

  const handleRegisterSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !clientName || !selectedRecipeId || !saleQty) return;

    setRecordingSale(true);
    try {
      const qty = parseInt(saleQty);
      const recipe = recipes.find(r => r.id === selectedRecipeId);
      if (!recipe) throw new Error("Receta no encontrada");

      // Transactional operation: Save sale AND subtract from inventory
      const batch = writeBatch(db);
      
      // 1. Save Sale
      const saleRef = doc(collection(db, `users/${user.uid}/sales`));
      batch.set(saleRef, {
        clientName,
        productName: recipe.name,
        recipeId: recipe.id,
        quantity: qty,
        createdAt: serverTimestamp(),
        userId: user.uid
      });

      // 2. Subtract each ingredient from Inventory
      recipe.ingredients.forEach(ing => {
        const itemRef = doc(db, `users/${user.uid}/inventory`, ing.itemId);
        const totalToSubtract = ing.amount * qty;
        batch.update(itemRef, {
          quantity: increment(-totalToSubtract),
          updatedAt: serverTimestamp()
        });
      });

      await batch.commit();
      
      setClientName("");
      setSelectedRecipeId("");
      setSaleQty("1");
      alert("¡Venta registrada y stock descontado con éxito!");
    } catch (error: any) {
      console.error("Error registering sale:", error);
      alert("Error al registrar: " + error.message);
    } finally {
      setRecordingSale(false);
    }
  };

  const handleGenerate = async () => {
    if (!clientName || !lastPurchase || !daysSince) return;
    setLoadingAI(true);
    setAiResult(null);

    const prompt = `Clienta: ${clientName}\nÚltima Compra: ${lastPurchase}\nDías desde su compra: ${daysSince} días`;
    const sysPrompt = "Eres un Cerrador de Ventas Premium especializado en productos artesanales y de lujo accesible (wax melts/placas aromáticas). Tu objetivo es redactar un mensaje corto, persuasivo, cálido y elegante para enviar por WhatsApp. Quieres lograr que esta clienta anterior te vuelva a comprar, invitándola a conocer un lanzamiento nuevo o preguntándole simpáticamente si necesita reponer sus ceras porque ya pasaron días desde su última compra.";

    try {
      const resp = await callGemini(prompt, sysPrompt);
      setAiResult(resp || "No se pudo generar la respuesta.");
    } catch (e) {
      setAiResult("Ocurrió un error.");
    } finally {
      setLoadingAI(false);
    }
  };

  const copyToClipboard = () => {
    if (aiResult) {
      navigator.clipboard.writeText(aiResult);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDeleteSale = async (id: string) => {
    if (!user || !confirm("¿Eliminar registro de venta? (Nota: Esto no devolverá el stock solo borra el historial)")) return;
    try {
      await deleteDoc(doc(db, `users/${user.uid}/sales`, id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `sales/${id}`);
    }
  };

  return (
    <div className="space-y-6 pb-24">
      <div className="bg-gradient-to-br from-teal-100 to-emerald-50 p-6 rounded-3xl border border-teal-200">
        <ShoppingCart className="w-8 h-8 text-teal-600 mb-3" />
        <h2 className="text-2xl font-bold text-teal-950 mb-2">Registro de Ventas</h2>
        <p className="text-teal-800 text-sm">
          Anota tus ventas para descontar stock automáticamente y fideliza con mensajes IA.
        </p>
      </div>

      <div className="bg-white border border-teal-100 p-5 rounded-3xl shadow-sm space-y-4">
        <h3 className="font-semibold text-slate-800 flex items-center gap-2 text-sm uppercase tracking-wider">
          <ShoppingCart className="w-4 h-4 text-teal-500" />
          Nueva Venta Realizada
        </h3>
        <form onSubmit={handleRegisterSale} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 block">Clienta</label>
              <input 
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Nombre"
                className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-sm"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 block">Producto (de Recetario)</label>
              <select 
                value={selectedRecipeId}
                onChange={(e) => setSelectedRecipeId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-sm"
                required
              >
                <option value="">Selecciona Producto...</option>
                {recipes.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 block">Cantidad Vendida</label>
            <input 
              type="number"
              value={saleQty}
              onChange={(e) => setSaleQty(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-sm"
              required
            />
          </div>
          <button 
            type="submit"
            disabled={recordingSale || !clientName || !selectedRecipeId}
            className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 rounded-2xl text-sm transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {recordingSale ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShoppingCart className="w-5 h-5" />}
            REGISTRAR Y RESTAR STOCK
          </button>
        </form>
      </div>

      {/* AI Message Section */}
      <div className="bg-slate-50 p-5 rounded-3xl border border-slate-200 space-y-4">
        <h3 className="font-semibold text-slate-800 flex items-center gap-2 text-sm uppercase tracking-wider">
          <MessageCircleHeart className="w-4 h-4 text-rose-400" />
          Fidelización con IA
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <input 
            type="text" 
            placeholder="¿Qué compró?" 
            className="bg-white border rounded-xl px-3 py-2 text-xs" 
            value={lastPurchase} 
            onChange={e => setLastPurchase(e.target.value)} 
          />
          <input 
            type="number" 
            placeholder="Días desde compra" 
            className="bg-white border rounded-xl px-3 py-2 text-xs" 
            value={daysSince} 
            onChange={e => setDaysSince(e.target.value)} 
          />
        </div>
        <button 
          onClick={handleGenerate}
          disabled={loadingAI}
          className="w-full bg-white border border-rose-200 text-rose-500 font-bold py-2 rounded-xl text-xs hover:bg-rose-50 flex items-center justify-center gap-2"
        >
          {loadingAI ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
          GENERAR MENSAJE PARA ELLA
        </button>

        {aiResult && (
          <div className="bg-white border text-left border-teal-100 rounded-2xl p-4 shadow-sm relative animate-in fade-in zoom-in duration-300">
            <button onClick={copyToClipboard} className="absolute top-2 right-2 p-1.5 bg-teal-50 text-teal-600 rounded-lg">
              {copied ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
            </button>
            <div className="prose prose-xs text-[11px] leading-snug whitespace-pre-wrap">
              {aiResult}
            </div>
          </div>
        )}
      </div>

      {/* History */}
      <div className="space-y-4">
        <h3 className="font-semibold text-slate-800 flex items-center gap-2 px-1">
          <History className="w-5 h-5 text-slate-400" />
          Historial de Ventas
        </h3>
        {loadingHistory ? (
          <div className="flex justify-center py-10 opacity-30"><Loader2 className="animate-spin" /></div>
        ) : sales.length === 0 ? (
          <p className="text-center text-slate-400 text-xs py-10">No hay ventas registradas aún.</p>
        ) : (
          <div className="space-y-3">
            {sales.map(sale => (
              <div key={sale.id} className="bg-white p-4 rounded-2xl border border-slate-100 flex justify-between items-center shadow-sm">
                <div>
                  <p className="text-xs font-bold text-teal-700">{sale.clientName}</p>
                  <p className="font-semibold text-slate-800">{sale.productName} (x{sale.quantity})</p>
                  <p className="text-[10px] text-slate-400">
                    {sale.createdAt?.toDate ? sale.createdAt.toDate().toLocaleDateString() : "Reciente"}
                  </p>
                </div>
                <button onClick={() => handleDeleteSale(sale.id)} className="p-2 text-slate-200 hover:text-rose-400">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

