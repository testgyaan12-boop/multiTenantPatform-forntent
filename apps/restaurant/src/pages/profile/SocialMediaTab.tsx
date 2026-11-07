import { useEffect, useState } from 'react';
import { Alert, Box, Button, CircularProgress, Divider, Paper, Stack, TextField, Typography } from '@mui/material';
import type { RestaurantProfile } from '@resto/types';
import { ConfirmDialog } from '@resto/ui';
import type { RestaurantUpdatePayload } from '@/api';
import {
  parseSocialLinks,
  serializeSocialLinks,
  SOCIAL_LINK_FIELDS,
  type SocialLinksForm,
} from './profileUtils';

interface SocialMediaTabProps {
  profile: RestaurantProfile;
  onSave: (payload: RestaurantUpdatePayload) => Promise<unknown>;
}

export function SocialMediaTab({ profile, onSave }: SocialMediaTabProps) {
  const [links, setLinks] = useState<SocialLinksForm>(() => parseSocialLinks(profile.socialLinks));
  const [baseline, setBaseline] = useState<SocialLinksForm>(() => parseSocialLinks(profile.socialLinks));
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  useEffect(() => {
    const parsed = parseSocialLinks(profile.socialLinks);
    setLinks(parsed);
    setBaseline(parsed);
    setApiError(null);
  }, [profile.socialLinks]);

  const dirty = JSON.stringify(links) !== JSON.stringify(baseline);

  const setField = (key: keyof SocialLinksForm, value: string) => {
    setLinks((previous) => ({ ...previous, [key]: value }));
  };

  const handleSave = async () => {
    if (saving || !dirty) return;
    setSaving(true);
    setApiError(null);
    try {
      await onSave({
        name: profile.name,
        currency: profile.currency,
        socialLinks: serializeSocialLinks(links),
      });
      setBaseline(links);
      setConfirmDiscard(false);
    } catch (error) {
      setApiError(error instanceof Error && error.message ? error.message : 'Failed to save social links.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (saving) return;
    if (dirty) {
      setConfirmDiscard(true);
      return;
    }
    setLinks(baseline);
    setApiError(null);
  };

  return (
    <>
      <Paper variant="outlined" sx={{ borderRadius: '14px', p: 2.5, display: 'grid', gap: 1.75 }}>
        <Box>
          <Typography sx={{ fontSize: 14, fontWeight: 700 }}>Social Media</Typography>
          <Typography sx={{ fontSize: 12.5, color: 'text.secondary', mt: 0.25 }}>
            Link your social profiles so guests can follow your restaurant.
          </Typography>
        </Box>

        {apiError ? (
          <Alert severity="error" variant="outlined" sx={{ borderRadius: '10px' }}>
            {apiError}
          </Alert>
        ) : null}

        <Divider />

        {[0, 2, 4, 6].map((start) => {
          const fields = SOCIAL_LINK_FIELDS.slice(start, start + 2);
          if (fields.length === 0) return null;
          return (
            <Stack key={start} direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              {fields.map((field) => (
                <TextField
                  key={field.key}
                  label={field.label}
                  placeholder={field.key === 'whatsapp' ? '+1 555 000 0000' : 'https://'}
                  value={links[field.key]}
                  onChange={(event) => setField(field.key, event.target.value)}
                  disabled={saving}
                  fullWidth
                />
              ))}
            </Stack>
          );
        })}

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5 }}>
          <Button color="inherit" onClick={handleCancel} disabled={saving}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => void handleSave()}
            disabled={!dirty || saving}
            startIcon={saving ? <CircularProgress size={15} color="inherit" /> : undefined}
          >
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </Box>
      </Paper>

      <ConfirmDialog
        open={confirmDiscard}
        title="Discard changes?"
        description="You have unsaved changes to your social links. Discarding will restore the saved values."
        confirmLabel="Discard"
        destructive
        onConfirm={() => {
          setLinks(baseline);
          setApiError(null);
          setConfirmDiscard(false);
        }}
        onCancel={() => setConfirmDiscard(false)}
      />
    </>
  );
}
