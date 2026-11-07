import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
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
  Tooltip,
  Typography,
} from '@mui/material';
import { ErrorState, LoadingState, PageHeader } from '@resto/ui';
import { platformApi } from '@/api';

export function AuditPage() {
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);
  const [search, setSearch] = useState('');
  const [entityType, setEntityType] = useState('');

  const logs = useQuery({
    queryKey: ['sa-audit', { page, size, search, entityType }],
    queryFn: () =>
      platformApi.auditLogs({ page, size, search: search || undefined, entityType: entityType || undefined }),
  });

  return (
    <>
      <PageHeader title="Audit Logs" subtitle="Platform-wide audit trail stored in audit_logs." />

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 2 }}>
        <TextField
          size="small"
          label="Search action, entity or actor"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(0);
          }}
          sx={{ minWidth: 300 }}
        />
        <TextField
          size="small"
          label="Entity type"
          value={entityType}
          onChange={(event) => {
            setEntityType(event.target.value);
            setPage(0);
          }}
          sx={{ width: 200 }}
          placeholder="e.g. Order"
        />
        {entityType ? (
          <MenuItem sx={{ display: 'none' }} value={entityType}>
            {entityType}
          </MenuItem>
        ) : null}
      </Stack>

      {logs.isPending ? <LoadingState /> : null}
      {logs.isError ? <ErrorState message={logs.error.message} onRetry={() => void logs.refetch()} /> : null}

      {logs.data ? (
        <>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>When</TableCell>
                <TableCell>Action</TableCell>
                <TableCell>Entity</TableCell>
                <TableCell>Actor</TableCell>
                <TableCell>Tenant</TableCell>
                <TableCell>IP</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {logs.data.content.map((log) => (
                <TableRow key={log.id} hover>
                  <TableCell>{log.createdAt ? new Date(log.createdAt).toLocaleString() : '—'}</TableCell>
                  <TableCell>
                    <Chip size="small" label={log.action} variant="outlined" />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{log.entityType}</Typography>
                    {log.entityId ? (
                      <Typography sx={{ fontFamily: 'monospace', fontSize: 11, color: 'text.secondary' }}>
                        #{log.entityId}
                      </Typography>
                    ) : null}
                  </TableCell>
                  <TableCell>{log.actorEmail ?? 'system'}</TableCell>
                  <TableCell>{log.tenantId ? `#${log.tenantId}` : '—'}</TableCell>
                  <TableCell>
                    <Tooltip title={log.requestId ?? ''}>
                      <span>{log.ipAddress ?? '—'}</span>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
              {logs.data.content.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 5, color: 'text.secondary' }}>
                    No audit entries found.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
          <TablePagination
            component="div"
            count={logs.data.page.totalElements}
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
    </>
  );
}
