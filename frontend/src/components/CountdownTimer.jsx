// ============================================================
// BlindJourney – Temporizador Regresivo
// Autora: Alicia Maillo
//
// Componente que muestra un countdown hasta una fecha objetivo.
// Se usa en ViajeDetallePage para mostrar cuánto falta para revelar
// el destino oculto del viaje.
// ============================================================

// useState: guarda el tiempo restante
// useEffect: crea un intervalo que actualiza el tiempo cada segundo y limpia al desmontar
import { useState, useEffect } from 'react';
// Box: contenedor flexible de MUI
// Typography: componente de texto
import { Box, Typography } from '@mui/material';
// useTranslation: acceso a los strings traducidos
import { useTranslation } from 'react-i18next';

// ── FUNCIÓN AUXILIAR: Calcular Tiempo Restante ─────────────
/**
 * Calcula la diferencia entre la fecha objetivo y el momento actual.
 * Devuelve: { dias, horas, minutos, segundos }
 *
 * Matemática:
 * - 1 día = 86400000 ms
 * - 1 hora = 3600000 ms
 * - 1 minuto = 60000 ms
 * - 1 segundo = 1000 ms
 *
 * Patrón: calcula el residuo tras cada unidad (% operator)
 * para evitar duplicar tiempo.
 *
 * Nota: si la fecha está en el pasado (diff <= 0), devuelve zeros
 */
function calcTimeLeft(target) {
  // Diferencia en milisegundos entre target y ahora
  const diff = new Date(target) - Date.now();

  // Si el countdown terminó, todos los valores son 0
  if (diff <= 0) return { dias: 0, horas: 0, minutos: 0, segundos: 0 };

  // Desglose de la diferencia en unidades de tiempo
  return {
    // Días enteros
    dias:     Math.floor(diff / 86400000),
    // Horas dentro del día actual (resto después de días)
    horas:    Math.floor((diff % 86400000) / 3600000),
    // Minutos dentro de la hora actual
    minutos:  Math.floor((diff % 3600000) / 60000),
    // Segundos restantes
    segundos: Math.floor((diff % 60000) / 1000),
  };
}

// ── COMPONENTE UNITARIO: Bloque de Tiempo ────────────────
/**
 * Componente que renderiza una unidad de tiempo (días, horas, etc.)
 * Props:
 * - value: número a mostrar (0-59)
 * - label: etiqueta debajo del número (ej. "Días", "Horas")
 *
 * Visualmente es una tarjeta cuadrada con número grande arriba
 * y etiqueta pequeña abajo.
 */
function Unit({ value, label }) {
  return (
    <Box
      sx={{
        bgcolor: 'var(--bj-surface2)',
        border: '1px solid var(--bj-border)',
        borderRadius: 2,
        p: '10px 4px',
        textAlign: 'center',
        flex: 1,
      }}
    >
      {/* Número con padding a 2 dígitos (ej. "09" en lugar de "9") */}
      <Typography
        sx={{
          fontFamily: '"Playfair Display", Georgia, serif',
          fontSize: '1.8rem',
          color: '#f0a500',
          lineHeight: 1,
          display: 'block',
        }}
      >
        {String(value).padStart(2, '0')}
      </Typography>

      {/* Etiqueta (traducida) */}
      <Typography
        sx={{
          fontSize: '0.55rem',
          color: 'var(--bj-text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          mt: 0.5,
          display: 'block',
        }}
      >
        {label}
      </Typography>
    </Box>
  );
}

// ── COMPONENTE PRINCIPAL: COUNTDOWN TIMER ────────────────
/**
 * Temporizador que muestra el tiempo restante hasta una fecha objetivo.
 * Props:
 * - targetDate: fecha objetivo como string o Date (ej. "2026-05-31T12:00:00Z")
 *
 * Comportamiento:
 * - Calcula el tiempo restante al montar
 * - Actualiza cada segundo con setInterval
 * - Limpia el intervalo al desmontar (return () => clearInterval)
 * - Si la fecha pasa, todos los valores se quedan en 0
 *
 * Nota: setInterval es un efecto colateral que debe limpiarse
 * para evitar memory leaks. Por eso useEffect devuelve un cleanup function.
 */
export default function CountdownTimer({ targetDate }) {
  // Hook de i18n para acceder a las etiquetas traducidas (countdown.days, etc.)
  const { t } = useTranslation();

  // Estado del tiempo restante: { dias, horas, minutos, segundos }
  // useState(() => ...) es una función inicializadora: calcula una sola vez al montar
  const [timeLeft, setTimeLeft] = useState(() => calcTimeLeft(targetDate));

  // Efecto: actualiza el tiempo cada segundo
  useEffect(() => {
    // setInterval ejecuta la función cada 1000ms (1 segundo)
    const id = setInterval(() => setTimeLeft(calcTimeLeft(targetDate)), 1000);

    // Función de limpieza (cleanup): se ejecuta al desmontar el componente
    // Detiene el intervalo para evitar que siga ejecutándose innecesariamente
    return () => clearInterval(id);
  }, [targetDate]); // Si targetDate cambia, re-crea el intervalo

  // Renderiza 4 bloques de unidades de tiempo
  return (
    <Box sx={{ display: 'flex', gap: 1, my: 2 }}>
      <Unit value={timeLeft.dias}     label={t('countdown.days')} />
      <Unit value={timeLeft.horas}    label={t('countdown.hours')} />
      <Unit value={timeLeft.minutos}  label={t('countdown.min')} />
      <Unit value={timeLeft.segundos} label={t('countdown.sec')} />
    </Box>
  );
}
