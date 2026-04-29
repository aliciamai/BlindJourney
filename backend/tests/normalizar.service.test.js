const { normalizarCandidatos, normalizarItinerario } = require('../src/services/normalizar.service');

describe('normalizarCandidatos', () => {
  it('devuelve [] si el input no es array', () => {
    expect(normalizarCandidatos(null)).toEqual([]);
    expect(normalizarCandidatos('x')).toEqual([]);
    expect(normalizarCandidatos(42)).toEqual([]);
  });

  it('devuelve [] si el array está vacío', () => {
    expect(normalizarCandidatos([])).toEqual([]);
  });

  it('normaliza un candidato válido', () => {
    const [r] = normalizarCandidatos([{
      ciudad: '  París  ', pais: 'Francia', tipo_viaje: 'cultura',
      precio_estimado: '650.5', descripcion: 'Desc', clima: 'Soleado',
      idioma: 'Francés', duracion_vuelo: '2h',
    }]);
    expect(r.ciudad).toBe('París');
    expect(r.pais).toBe('Francia');
    expect(r.tipo_viaje).toBe('cultura');
    expect(r.precio_estimado).toBe(650.5);
    expect(r.vetado).toBe(false);
    expect(r.seleccionado).toBe(false);
    expect(r.imagen_url).toBeNull();
  });

  it('usa "ocio" cuando tipo_viaje no es válido', () => {
    const [r] = normalizarCandidatos([{ ciudad: 'Roma', pais: 'Italia', tipo_viaje: 'playa_inventada' }]);
    expect(r.tipo_viaje).toBe('ocio');
  });

  it('todos los tipos válidos de candidato se preservan', () => {
    const tipos = ['cultura', 'naturaleza', 'gastronomia', 'playa', 'montana', 'ocio'];
    tipos.forEach(tipo => {
      const [r] = normalizarCandidatos([{ ciudad: 'X', pais: 'Y', tipo_viaje: tipo }]);
      expect(r.tipo_viaje).toBe(tipo);
    });
  });

  it('usa "Ciudad" como fallback cuando ciudad no es string', () => {
    const [r] = normalizarCandidatos([{ ciudad: null, pais: 'Italia' }]);
    expect(r.ciudad).toBe('Ciudad');
  });

  it('usa "País" como fallback cuando pais no es string', () => {
    const [r] = normalizarCandidatos([{ ciudad: 'Roma', pais: null }]);
    expect(r.pais).toBe('País');
  });

  it('filtra candidatos donde ciudad Y pais son los fallbacks', () => {
    const result = normalizarCandidatos([{ ciudad: '', pais: '' }]);
    expect(result).toHaveLength(0);
  });

  it('mantiene candidato si solo ciudad es fallback', () => {
    const result = normalizarCandidatos([{ ciudad: '', pais: 'Italia' }]);
    expect(result).toHaveLength(1);
  });

  it('mantiene candidato si solo pais es fallback', () => {
    const result = normalizarCandidatos([{ ciudad: 'Roma', pais: '' }]);
    expect(result).toHaveLength(1);
  });

  it('usa precio_estimado 0 cuando el valor no es numérico', () => {
    const [r] = normalizarCandidatos([{ ciudad: 'X', pais: 'Y', precio_estimado: 'gratis' }]);
    expect(r.precio_estimado).toBe(0);
  });

  it('redondea precio_estimado a 2 decimales', () => {
    const [r] = normalizarCandidatos([{ ciudad: 'X', pais: 'Y', precio_estimado: 100.123 }]);
    expect(r.precio_estimado).toBe(100.12);
  });

  it('trunca campos de texto largos', () => {
    const largo = 'A'.repeat(200);
    const [r] = normalizarCandidatos([{ ciudad: largo, pais: 'Y', clima: largo, idioma: largo, duracion_vuelo: largo }]);
    expect(r.ciudad.length).toBeLessThanOrEqual(100);
    expect(r.clima.length).toBeLessThanOrEqual(100);
    expect(r.idioma.length).toBeLessThanOrEqual(50);
    expect(r.duracion_vuelo.length).toBeLessThanOrEqual(50);
  });
});

