import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Button,
  Card,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { Save } from 'lucide-react';
import { ErrorState, LoadingState, PageHeader } from '@resto/ui';
import { platformApi } from '@/api';
import { useToast } from '@/components/toast';

export function SettingsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const settings = useQuery({ queryKey: ['sa-settings'], queryFn: () => platformApi.settings() });
  const [values, setValues] = useState<Record<string, string>>({});

  useEffect(() => {
    if (settings.data) {
      setValues(Object.fromEntries(settings.data.map((setting) => [setting.key, setting.value ?? ''])));
    }
  }, [settings.data]);

  const save = useMutation({
    mutationFn: () =>
      platformApi.upsertSettings(
        (settings.data ?? []).map((setting) => ({
          key: setting.key,
          value: values[setting.key] ?? '',
        })),
      ),
    onSuccess: () => {
      toast('Settings saved');
      void queryClient.invalidateQueries({ queryKey: ['sa-settings'] });
    },
    onError: (error: Error) => toast(error.message, 'error'),
  });

  const renderInput = (key: string, category: string) => {
    if (key === 'signup.policy' || key === 'default.plan' || key === 'mail.provider' || key === 'billing.provider') {
      const options =
        key === 'signup.policy'
          ? ['OPEN', 'APPROVAL']
          : key === 'default.plan'
            ? ['STARTER', 'GROWTH', 'ENTERPRISE']
            : key === 'mail.provider'
              ? ['none', 'smtp', 'sendgrid']
              : ['sandbox', 'stripe'];
      return (
        <TextField
          select
          label={key}
          value={values[key] ?? ''}
          onChange={(event) => setValues((current) => ({ ...current, [key]: event.target.value }))}
          fullWidth
          helperText={settings.data?.find((setting) => setting.key === key)?.description}
        >
          {options.map((option) => (
            <MenuItem key={option} value={option}>
              {option}
            </MenuItem>
          ))}
        </TextField>
      );
    }
    return (
      <TextField
        label={key}
        value={values[key] ?? ''}
        onChange={(event) => setValues((current) => ({ ...current, [key]: event.target.value }))}
        fullWidth
        helperText={`${category} · ${settings.data?.find((setting) => setting.key === key)?.description ?? ''}`}
      />
    );
  };

  const categories = [...new Set((settings.data ?? []).map((setting) => setting.category))];

  return (
    <>
      <PageHeader
        title="System Settings"
        subtitle="Platform configuration persisted in platform_settings (V7)."
        actions={
          <Button variant="contained" startIcon={<Save size={16} />} disabled={save.isPending} onClick={() => save.mutate()}>
            Save settings
          </Button>
        }
      />

      {settings.isPending ? <LoadingState /> : null}
      {settings.isError ? <ErrorState message={settings.error.message} onRetry={() => void settings.refetch()} /> : null}

      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, 1fr)' } }}>
        {categories.map((category) => (
          <Card key={category} sx={{ p: 2.5 }}>
            <Typography variant="h4" sx={{ mb: 2 }}>
              {category}
            </Typography>
            <Stack spacing={2}>
              {(settings.data ?? [])
                .filter((setting) => setting.category === category)
                .map((setting) => (
                  <Box key={setting.key}>{renderInput(setting.key, setting.category)}</Box>
                ))}
            </Stack>
          </Card>
        ))}
      </Box>
    </>
  );
}
