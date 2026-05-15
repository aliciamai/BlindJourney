// ============================================================
// BlindJourney – Visualizador de Mapa Interactivo
// Autora: Alicia Maillo
//
// Componente que renderiza un mapa de Google Maps con:
// - Actividades del itinerario como marcadores de colores
// - Fotos geoetiquetadas (si tienen coordenadas)
// - Filtros por categoría de actividad (buttons toggle)
// - InfoWindows que se abren al hacer clic en un marcador
// - Tema oscuro automático según el modo actual
//
// Uso de Google Maps API: necesita variable de entorno VITE_GOOGLE_MAPS_API_KEY
// ============================================================

// React hooks: estado, efectos, callbacks, referencias
import { useState, useEffect, useCallback, useRef } from 'react';
// Componentes de Google Maps (@react-google-maps/api)
// GoogleMap: mapa interactivo
// useLoadScript: carga la API de Google Maps de forma asincrónica
// MarkerF: marcadores en el mapa
// InfoWindowF: ventanas emergentes al hacer clic en marcadores
import { GoogleMap, useLoadScript, MarkerF, InfoWindowF } from '@react-google-maps/api';
// MUI components para UI
import { Box, Typography, CircularProgress, Alert } from '@mui/material';
// Traducciones
import { useTranslation } from 'react-i18next';

// ── CONSTANTES ─────────────────────────────────────────────

// Librerías de Google Maps a cargar (places para geocodificación)
const LIBRARIES = ['places'];
// Estilos del contenedor del mapa
const MAP_CONTAINER_STYLE = { width: '100%', height: '420px', borderRadius: '12px' };
// Centro por defecto: Madrid
const DEFAULT_CENTER = { lat: 40.4168, lng: -3.7038 };

// ── MAPEO: Tipo de Actividad → Color ───────────────────────
// Cada tipo de actividad tiene un color distintivo para los marcadores
const TIPO_COLOR = {
  cultura:      '#6495ed',      // Azul
  gastronomia:  '#f0a500',      // Dorado
  ocio:         '#c084fc',      // Púrpura
  transporte:   '#7b8aaa',      // Gris
  alojamiento:  '#3ddc84',      // Verde
  naturaleza:   '#4ade80',      // Verde oscuro
};

// ── CACHÉ A NIVEL DE MÓDULO ───────────────────────────────
// Map que almacena direcciones ya geocodificadas
// Razón: la API Geocoder es lenta y costosa. Sin caché, cada render
// haría N llamadas de geocoding. Con caché, reutiliza resultados.
const geocodeCache = new Map();

// ── FUNCIÓN: Crear Icono de Marcador ──────────────────────
/**
 * Genera un icono circular con el color correspondiente al tipo de actividad.
 * Parámetros: tipo (ej. "cultura", "gastronomia")
 * Devuelve: objeto de configuración de Google Maps SymbolPath
 *
 * Estilos:
 * - Relleno: color según tipo (fallback dorado)
 * - Borde: blanco
 * - Tamaño: 9 (escala Google Maps)
 */
function getMarkerIcon(tipo) {
  const color = TIPO_COLOR[tipo] || '#f0a500';  // Fallback a dorado
  return {
    path: window.google.maps.SymbolPath.CIRCLE,  // Forma circular
    fillColor: color,
    fillOpacity: 1,  // Opacidad completa
    strokeColor: '#ffffff',  // Borde blanco
    strokeWeight: 2,
    scale: 9,
  };
}

// ── FUNCIÓN: Geocodificar Dirección ───────────────────────
/**
 * Convierte una dirección (string) a coordenadas (lat, lng).
 * Pasos:
 * 1. Verifica si la dirección ya fue geocodificada (caché)
 * 2. Si no, llama a Geocoder de Google Maps
 * 3. Guarda el resultado en caché para futuras llamadas
 *
 * Parámetros:
 * - geocoder: instancia de Google Maps Geocoder
 * - address: dirección como string (ej. "Eiffel Tower, Paris")
 *
 * Devuelve: Promise que resuelve a { lat, lng } o null si falla
 */
function geocodeAddress(geocoder, address) {
  // Verifica si ya geocodificamos esta dirección
  if (geocodeCache.has(address)) {
    return Promise.resolve(geocodeCache.get(address));
  }

  // Si no está en caché, llama a la API de Geocoding
  return new Promise((resolve) => {
    geocoder.geocode({ address }, (results, status) => {
      // Si la geocodificación fue exitosa, extrae lat/lng del primer resultado
      const coords = (status === 'OK' && results[0])
        ? { lat: results[0].geometry.location.lat(), lng: results[0].geometry.location.lng() }
        : null;
      // Guarda en caché (incluso si es null, para evitar reintentar direcciones inválidas)
      geocodeCache.set(address, coords);
      resolve(coords);
    });
  });
}

