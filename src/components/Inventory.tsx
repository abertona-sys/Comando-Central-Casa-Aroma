import { useState, useEffect } from "react";
import { Box, Droplets, Flame, Loader2, Plus, Trash2 } from "lucide-react";
import { collection, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp, query, orderBy } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../lib/auth";
import { handleFirestoreError, OperationType } from "../lib/firebaseError";

interface InventoryItem {
  id: string;
  name: string;
  quantity: string;
  iconType: string;
}

export function Inventory() {
  const { user } = useAuth();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newItemName, setNewItemName] = useState("");
  const [newItemQty, setNewItemQty] = useState("");
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
      await addDoc(inventoryRef, {
        name: newItemName,
        quantity: newItemQty,
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

  const handleDelete = async (id: string) => {
    if (!user) return;
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
              <div key={item.id} className="flex flex-row items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-rose-50 group">
                <div className="flex flex-row items-center gap-3 overflow-hidden">
                  <div className="p-2 bg-slate-50 rounded-lg shrink-0">
                    {renderIcon(item.iconType)}
                  </div>
                  <span className="font-medium text-slate-800 truncate">{item.name}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <span className="text-rose-600 font-semibold bg-rose-50 px-3 py-1 rounded-full text-sm">
                    {item.quantity}
                  </span>
                  <button 
                    onClick={() => handleDelete(item.id)}
                    className="p-1.5 text-rose-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white border border-slate-100 p-5 rounded-3xl shadow-sm">
        <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Plus className="w-4 h-4 text-slate-400" />
          Nuevo Insumo
        </h3>
        <form onSubmit={handleAddItem} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1 block">Nombre del Insumo</label>
            <input 
              type="text"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              placeholder="Ej. Cera de Soja"
              className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 transition-all"
              required
            />
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-xs font-semibold text-slate-500 mb-1 block">Cantidad</label>
              <input 
                type="text"
                value={newItemQty}
                onChange={(e) => setNewItemQty(e.target.value)}
                placeholder="Ej. 10 kg"
                className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 transition-all"
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">Icono</label>
              <select 
                value={iconMode} 
                onChange={(e) => setIconMode(e.target.value)}
                className="w-24 bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 transition-all"
              >
                <option value="droplets">Gotas</option>
                <option value="flame">Fuego</option>
                <option value="box">Caja</option>
              </select>
            </div>
          </div>
          <button 
            type="submit" 
            disabled={adding || !newItemName || !newItemQty}
            className="w-full bg-rose-600 hover:bg-rose-700 text-white font-semibold py-3 rounded-xl text-sm transition-all shadow-sm disabled:opacity-50 flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Agregar 
          </button>
        </form>
      </div>
    </div>
  );
}
