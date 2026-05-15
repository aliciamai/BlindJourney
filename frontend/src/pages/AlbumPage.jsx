// ============================================================
// BlindJourney – Página de Álbum de Fotos
// Autora: Alicia Maillo
//
// Álbum de fotos geoetiquetadas del viaje:
// - Grid de fotos (MUI ImageList, 3 columnas)
// - Lightbox (Dialog) para ver foto ampliada
// - Botones para eliminar foto
// - FAB flotante para añadir nueva foto
// - Uploader con preview via FileReader
//
// Conceptos:
// - ImageList: componente de MUI para grillas de imágenes
// - Dialog: modal para lightbox y form de upload
// - FileReader: para preview antes de subir
// - FormData: para enviar archivos al servidor
// ============================================================

import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, IconButton, CircularProgress, Alert,
  Button, Dialog, DialogContent, DialogTitle, TextField,
  ImageList, ImageListItem, Fab,
} from '@mui/material';
import ArrowBackIcon   from '@mui/icons-material/ArrowBack';
import AddAPhotoIcon   from '@mui/icons-material/AddAPhoto';
import DeleteIcon      from '@mui/icons-material/Delete';
import CloseIcon       from '@mui/icons-material/Close';
import PlaceIcon       from '@mui/icons-material/Place';
import { getFotos, subirFoto, eliminarFoto } from '../api/fotos';