describe('normalizarItinerario', () => {
  it('devuelve [] si el input no es array', () => {
    expect(normalizarItinerario(null)).toEqual([]);
    expect(normalizarItinerario(42)).toEqual([]);
  });

  it('devuelve [] si el array está vacío', () => {
    expect(normalizarItinerario([])).toEqual([]);
  });

  it('filtra días cuyo campo dia no es entero positivo', () => {
    expect(normalizarItinerario([{ dia: 'nope', actividades: [] }])).toEqual([]);
    expect(normalizarItinerario([{ dia: 0, actividades: [] }])).toEqual([]);
    expect(normalizarItinerario([{ dia: -1, actividades: [] }])).toEqual([]);
  });

  it('normaliza un día con actividades válidas', () => {
    const input = [{ dia: 1, titulo: 'Llegada', actividades: [{
      hora: '10:00', nombre: 'Museo', descripcion: 'Visita', tipo: 'cultura',
      ubicacion: 'Centro', duracion_minutos: 90, coste_estimado: 15,
    }] }];
    const [dia] = normalizarItinerario(input);
    expect(dia.dia).toBe(1);
    expect(dia.titulo).toBe('Llegada');
    const [act] = dia.actividades;
    expect(act.hora).toBe('10:00');
    expect(act.tipo).toBe('cultura');
    expect(act.duracion_minutos).toBe(90);
    expect(act.coste_estimado).toBe(15);
  });

  it('usa título por defecto cuando falta', () => {
    const [dia] = normalizarItinerario([{ dia: 3, actividades: [] }]);
    expect(dia.titulo).toContain('3');
  });

  it('trata actividades como [] cuando no es array', () => {
    const [dia] = normalizarItinerario([{ dia: 1, actividades: null }]);
    expect(dia.actividades).toEqual([]);
  });

  it('filtra actividades sin nombre', () => {
    const [dia] = normalizarItinerario([{ dia: 1, actividades: [{ hora: '09:00' }] }]);
    expect(dia.actividades).toHaveLength(0);
  });

  it('filtra actividades nulas', () => {
    const [dia] = normalizarItinerario([{ dia: 1, actividades: [null, { nombre: 'Real' }] }]);
    expect(dia.actividades).toHaveLength(1);
  });

  it('usa "09:00" cuando hora no es string', () => {
    const [dia] = normalizarItinerario([{ dia: 1, actividades: [{ nombre: 'A', hora: 1000 }] }]);
    expect(dia.actividades[0].hora).toBe('09:00');
  });

  it('usa "09:00" cuando hora tiene formato inválido', () => {
    const [dia] = normalizarItinerario([{ dia: 1, actividades: [{ nombre: 'A', hora: 'mediodia' }] }]);
    expect(dia.actividades[0].hora).toBe('09:00');
  });

  it('usa "ocio" para tipo de actividad inválido', () => {
    const [dia] = normalizarItinerario([{ dia: 1, actividades: [{ nombre: 'A', tipo: 'invalido' }] }]);
    expect(dia.actividades[0].tipo).toBe('ocio');
  });

  it('todos los tipos válidos de actividad se preservan', () => {
    const tipos = ['cultura', 'gastronomia', 'ocio', 'transporte', 'alojamiento', 'naturaleza'];
    tipos.forEach(tipo => {
      const [dia] = normalizarItinerario([{ dia: 1, actividades: [{ nombre: 'A', tipo }] }]);
      expect(dia.actividades[0].tipo).toBe(tipo);
    });
  });

  it('devuelve null para duracion_minutos negativa o 0', () => {
    const [dia] = normalizarItinerario([{ dia: 1, actividades: [{ nombre: 'A', duracion_minutos: -5 }] }]);
    expect(dia.actividades[0].duracion_minutos).toBeNull();
  });

  it('devuelve null para coste_estimado no numérico', () => {
    const [dia] = normalizarItinerario([{ dia: 1, actividades: [{ nombre: 'A', coste_estimado: 'gratis' }] }]);
    expect(dia.actividades[0].coste_estimado).toBeNull();
  });

  it('devuelve null para coste_estimado negativo', () => {
    const [dia] = normalizarItinerario([{ dia: 1, actividades: [{ nombre: 'A', coste_estimado: -10 }] }]);
    expect(dia.actividades[0].coste_estimado).toBeNull();
  });

  it('redondea coste_estimado a 2 decimales', () => {
    const [dia] = normalizarItinerario([{ dia: 1, actividades: [{ nombre: 'A', coste_estimado: 10.555 }] }]);
    expect(dia.actividades[0].coste_estimado).toBe(10.56);
  });

  it('usa "Actividad" como nombre fallback cuando nombre es truthy pero no string', () => {
    const [dia] = normalizarItinerario([{ dia: 1, actividades: [{ nombre: true }] }]);
    expect(dia.actividades[0].nombre).toBe('Actividad');
  });
});
