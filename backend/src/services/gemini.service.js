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
    _geminiModel = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });
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
  let limpio = texto
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim();

  // Eliminar comentarios JSON no válidos (// y /* */)
  limpio = limpio.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');

  // Manejar múltiples problemas de JSON mal formado
  // 1. Reemplazar saltos de línea múltiples dentro de strings por espacios
  limpio = limpio.replace(/(["\'])\s*\n\s*/g, '$1 ');

  // 2. Asegurar que los números flotantes están bien formados
  limpio = limpio.replace(/:\s*([0-9]+)\s*,/g, ': $1,');
  limpio = limpio.replace(/:\s*([0-9]+\.?[0-9]*)\s*\}/g, ': $1}');
  limpio = limpio.replace(/:\s*([0-9]+\.?[0-9]*)\s*\]/g, ': $1]');

  try {
    return JSON.parse(limpio);
  } catch (err) {
    // Si sigue fallando, intentar una estrategia más agresiva
    console.warn('[IA] Parse JSON falló, intentando estrategia alternativa:', err.message);
    // Buscar el primer [ y el último ]
    const start = limpio.indexOf('[');
    const end = limpio.lastIndexOf(']') + 1;
    if (start >= 0 && end > start) {
      const jsonStr = limpio.substring(start, end);
      return JSON.parse(jsonStr);
    }
    throw err;
  }
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

Devuelve SOLO un array JSON válido (sin texto extra ni markdown, SIN saltos de línea en strings):
[{"ciudad":"nombre de la ciudad","pais":"nombre del país","tipo_viaje":"cultura|naturaleza|gastronomia|playa|montana|ocio","precio_estimado":650,"descripcion":"2 frases atractivas sobre el destino","clima":"ej: Cálido y soleado, 26°C","idioma":"idioma principal","duracion_vuelo":"ej: 2h 30min desde Madrid"}]`;

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

Devuelve SOLO un array JSON válido (sin texto extra, sin markdown, SIN saltos de línea en strings, una línea por día):
[{"dia":1,"titulo":"Llegada y primera exploración","actividades":[{"hora":"10:00","nombre":"lugar o actividad","descripcion":"descripción breve 1-2 frases","tipo":"cultura|gastronomia|ocio|transporte|alojamiento|naturaleza","ubicacion":"zona o dirección","duracion_minutos":90,"coste_estimado":15.0}]}]

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
