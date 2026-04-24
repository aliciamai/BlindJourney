// ============================================================
// BlindJourney – Servicio de IA con Google Gemini
// Genera candidatos de destino e itinerarios día a día
// ============================================================

const { GoogleGenerativeAI } = require('@google/generative-ai');

let _model = null;
const getModel = () => {
  if (!_model) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY no configurada en .env');
    }
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    _model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  }
  return _model;
};

// Parsea la respuesta de Gemini limpiando posibles bloques de markdown
const parsearJSON = (texto) => {
  const limpio = texto
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim();
  return JSON.parse(limpio);
};

/**
 * Genera entre 10 y 12 destinos candidatos basados en las preferencias del usuario.
 */
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
    const result  = await getModel().generateContent(prompt);
    const texto   = result.response.text();
    const datos   = parsearJSON(texto);

    if (!Array.isArray(datos)) throw new Error('Respuesta no es un array');
    return datos.slice(0, 15);
  } catch (error) {
    console.error('[GEMINI] Error generando candidatos:', error.message);
    throw new Error('Error al generar destinos con IA');
  }
};

/**
 * Genera un itinerario detallado día a día para el destino revelado.
 */
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
    const result = await getModel().generateContent(prompt);
    const texto  = result.response.text();
    const datos  = parsearJSON(texto);

    if (!Array.isArray(datos)) throw new Error('Respuesta no es un array');
    return datos;
  } catch (error) {
    console.error('[GEMINI] Error generando itinerario:', error.message);
    throw new Error('Error al generar itinerario con IA');
  }
};

module.exports = { generarCandidatos, generarItinerario };