export default function AlbumPage() {
  const { id: viajeId } = useParams();
  const navigate = useNavigate();

  const [fotos,   setFotos]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [selected, setSelected] = useState(null);    // foto ampliada
  const [dialog,  setDialog]  = useState(false);     // formulario añadir
  const [preview, setPreview] = useState('');
  const [desc,    setDesc]    = useState('');
  const [lugar,   setLugar]   = useState('');
  const [saving,  setSaving]  = useState(false);
  const fileRef = useRef();

  const load = () => {
    setLoading(true);
    getFotos(viajeId)
      .then(setFotos)
      .catch(() => setError('No se pudieron cargar las fotos'))
      .finally(() => setLoading(false));
  };

  useEffect(load, [viajeId]);

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleAdd = async () => {
    if (!preview) return;
    setSaving(true);
    try {
      await subirFoto(viajeId, {
        url:              preview,
        descripcion:      desc  || null,
        ubicacion_nombre: lugar || null,
        fecha_foto:       new Date().toISOString(),
      });
      setDialog(false);
      setPreview(''); setDesc(''); setLugar('');
      load();
    } catch {
      setError('Error al subir la foto');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (fotoId) => {
    await eliminarFoto(fotoId);
    setSelected(null);
    setFotos((prev) => prev.filter((f) => f.id !== fotoId));
  };

  return (
    <Box sx={{ px: 2, pt: 2, pb: 10 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <IconButton onClick={() => navigate(-1)} size="small" sx={{ color: '#f0a500' }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography sx={{ fontFamily: '"Playfair Display", serif', fontSize: '1.1rem', color: 'var(--bj-text)', flex: 1 }}>
          Álbum de recuerdos
        </Typography>
        <Typography sx={{ fontSize: '0.72rem', color: 'var(--bj-text-muted)' }}>
          {fotos.length} fotos
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress sx={{ color: '#f0a500' }} />
        </Box>
      ) : fotos.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <AddAPhotoIcon sx={{ fontSize: 48, color: 'var(--bj-text-muted)', mb: 1.5 }} />
          <Typography sx={{ fontFamily: '"Playfair Display", serif', fontSize: '1rem', color: 'var(--bj-text)', mb: 0.5 }}>
            Aún no hay recuerdos
          </Typography>
          <Typography sx={{ fontSize: '0.8rem', color: 'var(--bj-text-muted)', mb: 2.5 }}>
            Añade las fotos de tu viaje
          </Typography>
          <Button variant="contained" startIcon={<AddAPhotoIcon />} onClick={() => setDialog(true)}>
            Añadir foto
          </Button>
        </Box>
      ) : (
        <ImageList cols={3} gap={6} sx={{ borderRadius: 2, overflow: 'hidden' }}>
          {fotos.map((foto) => (
            <ImageListItem
              key={foto.id}
              onClick={() => setSelected(foto)}
              sx={{ cursor: 'pointer', borderRadius: 1, overflow: 'hidden', aspectRatio: '1', position: 'relative' }}
            >
              <Box
                component="img"
                src={foto.url}
                alt={foto.descripcion || 'foto'}
                sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
              {foto.ubicacion_nombre && (
                <Box sx={{
                  position: 'absolute', bottom: 0, left: 0, right: 0,
                  px: 0.5, py: 0.25,
                  background: 'linear-gradient(transparent, rgba(0,0,0,0.6))',
                }}>
                  <Typography sx={{ fontSize: '0.55rem', color: '#fff', display: 'flex', alignItems: 'center', gap: 0.25 }}>
                    <PlaceIcon sx={{ fontSize: 10 }} />
                    {foto.ubicacion_nombre}
                  </Typography>
                </Box>
              )}
            </ImageListItem>
          ))}
        </ImageList>
      )}

      {/* FAB */}
      {!loading && (
        <Fab
          size="medium"
          onClick={() => setDialog(true)}
          sx={{
            position: 'fixed', bottom: 80, right: 20,
            bgcolor: '#f0a500', color: '#000',
            '&:hover': { bgcolor: '#d4920a' },
          }}
        >
          <AddAPhotoIcon />
        </Fab>
      )}

      {/* Lightbox */}
      <Dialog
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { bgcolor: '#000', borderRadius: 2, m: 1 } }}
      >
        {selected && (
          <DialogContent sx={{ p: 0, position: 'relative' }}>
            <IconButton
              onClick={() => setSelected(null)}
              sx={{ position: 'absolute', top: 8, left: 8, bgcolor: 'rgba(0,0,0,0.5)', color: '#fff', zIndex: 2 }}
            >
              <CloseIcon />
            </IconButton>
            <IconButton
              onClick={() => handleDelete(selected.id)}
              sx={{ position: 'absolute', top: 8, right: 8, bgcolor: 'rgba(224,92,92,0.7)', color: '#fff', zIndex: 2 }}
            >
              <DeleteIcon />
            </IconButton>
            <Box
              component="img"
              src={selected.url}
              alt={selected.descripcion || 'foto'}
              sx={{ width: '100%', maxHeight: '70vh', objectFit: 'contain', display: 'block' }}
            />
            {(selected.descripcion || selected.ubicacion_nombre) && (
              <Box sx={{ px: 2, py: 1.5 }}>
                {selected.descripcion && (
                  <Typography sx={{ color: '#fff', fontSize: '0.85rem', mb: 0.5 }}>
                    {selected.descripcion}
                  </Typography>
                )}
                {selected.ubicacion_nombre && (
                  <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <PlaceIcon sx={{ fontSize: 14 }} />
                    {selected.ubicacion_nombre}
                  </Typography>
                )}
              </Box>
            )}
          </DialogContent>
        )}
      </Dialog>

      {/* Dialogo añadir foto */}
      <Dialog open={dialog} onClose={() => setDialog(false)} maxWidth="sm" fullWidth
        PaperProps={{ sx: { bgcolor: 'var(--bj-surface)', borderRadius: 2, m: 2 } }}
      >
        <DialogTitle sx={{ color: 'var(--bj-text)', pb: 0, fontFamily: '"Playfair Display", serif' }}>
          Añadir foto
        </DialogTitle>
        <DialogContent>
          {/* Selector de archivo */}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleFile}
          />
          <Box
            onClick={() => fileRef.current?.click()}
            sx={{
              mt: 1.5, height: 180, borderRadius: 2, cursor: 'pointer',
              border: '2px dashed var(--bj-border)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden', bgcolor: 'var(--bj-surface2)',
              '&:hover': { borderColor: '#f0a500' },
              transition: 'border-color 0.15s',
            }}
          >
            {preview
              ? <Box component="img" src={preview} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <>
                  <AddAPhotoIcon sx={{ fontSize: 36, color: 'var(--bj-text-muted)', mb: 1 }} />
                  <Typography sx={{ fontSize: '0.8rem', color: 'var(--bj-text-muted)' }}>
                    Toca para elegir una foto
                  </Typography>
                </>}
          </Box>

          <TextField
            fullWidth label="Descripción (opcional)" value={desc}
            onChange={(e) => setDesc(e.target.value)}
            size="small" sx={{ mt: 2 }}
          />
          <TextField
            fullWidth label="Lugar (opcional)" value={lugar}
            onChange={(e) => setLugar(e.target.value)}
            size="small" sx={{ mt: 1.5 }}
            InputProps={{ startAdornment: <PlaceIcon sx={{ fontSize: 16, color: 'var(--bj-text-muted)', mr: 0.5 }} /> }}
          />

          <Button
            variant="contained" fullWidth
            onClick={handleAdd} disabled={!preview || saving}
            sx={{ mt: 2, bgcolor: '#f0a500', color: '#000', '&:hover': { bgcolor: '#d4920a' } }}
          >
            {saving ? <CircularProgress size={20} sx={{ color: '#000' }} /> : 'Guardar foto'}
          </Button>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
