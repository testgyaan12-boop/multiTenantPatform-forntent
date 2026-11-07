import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Button,
  Card,
  Divider,
  FormControlLabel,
  MenuItem,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { Save } from 'lucide-react';
import { ErrorState, LoadingState } from '@resto/ui';
import type { UserPreferences } from '@resto/types';
import { profileApi } from '@/api';
import { useToast } from '@/components/toast';

const TIME_ZONES = ['Asia/Kolkata', 'UTC', 'America/New_York', 'Europe/London', 'Asia/Dubai', 'Asia/Singapore'];
const DATE_FORMATS = ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'];
const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'hi', label: 'Hindi' },
];

const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'SYSTEM',
  timeZone: 'UTC',
  dateFormat: 'DD/MM/YYYY',
  language: 'en',
  emailNotifications: true,
  inAppNotifications: true,
};

export function PreferencesTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const preferences = useQuery({ queryKey: ['sa-profile', 'preferences'], queryFn: () => profileApi.preferences() });
  const [form, setForm] = useState<UserPreferences>(DEFAULT_PREFERENCES);

  useEffect(() => {
    if (preferences.data) setForm(preferences.data);
  }, [preferences.data]);

  const save = useMutation({
    mutationFn: (payload: UserPreferences) => profileApi.savePreferences(payload),
    onSuccess: () => {
      toast('Preferences saved');
      void queryClient.invalidateQueries({ queryKey: ['sa-profile', 'preferences'] });
    },
    onError: (error: Error) => toast(error.message, 'error'),
  });

  if (preferences.isPending) return <LoadingState label="Loading preferences…" />;
  if (preferences.isError)
    return <ErrorState message={preferences.error.message} onRetry={() => void preferences.refetch()} />;

  return (
    <Card sx={{ p: 2.5 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Box>
          <Typography variant="h4">Preferences</Typography>
          <Typography variant="caption" color="text.secondary">
            Display, locale and notification settings saved to your account.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<Save size={16} />} disabled={save.isPending} onClick={() => save.mutate(form)}>
          {save.isPending ? 'Saving…' : 'Save preferences'}
        </Button>
      </Stack>
      <Divider sx={{ mb: 2.5 }} />

      <Box sx={{ display: 'grid', gap: 2.5, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' } }}>
        <TextField
          select
          label="Theme"
          value={form.theme}
          onChange={(event) =>
            setForm((current) => ({ ...current, theme: event.target.value as UserPreferences['theme'] }))
          }
          fullWidth
          helperText="Saved to your account."
        >
          <MenuItem value="LIGHT">Light</MenuItem>
          <MenuItem value="DARK">Dark</MenuItem>
          <MenuItem value="SYSTEM">System</MenuItem>
        </TextField>

        <TextField
          select
          label="Time zone"
          value={form.timeZone}
          onChange={(event) => setForm((current) => ({ ...current, timeZone: event.target.value }))}
          fullWidth
          helperText="Used for timestamps across the platform."
        >
          {TIME_ZONES.map((zone) => (
            <MenuItem key={zone} value={zone}>
              {zone}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          select
          label="Date format"
          value={form.dateFormat}
          onChange={(event) => setForm((current) => ({ ...current, dateFormat: event.target.value }))}
          fullWidth
        >
          {DATE_FORMATS.map((format) => (
            <MenuItem key={format} value={format}>
              {format}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          select
          label="Language"
          value={form.language}
          onChange={(event) => setForm((current) => ({ ...current, language: event.target.value }))}
          fullWidth
        >
          {LANGUAGES.map((language) => (
            <MenuItem key={language.value} value={language.value}>
              {language.label}
            </MenuItem>
          ))}
        </TextField>
      </Box>

      <Divider sx={{ my: 2.5 }} />

      <Stack spacing={1}>
        <Typography variant="h4">Notifications</Typography>
        <FormControlLabel
          control={
            <Switch
              checked={form.emailNotifications}
              onChange={(event) => setForm((current) => ({ ...current, emailNotifications: event.target.checked }))}
            />
          }
          label={
            <Box>
              <Typography variant="body2" fontWeight={600}>
                Email notifications
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Receive account and platform updates by email.
              </Typography>
            </Box>
          }
        />
        <FormControlLabel
          control={
            <Switch
              checked={form.inAppNotifications}
              onChange={(event) => setForm((current) => ({ ...current, inAppNotifications: event.target.checked }))}
            />
          }
          label={
            <Box>
              <Typography variant="body2" fontWeight={600}>
                In-app notifications
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Show notifications inside the super admin app.
              </Typography>
            </Box>
          }
        />
      </Stack>
    </Card>
  );
}
