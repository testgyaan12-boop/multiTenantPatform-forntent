import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Button,
  Card,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { Eye, Search, ShieldCheck, Store, X } from 'lucide-react';
import type { AuthUser } from '@resto/types';
import { platformApi } from '@/api';

export function AccessPanel({ user }: { user: AuthUser }) {
  const [permOpen, setPermOpen] = useState(false);
  const [permSearch, setPermSearch] = useState('');
  const stats = useQuery({ queryKey: ['sa-stats'], queryFn: () => platformApi.stats() });

  const isSuperAdmin = user.roles.includes('SUPER_ADMIN');
  const scopeLabel = isSuperAdmin
    ? 'Full platform (all restaurants)'
    : `Scoped access — ${user.roles.join(', ') || 'no roles assigned'}`;

  const filteredPermissions = user.permissions.filter((permission) =>
    permission.toLowerCase().includes(permSearch.trim().toLowerCase()),
  );

  return (
    <>
      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' },
        }}
      >
        <Card sx={{ p: 2.25 }}>
          <Typography sx={{ fontSize: 12.5, fontWeight: 600, color: 'text.secondary' }}>Assigned role</Typography>
          <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap" sx={{ mt: 1 }}>
            {user.roles.length > 0 ? (
              user.roles.map((role) => (
                <Chip
                  key={role}
                  size="small"
                  label={role === 'SUPER_ADMIN' ? 'Super Admin' : role}
                  color={role === 'SUPER_ADMIN' ? 'primary' : 'default'}
                  variant="outlined"
                />
              ))
            ) : (
              <Typography variant="body2" color="text.secondary">
                No roles assigned
              </Typography>
            )}
          </Stack>
        </Card>

        <Card sx={{ p: 2.25 }}>
          <Typography sx={{ fontSize: 12.5, fontWeight: 600, color: 'text.secondary' }}>
            Effective permissions
          </Typography>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 1 }}>
            <Typography sx={{ fontSize: 28, fontWeight: 700, lineHeight: 1.15 }}>
              {user.permissions.length}
            </Typography>
            <Button
              size="small"
              variant="outlined"
              startIcon={<Eye size={14} />}
              onClick={() => {
                setPermSearch('');
                setPermOpen(true);
              }}
            >
              View Permissions
            </Button>
          </Stack>
        </Card>

        <Card sx={{ p: 2.25 }}>
          <Typography sx={{ fontSize: 12.5, fontWeight: 600, color: 'text.secondary' }}>
            Platform access scope
          </Typography>
          <Typography sx={{ mt: 1, fontSize: 15, fontWeight: 600, lineHeight: 1.3 }}>{scopeLabel}</Typography>
          <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mt: 1 }}>
            <ShieldCheck size={14} color={isSuperAdmin ? '#16A34A' : '#5A6478'} />
            <Typography sx={{ fontSize: 11.5, color: 'text.secondary' }}>
              {isSuperAdmin ? 'Unrestricted platform administration' : 'Limited to assigned restaurants'}
            </Typography>
          </Stack>
        </Card>

        <Card sx={{ p: 2.25 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
            <Box>
              <Typography sx={{ fontSize: 12.5, fontWeight: 600, color: 'text.secondary' }}>
                Restaurants accessible
              </Typography>
              <Typography sx={{ mt: 1, fontSize: 28, fontWeight: 700, lineHeight: 1.15 }}>
                {stats.isPending ? '…' : stats.isError ? '—' : (stats.data?.tenants.total ?? 0)}
              </Typography>
              <Typography sx={{ fontSize: 11.5, color: 'text.secondary' }}>
                {stats.isError ? 'Failed to load platform stats' : 'Total restaurants on the platform'}
              </Typography>
            </Box>
            <Box
              sx={{
                width: 38,
                height: 38,
                borderRadius: 2,
                display: 'grid',
                placeItems: 'center',
                bgcolor: 'rgba(37,99,235,0.1)',
                color: '#2563EB',
                flexShrink: 0,
              }}
            >
              <Store size={18} />
            </Box>
          </Stack>
        </Card>
      </Box>

      <Dialog open={permOpen} onClose={() => setPermOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h3">Effective permissions</Typography>
            <IconButton size="small" onClick={() => setPermOpen(false)} aria-label="Close permissions">
              <X size={18} />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {user.permissions.length} permission{user.permissions.length === 1 ? '' : 's'} inherited from your assigned
            roles. Permissions are managed by platform administrators and cannot be edited here.
          </Typography>
          <TextField
            size="small"
            fullWidth
            placeholder="Search permissions…"
            value={permSearch}
            onChange={(event) => setPermSearch(event.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Search size={16} color="#5A6478" />
                  </InputAdornment>
                ),
              },
            }}
            sx={{ mb: 2 }}
          />
          <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap">
            {filteredPermissions.map((permission) => (
              <Chip key={permission} size="small" variant="outlined" label={permission} />
            ))}
          </Stack>
          {filteredPermissions.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
              {user.permissions.length === 0 ? 'No permissions assigned.' : 'No permissions match your search.'}
            </Typography>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
