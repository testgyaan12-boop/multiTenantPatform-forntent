import { useEffect, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from '@mui/material';
import { Upload } from 'lucide-react';
import { platformApi } from '@/api';
import { useToast } from '@/components/toast';
import { formatBytes } from './storageUtils';

interface UploadDialogProps {
  open: boolean;
  tenantId: number | null;
  onClose: () => void;
}

export function UploadDialog({ open, tenantId, onClose }: UploadDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    if (!open) {
      setFile(null);
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  }, [open]);

  const upload = useMutation({
    mutationFn: () => platformApi.uploadStorageFile(file as File, tenantId),
    onSuccess: (result) => {
      toast(`${result.name} uploaded`);
      void queryClient.invalidateQueries({ queryKey: ['storage-overview'] });
      void queryClient.invalidateQueries({ queryKey: ['storage-growth'] });
      void queryClient.invalidateQueries({ queryKey: ['storage-recent'] });
      void queryClient.invalidateQueries({ queryKey: ['storage-file-types'] });
      void queryClient.invalidateQueries({ queryKey: ['storage-files'] });
      void queryClient.invalidateQueries({ queryKey: ['sa-cloudinary-accounts'] });
      void queryClient.invalidateQueries({ queryKey: ['sa-cloudinary-summary'] });
      onClose();
    },
    onError: (error: Error) => toast(error.message, 'error'),
  });

  return (
    <Dialog open={open} onClose={upload.isPending ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Upload files</DialogTitle>
      <DialogContent>
        <Stack spacing={2}>
          <Typography variant="body2" color="text.secondary">
            Files are stored on the least-used active Cloudinary account.
            {tenantId == null ? ' No tenant selected — file will be stored as platform media.' : ''}
          </Typography>
          <Box
            onClick={() => inputRef.current?.click()}
            sx={{
              border: '1.5px dashed #C9D2E3',
              borderRadius: 2,
              p: 4,
              textAlign: 'center',
              cursor: 'pointer',
              bgcolor: '#F9FBFE',
              transition: 'border-color 0.15s ease, background-color 0.15s ease',
              '&:hover': { borderColor: '#FF5722', bgcolor: 'rgba(255,87,34,0.03)' },
            }}
          >
            <Upload size={26} color="#FF5722" />
            <Typography variant="body2" fontWeight={600} sx={{ mt: 1 }}>
              {file ? file.name : 'Click to choose a file'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {file ? formatBytes(file.size) : 'PNG, JPG, PDF, MP4 · max 10 MB'}
            </Typography>
          </Box>
          <input
            ref={inputRef}
            type="file"
            hidden
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          />
          {tenantId == null ? (
            <Alert severity="info" sx={{ fontSize: 12.5 }}>
              Tip: choose a tenant from the top bar to attribute this upload to a restaurant.
            </Alert>
          ) : null}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={upload.isPending}>
          Cancel
        </Button>
        <Button
          variant="contained"
          startIcon={<Upload size={16} />}
          onClick={() => upload.mutate()}
          disabled={!file || upload.isPending}
        >
          {upload.isPending ? 'Uploading…' : 'Upload'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
