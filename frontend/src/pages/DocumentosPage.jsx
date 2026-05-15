// ============================================================
// BlindJourney – Página de Documentos de Viaje
// Autora: Alicia Maillo
//
// Lista de documentos necesarios para los viajes:
// - Agrupados por viaje: una sección por viaje + "Generales" (documentos de todos)
// - Cada documento muestra: icono, nombre, tipo, fecha de expiración, botón descargar
// - Fecha expirada: se destaca en rojo para alertar al usuario
// - Iconos por tipo: pasaporte (azul), visa (púrpura), billete (dorado), etc.
//
// Conceptos:
// - Iconografía: mapeo de tipo de documento → icono de MUI
// - Fecha expirada: lógica condicional (new Date > hoy)
// - Agrupación: reduce para agrupar documentos por viaje_id
// ============================================================

import { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent,
  CircularProgress, Alert, IconButton,
} from '@mui/material';
import FolderIcon from '@mui/icons-material/Folder';
import DownloadIcon from '@mui/icons-material/Download';
import PassportIcon from '@mui/icons-material/RecentActors';
import FlightIcon from '@mui/icons-material/Flight';
import HotelIcon from '@mui/icons-material/Hotel';
import ArticleIcon from '@mui/icons-material/Article';
import ShieldIcon from '@mui/icons-material/Shield';
import { useTranslation } from 'react-i18next';
import client from '../api/client';

const TIPO_ICON = {
  pasaporte:     <PassportIcon sx={{ fontSize: 22, color: '#6495ed' }} />,
  visa:          <ArticleIcon  sx={{ fontSize: 22, color: '#c084fc' }} />,
  billete_vuelo: <FlightIcon   sx={{ fontSize: 22, color: '#f0a500' }} />,
  billete_tren:  <FlightIcon   sx={{ fontSize: 22, color: '#f0a500' }} />,
  reserva_hotel: <HotelIcon    sx={{ fontSize: 22, color: '#3ddc84' }} />,
  seguro:        <ShieldIcon   sx={{ fontSize: 22, color: '#3ddc84' }} />,
  otro:          <ArticleIcon  sx={{ fontSize: 22, color: 'var(--bj-text-muted)' }} />,
};

function DocCard({ doc, t }) {
  const icono = TIPO_ICON[doc.tipo] || TIPO_ICON.otro;
  const label = t(`documents.types.${doc.tipo}`, doc.tipo);
  const vence = doc.fecha_expiracion
    ? new Date(doc.fecha_expiracion).toLocaleDateString()
    : null;
  const isExpired = vence && new Date(doc.fecha_expiracion) < new Date();

  return (
    <Card sx={{ mb: 1.5, bgcolor: 'var(--bj-surface)', border: '1px solid var(--bj-border)' }}>
      <CardContent sx={{ p: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ flexShrink: 0 }}>{icono}</Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--bj-text)' }} noWrap>
              {doc.nombre}
            </Typography>
            <Typography sx={{ fontSize: '0.7rem', color: 'var(--bj-text-muted)', mt: 0.25 }}>
              {label}
              {vence && (
                <Box component="span" sx={{ ml: 1 }}>
                  ·{' '}
                  <Box component="span" sx={{ color: isExpired ? 'var(--bj-error)' : 'var(--bj-text-muted)' }}>
                    {vence}
                  </Box>
                </Box>
              )}
            </Typography>
          </Box>
          {doc.url_storage && (
            <IconButton href={doc.url_storage} target="_blank" size="small"
              sx={{ color: '#f0a500', flexShrink: 0 }}>
              <DownloadIcon fontSize="small" />
            </IconButton>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}

export default function DocumentosPage() {
  const { t } = useTranslation();
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    client
      .get('/documentos')
      .then((r) => setDocs(Array.isArray(r.data) ? r.data : r.data.documentos || []))
      .catch(() => { setError(t('common.error', 'Error')); setDocs([]); })
      .finally(() => setLoading(false));
  }, [t]);

  const grupos = docs.reduce((acc, d) => {
    const key = d.viaje_id ? t('documents.trip', { id: d.viaje_id }) : t('documents.generalDocs');
    if (!acc[key]) acc[key] = [];
    acc[key].push(d);
    return acc;
  }, {});

  return (
    <Box sx={{ px: 2, pt: 2.5, pb: 2 }}>
      <Typography sx={{ fontFamily: '"Playfair Display", serif', fontSize: '1.4rem', color: 'var(--bj-text)', mb: 2 }}>
        {t('documents.title')}
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress sx={{ color: '#f0a500' }} />
        </Box>
      ) : docs.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 7 }}>
          <FolderIcon sx={{ fontSize: 48, color: 'var(--bj-text-muted)', mb: 1.5 }} />
          <Typography sx={{ fontFamily: '"Playfair Display", serif', fontSize: '1.1rem', color: 'var(--bj-text)', mb: 0.75 }}>
            {t('documents.noDocuments')}
          </Typography>
          <Typography sx={{ fontSize: '0.8rem', color: 'var(--bj-text-muted)' }}>
            {t('documents.noDocumentsDesc')}
          </Typography>
        </Box>
      ) : (
        Object.entries(grupos).map(([grupo, items]) => (
          <Box key={grupo} sx={{ mb: 2 }}>
            <Typography sx={{
              fontSize: '0.7rem', color: 'var(--bj-text-muted)', fontWeight: 600,
              textTransform: 'uppercase', letterSpacing: '0.06em', mb: 1,
            }}>
              {grupo}
            </Typography>
            {items.map((doc) => <DocCard key={doc.id} doc={doc} t={t} />)}
          </Box>
        ))
      )}
    </Box>
  );
}
