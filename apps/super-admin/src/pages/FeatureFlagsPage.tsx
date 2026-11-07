import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { ErrorState, LoadingState, PageHeader } from '@resto/ui';
import { platformApi } from '@/api';
import { useToast } from '@/components/toast';

export function FeatureFlagsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const flags = useQuery({ queryKey: ['sa-flags'], queryFn: () => platformApi.flags() });

  const toggle = useMutation({
    mutationFn: ({ key, enabled }: { key: string; enabled: boolean }) => platformApi.toggleFlag(key, enabled),
    onSuccess: (flag) => {
      toast(`${flag.key} ${flag.enabled ? 'enabled' : 'disabled'}`);
      void queryClient.invalidateQueries({ queryKey: ['sa-flags'] });
    },
    onError: (error: Error) => toast(error.message, 'error'),
  });

  return (
    <>
      <PageHeader title="Feature Flags" subtitle="Runtime toggles stored in feature_flags (V7)." />
      <Alert severity="info" variant="outlined" sx={{ mb: 2 }}>
        Flags are persisted platform-side; downstream services read them on startup or via this API.
      </Alert>

      {flags.isPending ? <LoadingState /> : null}
      {flags.isError ? <ErrorState message={flags.error.message} onRetry={() => void flags.refetch()} /> : null}

      {flags.data ? (
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Flag</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Plan scope</TableCell>
              <TableCell align="right">Enabled</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {flags.data.map((flag) => (
              <TableRow key={flag.id} hover>
                <TableCell>
                  <Typography variant="body2" fontWeight={700} sx={{ fontFamily: 'monospace' }}>
                    {flag.key}
                  </Typography>
                </TableCell>
                <TableCell>{flag.description}</TableCell>
                <TableCell>{flag.planCode ?? 'All plans'}</TableCell>
                <TableCell align="right">
                  <Stack direction="row" spacing={1} justifyContent="flex-end" alignItems="center">
                    <Typography variant="body2" color={flag.enabled ? 'success.main' : 'text.secondary'}>
                      {flag.enabled ? 'On' : 'Off'}
                    </Typography>
                    <Switch
                      checked={flag.enabled}
                      disabled={toggle.isPending}
                      onChange={(event) => toggle.mutate({ key: flag.key, enabled: event.target.checked })}
                      inputProps={{ 'aria-label': `Toggle ${flag.key}` }}
                    />
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : null}
    </>
  );
}
