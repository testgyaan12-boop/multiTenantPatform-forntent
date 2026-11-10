import { useRef, useState } from 'react';
import { Box, Button, Chip, CircularProgress, TextField, Typography } from '@mui/material';
import { Image as ImageIcon, Plus, Star, Trash2 } from 'lucide-react';
import type { MenuItemImage } from '@resto/types';
import { uploadMenuImage } from '@/api';

const MAX_IMAGES = 10;
const MAX_BYTES = 5 * 1024 * 1024;
const PRESET_LABELS = ['Top view', 'Front view', 'Rear view', 'Interior', 'Exterior', 'Side view', 'Other'];

interface ProductImagesFieldProps {
  images: MenuItemImage[];
  onChange: (images: MenuItemImage[]) => void;
  onError: (message: string) => void;
}

export function ProductImagesField({ images, onChange, onError }: ProductImagesFieldProps) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    let next = [...images];
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        if (next.length >= MAX_IMAGES) {
          onError(`You can add up to ${MAX_IMAGES} images.`);
          break;
        }
        if (!file.type.startsWith('image/')) {
          onError('Only image files can be uploaded.');
          continue;
        }
        if (file.size > MAX_BYTES) {
          onError('Each image must be 5 MB or smaller.');
          continue;
        }
        const url = await uploadMenuImage(file);
        next = [...next, { url, label: 'Other' }];
        onChange(next);
      }
    } catch (error) {
      onError(error instanceof Error && error.message ? error.message : 'Image upload failed.');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const setLabel = (index: number, label: string) => {
    onChange(images.map((image, position) => (position === index ? { ...image, label } : image)));
  };

  const remove = (index: number) => {
    onChange(images.filter((_, position) => position !== index));
  };

  return (
    <Box sx={{ display: 'grid', gap: 1.5 }}>
      <input
        ref={inputRef}
        accept="image/png,image/jpeg,image/webp,image/gif"
        type="file"
        multiple
        hidden
        onChange={(event) => void handleFiles(event.target.files)}
      />
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
        <Button
          size="small"
          variant="outlined"
          startIcon={uploading ? <CircularProgress size={14} /> : <Plus size={14} />}
          disabled={uploading || images.length >= MAX_IMAGES}
          onClick={() => inputRef.current?.click()}
          sx={{ borderStyle: 'dashed', fontSize: 12.5 }}
        >
          {uploading ? 'Uploading...' : 'Add images'}
        </Button>
        <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
          {images.length}/{MAX_IMAGES} images. The first image is the cover.
        </Typography>
      </Box>

      {images.length === 0 ? (
        <Box
          sx={{
            border: '1px dashed #C9D2E3',
            borderRadius: '12px',
            p: 3,
            display: 'grid',
            justifyItems: 'center',
            gap: 0.75,
            color: '#98A2B3',
            bgcolor: '#F8FAFC',
          }}
        >
          <ImageIcon size={26} strokeWidth={1.5} />
          <Typography sx={{ fontSize: 12.5 }}>No product images yet</Typography>
        </Box>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gap: 1.25,
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' },
          }}
        >
          {images.map((image, index) => (
            <Box
              key={`${image.url}-${index}`}
              sx={{
                border: '1px solid',
                borderColor: index === 0 ? '#F4511E' : 'divider',
                borderRadius: '12px',
                overflow: 'hidden',
                bgcolor: '#FFFFFF',
              }}
            >
              <Box sx={{ position: 'relative', aspectRatio: '16 / 10', bgcolor: '#EEF1F5' }}>
                <Box
                  component="img"
                  src={image.url}
                  alt={image.label || `Product image ${index + 1}`}
                  sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                {index === 0 ? (
                  <Chip
                    size="small"
                    icon={<Star size={12} />}
                    label="Cover"
                    sx={{
                      position: 'absolute',
                      top: 8,
                      left: 8,
                      height: 22,
                      fontSize: 10.5,
                      fontWeight: 700,
                      bgcolor: 'rgba(255,255,255,0.92)',
                    }}
                  />
                ) : null}
              </Box>
              <Box sx={{ p: 1.25, display: 'grid', gap: 1 }}>
                <TextField
                  size="small"
                  label="View label"
                  value={image.label}
                  onChange={(event) => setLabel(index, event.target.value)}
                  slotProps={{ htmlInput: { maxLength: 60 } }}
                />
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                  {PRESET_LABELS.map((label) => (
                    <Chip
                      key={label}
                      size="small"
                      label={label}
                      onClick={() => setLabel(index, label)}
                      variant={image.label === label ? 'filled' : 'outlined'}
                      sx={{ height: 22, fontSize: 10.5 }}
                    />
                  ))}
                </Box>
                <Button
                  size="small"
                  color="inherit"
                  startIcon={<Trash2 size={13} />}
                  onClick={() => remove(index)}
                  sx={{ justifySelf: 'start', fontSize: 12, color: 'text.secondary' }}
                >
                  Remove
                </Button>
              </Box>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}
