import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { ImagePlus } from 'lucide-react';
import type { RestaurantProfile } from '@resto/types';
import { uploadRestaurantLogo } from '@/api';

interface RestaurantProfileDialogProps {
  open: boolean;
  profile: RestaurantProfile | null;
  onClose: () => void;
  onSubmit: (payload: {
    name: string;
    legalName?: string;
    description?: string;
    logoUrl?: string;
    timezone?: string;
    currency: string;
    taxRate?: number;
    serviceChargeRate?: number;
    cuisine?: string;
    contactEmail?: string;
    socialLinks?: string;
    operatingHours?: string;
  }) => Promise<unknown>;
}

interface FormState {
  name: string;
  legalName: string;
  description: string;
  logoUrl: string;
  timezone: string;
  currency: string;
  taxRatePercent: string;
  serviceChargePercent: string;
  cuisine: string;
  contactEmail: string;
  website: string;
  instagram: string;
  facebook: string;
  x: string;
  operatingHours: string;
}

const emptyForm: FormState = {
  name: '',
  legalName: '',
  description: '',
  logoUrl: '',
  timezone: 'UTC',
  currency: 'INR',
  taxRatePercent: '0',
  serviceChargePercent: '0',
  cuisine: '',
  contactEmail: '',
  website: '',
  instagram: '',
  facebook: '',
  x: '',
  operatingHours: '',
};

function parseSocialLinks(raw: string | null | undefined): Record<string, string> {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, string>) : {};
  } catch {
    return {};
  }
}

function toForm(profile: RestaurantProfile | null): FormState {
  if (!profile) return emptyForm;
  const socials = parseSocialLinks(profile.socialLinks);
  return {
    name: profile.name ?? '',
    legalName: profile.legalName ?? '',
    description: profile.description ?? '',
    logoUrl: profile.logoUrl ?? '',
    timezone: profile.timezone ?? 'UTC',
    currency: profile.currency ?? 'INR',
    taxRatePercent: String(Number(profile.taxRate ?? 0) * 100),
    serviceChargePercent: String(Number(profile.serviceChargeRate ?? 0) * 100),
    cuisine: profile.cuisine ?? '',
    contactEmail: profile.contactEmail ?? '',
    website: socials.website ?? '',
    instagram: socials.instagram ?? '',
    facebook: socials.facebook ?? '',
    x: socials.x ?? '',
    operatingHours: profile.operatingHours ?? '',
  };
}

function buildSocialLinks(form: FormState): string {
  const links: Record<string, string> = {};
  if (form.website.trim()) links.website = form.website.trim();
  if (form.instagram.trim()) links.instagram = form.instagram.trim();
  if (form.facebook.trim()) links.facebook = form.facebook.trim();
  if (form.x.trim()) links.x = form.x.trim();
  return Object.keys(links).length ? JSON.stringify(links) : '';
}

