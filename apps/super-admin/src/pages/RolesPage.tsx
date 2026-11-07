import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { Pencil, ShieldCheck } from 'lucide-react';
import { ErrorState, LoadingState, PageHeader } from '@resto/ui';
import { platformApi, type RoleView } from '@/api';
import { useToast } from '@/components/toast';

export function RolesPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [editing, setEditing] = useState<RoleView | null>(null);
  const [selected, setSelected] = useState<number[]>([]);

  const roles = useQuery({ queryKey: ['sa-roles'], queryFn: () => platformApi.roles() });
  const permissions = useQuery({ queryKey: ['sa-permissions'], queryFn: () => platformApi.permissions() });

  useEffect(() => {
    if (editing) setSelected(editing.permissionIds);
  }, [editing]);

  const save = useMutation({
    mutationFn: () => platformApi.updateRolePermissions(editing!.id, selected),
    onSuccess: () => {
      toast('Role permissions updated');
      setEditing(null);
      void queryClient.invalidateQueries({ queryKey: ['sa-roles'] });
    },
    onError: (error: Error) => toast(error.message, 'error'),
  });

  return (
    <>
      <PageHeader
        title="Roles & Permissions"
        subtitle="Permission matrix for tenant roles. System roles are seeded in code and cannot be edited."
        actions={
          <Chip icon={<ShieldCheck size={14} />} label={`${permissions.data?.length ?? 0} permissions`} />
        }
      />

      {roles.isPending ? <LoadingState /> : null}
      {roles.isError ? <ErrorState message={roles.error.message} onRetry={() => void roles.refetch()} /> : null}

      {roles.data ? (
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Role</TableCell>
              <TableCell>Code</TableCell>
              <TableCell>Scope</TableCell>
              <TableCell>Permissions</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {roles.data.map((role) => (
              <TableRow key={role.id} hover>
                <TableCell>
                  <Typography variant="body2" fontWeight={600}>
                    {role.name}
                  </Typography>
                  <Typography sx={{ fontSize: 11.5, color: 'text.secondary' }}>{role.description}</Typography>
                </TableCell>
                <TableCell sx={{ fontFamily: 'monospace', fontSize: 12.5 }}>{role.code}</TableCell>
                <TableCell>
                  {role.systemRole ? (
                    <Chip size="small" label="System" color="info" variant="outlined" />
                  ) : (
                    <Chip size="small" label={role.tenantId ? `Tenant #${role.tenantId}` : 'Platform'} />
                  )}
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{role.permissions.length} granted</Typography>
                  <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>
                    {role.permissions.slice(0, 4).join(', ')}
                    {role.permissions.length > 4 ? '…' : ''}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<Pencil size={14} />}
                    disabled={role.systemRole}
                    onClick={() => setEditing(role)}
                  >
                    Edit permissions
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : null}

      <Dialog open={editing !== null} onClose={() => setEditing(null)} fullWidth maxWidth="md">
        <DialogTitle>
          Permissions — {editing?.name} ({editing?.code})
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Alert severity="warning" variant="outlined">
              Changing permissions immediately affects what users with this role can do in the
              restaurant app.
            </Alert>
            <Box
              sx={{
                display: 'grid',
                gap: 0.5,
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
              }}
            >
              {(permissions.data ?? []).map((permission) => (
                <FormControlLabel
                  key={permission.id}
                  control={
                    <Checkbox
                      checked={selected.includes(permission.id)}
                      onChange={(event) =>
                        setSelected((current) =>
                          event.target.checked
                            ? [...current, permission.id]
                            : current.filter((id) => id !== permission.id),
                        )
                      }
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body2">{permission.name}</Typography>
                      <Typography sx={{ fontFamily: 'monospace', fontSize: 11, color: 'text.secondary' }}>
                        {permission.code}
                      </Typography>
                    </Box>
                  }
                />
              ))}
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditing(null)}>Cancel</Button>
          <Button variant="contained" disabled={save.isPending} onClick={() => save.mutate()}>
            Save {selected.length} permissions
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
