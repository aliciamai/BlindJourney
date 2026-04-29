// ============================================================
// BlindJourney – Controlador Buscador de viajes
// Genera deep-links de afiliados a proveedores externos y
// registra cada búsqueda como lead de comisión.
// ============================================================

const { Comision } = require('../models/index');

// ── Generadores de URLs de afiliado ──────────────────────────
// Cuando se configuren cuentas de afiliado reales, añadir el
// parámetro correspondiente de cada proveedor aquí.

const urlVuelo = {
  skyscanner: (from, destino, fechaIda, fechaVuelta, adultos) => {
    const params = new URLSearchParams({
      adults: adultos,
      ...(fechaIda    && { outboundDate: fechaIda }),
      ...(fechaVuelta && { inboundDate: fechaVuelta }),
    });
    return `https://www.skyscanner.es/vuelos/${from.toLowerCase()}/${encodeURIComponent(destino.toLowerCase())}?${params}`;
  },
  googleFlights: (from, destino, fechaIda, fechaVuelta) => {
    const base = 'https://www.google.com/travel/flights';
    const q = `vuelos+de+Madrid+a+${encodeURIComponent(destino)}`;
    return `${base}?q=${q}${fechaIda ? `&date=${fechaIda}` : ''}`;
  },
  kayak: (destino, fechaIda, fechaVuelta, adultos) =>
    `https://www.kayak.es/flights/MAD-${encodeURIComponent(destino)}/${fechaIda || ''}/${fechaVuelta || ''}/${adultos}adults`,
};

const urlHotel = {
  booking: (destino, checkin, checkout, adultos) => {
    const params = new URLSearchParams({
      ss:           destino,
      checkin:      checkin  || '',
      checkout:     checkout || '',
      group_adults: adultos,
    });
    return `https://www.booking.com/searchresults.es.html?${params}`;
  },
  airbnb: (destino, checkin, checkout) => {
    const params = new URLSearchParams({
      query:        destino,
      checkin:      checkin  || '',
      checkout:     checkout || '',
    });
    return `https://www.airbnb.es/s/${encodeURIComponent(destino)}/homes?${params}`;
  },
};

const urlExperiencia = {
  viator:      (destino) => `https://www.viator.com/es-ES/search?text=${encodeURIComponent(destino)}`,
  getyourguide:(destino) => `https://www.getyourguide.es/s/?q=${encodeURIComponent(destino)}`,
};

// ── POST /api/buscador/registrar ─────────────────────────────
// El frontend genera los links; este endpoint sólo registra el
// click como lead de comisión y devuelve confirmación.
const registrar = async (req, res, next) => {
  try {
    const { tipo, proveedor, destino_ciudad, url_destino, viaje_id } = req.body;
    if (!tipo || !destino_ciudad) {
      return res.status(400).json({ error: 'tipo y destino_ciudad son requeridos' });
    }

    await Comision.create({
      usuario_id:     req.usuario.id,
      viaje_id:       viaje_id || null,
      tipo,
      proveedor:      proveedor     || 'desconocido',
      destino_ciudad: destino_ciudad.substring(0, 100),
      url_destino:    url_destino   || null,
    });

    res.status(201).json({ message: 'Búsqueda registrada' });
  } catch (error) {
    next(error);
  }
};

// ── GET /api/buscador/estadisticas ───────────────────────────
const estadisticas = async (req, res, next) => {
  try {
    const historial = await Comision.findAll({
      where: { usuario_id: req.usuario.id },
      order: [['fecha_creacion', 'DESC']],
      limit: 100,
    });

    const stats = {
      total:        historial.length,
      vuelos:       historial.filter((c) => c.tipo === 'vuelo').length,
      hoteles:      historial.filter((c) => c.tipo === 'hotel').length,
      experiencias: historial.filter((c) => c.tipo === 'experiencia').length,
    };

    res.json({ stats, historial });
  } catch (error) {
    next(error);
  }
};

// ── GET /api/buscador/links ───────────────────────────────────
// Devuelve los links calculados para el tipo de búsqueda indicado.
const generarLinks = async (req, res, next) => {
  try {
    const { tipo, destino, fecha_ida, fecha_vuelta, checkin, checkout, adultos = 1 } = req.query;

    if (!tipo || !destino) {
      return res.status(400).json({ error: 'tipo y destino son requeridos' });
    }

    let links = {};

    if (tipo === 'vuelo') {
      links = {
        skyscanner:   urlVuelo.skyscanner('MAD', destino, fecha_ida, fecha_vuelta, adultos),
        googleFlights:urlVuelo.googleFlights('MAD', destino, fecha_ida, fecha_vuelta),
        kayak:        urlVuelo.kayak(destino, fecha_ida, fecha_vuelta, adultos),
      };
    } else if (tipo === 'hotel') {
      links = {
        booking: urlHotel.booking(destino, checkin, checkout, adultos),
        airbnb:  urlHotel.airbnb(destino, checkin, checkout),
      };
    } else if (tipo === 'experiencia') {
      links = {
        viator:       urlExperiencia.viator(destino),
        getyourguide: urlExperiencia.getyourguide(destino),
      };
    } else {
      return res.status(400).json({ error: 'tipo debe ser vuelo, hotel o experiencia' });
    }

    res.json({ links });
  } catch (error) {
    next(error);
  }
};

module.exports = { registrar, estadisticas, generarLinks };
