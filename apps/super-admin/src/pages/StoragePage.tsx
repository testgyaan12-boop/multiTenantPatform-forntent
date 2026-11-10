import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  LinearProgress,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { Edit, Plus, RefreshCw, Trash2, Upload } from 'lucide-react';
import { ConfirmDialog, ErrorState, LoadingState, PageHeader } from '@resto/ui';
import { platformApi } from '@/api';
import { useToast } from '@/components/toast';

export function StoragePage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const form = useState<{
    label: string;
    cloudName: string;
    apiKey: string;
    apiSecret: string;
    uploadPreset: string;
    folderPrefix: string;
    priority: string;
    isActive: boolean;
    monthlyCreditLimit: string;
  }>({
    label: '',
    cloudName: '',
    apiKey: '',
    apiSecret: '',
    uploadPreset: '',
    folderPrefix: '',
    priority: '0',
    isActive: true,
    monthlyCreditLimit: '25',
  });
  const [values, setValues] = form;

  const accounts = useQuery({
    queryKey: ['sa-cloudinary-accounts'],
    queryFn: () => platformApi.cloudinaryAccounts(),
  });
  const summary = useQuery({
    queryKey: ['sa-cloudinary-summary'],
    queryFn: () => platformApi.cloudinarySummary(),
    enabled: !accounts.isPending,
  });

  const exhausted =
    summary.data?.exhaustedAccounts ?? 0;
  const lowOrExhausted = summary.data?.lowOrExhausted ?? [];

  const create = useMutation({
    mutationFn: () =>
      platformApi.createCloudinaryAccount({
        ...values,
        priority: Number(values.priority) || 0,
        monthlyCreditLimit: Number(values.monthlyCreditLimit) || 25,
      }),
    onSuccess: () => {
      toast('Cloudinary account added');
      setOpen(false);
      setEditingId(null);
      setValues({
        label: '', cloudName: '', apiKey: '', apiSecret: '', uploadPreset: '',
        folderPrefix: '', priority: '0', isActive: true, monthlyCreditLimit: '25',
      });
      void queryClient.invalidateQueries({ queryKey: ['sa-cloudinary-accounts'] });
      void queryClient.invalidateQueries({ queryKey: ['sa-cloudinary-summary'] });
    },
    onError: (error: Error) => toast(error.message, 'error'),
  });

  const update = useMutation({
    mutationFn: () =>
      platformApi.updateCloudinaryAccount(editingId!, {
        ...values,
        priority: Number(values.priority) || 0,
        monthlyCreditLimit: Number(values.monthlyCreditLimit) || 25,
      }),
    onSuccess: () => {
      toast('Cloudinary account updated');
      setOpen(false);
      setEditingId(null);
      void queryClient.invalidateQueries({ queryKey: ['sa-cloudinary-accounts'] });
      void queryClient.invalidateQueries({ queryKey: ['sa-cloudinary-summary'] });
    },
    onError: (error: Error) => toast(error.message, 'error'),
  });

  const remove = useMutation({
    mutationFn: () => platformApi.deleteCloudinaryAccount(deleteId!),
    onSuccess: () => {
      setDeleteId(null);
      setDeleteLoading(false);
      toast('Cloudinary account removed');
      void queryClient.invalidateQueries({ queryKey: ['sa-cloudinary-accounts'] });
      void queryClient.invalidateQueries({ queryKey: ['sa-cloudinary-summary'] });
    },
    onError: (error: Error) => {
      setDeleteLoading(false);
      toast(error.message, 'error');
    },
  });

  const testAccount = useMutation({
    mutationFn: (id: number) => platformApi.testCloudinaryAccount(id),
    onSuccess: () => {
      toast('Credentials verified');
      void queryClient.invalidateQueries({ queryKey: ['sa-cloudinary-accounts'] });
      void queryClient.invalidateQueries({ queryKey: ['sa-cloudinary-summary'] });
    },
    onError: (error: Error) => toast(error.message, 'error'),
  });

  const refreshUsage = useMutation({
    mutationFn: (id: number) => platformApi.refreshCloudinaryUsage(id),
    onSuccess: () => {
      toast('Usage refreshed');
      void queryClient.invalidateQueries({ queryKey: ['sa-cloudinary-accounts'] });
      void queryClient.invalidateQueries({ queryKey: ['sa-cloudinary-summary'] });
    },
    onError: (error: Error) => toast(error.message, 'error'),
  });

  const handleSave = () => {
    if (editingId == null) {
      create.mutate();
    } else {
      update.mutate();
    }
  };

  const creditColor = (usedPercent: number) => {
    if (usedPercent >= 90) return 'error';
    if (usedPercent >= 60) return 'warning';
    return 'success';
  };

  return (
    <>
      <PageHeader
        title="Storage / Cloudinary"
        subtitle="Upload credentials for menu images, logos, covers and gallery. The least-used active account is chosen per upload."
        actions={
          <Stack direction="row" spacing={1} alignItems="center">
            <Button
              variant="contained"
              startIcon={<Plus size={16} />}
              disabled={create.isPending || update.isPending}
              onClick={() => {
                setEditingId(null);
                setValues({
                  label: '', cloudName: '', apiKey: '', apiSecret: '', uploadPreset: '',
                  folderPrefix: '', priority: '0', isActive: true, monthlyCreditLimit: '25',
                });
                setOpen(true);
              }}
            >
              Add account
            </Button>
          </Stack>
        }
      />

      {accounts.isPending ? <LoadingState /> : null}
      {accounts.isError ? <ErrorState message={accounts.error.message} onRetry={() => void accounts.refetch()} /> : null}

      {accounts.data && summary.data ? (
        <>
          {summary.data.exhaustedAccounts > 0 && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {summary.data.exhaustedAccounts} Cloudinary account(s) have reached their credit limit. Image uploads will fail until a new account is added or an existing one is reset next month.
            </Alert>
          )}
          {summary.data.totalRemainingCredits !== null &&
            summary.data.totalRemainingCredits <= 5 && summary.data.exhaustedAccounts === 0 && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                Only {summary.data.totalRemainingCredits} Cloudinary credit(s) remain across all active accounts. Add a new account to avoid upload failures.
              </Alert>
            )}

          <Box sx={{ display: 'grid', gap: 2, mb: 3, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' } }}>
            <Card sx={{ p: 2 }}>
              <Typography variant="caption" color="text.secondary">Total accounts</Typography>
              <Typography variant="h4">{summary.data.totalAccounts}</Typography>
            </Card>
            <Card sx={{ p: 2 }}>
              <Typography variant="caption" color="text.secondary">Active accounts</Typography>
              <Typography variant="h4">{summary.data.activeAccounts}</Typography>
            </Card>
            <Card sx={{ p: 2 }}>
              <Typography variant="caption" color="text.secondary">Remaining credits (this month)</Typography>
              <Typography variant="h4">{summary.data.totalRemainingCredits}</Typography>
            </Card>
            <Card sx={{ p: 2 }}>
              <Typography variant="caption" color="text.secondary">Exhausted accounts</Typography>
              <Typography variant="h4" color={exhausted > 0 ? 'error' : 'inherit'}>
                {exhausted}
              </Typography>
            </Card>
          </Box>

          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)', xl: 'repeat(4, 1fr)' } }}>
            {(accounts.data ?? []).map((account) => {
              const usedPercent = account.usedPercent ?? 0;
              const remaining = (account.monthlyCreditLimit ?? 25) - (account.creditsUsed ?? 0);
              return (
                <Card key={account.id} sx={{ p: 2.5, display: 'flex', flexDirection: 'column' }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                    <Box>
                      <Typography variant="body2" fontWeight={700}>
                        {account.label}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.25 }}>
                        {account.cloudName}
                      </Typography>
                    </Box>
                    <Chip
                      size="small"
                      label={account.isActive ? 'Active' : 'Inactive'}
                      color={account.isActive ? 'success' : 'default'}
                      disabled
                    />
                  </Stack>

                  <Stack spacing={1}>
                    <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                      <Typography variant="caption" color="text.secondary">API key</Typography>
                      <Typography variant="body2" fontFamily="monospace" fontSize={12.5}>
                        {account.apiKeyMasked}
                      </Typography>
                    </Stack>
                    <Stack direction="row" justifyContent="space-between" alignItems="baseline" sx={{ mb: 1 }}>
                      <Box>
                        <Typography variant="caption" color="text.secondary">Credits used</Typography>
                      </Box>
                      <Typography variant="body2">
                        {account.creditsUsed} / {account.monthlyCreditLimit}
                      </Typography>
                    </Stack>
                    <LinearProgress
                      variant="determinate"
                      value={Math.min(100, usedPercent)}
                      sx={{ height: 8, borderRadius: 4, '& .MuiLinearProgress-bar': { borderRadius: 4 } }}
                      color={creditColor(usedPercent)}
                    />
                    <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'right' }}>
                      {usedPercent}% used · {remaining > 0 ? remaining : 0} remaining
                    </Typography>
                    {account.lastError && (
                      <Alert severity="error" sx={{ mb: 1, fontSize: 12.5 }}>
                        Last error: {account.lastError}
                      </Alert>
                    )}
                    <Stack direction="row" spacing={1}>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<RefreshCw size={16} />}
                        onClick={() => refreshUsage.mutate(account.id)}
                        disabled={refreshUsage.isPending}
                      >
                        Refresh usage
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<Upload size={16} />}
                        onClick={() => testAccount.mutate(account.id)}
                        disabled={testAccount.isPending}
                      >
                        Test
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<Edit size={16} />}
                        onClick={() => {
                          setEditingId(account.id);
                          setValues({
                            label: account.label,
                            cloudName: account.cloudName,
                            apiKey: account.apiKeyMasked,
                            apiSecret: '',
                            uploadPreset: account.uploadPreset ?? '',
                            folderPrefix: account.folderPrefix ?? '',
                            priority: String(account.priority ?? 0),
                            isActive: account.isActive,
                            monthlyCreditLimit: String(account.monthlyCreditLimit),
                          });
                          setOpen(true);
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        startIcon={<Trash2 size={16} />}
                        onClick={() => {
                          setDeleteId(account.id);
                          setOpen(false);
                        }}
                      >
                        Delete
                      </Button>
                    </Stack>
                    {account.usageCheckedAt && (
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                        Usage last checked: {new Date(account.usageCheckedAt).toLocaleString()}
                      </Typography>
                    )}
                  </Stack>
                </Card>
              );
            })}
          </Box>

          {lowOrExhausted.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" gutterBottom>Accounts needing attention</Typography>
              <Box sx={{ display: 'grid', gap: 1, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' } }}>
                {lowOrExhausted.map((account) => (
                  <Card key={account.id} sx={{ p: 1.5 }}>
                    <Typography variant="body2" fontWeight={600} color="error">
                      {account.label}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">{account.cloudName}</Typography>
                    <Typography variant="body2" color="error">
                      {account.usedPercent}% used
                    </Typography>
                    {account.lastError && (
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                        {account.lastError}
                      </Typography>
                    )}
                  </Card>
                ))}
              </Box>
            </Box>
          )}
        </>
      ) : null}

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingId == null ? 'Add Cloudinary account' : 'Edit Cloudinary account'}
        </DialogTitle>
        <DialogContent sx={{ minWidth: 420 }}>
          <Stack spacing={2}>
            <TextField
              label="Label (display name)"
              value={values.label}
              onChange={(e) => setValues({ ...values, label: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="Cloud name"
              value={values.cloudName}
              onChange={(e) => setValues({ ...values, cloudName: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="API key"
              value={values.apiKey}
              onChange={(e) => setValues({ ...values, apiKey: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="API secret (stored encrypted)"
              type="password"
              value={values.apiSecret}
              onChange={(e) => setValues({ ...values, apiSecret: e.target.value })}
              fullWidth
              required={editingId == null}
              helperText={
                editingId == null ? 'Required' : 'Leave blank to keep existing secret'
              }
            />
            <TextField
              label="Upload preset (optional)"
              value={values.uploadPreset}
              onChange={(e) => setValues({ ...values, uploadPreset: e.target.value })}
              fullWidth
            />
            <TextField
              label="Folder prefix (optional)"
              value={values.folderPrefix}
              onChange={(e) => setValues({ ...values, folderPrefix: e.target.value })}
              fullWidth
            />
            <TextField
              label="Priority (lower = preferred)"
              type="number"
              value={values.priority}
              onChange={(e) => setValues({ ...values, priority: e.target.value })}
              fullWidth
            />
            <TextField
              label="Monthly credit limit"
              type="number"
              value={values.monthlyCreditLimit}
              onChange={(e) => setValues({ ...values, monthlyCreditLimit: e.target.value })}
              fullWidth
              helperText="Free tier = 25 credits/month"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={values.isActive}
                  onChange={(e) => setValues({ ...values, isActive: e.target.checked })}
                  sx={{ mt: 0.25 }}
                />
              }
              label="Active"
              labelPlacement="start"
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpen(false)} disabled={create.isPending || update.isPending}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={create.isPending || update.isPending}
          >
            {editingId == null ? 'Add account' : 'Save changes'}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={deleteId != null}
        title="Delete Cloudinary account?"
        description="Uploads will fail if no active account remains. Add a replacement first."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        destructive
        loading={deleteLoading}
        onConfirm={() => {
          setDeleteLoading(true);
          remove.mutate();
        }}
        onCancel={() => setDeleteId(null)}
      />
    </>
  );
}
