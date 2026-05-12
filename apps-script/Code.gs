// ==========================================
// BACKEND: Code.gs (Google Apps Script)
// ==========================================

// 1. Mostrar la Web App
function doGet(e) {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Comando Central Aroma')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, user-scalable=no');
}

// 2. Leer Inventario desde "Inventario" sheet
function getInventario() {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Inventario');
    if (!sheet) throw new Error("No se encontró la pestaña 'Inventario'");
    
    // Asume columnas: A(Item), B(Cantidad)
    const data = sheet.getDataRange().getValues();
    const headers = data.shift(); // Quitar cabeceras
    
    return data.map(row => ({
      item: row[0],
      cantidad: row[1]
    }));
  } catch (error) {
    Logger.log(error.toString());
    return [];
  }
}

// 3. Función Principal de Gemini AI
function llamarGemini(prompt, systemInstruction) {
  // 🔴 IMPORTANTE: Ve a Configuración de Proyecto (Engranaje) > Propiedades del script
  // y añade una propiedad llamada GEMINI_API_KEY con tu clave de Google AI Studio.
  const apiKey = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
  
  if (!apiKey) {
    throw new Error("Falta la GEMINI_API_KEY en las propiedades del script.");
  }
  
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
  
  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    systemInstruction: { parts: [{ text: systemInstruction }] },
    generationConfig: { temperature: 0.7 }
  };
  
  const options = {
    method: "POST",
    contentType: "application/json",
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };
  
  try {
    const response = UrlFetchApp.fetch(url, options);
    const json = JSON.parse(response.getContentText());
    
    if (json.error) {
      throw new Error(json.error.message);
    }
    
    return json.candidates[0].content.parts[0].text;
  } catch (error) {
    Logger.log("Error llamando a Gemini: " + error.toString());
    throw new Error("Hubo un error de conexión con la IA. " + error.toString());
  }
}

// 4. Módulo Marketing
function generarMarketing(producto, nicho) {
  const prompt = `Producto: ${producto}\nNicho u Ocasión: ${nicho}`;
  const sysPrompt = "Eres un Experto Copywriter de respuesta directa especializado en venta de productos aromáticos artesanales. Tu objetivo es escribir un guion para un Reel de Instagram/TikTok de exactamente 15 segundos. Debe ser un guion muy visual (qué se muestra en cámara) y muy persuasivo (qué texto va en pantalla o voz en off). El tono debe ser femenino, cálido, pero altamente vendedor. Estructura el guion: [0-3s Gancho], [4-10s Cuerpo/Propuesta], [11-15s Llamado a la Acción].";
  return llamarGemini(prompt, sysPrompt);
}

// 5. Módulo CRM
function generarMensajeCRM(nombre, compra, dias) {
  const prompt = `Clienta: ${nombre}\nÚltima Compra: ${compra}\nDías desde su compra: ${dias} días`;
  const sysPrompt = "Eres un Cerrador de Ventas Premium especializado en productos artesanales y de lujo accesible (wax melts/placas aromáticas). Tu objetivo es redactar un mensaje corto, persuasivo, cálido y elegante para enviar por WhatsApp. Quieres lograr que esta clienta anterior te vuelva a comprar, invitándola a conocer un lanzamiento nuevo o preguntándole simpáticamente si necesita reponer sus ceras porque ya pasaron días desde su última compra. No uses lenguaje frío, corporativo ni uses hashtags.";
  return llamarGemini(prompt, sysPrompt);
}

// 6. Módulo Mentora
function consultarMentora(consultaContexto, consultaActual) {
  const fullPrompt = `${consultaContexto}\nClienta: ${consultaActual}\nMentora:`;
  const sysPrompt = "Eres un Maestro Aromático y Químico experto en cera de soja, esencias y placas aromáticas (wax melts). Las usuarias te preguntarán problemas de producción (ej. frosting, sudoración de la cera, pérdida de aroma). Entrega soluciones altamente técnicas, precisas, paso a paso, pero siempre utilizando un tono extremadamente empático, tranquilizador y maternal. Tu objetivo es animarlas y darles la fórmula exacta (temperaturas, porcentajes) para solucionar su problema.";
  return llamarGemini(fullPrompt, sysPrompt);
}
