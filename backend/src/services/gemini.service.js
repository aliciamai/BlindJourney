// ============================================================
// BlindJourney – Servicio de IA
// Primario: Google Gemini (cuenta estudiante)
// Fallback:  Groq (LLaMA 3.3) cuando Gemini falla o agota cuota
// ============================================================

const { GoogleGenerativeAI } = require('@google/generative-ai');
const Groq = require('groq-sdk');
const { normalizarCandidatos, normalizarItinerario } = require('./normalizar.service');

// ── Gemini ────────────────────────────────────────────────────
let _geminiModel = null;
const getGeminiModel = () => {
  if (!_geminiModel) {
    if (!process.env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY no configurada en .env');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    _geminiModel = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  }
  return _geminiModel;
};

// ── Groq (fallback) ───────────────────────────────────────────
let _groqClient = null;
const getGroqClient = () => {
  if (!_groqClient) {
    if (!process.env.GROQ_API_KEY) throw new Error('GROQ_API_KEY no configurada en .env');
    _groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return _groqClient;
};

const GROQ_MODEL = 'llama-3.3-70b-versatile';

// ── Helpers ───────────────────────────────────────────────────
const parsearJSON = (texto) => {
  const limpio = texto
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim();
  return JSON.parse(limpio);
};

// Llama a Gemini; si falla por cualquier motivo usa Groq como fallback
const generarConIA = async (prompt) => {
  let geminiError = null;
  try {
    const result = await getGeminiModel().generateContent(prompt);
    return { texto: result.response.text(), proveedor: 'gemini' };
  } catch (err) {
    geminiError = err;
    console.warn('[IA] Gemini falló:', err.message);
  }

  try {
    console.log('[IA] Intentando con Groq como fallback...');
    const completion = await getGroqClient().chat.completions.create({
      model: GROQ_MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    });
    console.log('[IA] Groq funcionó correctamente');
    return { texto: completion.choices[0].message.content, proveedor: 'groq' };
  } catch (groqError) {
    console.error('[IA] AMBAS IAS FALLARON - Gemini:', geminiError.message, '| Groq:', groqError.message);
    throw new Error(`Ambas IAs fallaron. Gemini: ${geminiError.message}. Groq: ${groqError.message}`);
  }
};

// ── Candidatos de destino ─────────────────────────────────────
const generarCandidatos = async ({
  presupuesto,
  diasViaje,
  intereses,
  nivelActividad,
  restriccionesAlimentarias,
  numViajeros,
}) => {
  const prompt = `Eres un experto agente de viajes español. Genera exactamente 12 destinos de viaje sorpresa.

Criterios:
- Duración: ${diasViaje} días
- Presupuesto total: ${presupuesto}€ por persona (incluye vuelo + alojamiento)
- Intereses: ${(intereses || []).join(', ') || 'variados'}
- Nivel de actividad: ${nivelActividad || 'moderado'}
- Restricciones alimentarias: ${(restriccionesAlimentarias || []).join(', ') || 'ninguna'}
- Viajeros: ${numViajeros || 1}

Devuelve SOLO un array JSON válido (sin texto extra ni markdown) con este formato exacto:
[
  {
    "ciudad": "nombre de la ciudad",
    "pais": "nombre del país",
    "tipo_viaje": "cultura|naturaleza|gastronomia|playa|montana|ocio",
    "precio_estimado": 650,
    "descripcion": "2 frases atractivas sobre el destino",
    "clima": "ej: Cálido y soleado, 26°C",
    "idioma": "idioma principal del país",
    "duracion_vuelo": "ej: 2h 30min desde Madrid"
  }
]`;

  try {
    const { texto, proveedor } = await generarConIA(prompt);
    const datos = parsearJSON(texto);
    if (!Array.isArray(datos)) throw new Error('Respuesta no es un array');
    const normalizados = normalizarCandidatos(datos);
    console.log(`[IA] ${normalizados.length} candidatos generados con ${proveedor}`);
    return normalizados.slice(0, 15);
  } catch (error) {
    console.error('[IA] Error generando candidatos:', error.message);
    throw new Error('Error al generar destinos con IA');
  }
};

// ── Itinerario día a día ──────────────────────────────────────
const generarItinerario = async ({
  ciudad,
  pais,
  diasViaje,
  presupuestoDiario,
  intereses,
  nivelActividad,
  restriccionesAlimentarias,
}) => {
  const prompt = `Eres un guía de viajes experto. Crea un itinerario detallado para ${diasViaje} días en ${ciudad}, ${pais}.

Perfil del viajero:
- Intereses: ${(intereses || []).join(', ') || 'variados'}
- Nivel de actividad: ${nivelActividad || 'moderado'}
- Presupuesto diario: ${presupuestoDiario}€ por persona
- Restricciones alimentarias: ${(restriccionesAlimentarias || []).join(', ') || 'ninguna'}

Devuelve SOLO un array JSON válido (sin texto extra ni markdown):
[
  {
    "dia": 1,
    "titulo": "Llegada y primera exploración",
    "actividades": [
      {
        "hora": "10:00",
        "nombre": "nombre del lugar o actividad",
        "descripcion": "descripción breve de 1-2 frases",
        "tipo": "cultura|gastronomia|ocio|transporte|alojamiento|naturaleza",
        "ubicacion": "zona o dirección",
        "duracion_minutos": 90,
        "coste_estimado": 15.00
      }
    ]
  }
]

Incluye 4-6 actividades por día. Día 1: llegada. Último día: check-out y vuelo de regreso.`;

  try {
    const { texto, proveedor } = await generarConIA(prompt);
    const datos = parsearJSON(texto);
    if (!Array.isArray(datos)) throw new Error('Respuesta no es un array');
    const normalizado = normalizarItinerario(datos);
    console.log(`[IA] Itinerario (${normalizado.length} días) generado con ${proveedor}`);
    return normalizado;
  } catch (error) {
    console.error('[IA] Error generando itinerario:', error.message);
    throw new Error('Error al generar itinerario con IA');
  }
};

module.exports = { generarCandidatos, generarItinerario };