export function RestaurantProfileDialog({ open, profile, onClose, onSubmit }: RestaurantProfileDialogProps) {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (open) {
      setForm(toForm(profile));
      setErrors({});
      setApiError(null);
      setSaving(false);
      setUploading(false);
    }
  }, [open, profile]);

  const set = (key: keyof FormState, value: string) => {
    setForm((previous) => ({ ...previous, [key]: value }));
    setErrors((previous) => {
      if (!(key in previous)) return previous;
      const next = { ...previous };
      delete next[key];
      return next;
    });
  };

  const handleUpload = async (file: File) => {
    setUploading(true);
    setApiError(null);
    try {
      const url = await uploadRestaurantLogo(file);
      setForm((previous) => ({ ...previous, logoUrl: url }));
    } catch (error) {
      setApiError(error instanceof Error && error.message ? error.message : 'Logo upload failed.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (!form.name.trim()) next.name = 'Restaurant name is required';
    if (form.currency.trim().length !== 3) next.currency = 'Use a 3-letter currency code (e.g. INR)';
    const tax = Number(form.taxRatePercent);
    const service = Number(form.serviceChargePercent);
    if (!Number.isFinite(tax) || tax < 0 || tax > 100) next.taxRatePercent = 'Enter 0–100';
    if (!Number.isFinite(service) || service < 0 || service > 100) next.serviceChargePercent = 'Enter 0–100';
    if (form.contactEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactEmail.trim())) {
      next.contactEmail = 'Enter a valid email';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (saving) return;
    if (!validate()) return;
    setSaving(true);
    setApiError(null);
    try {
      await onSubmit({
        name: form.name.trim(),
        legalName: form.legalName.trim() || undefined,
        description: form.description.trim() || undefined,
        logoUrl: form.logoUrl.trim() || undefined,
        timezone: form.timezone.trim() || undefined,
        currency: form.currency.trim().toUpperCase(),
        taxRate: Number(form.taxRatePercent) / 100,
        serviceChargeRate: Number(form.serviceChargePercent) / 100,
        cuisine: form.cuisine.trim() || undefined,
        contactEmail: form.contactEmail.trim() || undefined,
        socialLinks: buildSocialLinks(form) || undefined,
        operatingHours: form.operatingHours.trim() || undefined,
      });
    } catch (error) {
      setApiError(error instanceof Error && error.message ? error.message : 'Failed to save the profile.');
      setSaving(false);
      return;
    }
    setSaving(false);
  };

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontSize: 17, fontWeight: 700 }}>Restaurant profile</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent dividers>
          <Stack spacing={2}>
            {apiError ? (
              <Alert severity="error" variant="outlined" sx={{ borderRadius: '10px' }}>
                {apiError}
              </Alert>
            ) : null}

            <TextField
              label="Restaurant name"
              value={form.name}
              onChange={(event) => set('name', event.target.value)}
              error={Boolean(errors.name)}
              fullWidth
              required
            />
            <TextField
              label="Legal name"
              value={form.legalName}
              onChange={(event) => set('legalName', event.target.value)}
              helperText="Optional — used on invoices"
              fullWidth
            />
            <TextField
              label="Description"
              value={form.description}
              onChange={(event) => set('description', event.target.value)}
              multiline
              minRows={2}
              fullWidth
            />

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="flex-start">
              <TextField
                label="Logo image URL"
                value={form.logoUrl}
                onChange={(event) => set('logoUrl', event.target.value)}
                error={Boolean(errors.logoUrl)}
                helperText={uploading ? 'Uploading…' : 'Paste a URL or upload an image (≤ 5MB)'}
                fullWidth
              />
              <Button
                variant="outlined"
                component="label"
                disabled={uploading}
                startIcon={uploading ? <CircularProgress size={15} color="inherit" /> : <ImagePlus size={16} />}
                sx={{ whiteSpace: 'nowrap', mt: { xs: 0, sm: 1 } }}
              >
                Upload
                <input
                  ref={fileInputRef}
                  hidden
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) void handleUpload(file);
                  }}
                />
              </Button>
            </Stack>

            <Divider />

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Cuisine categories"
                value={form.cuisine}
                onChange={(event) => set('cuisine', event.target.value)}
                helperText="Comma-separated, e.g. Italian, Pizza, Grill"
                fullWidth
              />
              <TextField
                label="Contact email"
                type="email"
                value={form.contactEmail}
                onChange={(event) => set('contactEmail', event.target.value)}
                error={Boolean(errors.contactEmail)}
                fullWidth
              />
            </Stack>
            <TextField
              label="Operating hours"
              value={form.operatingHours}
              onChange={(event) => set('operatingHours', event.target.value)}
              helperText='e.g. Mon–Fri 11:00–22:00 · Sat–Sun 10:00–23:00'
              fullWidth
            />

            <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: 'text.secondary' }}>
              Social links
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField label="Website" value={form.website} onChange={(event) => set('website', event.target.value)} fullWidth />
              <TextField label="Instagram" value={form.instagram} onChange={(event) => set('instagram', event.target.value)} fullWidth />
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField label="Facebook" value={form.facebook} onChange={(event) => set('facebook', event.target.value)} fullWidth />
              <TextField label="X (Twitter)" value={form.x} onChange={(event) => set('x', event.target.value)} fullWidth />
            </Stack>

            <Divider />

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Timezone"
                value={form.timezone}
                onChange={(event) => set('timezone', event.target.value)}
                fullWidth
              />
              <TextField
                label="Currency"
                value={form.currency}
                onChange={(event) => set('currency', event.target.value.toUpperCase())}
                error={Boolean(errors.currency)}
                inputProps={{ maxLength: 3 }}
                fullWidth
              />
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Tax rate (%)"
                value={form.taxRatePercent}
                onChange={(event) => set('taxRatePercent', event.target.value)}
                error={Boolean(errors.taxRatePercent)}
                fullWidth
              />
              <TextField
                label="Service charge (%)"
                value={form.serviceChargePercent}
                onChange={(event) => set('serviceChargePercent', event.target.value)}
                error={Boolean(errors.serviceChargePercent)}
                fullWidth
              />
            </Stack>

            {profile?.publicUrl ? (
              <Alert severity="info" variant="outlined" sx={{ borderRadius: '10px', fontSize: 12.5 }}>
                Public menu: {profile.publicUrl}
              </Alert>
            ) : null}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button color="inherit" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={saving || uploading}
            startIcon={saving ? <CircularProgress size={15} color="inherit" /> : undefined}
            sx={{ px: 3 }}
          >
            {saving ? 'Saving…' : 'Save profile'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
