import { useEffect, useRef, useState } from 'react';
import { Alert, Box, Button, CircularProgress, Divider, IconButton, Paper, Typography } from '@mui/material';
import { Image as ImageIcon, ImagePlus, X } from 'lucide-react';
import type { RestaurantProfile } from '@resto/types';
import { uploadRestaurantMedia, type RestaurantUpdatePayload } from '@/api';
import { parseGallery } from './profileUtils';

interface GalleryTabProps {
  profile: RestaurantProfile;
  onSave: (payload: RestaurantUpdatePayload) => Promise<unknown>;
}

export function GalleryTab({ profile, onSave }: GalleryTabProps) {
  const [images, setImages] = useState<string[]>(() => parseGallery(profile.gallery));
  const [baseline, setBaseline] = useState<string[]>(() => parseGallery(profile.gallery));
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const parsed = parseGallery(profile.gallery);
    setImages(parsed);
    setBaseline(parsed);
    setApiError(null);
  }, [profile.gallery]);

  const dirty = JSON.stringify(images) !== JSON.stringify(baseline);
  const busy = saving || uploading;

  const handleAdd = async (file: File) => {
    setUploading(true);
    setApiError(null);
    try {
      const url = await uploadRestaurantMedia(file, 'gallery');
      setImages((previous) => [...previous, url]);
    } catch (error) {
      setApiError(error instanceof Error && error.message ? error.message : 'Image upload failed.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    if (busy) return;
    setImages((previous) => previous.filter((_, position) => position !== index));
  };

  const handleSave = async () => {
    if (busy || !dirty) return;
    setSaving(true);
    setApiError(null);
    try {
      await onSave({
        name: profile.name,
        currency: profile.currency,
        gallery: JSON.stringify(images),
      });
      setBaseline(images);
    } catch (error) {
      setApiError(error instanceof Error && error.message ? error.message : 'Failed to save the gallery.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (busy) return;
    setImages(baseline);
    setApiError(null);
  };

  return (
    <Paper variant="outlined" sx={{ borderRadius: '14px', p: 2.5, display: 'grid', gap: 1.75 }}>
      <Box>
        <Typography sx={{ fontSize: 14, fontWeight: 700 }}>Gallery</Typography>
        <Typography sx={{ fontSize: 12.5, color: 'text.secondary', mt: 0.25 }}>
          Photos shown on your public page. Upload images of dishes, your team, or the interior.
        </Typography>
      </Box>

      {apiError ? (
        <Alert severity="error" variant="outlined" sx={{ borderRadius: '10px' }}>
          {apiError}
        </Alert>
      ) : null}

      <Divider />

      {images.length === 0 ? (
        <Box
          sx={{
            textAlign: 'center',
            py: 5,
            px: 2,
            border: '1px dashed',
            borderColor: 'divider',
            borderRadius: '12px',
            bgcolor: 'grey.50',
          }}
        >
          <ImageIcon size={26} style={{ color: '#98A2B3' }} />
          <Typography sx={{ fontSize: 14, fontWeight: 600, mt: 1 }}>No gallery images yet</Typography>
          <Typography sx={{ fontSize: 12.5, color: 'text.secondary', mt: 0.25 }}>
            Add your first photo below to showcase your restaurant.
          </Typography>
        </Box>
      ) : null}

      <Box
        sx={{
          display: 'grid',
          gap: 1.5,
          gridTemplateColumns: {
            xs: 'repeat(2, minmax(0, 1fr))',
            sm: 'repeat(3, minmax(0, 1fr))',
            md: 'repeat(4, minmax(0, 1fr))',
          },
        }}
      >
        {images.map((url, index) => (
          <Box
            key={`${url}-${index}`}
            sx={{
              position: 'relative',
              borderRadius: '10px',
              overflow: 'hidden',
              border: '1px solid',
              borderColor: 'divider',
              aspectRatio: '4 / 3',
              bgcolor: 'grey.100',
            }}
          >
            <Box
              component="img"
              src={url}
              alt=""
              sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
            <IconButton
              size="small"
              onClick={() => removeImage(index)}
              disabled={busy}
              aria-label="Remove image"
              sx={{
                position: 'absolute',
                top: 6,
                right: 6,
                width: 28,
                height: 28,
                bgcolor: 'rgba(15,23,42,0.65)',
                color: '#ffffff',
                '&:hover': { bgcolor: 'rgba(15,23,42,0.85)' },
              }}
            >
              <X size={15} />
            </IconButton>
          </Box>
        ))}

        <Box
          component="label"
          sx={{
            aspectRatio: '4 / 3',
            borderRadius: '10px',
            border: '1px dashed',
            borderColor: uploading ? 'primary.main' : 'divider',
            display: 'grid',
            placeItems: 'center',
            alignContent: 'center',
            gap: 0.5,
            cursor: uploading ? 'default' : 'pointer',
            bgcolor: 'grey.50',
            opacity: uploading ? 0.7 : 1,
            transition: 'border-color 0.15s ease, background-color 0.15s ease',
            '&:hover': uploading
              ? {}
              : { borderColor: 'primary.main', bgcolor: '#fff7ed' },
          }}
        >
          {uploading ? (
            <CircularProgress size={24} />
          ) : (
            <ImagePlus size={24} style={{ color: '#98A2B3' }} />
          )}
          <Typography sx={{ fontSize: 12, fontWeight: 600, color: 'text.secondary' }}>
            {uploading ? 'Uploading…' : 'Add image'}
          </Typography>
          <input
            ref={fileInputRef}
            hidden
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void handleAdd(file);
            }}
          />
        </Box>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5 }}>
        <Button color="inherit" onClick={handleCancel} disabled={!dirty || busy}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={() => void handleSave()}
          disabled={!dirty || busy}
          startIcon={saving ? <CircularProgress size={15} color="inherit" /> : undefined}
        >
          {saving ? 'Saving…' : 'Save'}
        </Button>
      </Box>
    </Paper>
  );
}
