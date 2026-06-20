import { useState, useEffect } from "react";
import { BookOpen, Plus, Trash2, Loader2, Save, ShoppingBag, CircleAlert } from "lucide-react";
import { collection, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp, query, orderBy } from "firebase/firestore";
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

interface InventoryItem {
  id: string;
  name: string;
  unit: string;
}

export function Recipes() {
  const { user } = useAuth();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // States for new recipe
  const [recipeName, setRecipeName] = useState("");
  const [selectedIngredient, setSelectedIngredient] = useState("");
  const [ingredientAmount, setIngredientAmount] = useState("");
  const [newRecipeIngredients, setNewRecipeIngredients] = useState<RecipeIngredient[]>([]);
  const [saving, setSaving] = useState(false);

  const selectedItem = inventoryItems.find(i => i.id === selectedIngredient);

  useEffect(() => {
    if (!user) return;

    const qRecipes = query(collection(db, `users/${user.uid}/recipes`), orderBy("createdAt", "desc"));
    const unsubRecipes = onSnapshot(qRecipes, (snapshot) => {
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Recipe));
      setRecipes(list);
      setLoading(false);
    }, (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, "recipes");
      } catch (err) {
        console.error("List recipes snapshot failed:", err);
      }
      setLoading(false);
    });

    const qInv = query(collection(db, `users/${user.uid}/inventory`), orderBy("name", "asc"));
    const unsubInv = onSnapshot(qInv, (snapshot) => {
      const list = snapshot.docs.map(d => ({ 
        id: d.id, 
        name: d.data().name, 
        unit: d.data().unit 
      } as InventoryItem));
      setInventoryItems(list);
    });

    return () => {
      unsubRecipes();
      unsubInv();
    };
  }, [user]);

  const addIngredientToTemp = () => {
    if (!selectedIngredient || !ingredientAmount) return;
    const item = inventoryItems.find(i => i.id === selectedIngredient);
    if (!item) return;

    const newItem: RecipeIngredient = {
      itemId: item.id,
      itemName: item.name,
      amount: parseFloat(ingredientAmount),
      unit: item.unit
    };

    setNewRecipeIngredients([...newRecipeIngredients, newItem]);
    setSelectedIngredient("");
    setIngredientAmount("");
  };

  const removeIngredientFromTemp = (index: number) => {
    setNewRecipeIngredients(newRecipeIngredients.filter((_, i) => i !== index));
  };

  const handleSaveRecipe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !recipeName || newRecipeIngredients.length === 0) return;

    setSaving(true);
    setErrorMsg(null);
    try {
      await addDoc(collection(db, `users/${user.uid}/recipes`), {
        name: recipeName,
        ingredients: newRecipeIngredients,
        createdAt: serverTimestamp(),
        userId: user.uid
      });
      setRecipeName("");
      setNewRecipeIngredients([]);
      setErrorMsg(null);
    } catch (error: any) {
      console.error("Error creating recipe:", error);
      const detail = error.message || String(error);
      setErrorMsg(`No se pudo crear la receta. Detalle del error: ${detail}`);
      try {
        handleFirestoreError(error, OperationType.CREATE, `users/${user.uid}/recipes`);
      } catch (err) {}
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRecipe = async (id: string) => {
    if (!user || !confirm("¿Eliminar esta receta?")) return;
    setErrorMsg(null);
    try {
      await deleteDoc(doc(db, `users/${user.uid}/recipes`, id));
    } catch (error: any) {
      console.error("Error deleting recipe:", error);
      setErrorMsg("No se pudo eliminar la receta.");
      try {
        handleFirestoreError(error, OperationType.DELETE, `recipes/${id}`);
      } catch (err) {}
    }
  };

  return (
    <div className="space-y-6 pb-24">
      {errorMsg && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-2xl flex items-start gap-3 text-sm shadow-sm animate-in fade-in">
          <CircleAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold block">Aviso del Sistema</span>
            <p className="text-xs leading-relaxed">{errorMsg}</p>
          </div>
        </div>
      )}

      <div className="bg-gradient-to-br from-indigo-100 to-violet-50 p-6 rounded-3xl border border-indigo-200">
        <BookOpen className="w-8 h-8 text-indigo-600 mb-3" />
        <h2 className="text-2xl font-bold text-indigo-950 mb-2">Recetario Maestro</h2>
        <p className="text-indigo-800 text-sm">
          Define tus productos y cuánto material consumen. Esto permitirá descontar stock automáticamente al vender.
        </p>
      </div>

      <div className="bg-white border border-slate-100 p-5 rounded-3xl shadow-sm">
        <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
          <Plus className="w-4 h-4 text-indigo-500" />
          Crear Nueva Receta de Producto
        </h3>
        
        <form onSubmit={handleSaveRecipe} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1 block">Nombre del Producto terminado</label>
            <input 
              type="text"
              value={recipeName}
              onChange={(e) => setRecipeName(e.target.value)}
              placeholder="Ej. Placa de Lavanda Grande"
              className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 font-medium"
              required
            />
          </div>

          <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 space-y-3">
            <label className="text-xs font-bold text-indigo-600 block uppercase tracking-tight">Agregar Insumos Necesarios</label>
            <div className="flex flex-wrap gap-2 items-center">
              <select 
                value={selectedIngredient}
                onChange={(e) => setSelectedIngredient(e.target.value)}
                className="flex-1 min-w-[150px] bg-white border border-indigo-200 px-3 py-2.5 rounded-xl text-sm focus:outline-none"
              >
                <option value="">Selecciona Insumo...</option>
                {inventoryItems.map(i => (
                  <option key={i.id} value={i.id}>{i.name} ({i.unit})</option>
                ))}
              </select>
              
              <div className="relative flex items-center min-w-[100px] flex-1">
                <input 
                  type="number"
                  step="any"
                  value={ingredientAmount}
                  onChange={(e) => setIngredientAmount(e.target.value)}
                  placeholder={selectedItem ? `En ${selectedItem.unit}` : "Cant."}
                  className="w-full bg-white border border-indigo-200 pl-3 pr-16 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
                {selectedItem && (
                  <span className="absolute right-3 text-[10px] bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded text-indigo-600 font-bold lowercase">
                    {selectedItem.unit}
                  </span>
                )}
              </div>

              <button 
                type="button"
                onClick={addIngredientToTemp}
                disabled={!selectedIngredient || !ingredientAmount}
                className="bg-indigo-600 text-white p-2.5 rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-all"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            {selectedItem && (
              <p className="text-[11px] text-indigo-700 bg-indigo-50/50 px-3 py-2 rounded-xl border border-indigo-100/80 animate-in fade-in transition-all">
                💡 Este insumo se mide en <span className="font-extrabold underline uppercase">{selectedItem.unit}</span>. Asegúrate de ingresar el valor adecuado para esta unidad.
              </p>
            )}

            <div className="space-y-2 mt-2">
              {newRecipeIngredients.map((ing, idx) => (
                <div key={idx} className="flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-indigo-100 text-xs font-medium text-slate-700">
                  <span>{ing.itemName}: <span className="text-indigo-600 font-bold">{ing.amount} {ing.unit}</span></span>
                  <button type="button" onClick={() => removeIngredientFromTemp(idx)} className="text-rose-400">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <button 
            type="submit"
            disabled={saving || !recipeName || newRecipeIngredients.length === 0}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl text-sm transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            GUARDAR RECETA
          </button>
        </form>
      </div>

      <div className="space-y-4">
        <h3 className="font-semibold text-slate-800 flex items-center gap-2 px-1">
          <ShoppingBag className="w-5 h-5 text-indigo-500" />
          Tus Productos Configurados
        </h3>
        
        {loading ? (
          <div className="flex justify-center py-10 opacity-50"><Loader2 className="animate-spin" /></div>
        ) : recipes.length === 0 ? (
          <div className="bg-white p-10 rounded-3xl border border-dashed border-slate-200 text-center">
            <p className="text-slate-400 text-sm">Aún no tienes productos con receta.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {recipes.map(recipe => (
              <div key={recipe.id} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold text-slate-800">{recipe.name}</h4>
                  <button 
                    onClick={() => handleDeleteRecipe(recipe.id)}
                    className="p-2 text-slate-300 hover:text-rose-500 rounded-xl"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recipe.ingredients.map((ing, i) => (
                    <span key={i} className="bg-slate-50 text-slate-600 text-[10px] px-2.5 py-1 rounded-lg border border-slate-100 uppercase tracking-tight">
                      {ing.itemName}: <span className="text-indigo-600 font-bold">{ing.amount} {ing.unit}</span>
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
