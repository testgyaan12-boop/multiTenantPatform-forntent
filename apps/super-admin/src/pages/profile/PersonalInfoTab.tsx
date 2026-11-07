import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Avatar, Box, Button, Card, Chip, Divider, Stack, TextField, Typography } from '@mui/material';
import { Save } from 'lucide-react';
import type { AuthUser, UpdateProfilePayload } from '@resto/types';
import { profileApi } from '@/api';
import { useToast } from '@/components/toast';
import { NAVY } from '@/theme';

interface ProfileForm {
  firstName: string;
  lastName: string;
  phone: string;
  avatarUrl: string;
  displayName: string;
  bio: string;
}

function toForm(user: AuthUser): ProfileForm {
  return {
    firstName: user.firstName ?? '',
    lastName: user.lastName ?? '',
    phone: user.phone ?? '',
    avatarUrl: user.avatarUrl ?? '',
    displayName: user.displayName ?? '',
    bio: user.bio ?? '',
  };
}

export function PersonalInfoTab({ user }: { user: AuthUser }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<ProfileForm>(() => toForm(user));
  const [errors, setErrors] = useState<Partial<Record<keyof ProfileForm, string>>>({});

  useEffect(() => {
    setForm(toForm(user));
    setErrors({});
  }, [user]);

  const save = useMutation({
    mutationFn: (payload: UpdateProfilePayload) => profileApi.update(payload),
    onSuccess: () => {
      toast('Profile updated');
      void queryClient.invalidateQueries({ queryKey: ['sa-profile'] });
    },
    onError: (error: Error) => toast(error.message, 'error'),
  });

  const validate = (): boolean => {
    const next: Partial<Record<keyof ProfileForm, string>> = {};
    if (!form.firstName.trim()) next.firstName = 'First name is required.';
    if (!form.lastName.trim()) next.lastName = 'Last name is required.';
    if (form.phone.length > 30) next.phone = 'Phone must be 30 characters or fewer.';
    if (form.bio.length > 500) next.bio = 'Bio must be 500 characters or fewer.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    save.mutate({
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      phone: form.phone.trim(),
      avatarUrl: form.avatarUrl.trim(),
      displayName: form.displayName.trim(),
      bio: form.bio.trim(),
    });
  };

  return (
    <Card sx={{ p: 2.5 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Box>
          <Typography variant="h4">Personal information</Typography>
          <Typography variant="caption" color="text.secondary">
            Update your name, contact details and public profile fields.
          </Typography>
        </Box>
        <Chip
          size="small"
          variant="outlined"
          color={user.emailVerified ? 'success' : 'warning'}
          label={user.emailVerified ? 'Email verified' : 'Email not verified'}
        />
      </Stack>
      <Divider sx={{ mb: 2.5 }} />

      <form
        onSubmit={(event) => {
          event.preventDefault();
          handleSubmit();
        }}
      >
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} alignItems="flex-start">
          <Stack spacing={1.25} alignItems="center" sx={{ minWidth: 140 }}>
            <Avatar
              src={form.avatarUrl.trim() || undefined}
              sx={{ width: 88, height: 88, bgcolor: NAVY, fontSize: 30, fontWeight: 700 }}
            >
              {`${form.firstName.charAt(0)}${form.lastName.charAt(0)}`.toUpperCase() || 'A'}
            </Avatar>
            <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
              Avatar preview
            </Typography>
          </Stack>

          <Box sx={{ flex: 1, width: '100%', display: 'grid', gap: 2 }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="First name"
                required
                value={form.firstName}
                onChange={(event) => setForm((current) => ({ ...current, firstName: event.target.value }))}
                error={Boolean(errors.firstName)}
                helperText={errors.firstName}
                fullWidth
              />
              <TextField
                label="Last name"
                required
                value={form.lastName}
                onChange={(event) => setForm((current) => ({ ...current, lastName: event.target.value }))}
                error={Boolean(errors.lastName)}
                helperText={errors.lastName}
                fullWidth
              />
            </Stack>

            <TextField
              label="Email"
              value={user.email}
              fullWidth
              disabled
              helperText="Contact a platform administrator to change the account email."
            />

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Phone"
                value={form.phone}
                onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                error={Boolean(errors.phone)}
                helperText={errors.phone ?? 'Maximum 30 characters.'}
                fullWidth
              />
              <TextField
                label="Display name"
                value={form.displayName}
                onChange={(event) => setForm((current) => ({ ...current, displayName: event.target.value }))}
                helperText="Optional — shown instead of your full name where supported."
                fullWidth
              />
            </Stack>

            <TextField
              label="Avatar URL"
              value={form.avatarUrl}
              onChange={(event) => setForm((current) => ({ ...current, avatarUrl: event.target.value }))}
              helperText="Paste an image URL. File uploads are not supported by the platform yet."
              fullWidth
            />

            <TextField
              label="Bio"
              value={form.bio}
              onChange={(event) => setForm((current) => ({ ...current, bio: event.target.value }))}
              error={Boolean(errors.bio)}
              helperText={errors.bio ?? `${form.bio.length}/500 characters · Optional`}
              multiline
              minRows={3}
              fullWidth
            />

            <TextField
              label="Account created"
              value={user.createdAt ? new Date(user.createdAt).toLocaleString() : '—'}
              fullWidth
              disabled
            />

            <Stack direction="row" spacing={1.5} justifyContent="flex-end">
              <Button
                variant="outlined"
                color="inherit"
                onClick={() => {
                  setForm(toForm(user));
                  setErrors({});
                }}
                disabled={save.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" variant="contained" startIcon={<Save size={16} />} disabled={save.isPending}>
                {save.isPending ? 'Saving…' : 'Save changes'}
              </Button>
            </Stack>
          </Box>
        </Stack>
      </form>
    </Card>
  );
}
