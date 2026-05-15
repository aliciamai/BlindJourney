// ============================================================
// BlindJourney – Configuración de Internacionalización (i18n)
// Autora: Alicia Maillo
//
// Este módulo configura i18next para soportar múltiples idiomas
// (español e inglés). Los textos de la app se cargan desde archivos
// JSON en función del idioma seleccionado.
//
// La preferencia de idioma se persiste en localStorage (clave: 'bj_lang')
// para que se mantenga entre sesiones del usuario.
// ============================================================

// i18next: framework estándar para internacionalización
// Permite cambiar idiomas dinámicamente sin recargar la página
import i18n from 'i18next';
// react-i18next: integración de i18next con React
// Proporciona hooks como useTranslation() y componentes como <Trans>
import { initReactI18next } from 'react-i18next';
// Archivos JSON con todos los textos traducidos de la app
// es.json: strings en español
// en.json: strings en inglés
import es from './locales/es.json';
import en from './locales/en.json';

// ── INICIALIZACIÓN DE i18next ─────────────────────────────────
/**
 * Configura i18next para gestionar los idiomas de la app.
 *
 * Pasos:
 * 1. Lee el idioma guardado en localStorage (clave 'bj_lang')
 * 2. Si no existe, usa el idioma por defecto: 'es' (español)
 * 3. Carga los archivos JSON con los textos de cada idioma
 * 4. interpolation.escapeValue = false: permite inyectar HTML en los textos
 */
i18n.use(initReactI18next).init({
  // Diccionarios de idiomas disponibles
  resources: {
    es: { translation: es },
    en: { translation: en },
  },
  // Idioma inicial: lee de localStorage si existe, fallback a 'es'
  // El check de typeof localStorage previene errores en SSR (server-side rendering)
  lng: (typeof localStorage !== 'undefined' && typeof localStorage.getItem === 'function' ? localStorage.getItem('bj_lang') : null) || 'es',
  // Idioma por defecto si el idioma seleccionado no está disponible
  fallbackLng: 'es',
  // interpolation: configuración de cómo insertar variables en los textos
  // escapeValue: false permite que los textos incluyan HTML (ej. <strong>texto</strong>)
  interpolation: { escapeValue: false },
});

export default i18n;
