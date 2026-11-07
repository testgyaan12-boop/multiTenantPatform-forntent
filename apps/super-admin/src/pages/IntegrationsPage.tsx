import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Box, Button, Card, Stack, TextField, Typography } from '@mui/material';
import { Plug, Save } from 'lucide-react';
import { ErrorState, LoadingState, PageHeader } from '@resto/ui';
import { platformApi } from '@/api';
import { useToast } from '@/components/toast';

export function IntegrationsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const integrations = useQuery({ queryKey: ['sa-integrations'], queryFn: () => platformApi.integrations() });
  const [values, setValues] = useState<Record<string, string>>({});

  useEffect(() => {
    if (integrations.data) {
      setValues(Object.fromEntries(integrations.data.map((item) => [item.key, item.value ?? ''])));
    }
  }, [integrations.data]);

  const save = useMutation({
    mutationFn: () =>
      platformApi.upsertIntegrations(
        (integrations.data ?? []).map((item) => ({ key: item.key, value: values[item.key] ?? '' })),
      ),
    onSuccess: () => {
      toast('Integrations saved');
      void queryClient.invalidateQueries({ queryKey: ['sa-integrations'] });
      void queryClient.invalidateQueries({ queryKey: ['sa-settings'] });
    },
    onError: (error: Error) => toast(error.message, 'error'),
  });

  return (
    <>
      <PageHeader
        title="Integrations"
        subtitle="Provider configuration stored under the INTEGRATION settings category."
        actions={
          <Button variant="contained" startIcon={<Save size={16} />} disabled={save.isPending} onClick={() => save.mutate()}>
            Save
          </Button>
        }
      />

      {integrations.isPending ? <LoadingState /> : null}
      {integrations.isError ? (
        <ErrorState message={integrations.error.message} onRetry={() => void integrations.refetch()} />
      ) : null}

      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' } }}>
        {(integrations.data ?? []).map((item) => (
          <Card key={item.key} sx={{ p: 2.5 }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
              <Plug size={16} color="#5A6478" />
              <Typography variant="h4">{item.key}</Typography>
            </Stack>
            <TextField
              label="Value"
              value={values[item.key] ?? ''}
              onChange={(event) => setValues((current) => ({ ...current, [item.key]: event.target.value }))}
              fullWidth
              size="small"
            />
            <Typography sx={{ fontSize: 11.5, color: 'text.secondary', mt: 1 }}>
              {item.description}
            </Typography>
          </Card>
        ))}
      </Box>
    </>
  );
}
