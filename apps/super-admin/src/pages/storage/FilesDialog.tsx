import { useEffect, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  InputAdornment,
  Skeleton,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { File, FileText, Film, Image as ImageIcon, Search } from 'lucide-react';
import { platformApi } from '@/api';
import type { StorageFileCategory, StorageFileView } from '@/api';
import { formatBytes, formatDateTime } from './storageUtils';

interface FilesDialogProps {
  open: boolean;
  tenantId: number | null;
  initialType?: StorageFileCategory | 'ALL';
  onClose: () => void;
}

const TYPE_OPTIONS: { value: StorageFileCategory | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'IMAGE', label: 'Images' },
  { value: 'DOCUMENT', label: 'Documents' },
  { value: 'VIDEO', label: 'Videos' },
  { value: 'OTHER', label: 'Other' },
];

function categoryIcon(category: StorageFileCategory) {
  switch (category) {
    case 'IMAGE':
      return <ImageIcon size={18} />;
    case 'DOCUMENT':
      return <FileText size={18} />;
    case 'VIDEO':
      return <Film size={18} />;
    default:
      return <File size={18} />;
  }
}

function categoryColor(category: StorageFileCategory): string {
  switch (category) {
    case 'IMAGE':
      return '#FF5722';
    case 'DOCUMENT':
      return '#2563EB';
    case 'VIDEO':
      return '#7C3AED';
    default:
      return '#8A93A6';
  }
}

function Thumb({ file }: { file: StorageFileView }) {
  const isImage = file.category === 'IMAGE' && file.publicUrl;
  if (isImage) {
    return (
      <Avatar variant="rounded" src={file.publicUrl ?? undefined} sx={{ width: 40, height: 40, bgcolor: '#F1F4FA' }} />
    );
  }
  return (
    <Avatar
      variant="rounded"
      sx={{ width: 40, height: 40, bgcolor: `${categoryColor(file.category)}18`, color: categoryColor(file.category) }}
    >
      {categoryIcon(file.category)}
    </Avatar>
  );
}

export function FilesDialog({ open, tenantId, initialType = 'ALL', onClose }: FilesDialogProps) {
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [type, setType] = useState<StorageFileCategory | 'ALL'>(initialType);

  useEffect(() => {
    if (open) {
      setPage(0);
      setSearch('');
      setType(initialType);
    }
  }, [open, initialType]);

  const files = useQuery({
    queryKey: ['storage-files', tenantId, page, search, type],
    queryFn: () =>
      platformApi.storageFiles({
        tenantId,
        page,
        size: 8,
        search: search.trim() || undefined,
        type: type === 'ALL' ? undefined : type,
      }),
    enabled: open,
    placeholderData: keepPreviousData,
  });

  const data = files.data;
  const totalPages = data?.totalPages ?? 0;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Manage files</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 0.5 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }}>
            <TextField
              size="small"
              fullWidth
              placeholder="Search files by name…"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(0);
              }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search size={16} color="#5A6478" />
                    </InputAdornment>
                  ),
                },
              }}
            />
            <ToggleButtonGroup
              size="small"
              exclusive
              value={type}
              onChange={(_event, value: StorageFileCategory | 'ALL' | null) => {
                if (value) {
                  setType(value);
                  setPage(0);
                }
              }}
              sx={{ flexShrink: 0, '& .MuiToggleButton-root': { px: 1.5, py: 0.5, fontSize: 12, textTransform: 'none' } }}
            >
              {TYPE_OPTIONS.map((option) => (
                <ToggleButton key={option.value} value={option.value}>
                  {option.label}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Stack>

          {files.isError ? (
            <Alert severity="error">{files.error.message}</Alert>
          ) : files.isPending ? (
            <Stack spacing={1}>
              {[0, 1, 2, 3, 4].map((key) => (
                <Skeleton key={key} variant="rounded" height={56} />
              ))}
            </Stack>
          ) : (data?.content ?? []).length === 0 ? (
            <Box sx={{ py: 6, textAlign: 'center' }}>
              <Typography variant="subtitle1" fontWeight={600}>
                No files found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Upload media or adjust the filters to see results.
              </Typography>
            </Box>
          ) : (
            <Box sx={{ border: '1px solid #E4E9F2', borderRadius: 2, overflow: 'hidden' }}>
              {(data?.content ?? []).map((file, index) => (
                <Box key={file.id || `${file.name}-${index}`}>
                  {index > 0 ? <Divider /> : null}
                  <Stack direction="row" spacing={1.5} alignItems="center" sx={{ px: 2, py: 1.25 }}>
                    <Thumb file={file} />
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography variant="body2" fontWeight={600} noWrap>
                        {file.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatBytes(file.sizeBytes)} · {formatDateTime(file.createdAt)}
                        {file.tenantId != null ? ` · tenant #${file.tenantId}` : ''}
                      </Typography>
                    </Box>
                    <Chip
                      size="small"
                      label={file.provider === 'CLOUDINARY' ? 'Cloudinary' : 'Local'}
                      variant="outlined"
                      sx={{ height: 22, fontSize: 11 }}
                    />
                  </Stack>
                </Box>
              ))}
            </Box>
          )}

          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="caption" color="text.secondary">
              {data ? `${data.totalElements} file(s) · page ${totalPages === 0 ? 0 : page + 1} of ${totalPages}` : ''}
            </Typography>
            <Stack direction="row" spacing={1}>
              <Button size="small" disabled={page <= 0 || files.isFetching} onClick={() => setPage((p) => Math.max(0, p - 1))}>
                Previous
              </Button>
              <Button
                size="small"
                disabled={page + 1 >= totalPages || files.isFetching}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </Stack>
          </Stack>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
