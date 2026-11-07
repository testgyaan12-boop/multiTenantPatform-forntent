import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  CircularProgress,
  Divider,
  IconButton,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import { Check, Copy, ImagePlus, Trash2 } from 'lucide-react';
import type { RestaurantProfile } from '@resto/types';
import { uploadRestaurantLogo, uploadRestaurantMedia, type RestaurantUpdatePayload } from '@/api';
import { initialsOf } from '@/components/branches/branchUtils';
import { parseBrandColors, serializeBrandColors, type BrandColors } from './profileUtils';

interface BrandingTabProps {
  profile: RestaurantProfile;
  onSave: (payload: RestaurantUpdatePayload) => Promise<unknown>;
  onNotify: (severity: 'success' | 'error', message: string) => void;
}

interface BrandingState {
  logoUrl: string;
  coverImageUrl: string;
  colors: BrandColors;
}

function stateFromProfile(profile: RestaurantProfile): BrandingState {
  return {
    logoUrl: profile.logoUrl ?? '',
    coverImageUrl: profile.coverImageUrl ?? '',
    colors: parseBrandColors(profile.brandColors),
  };
}

export function BrandingTab({ profile, onSave, onNotify }: BrandingTabProps) {
  const [current, setCurrent] = useState<BrandingState>(() => stateFromProfile(profile));
  const [baseline, setBaseline] = useState<BrandingState>(() => stateFromProfile(profile));
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<'logo' | 'cover' | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const coverInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const next = stateFromProfile(profile);
    setCurrent(next);
    setBaseline(next);
    setApiError(null);
  }, [profile.logoUrl, profile.coverImageUrl, profile.brandColors]);

  const dirty = JSON.stringify(current) !== JSON.stringify(baseline);
  const busy = saving || uploading !== null;

  const handleLogoUpload = async (file: File) => {
    setUploading('logo');
    setApiError(null);
    try {
      const url = await uploadRestaurantLogo(file);
      setCurrent((previous) => ({ ...previous, logoUrl: url }));
    } catch (error) {
      setApiError(error instanceof Error && error.message ? error.message : 'Logo upload failed.');
    } finally {
      setUploading(null);
      if (logoInputRef.current) logoInputRef.current.value = '';
    }
  };

  const handleCoverUpload = async (file: File) => {
    setUploading('cover');
    setApiError(null);
    try {
      const url = await uploadRestaurantMedia(file, 'cover');
      setCurrent((previous) => ({ ...previous, coverImageUrl: url }));
    } catch (error) {
      setApiError(error instanceof Error && error.message ? error.message : 'Cover upload failed.');
    } finally {
      setUploading(null);
      if (coverInputRef.current) coverInputRef.current.value = '';
    }
  };

  const handleSave = async () => {
    if (busy) return;
    setSaving(true);
    setApiError(null);
    try {
      await onSave({
        name: profile.name,
        currency: profile.currency,
        logoUrl: current.logoUrl,
        coverImageUrl: current.coverImageUrl,
        brandColors: serializeBrandColors(current.colors),
      });
      setBaseline(current);
    } catch (error) {
      setApiError(error instanceof Error && error.message ? error.message : 'Failed to save branding.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (busy) return;
    setCurrent(baseline);
    setApiError(null);
  };

  const copyPublicUrl = async () => {
    if (!profile.publicUrl) return;
    try {
      await navigator.clipboard.writeText(profile.publicUrl);
      setCopied(true);
      onNotify('success', 'Public link copied to clipboard.');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      onNotify('error', 'Could not copy the link — select it and copy manually.');
    }
  };

  return (
    <Paper variant="outlined" sx={{ borderRadius: '14px', p: 2.5, display: 'grid', gap: 2 }}>
      <Box>
        <Typography sx={{ fontSize: 14, fontWeight: 700 }}>Branding</Typography>
        <Typography sx={{ fontSize: 12.5, color: 'text.secondary', mt: 0.25 }}>
          Manage how your restaurant appears to guests — logo, cover photo, and brand colors.
        </Typography>
      </Box>

      {apiError ? (
        <Alert severity="error" variant="outlined" sx={{ borderRadius: '10px' }}>
          {apiError}
        </Alert>
      ) : null}

      <Divider />

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} alignItems={{ md: 'flex-start' }}>
        <Box sx={{ display: 'grid', gap: 1, minWidth: 0 }}>
          <Typography sx={{ fontSize: 12.5, fontWeight: 600 }}>Logo</Typography>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Avatar
              src={current.logoUrl || undefined}
              sx={{ width: 64, height: 64, bgcolor: '#F4511E', fontSize: 20, fontWeight: 800 }}
            >
              {initialsOf(profile.name || 'R')}
            </Avatar>
            <Box sx={{ display: 'grid', gap: 0.75 }}>
              <Stack direction="row" spacing={1}>
                <Button
                  variant="outlined"
                  component="label"
                  size="small"
                  disabled={uploading !== null}
                  startIcon={
                    uploading === 'logo' ? <CircularProgress size={14} color="inherit" /> : <ImagePlus size={15} />
                  }
                >
                  {current.logoUrl ? 'Replace' : 'Upload'}
                  <input
                    ref={logoInputRef}
                    hidden
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) void handleLogoUpload(file);
                    }}
                  />
                </Button>
                <Button
                  variant="outlined"
                  color="inherit"
                  size="small"
                  startIcon={<Trash2 size={15} />}
                  disabled={!current.logoUrl || uploading !== null}
                  onClick={() => setCurrent((previous) => ({ ...previous, logoUrl: '' }))}
                >
                  Remove
                </Button>
              </Stack>
              <Typography sx={{ fontSize: 11.5, color: 'text.secondary' }}>
                Shown on receipts and your public menu.
              </Typography>
            </Box>
          </Stack>
        </Box>

        <Box sx={{ display: 'grid', gap: 1, minWidth: 0, flex: 1, width: '100%' }}>
          <Typography sx={{ fontSize: 12.5, fontWeight: 600 }}>Cover image</Typography>
          <Box
            sx={{
              height: 110,
              borderRadius: '10px',
              overflow: 'hidden',
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: 'linear-gradient(120deg, #152033 0%, #1E2F4A 100%)',
              display: 'grid',
              placeItems: 'center',
            }}
          >
            {current.coverImageUrl ? (
              <Box
                component="img"
                src={current.coverImageUrl}
                alt=""
                sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <Typography sx={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>No cover image</Typography>
            )}
          </Box>
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              component="label"
              size="small"
              disabled={uploading !== null}
              startIcon={
                uploading === 'cover' ? <CircularProgress size={14} color="inherit" /> : <ImagePlus size={15} />
              }
            >
              {current.coverImageUrl ? 'Replace' : 'Upload'}
              <input
                ref={coverInputRef}
                hidden
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void handleCoverUpload(file);
                }}
              />
            </Button>
            <Button
              variant="outlined"
              color="inherit"
              size="small"
              startIcon={<Trash2 size={15} />}
              disabled={!current.coverImageUrl || uploading !== null}
              onClick={() => setCurrent((previous) => ({ ...previous, coverImageUrl: '' }))}
            >
              Remove
            </Button>
          </Stack>
        </Box>
      </Stack>

      <Divider />

      <Box sx={{ display: 'grid', gap: 1 }}>
        <Typography sx={{ fontSize: 12.5, fontWeight: 600 }}>Brand colors</Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
            <Box
              component="input"
              type="color"
              value={current.colors.primary}
              onChange={(event) =>
                setCurrent((previous) => ({
                  ...previous,
                  colors: { ...previous.colors, primary: event.target.value },
                }))
              }
              aria-label="Primary brand color"
              sx={{
                width: 48,
                height: 38,
                p: 0.5,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: '8px',
                bgcolor: 'background.paper',
                cursor: 'pointer',
              }}
            />
            <Box>
              <Typography sx={{ fontSize: 12.5, fontWeight: 600 }}>Primary</Typography>
              <Typography sx={{ fontSize: 11.5, color: 'text.secondary', fontFamily: 'monospace' }}>
                {current.colors.primary}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
            <Box
              component="input"
              type="color"
              value={current.colors.secondary}
              onChange={(event) =>
                setCurrent((previous) => ({
                  ...previous,
                  colors: { ...previous.colors, secondary: event.target.value },
                }))
              }
              aria-label="Secondary brand color"
              sx={{
                width: 48,
                height: 38,
                p: 0.5,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: '8px',
                bgcolor: 'background.paper',
                cursor: 'pointer',
              }}
            />
            <Box>
              <Typography sx={{ fontSize: 12.5, fontWeight: 600 }}>Secondary</Typography>
              <Typography sx={{ fontSize: 11.5, color: 'text.secondary', fontFamily: 'monospace' }}>
                {current.colors.secondary}
              </Typography>
            </Box>
          </Box>
        </Stack>
      </Box>

      <Divider />

      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
          flexWrap: 'wrap',
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontSize: 12.5, fontWeight: 600 }}>Public website / menu link</Typography>
          <Typography
            sx={{
              fontSize: 12.5,
              color: profile.publicUrl ? 'text.secondary' : 'text.disabled',
              wordBreak: 'break-word',
            }}
          >
            {profile.publicUrl ?? 'The public link will appear here once it is generated.'}
          </Typography>
        </Box>
        {profile.publicUrl ? (
          <Tooltip title={copied ? 'Copied' : 'Copy link'}>
            <IconButton size="small" onClick={() => void copyPublicUrl()} aria-label="Copy public link">
              {copied ? <Check size={16} color="#16A36A" /> : <Copy size={16} />}
            </IconButton>
          </Tooltip>
        ) : null}
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
          {saving ? 'Saving…' : 'Save changes'}
        </Button>
      </Box>
    </Paper>
  );
}
