import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Button,
  Card,
  Chip,
  Divider,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { Laptop, LogOut, Monitor, Shield, Smartphone } from 'lucide-react';
import { ConfirmDialog, ErrorState, LoadingState } from '@resto/ui';
import type { UserSession } from '@resto/types';
import { profileApi } from '@/api';
import { useToast } from '@/components/toast';

function deviceIcon(device: string) {
  const value = device.toLowerCase();
  if (value.includes('iphone') || value.includes('android') || value.includes('phone')) {
    return <Smartphone size={16} />;
  }
  if (value.includes('ipad') || value.includes('tablet')) {
    return <Laptop size={16} />;
  }
  return <Monitor size={16} />;
}

export function SessionsTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const sessions = useQuery({ queryKey: ['sa-profile', 'sessions'], queryFn: () => profileApi.sessions() });
  const [revokeTarget, setRevokeTarget] = useState<UserSession | null>(null);
  const [revokeAllOpen, setRevokeAllOpen] = useState(false);

  const revoke = useMutation({
    mutationFn: (id: number) => profileApi.revokeSession(id),
    onSuccess: () => {
      toast('Session revoked');
      setRevokeTarget(null);
      void queryClient.invalidateQueries({ queryKey: ['sa-profile', 'sessions'] });
    },
    onError: (error: Error) => toast(error.message, 'error'),
  });

  const revokeOthers = useMutation({
    mutationFn: () => profileApi.revokeOtherSessions(),
    onSuccess: () => {
      toast('All other sessions revoked');
      setRevokeAllOpen(false);
      void queryClient.invalidateQueries({ queryKey: ['sa-profile', 'sessions'] });
    },
    onError: (error: Error) => toast(error.message, 'error'),
  });

  const rows = sessions.data ?? [];
  const otherCount = rows.filter((session) => !session.current).length;

  return (
    <>
      <Card sx={{ p: 2.5 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Box>
            <Typography variant="h4">Sessions & devices</Typography>
            <Typography variant="caption" color="text.secondary">
              Devices currently signed in to your account.
            </Typography>
          </Box>
          <Button
            variant="outlined"
            color="error"
            startIcon={<LogOut size={15} />}
            disabled={otherCount === 0 || revokeOthers.isPending}
            onClick={() => setRevokeAllOpen(true)}
          >
            Sign out all other sessions
          </Button>
        </Stack>

        {sessions.isPending ? <LoadingState label="Loading sessions…" /> : null}
        {sessions.isError ? <ErrorState message={sessions.error.message} onRetry={() => void sessions.refetch()} /> : null}

        {sessions.data ? (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Device</TableCell>
                <TableCell>Browser / user agent</TableCell>
                <TableCell>IP address</TableCell>
                <TableCell>Signed in</TableCell>
                <TableCell>Expires</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((session) => (
                <TableRow key={session.id} hover>
                  <TableCell>
                    <Stack direction="row" spacing={1} alignItems="center">
                      {deviceIcon(session.device)}
                      <Box>
                        <Stack direction="row" spacing={0.75} alignItems="center">
                          <Typography variant="body2" fontWeight={600}>
                            {session.device}
                          </Typography>
                          {session.current ? (
                            <Chip size="small" color="success" label="This device" sx={{ height: 20, fontSize: 10.5 }} />
                          ) : null}
                        </Stack>
                      </Box>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary" sx={{ wordBreak: 'break-word' }}>
                      {session.userAgent ?? '—'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: 12.5 }}>
                      {session.ipAddress ?? '—'}
                    </Typography>
                    <Typography sx={{ fontSize: 10.5, color: '#9AA3B5' }}>
                      IP address (approximate location unavailable)
                    </Typography>
                  </TableCell>
                  <TableCell>{new Date(session.createdAt).toLocaleString()}</TableCell>
                  <TableCell>{new Date(session.expiresAt).toLocaleString()}</TableCell>
                  <TableCell align="right">
                    <Button size="small" color="error" variant="outlined" onClick={() => setRevokeTarget(session)}>
                      Revoke
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 5, color: 'text.secondary' }}>
                    No active sessions found.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        ) : null}

        {sessions.data ? (
          <>
            <Divider sx={{ my: 2 }} />
            <Stack direction="row" spacing={1} alignItems="flex-start">
              <Shield size={15} color="#5A6478" style={{ flexShrink: 0, marginTop: 2 }} />
              <Typography variant="caption" color="text.secondary">
                Revoking a session ends it on the server immediately. Revoking your current session will sign you out
                of this device.
              </Typography>
            </Stack>
          </>
        ) : null}
      </Card>

      <ConfirmDialog
        open={revokeTarget !== null}
        title="Revoke session?"
        description={
          revokeTarget
            ? revokeTarget.current
              ? `This is your current session. Revoking it will sign you out of "${revokeTarget.device}" immediately and you will need to sign in again.`
              : `This will immediately end the session for "${revokeTarget.device}" (IP ${revokeTarget.ipAddress ?? 'unknown'}). The device will need to sign in again.`
            : ''
        }
        confirmLabel="Revoke"
        destructive
        loading={revoke.isPending}
        onCancel={() => setRevokeTarget(null)}
        onConfirm={() => {
          if (revokeTarget) revoke.mutate(revokeTarget.id);
        }}
      />

      <ConfirmDialog
        open={revokeAllOpen}
        title="Sign out all other sessions?"
        description={`This will immediately end ${otherCount} other session${otherCount === 1 ? '' : 's'}. Only this device will remain signed in.`}
        confirmLabel="Sign out others"
        destructive
        loading={revokeOthers.isPending}
        onCancel={() => setRevokeAllOpen(false)}
        onConfirm={() => revokeOthers.mutate()}
      />
    </>
  );
}
