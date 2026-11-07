import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { Check, Send } from 'lucide-react';
import { ErrorState, LoadingState, PageHeader } from '@resto/ui';
import { platformApi } from '@/api';
import { useToast } from '@/components/toast';

export function NotificationsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [broadcastOpen, setBroadcastOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  const notifications = useQuery({
    queryKey: ['sa-notifications', { page, size, unreadOnly }],
    queryFn: () => platformApi.notifications({ page, size, unreadOnly: unreadOnly || undefined }),
  });

  const markRead = useMutation({
    mutationFn: (id: number) => platformApi.markNotificationRead(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['sa-notifications'] });
      void queryClient.invalidateQueries({ queryKey: ['sa-notifications-unread'] });
    },
    onError: (error: Error) => toast(error.message, 'error'),
  });

  const broadcast = useMutation({
    mutationFn: () => platformApi.broadcast({ subject, body }),
    onSuccess: (result) => {
      toast(`Broadcast sent to ${result.recipients} user(s)`);
      setBroadcastOpen(false);
      setSubject('');
      setBody('');
      void queryClient.invalidateQueries({ queryKey: ['sa-notifications'] });
    },
    onError: (error: Error) => toast(error.message, 'error'),
  });

  return (
    <>
      <PageHeader
        title="Notifications"
        subtitle="In-app notification feed. Broadcast writes a notification for every registered user."
        actions={
          <Button variant="contained" startIcon={<Send size={16} />} onClick={() => setBroadcastOpen(true)}>
            Broadcast
          </Button>
        }
      />

      <FormControlLabel
        control={
          <Switch
            checked={unreadOnly}
            onChange={(event) => {
              setUnreadOnly(event.target.checked);
              setPage(0);
            }}
          />
        }
        label="Unread only"
        sx={{ mb: 2 }}
      />

      {notifications.isPending ? <LoadingState /> : null}
      {notifications.isError ? (
        <ErrorState message={notifications.error.message} onRetry={() => void notifications.refetch()} />
      ) : null}

      {notifications.data ? (
        <>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>When</TableCell>
                <TableCell>Subject</TableCell>
                <TableCell>Template</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Read</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {notifications.data.content.map((notification) => (
                <TableRow key={notification.id} hover>
                  <TableCell>
                    {notification.createdAt ? new Date(notification.createdAt).toLocaleString() : '—'}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>
                      {notification.subject ?? '—'}
                    </Typography>
                    <Typography sx={{ fontSize: 11.5, color: 'text.secondary' }}>
                      {notification.body?.slice(0, 80)}
                      {(notification.body?.length ?? 0) > 80 ? '…' : ''}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: 12 }}>
                    {notification.templateCode}
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={notification.status}
                      color={notification.status === 'SENT' ? 'success' : 'default'}
                    />
                  </TableCell>
                  <TableCell>
                    {notification.readAt ? new Date(notification.readAt).toLocaleString() : 'Unread'}
                  </TableCell>
                  <TableCell align="right">
                    {notification.readAt ? null : (
                      <Button
                        size="small"
                        startIcon={<Check size={14} />}
                        onClick={() => markRead.mutate(notification.id)}
                        disabled={markRead.isPending}
                      >
                        Mark read
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {notifications.data.content.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 5, color: 'text.secondary' }}>
                    No notifications yet. Send a broadcast to create some.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
          <TablePagination
            component="div"
            count={notifications.data.page.totalElements}
            page={page}
            rowsPerPage={size}
            onPageChange={(_, next) => setPage(next)}
            onRowsPerPageChange={(event) => {
              setSize(Number(event.target.value));
              setPage(0);
            }}
          />
        </>
      ) : null}

      <Dialog open={broadcastOpen} onClose={() => setBroadcastOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Broadcast notification</DialogTitle>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            broadcast.mutate();
          }}
        >
          <DialogContent>
            <Stack spacing={2} sx={{ pt: 1 }}>
              <Alert severity="info" variant="outlined">
                Creates an IN_APP notification for every user (platform + tenant accounts).
              </Alert>
              <TextField
                label="Subject"
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                required
                fullWidth
              />
              <TextField
                label="Body"
                value={body}
                onChange={(event) => setBody(event.target.value)}
                required
                fullWidth
                multiline
                minRows={3}
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setBroadcastOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={broadcast.isPending || !subject || !body}>
              Send broadcast
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </>
  );
}
