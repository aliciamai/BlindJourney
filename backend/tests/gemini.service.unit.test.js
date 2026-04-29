jest.mock('@google/generative-ai', () => {
  const generateContent = jest.fn();
  const getGenerativeModel = jest.fn(() => ({ generateContent }));
  const GoogleGenerativeAI = jest.fn(() => ({ getGenerativeModel }));
  GoogleGenerativeAI._generateContent = generateContent;
  GoogleGenerativeAI._getGenerativeModel = getGenerativeModel;
  return { GoogleGenerativeAI };
});

jest.mock('groq-sdk', () => {
  const create = jest.fn();
  const Groq = jest.fn(() => ({ chat: { completions: { create } } }));
  Groq._create = create;
  return Groq;
});

jest.mock('../src/services/normalizar.service', () => ({
  normalizarCandidatos: jest.fn(x => (Array.isArray(x) ? x : [])),
  normalizarItinerario: jest.fn(x => (Array.isArray(x) ? x : [])),
}));

describe('gemini.service – generarCandidatos', () => {
  let svc;
  let generateContent;
  let groqCreate;

  beforeEach(() => {
    jest.resetModules();
    process.env.GEMINI_API_KEY = 'test-gemini-key';
    process.env.GROQ_API_KEY = 'test-groq-key';
    svc = require('../src/services/gemini.service');
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const Groq = require('groq-sdk');
    generateContent = GoogleGenerativeAI._generateContent;
    groqCreate = Groq._create;

    const { normalizarCandidatos, normalizarItinerario } = require('../src/services/normalizar.service');
    normalizarCandidatos.mockImplementation(x => (Array.isArray(x) ? x : []));
    normalizarItinerario.mockImplementation(x => (Array.isArray(x) ? x : []));
  });

  afterEach(() => {
    delete process.env.GEMINI_API_KEY;
    delete process.env.GROQ_API_KEY;
  });

  it('genera candidatos usando Gemini', async () => {
    const candidatos = [{ ciudad: 'París', pais: 'Francia', tipo_viaje: 'cultura', precio_estimado: 700 }];
    generateContent.mockResolvedValue({ response: { text: () => JSON.stringify(candidatos) } });

    const result = await svc.generarCandidatos({ presupuesto: 1000, diasViaje: 7, intereses: ['cultura'], nivelActividad: 'moderado', restriccionesAlimentarias: [], numViajeros: 1 });
    expect(result).toEqual(candidatos);
    expect(generateContent).toHaveBeenCalled();
  });

  it('usa Groq como fallback cuando Gemini falla', async () => {
    const candidatos = [{ ciudad: 'Roma', pais: 'Italia' }];
    generateContent.mockRejectedValue(new Error('Gemini error'));
    groqCreate.mockResolvedValue({ choices: [{ message: { content: JSON.stringify(candidatos) } }] });

    const result = await svc.generarCandidatos({ presupuesto: 500, diasViaje: 5 });
    expect(result).toEqual(candidatos);
    expect(groqCreate).toHaveBeenCalled();
  });

  it('lanza error si ambos proveedores fallan', async () => {
    generateContent.mockRejectedValue(new Error('Gemini down'));
    groqCreate.mockRejectedValue(new Error('Groq down'));

    await expect(svc.generarCandidatos({ presupuesto: 500, diasViaje: 5 }))
      .rejects.toThrow('Error al generar destinos con IA');
  });

  it('lanza error si la respuesta no es un array JSON válido', async () => {
    generateContent.mockResolvedValue({ response: { text: () => '{"no": "es array"}' } });

    await expect(svc.generarCandidatos({ presupuesto: 500, diasViaje: 5 }))
      .rejects.toThrow('Error al generar destinos con IA');
  });

  it('limpia markdown de la respuesta antes de parsear JSON', async () => {
    const candidatos = [{ ciudad: 'Berlín', pais: 'Alemania' }];
    generateContent.mockResolvedValue({ response: { text: () => '```json\n' + JSON.stringify(candidatos) + '\n```' } });

    const result = await svc.generarCandidatos({ presupuesto: 500, diasViaje: 5 });
    expect(result).toEqual(candidatos);
  });

  it('retorna máximo 15 candidatos', async () => {
    const muchos = Array.from({ length: 20 }, (_, i) => ({ ciudad: `Ciudad${i}`, pais: 'País' }));
    generateContent.mockResolvedValue({ response: { text: () => JSON.stringify(muchos) } });

    const result = await svc.generarCandidatos({ presupuesto: 500, diasViaje: 5 });
    expect(result.length).toBeLessThanOrEqual(15);
  });

  it('lanza error si GEMINI_API_KEY no está y GROQ tampoco', async () => {
    jest.resetModules();
    delete process.env.GEMINI_API_KEY;
    delete process.env.GROQ_API_KEY;

    const freshSvc = require('../src/services/gemini.service');
    await expect(freshSvc.generarCandidatos({ presupuesto: 500, diasViaje: 5 }))
      .rejects.toThrow('Error al generar destinos con IA');
  });
});

