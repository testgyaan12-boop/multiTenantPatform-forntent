import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { ImagePlus, Trash2, X } from 'lucide-react';
import type { RestaurantProfile } from '@resto/types';
import { ConfirmDialog } from '@resto/ui';
import { uploadRestaurantLogo, uploadRestaurantMedia, type RestaurantUpdatePayload } from '@/api';
import { initialsOf } from '@/components/branches/branchUtils';
import {
  emptySocialLinks,
  parseBrandColors,
  parseSocialLinks,
  SOCIAL_LINK_FIELDS,
  serializeSocialLinks,
  type SocialLinksForm,
} from './profileUtils';

export interface EditProfileDialogProps {
  open: boolean;
  profile: RestaurantProfile | null;
  onClose: () => void;
  onSave: (payload: RestaurantUpdatePayload) => Promise<unknown>;
}

interface EditFormState {
  name: string;
  legalName: string;
  cuisine: string;
  description: string;
  contactEmail: string;
  contactPhone: string;
  website: string;
  addressLine: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  businessRegistrationNumber: string;
  taxNumber: string;
  currency: string;
  timezone: string;
  defaultLanguage: string;
  taxRate: string;
  serviceChargeRate: string;
  logoUrl: string;
  coverImageUrl: string;
  brandPrimary: string;
  brandSecondary: string;
  social: SocialLinksForm;
}

const emptyForm: EditFormState = {
  name: '',
  legalName: '',
  cuisine: '',
  description: '',
  contactEmail: '',
  contactPhone: '',
  website: '',
  addressLine: '',
  city: '',
  state: '',
  country: '',
  postalCode: '',
  businessRegistrationNumber: '',
  taxNumber: '',
  currency: '',
  timezone: '',
  defaultLanguage: '',
  taxRate: '',
  serviceChargeRate: '',
  logoUrl: '',
  coverImageUrl: '',
  brandPrimary: '#FF5722',
  brandSecondary: '#152033',
  social: emptySocialLinks(),
};

function toForm(profile: RestaurantProfile | null): EditFormState {
  if (!profile) return emptyForm;
  const social = parseSocialLinks(profile.socialLinks);
  const colors = parseBrandColors(profile.brandColors);
  return {
    name: profile.name ?? '',
    legalName: profile.legalName ?? '',
    cuisine: profile.cuisine ?? '',
    description: profile.description ?? '',
    contactEmail: profile.contactEmail ?? '',
    contactPhone: profile.contactPhone ?? '',
    website: profile.website ?? '',
    addressLine: profile.addressLine ?? '',
    city: profile.city ?? '',
    state: profile.state ?? '',
    country: profile.country ?? '',
    postalCode: profile.postalCode ?? '',
    businessRegistrationNumber: profile.businessRegistrationNumber ?? '',
    taxNumber: profile.taxNumber ?? '',
    currency: profile.currency ?? '',
    timezone: profile.timezone ?? '',
    defaultLanguage: profile.defaultLanguage ?? '',
    taxRate: String(profile.taxRate ?? 0),
    serviceChargeRate: String(profile.serviceChargeRate ?? 0),
    logoUrl: profile.logoUrl ?? '',
    coverImageUrl: profile.coverImageUrl ?? '',
    brandPrimary: colors.primary,
    brandSecondary: colors.secondary,
    social,
  };
}

function validate(form: EditFormState): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!form.name.trim()) errors.name = 'Restaurant name is required';
  if (!form.currency.trim()) errors.currency = 'Currency is required';
  if (form.taxRate.trim()) {
    const tax = Number(form.taxRate);
    if (!Number.isFinite(tax) || tax < 0 || tax > 1) errors.taxRate = 'Enter a value between 0 and 1';
  }
  if (form.serviceChargeRate.trim()) {
    const charge = Number(form.serviceChargeRate);
    if (!Number.isFinite(charge) || charge < 0 || charge > 1) {
      errors.serviceChargeRate = 'Enter a value between 0 and 1';
    }
  }
  if (form.contactEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactEmail.trim())) {
    errors.contactEmail = 'Enter a valid email address';
  }
  return errors;
}

