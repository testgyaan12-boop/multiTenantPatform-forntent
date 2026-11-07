import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Button,
  Card,
  Chip,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { ListFilter, RefreshCw } from 'lucide-react';
import { ErrorState, LoadingState } from '@resto/ui';
import type { ActivityQuery } from '@resto/types';
import { profileApi } from '@/api';

const ACTIONS = [
  'LOGIN',
  'LOGOUT',
  'PASSWORD_CHANGED',
  'SESSION_REVOKED',
  'OTHER_SESSIONS_REVOKED',
  'PROFILE_UPDATED',
  'PREFERENCES_UPDATED',
];

interface AppliedFilters {
  from: string;
  to: string;
  action: string;
}

const EMPTY_FILTERS: AppliedFilters = { from: '', to: '', action: '' };

export function ActivityTab() {
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);
  const [draft, setDraft] = useState<AppliedFilters>(EMPTY_FILTERS);
  const [applied, setApplied] = useState<AppliedFilters>(EMPTY_FILTERS);

  const query: ActivityQuery = {
    page,
    size,
    ...(applied.from ? { from: applied.from } : {}),
    ...(applied.to ? { to: applied.to } : {}),
    ...(applied.action ? { action: applied.action } : {}),
  };

  const activity = useQuery({
    queryKey: ['sa-profile', 'activity', query],
    queryFn: () => profileApi.activity(query),
  });

  return (
    <Card sx={{ p: 2.5 }}>
      <Box sx={{ mb: 2 }}>
        <Typography variant="h4">Activity log</Typography>
        <Typography variant="caption" color="text.secondary">
          Your account activity
        </Typography>
      </Box>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 2 }} alignItems={{ sm: 'flex-end' }}>
        <TextField
          type="date"
          size="small"
          label="From"
          value={draft.from}
          onChange={(event) => setDraft((current) => ({ ...current, from: event.target.value }))}
          slotProps={{ inputLabel: { shrink: true } }}
          sx={{ width: 180 }}
        />
        <TextField
          type="date"
          size="small"
          label="To"
          value={draft.to}
          onChange={(event) => setDraft((current) => ({ ...current, to: event.target.value }))}
          slotProps={{ inputLabel: { shrink: true } }}
          sx={{ width: 180 }}
        />
        <TextField
          select
          size="small"
          label="Action"
          value={draft.action}
          onChange={(event) => setDraft((current) => ({ ...current, action: event.target.value }))}
          sx={{ minWidth: 240 }}
        >
          <MenuItem value="">All actions</MenuItem>
          {ACTIONS.map((action) => (
            <MenuItem key={action} value={action}>
              {action}
            </MenuItem>
          ))}
        </TextField>
        <Button
          variant="contained"
          startIcon={<ListFilter size={15} />}
          onClick={() => {
            setApplied(draft);
            setPage(0);
          }}
        >
          Apply
        </Button>
        <Button
          variant="outlined"
          color="inherit"
          startIcon={<RefreshCw size={15} />}
          onClick={() => {
            setDraft(EMPTY_FILTERS);
            setApplied(EMPTY_FILTERS);
            setPage(0);
          }}
        >
          Reset
        </Button>
      </Stack>

      {activity.isPending ? <LoadingState label="Loading activity…" /> : null}
      {activity.isError ? (
        <ErrorState message={activity.error.message} onRetry={() => void activity.refetch()} />
      ) : null}

      {activity.data ? (
        <>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Timestamp</TableCell>
                <TableCell>Action</TableCell>
                <TableCell>Module</TableCell>
                <TableCell>Actor</TableCell>
                <TableCell>Details</TableCell>
                <TableCell>Result</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {activity.data.content.map((item) => (
                <TableRow key={item.id} hover>
                  <TableCell>{new Date(item.timestamp).toLocaleString()}</TableCell>
                  <TableCell>
                    <Chip size="small" label={item.action} variant="outlined" />
                  </TableCell>
                  <TableCell>{item.module}</TableCell>
                  <TableCell>{item.actor}</TableCell>
                  <TableCell sx={{ maxWidth: 320 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ wordBreak: 'break-word' }}>
                      {item.details ?? '—'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={item.result}
                      color={item.result === 'SUCCESS' ? 'success' : 'error'}
                      variant="outlined"
                    />
                  </TableCell>
                </TableRow>
              ))}
              {activity.data.content.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 5, color: 'text.secondary' }}>
                    No activity found for the selected filters.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
          <TablePagination
            component="div"
            count={activity.data.page.totalElements}
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
    </Card>
  );
}