describe('gemini.service – generarItinerario', () => {
  let svc;
  let generateContent;
  let groqCreate;

  beforeEach(() => {
    jest.resetModules();
    process.env.GEMINI_API_KEY = 'test-gemini-key';
    process.env.GROQ_API_KEY = 'test-groq-key';
    svc = require('../src/services/gemini.service');
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const Groq = require('groq-sdk');
    generateContent = GoogleGenerativeAI._generateContent;
    groqCreate = Groq._create;

    const { normalizarCandidatos, normalizarItinerario } = require('../src/services/normalizar.service');
    normalizarCandidatos.mockImplementation(x => (Array.isArray(x) ? x : []));
    normalizarItinerario.mockImplementation(x => (Array.isArray(x) ? x : []));
  });

  afterEach(() => {
    delete process.env.GEMINI_API_KEY;
    delete process.env.GROQ_API_KEY;
  });

  it('genera itinerario usando Gemini', async () => {
    const dias = [{ dia: 1, titulo: 'Llegada', actividades: [] }];
    generateContent.mockResolvedValue({ response: { text: () => JSON.stringify(dias) } });

    const result = await svc.generarItinerario({ ciudad: 'París', pais: 'Francia', diasViaje: 3, presupuestoDiario: 100, intereses: [], nivelActividad: 'moderado', restriccionesAlimentarias: [] });
    expect(result).toEqual(dias);
  });

  it('usa Groq como fallback cuando Gemini falla', async () => {
    const dias = [{ dia: 1, actividades: [] }];
    generateContent.mockRejectedValue(new Error('Gemini error'));
    groqCreate.mockResolvedValue({ choices: [{ message: { content: JSON.stringify(dias) } }] });

    const result = await svc.generarItinerario({ ciudad: 'Roma', pais: 'Italia', diasViaje: 2, presupuestoDiario: 80 });
    expect(result).toEqual(dias);
  });

  it('lanza error si la respuesta del itinerario no es un array', async () => {
    generateContent.mockResolvedValue({ response: { text: () => '{"dia": 1}' } });

    await expect(svc.generarItinerario({ ciudad: 'X', pais: 'Y', diasViaje: 1, presupuestoDiario: 50 }))
      .rejects.toThrow('Error al generar itinerario con IA');
  });

  it('lanza error si ambos proveedores fallan en itinerario', async () => {
    generateContent.mockRejectedValue(new Error('Gemini down'));
    groqCreate.mockRejectedValue(new Error('Groq down'));

    await expect(svc.generarItinerario({ ciudad: 'X', pais: 'Y', diasViaje: 1, presupuestoDiario: 50 }))
      .rejects.toThrow('Error al generar itinerario con IA');
  });

  it('limpia markdown de la respuesta del itinerario', async () => {
    const dias = [{ dia: 1, actividades: [] }];
    generateContent.mockResolvedValue({ response: { text: () => '```\n' + JSON.stringify(dias) + '\n```' } });

    const result = await svc.generarItinerario({ ciudad: 'X', pais: 'Y', diasViaje: 1, presupuestoDiario: 50 });
    expect(result).toEqual(dias);
  });
});