function buildPayload(form: EditFormState): RestaurantUpdatePayload {
  return {
    name: form.name.trim(),
    legalName: form.legalName.trim(),
    description: form.description.trim(),
    cuisine: form.cuisine.trim(),
    contactEmail: form.contactEmail.trim(),
    contactPhone: form.contactPhone.trim(),
    website: form.website.trim(),
    addressLine: form.addressLine.trim(),
    city: form.city.trim(),
    state: form.state.trim(),
    country: form.country.trim(),
    postalCode: form.postalCode.trim(),
    businessRegistrationNumber: form.businessRegistrationNumber.trim(),
    taxNumber: form.taxNumber.trim(),
    currency: form.currency.trim().toUpperCase(),
    timezone: form.timezone.trim(),
    defaultLanguage: form.defaultLanguage.trim(),
    taxRate: form.taxRate.trim() ? Number(form.taxRate) : undefined,
    serviceChargeRate: form.serviceChargeRate.trim() ? Number(form.serviceChargeRate) : undefined,
    logoUrl: form.logoUrl.trim(),
    coverImageUrl: form.coverImageUrl.trim(),
    brandColors: JSON.stringify({ primary: form.brandPrimary, secondary: form.brandSecondary }),
    socialLinks: serializeSocialLinks(form.social),
  };
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: 'text.secondary' }}>{children}</Typography>
  );
}

