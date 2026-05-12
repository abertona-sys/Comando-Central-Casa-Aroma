# 🛠️ Instrucciones de Configuración (Google Apps Script)

He desarrollado **dos versiones** para ti:
1. **La Versión en React (Esta página web):** Puedes probar cómo funciona la UI exacta y las peticiones a la IA ahora mismo en esta previsualización.
2. **La Versión Google Apps Script:** El código necesario para llevarlo a tu entorno de Google Workspace (Costo $0). Sigue estos pasos para instalar esa versión:

## Paso 1: Configurar Google Sheets
1. Crea un nuevo Google Sheet. Llámalo "Comando Central Aroma".
2. Renombra la pestaña predeterminada ("Hoja 1") a **`Inventario`** (muy importante que tenga este nombre exacto).
3. En esa pestaña, en la **Celda A1** escribe "Item" y en la **Celda B1** escribe "Cantidad".
4. Agrega datos de prueba debajo. Ejemplo: A2: "Cera de Soja", B2: "10 kg".

## Paso 2: Abrir Apps Script
1. En tu Google Sheet, ve al menú **Extensiones** > **Apps Script**.
2. Verás un archivo llamado `Código.gs`.

## Paso 3: Pegar el Código
1. En Apps Script, copia todo el contenido del archivo `Code.gs` (que puedes ver en la carpeta `apps-script/Code.gs` de este entorno) y pégalo reemplazando lo que haya en `Código.gs`.
2. Presiona el botón **"+"** (Agregar archivo) > **HTML**. Llámalo exactamente **`Index`**. 
3. Copia todo el contenido del archivo `Index.html` (de la carpeta `apps-script/Index.html`) y pégalo allí, reemplazando todo.
4. Guarda el proyecto (Ctrl + S o icono de disquete).

## Paso 4: Agregar tu Clave API de Gemini
Para que la Inteligencia Artificial funcione:
1. En Google Apps Script, ve al menú izquierdo y haz clic en el icono de **Engranaje (Configuración del proyecto)**.
2. Baja hasta **"Propiedades del script"** y haz clic en "Agregar propiedad del script".
3. **Propiedad:** Escribe `GEMINI_API_KEY` (en mayúsculas, sin espacios).
4. **Valor:** Pega tu clave de Google AI Studio (copiada desde https://aistudio.google.com/app/apikey).
5. Haz clic en "Guardar las propiedades del script".

## Paso 5: Implementar y Usar
1. Arriba a la derecha, haz clic en **"Implementar"** > **"Nueva implementación"**.
2. En el icono de la rueda dentada (⚙️) junto a "Seleccionar tipo", elige **"Aplicación web"**.
3. Configuración:
   - Descripción: "Versión 1.0"
   - Ejecutar como: **"Yo"**
   - Quién tiene acceso: **"Cualquiera"** o "Solo yo" (según prefieras).
4. Dale a **"Implementar"**. 
5. *(Te pedirá "Revisar Permisos", sigue los pasos, elige tu cuenta de Google > Avanzado > Ir a Proyecto (Inseguro) > Permitir)*.
6. **¡Listo!** Te dará una "URL de la aplicación web". Esa es la URL que abrirás en tu celular para acceder a tu App. 🚀
