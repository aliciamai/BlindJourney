const future = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
const pastDate = '2025-01-01';
const pastEnd = '2025-01-08';

export const viajesFixture = [
  {
    id: 1,
    estado: 'pendiente',
    destino_revelado: false,
    fecha_inicio: '2026-07-01',
    fecha_fin: '2026-07-08',
    duracion: 7,
    revelar_en: future,
    candidatos: [
      { id: 10, ciudad: 'Lisboa', pais: 'Portugal', tipo_viaje: 'cultural', precio_estimado: 800, seleccionado: true, vetado: false, clima: 'Templado', idioma: 'Portugués', descripcion: 'Ciudad costera' },
      { id: 11, ciudad: 'Amsterdam', pais: 'Países Bajos', tipo_viaje: 'urbano', precio_estimado: 1100, seleccionado: false, vetado: false, clima: 'Frío', idioma: 'Holandés', descripcion: 'Canales y museos' },
    ],
    reservas: [],
  },
  {
    id: 2,
    estado: 'confirmado',
    destino_revelado: false,
    fecha_inicio: '2026-08-10',
    fecha_fin: '2026-08-17',
    duracion: 7,
    revelar_en: null,
    candidatos: [],
    reservas: [],
  },
  {
    id: 3,
    estado: 'revelado',
    destino_revelado: true,
    destino_ciudad: 'París',
    destino_pais: 'Francia',
    fecha_inicio: '2026-09-01',
    fecha_fin: '2026-09-07',
    duracion: 6,
    revelar_en: null,
    candidatos: [],
    reservas: [
      { id: 100, codigo_reserva_vuelo: 'IB1234', alojamiento: 'Hotel Lumière' },
    ],
  },
  {
    id: 4,
    estado: 'completado',
    destino_revelado: true,
    destino_ciudad: 'Roma',
    destino_pais: 'Italia',
    fecha_inicio: pastDate,
    fecha_fin: pastEnd,
    duracion: 7,
    revelar_en: null,
    candidatos: [],
    reservas: [],
  },
  {
    id: 5,
    estado: 'cancelado',
    destino_revelado: false,
    fecha_inicio: '2026-04-01',
    fecha_fin: '2026-04-05',
    duracion: 4,
    revelar_en: null,
    candidatos: [],
    reservas: [],
  },
];

export const viajeReveladoFixture = viajesFixture[2];
export const viajeNoReveladoFixture = viajesFixture[0];