export default function MapView({ activities = [], fotos = [], destCity = '', destPais = '' }) {
  const { t } = useTranslation();
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: apiKey || '',
    libraries: LIBRARIES,
    language: 'es',
  });

  const [center, setCenter] = useState(DEFAULT_CENTER);
  const [markers, setMarkers] = useState([]);
  const [fotoMarkers, setFotoMarkers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [selectedFoto, setSelectedFoto] = useState(null);
  const [geocoding, setGeocoding] = useState(false);
  // All categories active by default; populated once markers are ready
  const [activeFilters, setActiveFilters] = useState(new Set(Object.keys(TIPO_COLOR)));

  // Refs so the callback can read the latest values without them being dependencies
  const activitiesRef = useRef(activities);
  activitiesRef.current = activities;
  const fotosRef = useRef(fotos);
  fotosRef.current = fotos;

  // Stable key derived from the actual geocodable data — only changes when addresses change
  const geocodeKey = [destCity, destPais, ...activities.map((a) => a.ubicacion || '')].join('|');

  const buildMarkers = useCallback(async () => {
    if (!isLoaded || !window.google) return;
    setGeocoding(true);

    const acts = activitiesRef.current;
    const fts = fotosRef.current;
    const geocoder = new window.google.maps.Geocoder();

    if (destCity) {
      const coords = await geocodeAddress(geocoder, `${destCity}, ${destPais}`);
      if (coords) setCenter(coords);
    }

    const withLocation = acts.filter((a) => a.ubicacion);
    const results = await Promise.all(
      withLocation.map(async (a) => {
        const coords = await geocodeAddress(geocoder, `${a.ubicacion}, ${destCity}`);
        return coords ? { ...a, ...coords } : null;
      })
    );

    const valid = results.filter(Boolean);
    setMarkers(valid);
    setActiveFilters(new Set(valid.map((m) => m.tipo)));

    // Fotos con coordenadas directas — no requieren geocoding
    const fotoConCoords = fts.filter((f) => f.latitud && f.longitud && f.activo !== false);
    setFotoMarkers(fotoConCoords.map((f) => ({
      ...f,
      lat: parseFloat(f.latitud),
      lng: parseFloat(f.longitud),
    })));

    setGeocoding(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, geocodeKey, destCity, destPais]);

  useEffect(() => {
    buildMarkers();
  }, [buildMarkers]);

  const toggleFilter = (tipo) => {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(tipo)) next.delete(tipo);
      else next.add(tipo);
      return next;
    });
    // Cierra InfoWindow si su marcador queda oculto
    setSelected((sel) => (sel?.tipo === tipo ? null : sel));
  };

  if (!apiKey) {
    return <Alert severity="info" sx={{ mt: 1 }}>{t('itinerary.map.noKey')}</Alert>;
  }
  if (loadError) {
    return <Alert severity="error">{loadError.message}</Alert>;
  }
  if (!isLoaded || geocoding) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 5, gap: 1.5 }}>
        <CircularProgress sx={{ color: '#f0a500' }} size={32} />
        <Typography sx={{ fontSize: '0.8rem', color: 'var(--bj-text-muted)' }}>
          {t('itinerary.map.loading')}
        </Typography>
      </Box>
    );
  }

  const isDark = localStorage.getItem('bj_theme') !== 'light';

  const mapOptions = {
    styles: isDark ? darkMapStyle : [],
    disableDefaultUI: false,
    zoomControl: true,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: true,
  };

  const visibleMarkers = markers.filter((m) => activeFilters.has(m.tipo));

  // Categories that have at least one marker
  const presentCategories = Object.keys(TIPO_COLOR).filter(
    (tipo) => markers.some((m) => m.tipo === tipo)
  );

  return (
    <Box sx={{ mt: 1 }}>
      {markers.length === 0 && (
        <Alert severity="info" sx={{ mb: 1.5 }}>{t('itinerary.map.noActivities')}</Alert>
      )}

      <GoogleMap
        mapContainerStyle={MAP_CONTAINER_STYLE}
        center={center}
        zoom={13}
        options={mapOptions}
        onClick={() => setSelected(null)}
      >
        {visibleMarkers.map((m) => (
          <MarkerF
            key={m.id}
            position={{ lat: m.lat, lng: m.lng }}
            title={m.nombre}
            icon={getMarkerIcon(m.tipo)}
            onClick={() => setSelected(m)}
          />
        ))}

        {/* Marcadores de fotos */}
        {fotoMarkers.map((f) => (
          <MarkerF
            key={`foto-${f.id}`}
            position={{ lat: f.lat, lng: f.lng }}
            title={f.ubicacion_nombre || 'Foto'}
            icon={{
              path: window.google.maps.SymbolPath.CIRCLE,
              fillColor: '#f0a500',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 2,
              scale: 8,
            }}
            onClick={() => { setSelectedFoto(f); setSelected(null); }}
          />
        ))}

        {/* InfoWindow de foto */}
        {selectedFoto && (
          <InfoWindowF
            position={{ lat: selectedFoto.lat, lng: selectedFoto.lng }}
            onCloseClick={() => setSelectedFoto(null)}
          >
            <Box sx={{ maxWidth: 180 }}>
              <Box
                component="img"
                src={selectedFoto.url}
                alt={selectedFoto.descripcion || 'foto'}
                sx={{ width: '100%', height: 100, objectFit: 'cover', borderRadius: 1, display: 'block', mb: 0.5 }}
              />
              {selectedFoto.descripcion && (
                <Typography sx={{ fontSize: '0.75rem', color: '#1a1f2e' }}>
                  {selectedFoto.descripcion}
                </Typography>
              )}
              {selectedFoto.ubicacion_nombre && (
                <Typography sx={{ fontSize: '0.68rem', color: '#5a6383' }}>
                  📍 {selectedFoto.ubicacion_nombre}
                </Typography>
              )}
            </Box>
          </InfoWindowF>
        )}

        {selected && activeFilters.has(selected.tipo) && (
          <InfoWindowF
            position={{ lat: selected.lat, lng: selected.lng }}
            onCloseClick={() => setSelected(null)}
          >
            <Box sx={{ maxWidth: 200, p: 0.5 }}>
              <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', color: '#1a1f2e' }}>
                {selected.nombre}
              </Typography>
              {selected.hora && (
                <Typography sx={{ fontSize: '0.72rem', color: '#5a6383' }}>🕐 {selected.hora}</Typography>
              )}
              {selected.ubicacion && (
                <Typography sx={{ fontSize: '0.72rem', color: '#5a6383' }}>📍 {selected.ubicacion}</Typography>
              )}
              {selected.duracion_minutos && (
                <Typography sx={{ fontSize: '0.72rem', color: '#5a6383' }}>⏱ {selected.duracion_minutos} min</Typography>
              )}
              {selected.coste_estimado > 0 && (
                <Typography sx={{ fontSize: '0.72rem', color: '#f0a500', fontWeight: 600 }}>
                  {selected.coste_estimado}€
                </Typography>
              )}
            </Box>
          </InfoWindowF>
        )}
      </GoogleMap>

      {presentCategories.length > 0 && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mt: 1.5 }}>
          {presentCategories.map((tipo) => {
            const color = TIPO_COLOR[tipo];
            const count = markers.filter((m) => m.tipo === tipo).length;
            const active = activeFilters.has(tipo);
            return (
              <Box
                key={tipo}
                onClick={() => toggleFilter(tipo)}
                sx={{
                  display: 'flex', alignItems: 'center', gap: 0.75,
                  px: 1.25, py: 0.5, borderRadius: 5, cursor: 'pointer',
                  border: `1.5px solid ${active ? color : 'var(--bj-border)'}`,
                  bgcolor: active ? `${color}22` : 'transparent',
                  opacity: active ? 1 : 0.45,
                  transition: 'all 0.18s ease',
                  userSelect: 'none',
                  '&:hover': { opacity: 1, borderColor: color },
                }}
              >
                <Box sx={{
                  width: 9, height: 9, borderRadius: '50%',
                  bgcolor: active ? color : 'var(--bj-text-muted)',
                  flexShrink: 0,
                  transition: 'background-color 0.18s ease',
                }} />
                <Typography sx={{
                  fontSize: '0.68rem',
                  color: active ? color : 'var(--bj-text-muted)',
                  textTransform: 'capitalize',
                  fontWeight: active ? 600 : 400,
                  transition: 'color 0.18s ease',
                }}>
                  {tipo} ({count})
                </Typography>
              </Box>
            );
          })}
        </Box>
      )}
    </Box>
  );
}

const darkMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#1e2535' }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#7b8aaa' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0d0f14' }] },
  { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: '#2a3347' }] },
  { featureType: 'administrative.country', elementType: 'labels.text.fill', stylers: [{ color: '#9e9e9e' }] },
  { featureType: 'administrative.land_parcel', stylers: [{ visibility: 'off' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#bdbdbd' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#181c24' }] },
  { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#3ddc84' }] },
  { featureType: 'road', elementType: 'geometry.fill', stylers: [{ color: '#2a3347' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#9e9e9e' }] },
  { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#373d4e' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#3c4559' }] },
  { featureType: 'road.highway.controlled_access', elementType: 'geometry', stylers: [{ color: '#4e5d7a' }] },
  { featureType: 'road.local', elementType: 'labels.text.fill', stylers: [{ color: '#616161' }] },
  { featureType: 'transit', elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0d1117' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#3d3d3d' }] },
];
