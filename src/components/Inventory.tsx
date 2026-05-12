import { useState, useEffect } from "react";
import { Box, Droplets, Flame, Loader2, Plus, Trash2, Minus } from "lucide-react";
import { collection, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp, query, orderBy, updateDoc, increment } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../lib/auth";
import { handleFirestoreError, OperationType } from "../lib/firebaseError";

interface InventoryItem {
  id: string;
  name: string;
  quantity: number | string;
  unit: string;
  iconType: string;
}

export function Inventory() {
  const { user } = useAuth();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newItemName, setNewItemName] = useState("");
  const [newItemQty, setNewItemQty] = useState("");
  const [newItemUnit, setNewItemUnit] = useState("unidades");
  const [iconMode, setIconMode] = useState("droplets");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (!user) return;
    const inventoryRef = collection(db, `users/${user.uid}/inventory`);
    const q = query(inventoryRef, orderBy("createdAt", "desc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loadedItems = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as InventoryItem[];
      setItems(loadedItems);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/inventory`);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName || !newItemQty || !user) return;
    setAdding(true);
    try {
      const inventoryRef = collection(db, `users/${user.uid}/inventory`);
      const qtyNumber = parseFloat(newItemQty);
      await addDoc(inventoryRef, {
        name: newItemName,
        quantity: isNaN(qtyNumber) ? newItemQty : qtyNumber,
        unit: newItemUnit,
        iconType: iconMode,
        userId: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      setNewItemName("");
      setNewItemQty("");
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `users/${user.uid}/inventory`);
    } finally {
      setAdding(false);
    }
  };

  const handleAdjustQuantity = async (id: string, amount: number) => {
    if (!user) return;
    try {
      const itemRef = doc(db, `users/${user.uid}/inventory`, id);
      await updateDoc(itemRef, {
        quantity: increment(amount),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}/inventory/${id}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!user) return;
    if (!confirm("¿Estás segura de eliminar este insumo?")) return;
    try {
      await deleteDoc(doc(db, `users/${user.uid}/inventory`, id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `users/${user.uid}/inventory/${id}`);
    }
  };

  const renderIcon = (type: string) => {
    switch (type) {
      case "flame": return <Flame className="w-5 h-5 text-amber-500" />;
      case "box": return <Box className="w-5 h-5 text-pink-500" />;
      default: return <Droplets className="w-5 h-5 text-indigo-500" />;
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="bg-rose-50 border border-rose-100 p-6 rounded-3xl">
        <h2 className="text-xl font-semibold text-rose-900 mb-1">Inventario Actual</h2>
        <p className="text-sm text-rose-700 mb-6">Gestiona tus insumos para placas aromáticas.</p>
        
        {loading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="w-6 h-6 animate-spin text-rose-400" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-6 text-rose-400 text-sm font-medium">
            No tienes insumos agregados.
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="flex flex-col bg-white p-4 rounded-xl shadow-sm border border-rose-50 group">
                <div className="flex flex-row items-center justify-between mb-2">
                  <div className="flex flex-row items-center gap-3 overflow-hidden">
                    <div className="p-2 bg-slate-50 rounded-lg shrink-0">
                      {renderIcon(item.iconType)}
                    </div>
                    <span className="font-medium text-slate-800 truncate">{item.name}</span>
                  </div>
                  <button 
                    onClick={() => handleDelete(item.id)}
                    className="p-1.5 text-rose-200 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="flex items-center justify-between bg-slate-50 rounded-xl p-2">
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => handleAdjustQuantity(item.id, -1)}
                      className="w-8 h-8 flex items-center justify-center bg-white border border-slate-200 rounded-lg text-slate-600 hover:text-rose-600 hover:border-rose-200 transition-colors shadow-sm"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <div className="px-4 py-1 text-center min-w-[3rem]">
                      <span className="text-rose-600 font-bold text-lg">
                        {item.quantity}
                      </span>
                      <span className="text-[10px] text-slate-400 block -mt-1 uppercase tracking-wider font-bold">
                        {item.unit || "uds"}
                      </span>
                    </div>
                    <button 
                      onClick={() => handleAdjustQuantity(item.id, 1)}
                      className="w-8 h-8 flex items-center justify-center bg-white border border-slate-200 rounded-lg text-slate-600 hover:text-green-600 hover:border-green-200 transition-colors shadow-sm"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="text-[10px] text-slate-300 italic px-2">
                    Ajuste rápido
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white border border-slate-100 p-5 rounded-3xl shadow-sm">
        <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
          <Plus className="w-4 h-4 text-rose-500" />
          Nuevo Insumo
        </h3>
        <form onSubmit={handleAddItem} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1 block capitalize">Nombre del Insumo</label>
            <input 
              type="text"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              placeholder="Ej. Cera de Soja"
              className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 transition-all font-medium"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block capitalize">Cantidad Inicial</label>
              <input 
                type="number"
                step="any"
                value={newItemQty}
                onChange={(e) => setNewItemQty(e.target.value)}
                placeholder="0"
                className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 transition-all font-medium"
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block capitalize">Unidad</label>
              <select 
                value={newItemUnit} 
                onChange={(e) => setNewItemUnit(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 px-3 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 transition-all font-medium"
              >
                <option value="unidades">Unidades</option>
                <option value="gramos">Gramos (g)</option>
                <option value="kilos">Kilos (kg)</option>
                <option value="ml">Mililitros (ml)</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1 block capitalize">Icono Visual</label>
            <div className="flex gap-2">
              {["droplets", "flame", "box"].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setIconMode(type)}
                  className={`flex-1 p-3 rounded-xl border transition-all flex justify-center ${
                    iconMode === type 
                      ? "border-rose-500 bg-rose-50 ring-2 ring-rose-200" 
                      : "border-slate-200 bg-slate-50 opacity-60"
                  }`}
                >
                  {renderIcon(type)}
                </button>
              ))}
            </div>
          </div>
          <button 
            type="submit" 
            disabled={adding || !newItemName || !newItemQty}
            className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-4 rounded-2xl text-sm transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {adding ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
            AGREGAR AL INVENTARIO
          </button>
        </form>
      </div>
    </div>
  );
}
