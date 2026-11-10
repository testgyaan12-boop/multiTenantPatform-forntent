import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { platformApi } from '@/api';
import type { CloudinaryAccountView } from '@/api';
import { useToast } from '@/components/toast';

interface AccountDialogProps {
  open: boolean;
  account: CloudinaryAccountView | null;
  onClose: () => void;
}

interface AccountForm {
  label: string;
  cloudName: string;
  apiKey: string;
  apiSecret: string;
  uploadPreset: string;
  folderPrefix: string;
  priority: string;
  monthlyCreditLimit: string;
  isActive: boolean;
}

const EMPTY_FORM: AccountForm = {
  label: '',
  cloudName: '',
  apiKey: '',
  apiSecret: '',
  uploadPreset: '',
  folderPrefix: '',
  priority: '0',
  monthlyCreditLimit: '25',
  isActive: true,
};

export function AccountDialog({ open, account, onClose }: AccountDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<AccountForm>(EMPTY_FORM);

  useEffect(() => {
    if (!open) {
      return;
    }
    if (account) {
      setForm({
        label: account.label,
        cloudName: account.cloudName,
        apiKey: '',
        apiSecret: '',
        uploadPreset: account.uploadPreset ?? '',
        folderPrefix: account.folderPrefix ?? '',
        priority: String(account.priority ?? 0),
        monthlyCreditLimit: String(account.monthlyCreditLimit ?? 25),
        isActive: account.isActive,
      });
    } else {
      setForm(EMPTY_FORM);
    }
  }, [open, account]);

  const isEditing = account != null;
  const invalid = isEditing
    ? !form.label.trim() || !form.cloudName.trim()
    : !form.label.trim() || !form.cloudName.trim() || !form.apiKey.trim() || !form.apiSecret.trim();

  const save = useMutation({
    mutationFn: () => {
      const payload = {
        label: form.label.trim(),
        cloudName: form.cloudName.trim(),
        apiKey: form.apiKey.trim(),
        apiSecret: form.apiSecret.trim(),
        uploadPreset: form.uploadPreset.trim() || null,
        folderPrefix: form.folderPrefix.trim() || null,
        priority: Number(form.priority) || 0,
        monthlyCreditLimit: Number(form.monthlyCreditLimit) || 25,
        isActive: form.isActive,
      };
      return isEditing
        ? platformApi.updateCloudinaryAccount(account.id, payload)
        : platformApi.createCloudinaryAccount(payload);
    },
    onSuccess: () => {
      toast(isEditing ? 'Cloudinary account updated' : 'Cloudinary account added');
      void queryClient.invalidateQueries({ queryKey: ['sa-cloudinary-accounts'] });
      void queryClient.invalidateQueries({ queryKey: ['sa-cloudinary-summary'] });
      void queryClient.invalidateQueries({ queryKey: ['storage-overview'] });
      onClose();
    },
    onError: (error: Error) => toast(error.message, 'error'),
  });

  const update = <K extends keyof AccountForm>(key: K, value: AccountForm[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  return (
    <Dialog open={open} onClose={save.isPending ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{isEditing ? 'Edit Cloudinary account' : 'Add Cloudinary account'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
            <TextField
              label="Label"
              value={form.label}
              onChange={(event) => update('label', event.target.value)}
              fullWidth
              required
            />
            <TextField
              label="Cloud name"
              value={form.cloudName}
              onChange={(event) => update('cloudName', event.target.value)}
              fullWidth
              required
            />
            <TextField
              label="API key"
              value={form.apiKey}
              onChange={(event) => update('apiKey', event.target.value)}
              fullWidth
              required={!isEditing}
              placeholder={isEditing ? account.apiKeyMasked : ''}
              helperText={isEditing ? 'Leave blank to keep the current key' : ' '}
            />
            <TextField
              label="API secret"
              type="password"
              value={form.apiSecret}
              onChange={(event) => update('apiSecret', event.target.value)}
              fullWidth
              required={!isEditing}
              helperText={isEditing ? 'Leave blank to keep the current secret' : 'Stored encrypted (AES-GCM)'}
            />
            <TextField
              label="Upload preset (optional)"
              value={form.uploadPreset}
              onChange={(event) => update('uploadPreset', event.target.value)}
              fullWidth
            />
            <TextField
              label="Folder prefix (optional)"
              value={form.folderPrefix}
              onChange={(event) => update('folderPrefix', event.target.value)}
              fullWidth
            />
            <TextField
              label="Priority"
              type="number"
              value={form.priority}
              onChange={(event) => update('priority', event.target.value)}
              fullWidth
              helperText="Lower number = preferred"
            />
            <TextField
              label="Monthly credit limit"
              type="number"
              value={form.monthlyCreditLimit}
              onChange={(event) => update('monthlyCreditLimit', event.target.value)}
              fullWidth
              helperText="Free tier = 25 credits / month"
            />
          </Box>
          <Box>
            <FormControlLabel
              control={
                <Switch
                  checked={form.isActive}
                  onChange={(event) => update('isActive', event.target.checked)}
                />
              }
              label="Active (participates in upload allocation)"
            />
            <Typography variant="caption" color="text.secondary" display="block">
              Uploads always prefer the least-used active account.
            </Typography>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={save.isPending}>
          Cancel
        </Button>
        <Button variant="contained" onClick={() => save.mutate()} disabled={invalid || save.isPending}>
          {save.isPending ? 'Saving…' : isEditing ? 'Save changes' : 'Add account'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