export function EditProfileDialog({ open, profile, onClose, onSave }: EditProfileDialogProps) {
  const [form, setForm] = useState<EditFormState>(emptyForm);
  const [baseline, setBaseline] = useState<EditFormState>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const coverInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (open) {
      const next = toForm(profile);
      setForm(next);
      setBaseline(next);
      setErrors({});
      setApiError(null);
      setSaving(false);
      setLogoUploading(false);
      setCoverUploading(false);
      setConfirmDiscard(false);
    }
  }, [open]);

  const dirty = JSON.stringify(form) !== JSON.stringify(baseline);

  const set = <K extends keyof EditFormState>(key: K, value: EditFormState[K]) => {
    setForm((previous) => ({ ...previous, [key]: value }));
    setErrors((previous) => {
      if (!(key in previous)) return previous;
      const next = { ...previous };
      delete next[key];
      return next;
    });
  };

  const setSocial = (key: keyof SocialLinksForm, value: string) => {
    setForm((previous) => ({ ...previous, social: { ...previous.social, [key]: value } }));
  };

  const requestClose = () => {
    if (saving) return;
    if (dirty) {
      setConfirmDiscard(true);
      return;
    }
    onClose();
  };

  const handleLogoUpload = async (file: File) => {
    setLogoUploading(true);
    setApiError(null);
    try {
      const url = await uploadRestaurantLogo(file);
      setForm((previous) => ({ ...previous, logoUrl: url }));
    } catch (error) {
      setApiError(error instanceof Error && error.message ? error.message : 'Logo upload failed.');
    } finally {
      setLogoUploading(false);
      if (logoInputRef.current) logoInputRef.current.value = '';
    }
  };

  const handleCoverUpload = async (file: File) => {
    setCoverUploading(true);
    setApiError(null);
    try {
      const url = await uploadRestaurantMedia(file, 'cover');
      setForm((previous) => ({ ...previous, coverImageUrl: url }));
    } catch (error) {
      setApiError(error instanceof Error && error.message ? error.message : 'Cover image upload failed.');
    } finally {
      setCoverUploading(false);
      if (coverInputRef.current) coverInputRef.current.value = '';
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (saving || logoUploading || coverUploading) return;
    const validation = validate(form);
    setErrors(validation);
    if (Object.keys(validation).length > 0) return;
    setSaving(true);
    setApiError(null);
    try {
      await onSave(buildPayload(form));
    } catch (error) {
      setApiError(error instanceof Error && error.message ? error.message : 'Failed to save the profile.');
      setSaving(false);
      return;
    }
    setSaving(false);
    onClose();
  };

  const busy = saving || logoUploading || coverUploading;

  return (
    <>
      <Dialog open={open} onClose={requestClose} fullWidth maxWidth="md" disableEscapeKeyDown={busy}>
        <DialogTitle sx={{ fontSize: 17, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          Edit Restaurant Profile
          <IconButton size="small" onClick={requestClose} disabled={busy} aria-label="Close">
            <X size={17} />
          </IconButton>
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent dividers>
            <Stack spacing={2}>
              {apiError ? (
                <Alert severity="error" variant="outlined" sx={{ borderRadius: '10px' }}>
                  {apiError}
                </Alert>
              ) : null}

              <SectionTitle>Basic information</SectionTitle>
              <TextField
                label="Restaurant name"
                value={form.name}
                onChange={(event) => set('name', event.target.value)}
                error={Boolean(errors.name)}
                helperText={errors.name}
                fullWidth
                required
              />
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  label="Legal name"
                  value={form.legalName}
                  onChange={(event) => set('legalName', event.target.value)}
                  fullWidth
                />
                <TextField
                  label="Cuisine / business category"
                  value={form.cuisine}
                  onChange={(event) => set('cuisine', event.target.value)}
                  fullWidth
                />
              </Stack>
              <TextField
                label="Description"
                value={form.description}
                onChange={(event) => set('description', event.target.value)}
                multiline
                minRows={2}
                fullWidth
              />

              <Divider />
              <SectionTitle>Contact</SectionTitle>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  label="Business email"
                  type="email"
                  value={form.contactEmail}
                  onChange={(event) => set('contactEmail', event.target.value)}
                  error={Boolean(errors.contactEmail)}
                  helperText={errors.contactEmail}
                  fullWidth
                />
                <TextField
                  label="Business phone"
                  value={form.contactPhone}
                  onChange={(event) => set('contactPhone', event.target.value)}
                  fullWidth
                />
              </Stack>
              <TextField
                label="Website"
                value={form.website}
                onChange={(event) => set('website', event.target.value)}
                fullWidth
              />

              <Divider />
              <SectionTitle>Address</SectionTitle>
              <TextField
                label="Address line"
                value={form.addressLine}
                onChange={(event) => set('addressLine', event.target.value)}
                fullWidth
              />
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  label="City"
                  value={form.city}
                  onChange={(event) => set('city', event.target.value)}
                  fullWidth
                />
                <TextField
                  label="State / province"
                  value={form.state}
                  onChange={(event) => set('state', event.target.value)}
                  fullWidth
                />
              </Stack>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  label="Country"
                  value={form.country}
                  onChange={(event) => set('country', event.target.value)}
                  fullWidth
                />
                <TextField
                  label="Postal code"
                  value={form.postalCode}
                  onChange={(event) => set('postalCode', event.target.value)}
                  fullWidth
                />
              </Stack>

              <Divider />
              <SectionTitle>Business &amp; tax</SectionTitle>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  label="Business registration number"
                  value={form.businessRegistrationNumber}
                  onChange={(event) => set('businessRegistrationNumber', event.target.value)}
                  fullWidth
                />
                <TextField
                  label="Tax / GST number"
                  value={form.taxNumber}
                  onChange={(event) => set('taxNumber', event.target.value)}
                  fullWidth
                />
              </Stack>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  label="Currency"
                  value={form.currency}
                  onChange={(event) => set('currency', event.target.value.toUpperCase())}
                  error={Boolean(errors.currency)}
                  helperText={errors.currency}
                  inputProps={{ maxLength: 3 }}
                  fullWidth
                  required
                />
                <TextField
                  label="Time zone"
                  value={form.timezone}
                  onChange={(event) => set('timezone', event.target.value)}
                  fullWidth
                />
                <TextField
                  label="Default language"
                  value={form.defaultLanguage}
                  onChange={(event) => set('defaultLanguage', event.target.value)}
                  fullWidth
                />
              </Stack>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  label="Tax rate (0–1)"
                  value={form.taxRate}
                  onChange={(event) => set('taxRate', event.target.value)}
                  error={Boolean(errors.taxRate)}
                  helperText={errors.taxRate || 'Decimal between 0 and 1, e.g. 0.18 = 18%'}
                  fullWidth
                />
                <TextField
                  label="Service charge rate (0–1)"
                  value={form.serviceChargeRate}
                  onChange={(event) => set('serviceChargeRate', event.target.value)}
                  error={Boolean(errors.serviceChargeRate)}
                  helperText={errors.serviceChargeRate || 'Decimal between 0 and 1, e.g. 0.05 = 5%'}
                  fullWidth
                />
              </Stack>

              <Divider />
              <SectionTitle>Branding</SectionTitle>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} alignItems={{ sm: 'flex-start' }}>
                <Box sx={{ display: 'grid', gap: 1, minWidth: 0 }}>
                  <Typography sx={{ fontSize: 12.5, fontWeight: 600 }}>Logo</Typography>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Avatar
                      src={form.logoUrl || undefined}
                      sx={{ width: 56, height: 56, bgcolor: '#F4511E', fontSize: 18, fontWeight: 800 }}
                    >
                      {initialsOf(form.name || 'R')}
                    </Avatar>
                    <Button
                      variant="outlined"
                      component="label"
                      size="small"
                      disabled={logoUploading}
                      startIcon={
                        logoUploading ? <CircularProgress size={14} color="inherit" /> : <ImagePlus size={15} />
                      }
                    >
                      {form.logoUrl ? 'Replace' : 'Upload'}
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
                    <IconButton
                      size="small"
                      disabled={!form.logoUrl || logoUploading}
                      onClick={() => set('logoUrl', '')}
                      aria-label="Remove logo"
                    >
                      <Trash2 size={16} />
                    </IconButton>
                  </Stack>
                </Box>

                <Box sx={{ display: 'grid', gap: 1, minWidth: 0, flex: 1 }}>
                  <Typography sx={{ fontSize: 12.5, fontWeight: 600 }}>Cover image</Typography>
                  <Box
                    sx={{
                      height: 76,
                      borderRadius: '10px',
                      overflow: 'hidden',
                      border: '1px solid',
                      borderColor: 'divider',
                      bgcolor: 'linear-gradient(120deg, #152033 0%, #1E2F4A 100%)',
                      display: 'grid',
                      placeItems: 'center',
                      position: 'relative',
                    }}
                  >
                    {form.coverImageUrl ? (
                      <Box
                        component="img"
                        src={form.coverImageUrl}
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
                      disabled={coverUploading}
                      startIcon={
                        coverUploading ? <CircularProgress size={14} color="inherit" /> : <ImagePlus size={15} />
                      }
                    >
                      {form.coverImageUrl ? 'Replace' : 'Upload'}
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
                      disabled={!form.coverImageUrl || coverUploading}
                      onClick={() => set('coverImageUrl', '')}
                    >
                      Remove
                    </Button>
                  </Stack>
                </Box>
              </Stack>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                  <Box
                    component="input"
                    type="color"
                    value={form.brandPrimary}
                    onChange={(event) => set('brandPrimary', event.target.value)}
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
                    <Typography sx={{ fontSize: 12.5, fontWeight: 600 }}>Primary color</Typography>
                    <Typography sx={{ fontSize: 11.5, color: 'text.secondary', fontFamily: 'monospace' }}>
                      {form.brandPrimary}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                  <Box
                    component="input"
                    type="color"
                    value={form.brandSecondary}
                    onChange={(event) => set('brandSecondary', event.target.value)}
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
                    <Typography sx={{ fontSize: 12.5, fontWeight: 600 }}>Secondary color</Typography>
                    <Typography sx={{ fontSize: 11.5, color: 'text.secondary', fontFamily: 'monospace' }}>
                      {form.brandSecondary}
                    </Typography>
                  </Box>
                </Box>
              </Stack>

              <Divider />
              <SectionTitle>Social media links</SectionTitle>
              {[0, 2, 4, 6].map((start) => {
                const fields = SOCIAL_LINK_FIELDS.slice(start, start + 2);
                if (fields.length === 0) return null;
                return (
                  <Stack key={start} direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    {fields.map((field) => (
                      <TextField
                        key={field.key}
                        label={field.label}
                        value={form.social[field.key]}
                        onChange={(event) => setSocial(field.key, event.target.value)}
                        fullWidth
                      />
                    ))}
                  </Stack>
                );
              })}
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button color="inherit" onClick={requestClose} disabled={saving}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={busy}
              startIcon={saving ? <CircularProgress size={15} color="inherit" /> : undefined}
              sx={{ px: 3 }}
            >
              {saving ? 'Saving…' : 'Save Changes'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <ConfirmDialog
        open={confirmDiscard}
        title="Discard changes?"
        description="You have unsaved changes to the restaurant profile. Closing now will discard them."
        confirmLabel="Discard"
        destructive
        onConfirm={() => {
          setConfirmDiscard(false);
          onClose();
        }}
        onCancel={() => setConfirmDiscard(false)}
      />
    </>
  );
}
