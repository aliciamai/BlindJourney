export const documentosFixture = [
  {
    id: 1,
    nombre: 'Pasaporte Ana García',
    tipo: 'pasaporte',
    url_storage: 'https://storage.example.com/passport.pdf',
    fecha_expiracion: '2030-01-01',
    viaje_id: null,
  },
  {
    id: 2,
    nombre: 'Billete Madrid-París',
    tipo: 'billete_vuelo',
    url_storage: 'https://storage.example.com/vuelo.pdf',
    fecha_expiracion: '2026-06-01',
    viaje_id: 1,
  },
  {
    id: 3,
    nombre: 'Visa expirada',
    tipo: 'visa',
    url_storage: null,
    fecha_expiracion: '2020-01-01',
    viaje_id: null,
  },
  {
    id: 4,
    nombre: 'Seguro viaje',
    tipo: 'seguro',
    url_storage: 'https://storage.example.com/seguro.pdf',
    fecha_expiracion: null,
    viaje_id: 1,
  },
];
