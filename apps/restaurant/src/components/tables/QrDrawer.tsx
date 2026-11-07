import { useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Drawer,
  IconButton,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { QRCodeCanvas } from 'qrcode.react';
import { Check, Copy, Download, Printer, RefreshCw, X } from 'lucide-react';
import type { DiningTable } from '@resto/types';
import { ConfirmDialog } from '@resto/ui';
import { downloadCanvasPng, publicUrl, qrFilename } from './tablesUtils';

interface QrDrawerProps {
  open: boolean;
  table: DiningTable | null;
  restaurantName: string;
  branchName: string;
  isRegenerating: boolean;
  onClose: () => void;
  onRegenerate: () => Promise<void>;
  onDownload: () => void;
  onPrint: () => void;
  notify: (severity: 'success' | 'error', message: string) => void;
}

export function QrDrawer({
  open,
  table,
  restaurantName,
  branchName,
  isRegenerating,
  onClose,
  onRegenerate,
  onDownload,
  onPrint,
  notify,
}: QrDrawerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);
  const [confirmRotate, setConfirmRotate] = useState(false);

  const url = table ? publicUrl(table) : '';

  const handleCopy = async () => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      notify('success', 'QR link copied to clipboard.');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      notify('error', 'Could not copy the link — select it and copy manually.');
    }
  };

  const handleDownload = () => {
    if (canvasRef.current && table) {
      downloadCanvasPng(canvasRef.current, qrFilename(table));
      notify('success', `QR code for table ${table.tableNumber} downloaded.`);
      return;
    }
    onDownload();
  };

  const handleRegenerateConfirm = async () => {
    setConfirmRotate(false);
    try {
      await onRegenerate();
      notify('success', 'QR code regenerated. The previous QR code no longer works.');
    } catch (error) {
      notify(
        'error',
        error instanceof Error && error.message ? error.message : 'Failed to regenerate the QR code.',
      );
    }
  };

  return (
    <>
      <Drawer
        anchor="right"
        open={open}
        onClose={isRegenerating ? undefined : onClose}
        slotProps={{
          paper: {
            sx: {
              width: { xs: '100vw', sm: 440 },
              borderLeft: { sm: '1px solid' },
              borderLeftColor: { sm: 'divider' },
              backgroundImage: 'none',
            },
          },
        }}
      >
        {table ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <Box
              sx={{
                px: 2.5,
                py: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                borderBottom: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography sx={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.01em' }}>
                  Table {table.tableNumber} QR
                </Typography>
                <Typography noWrap sx={{ fontSize: 12.5, color: 'text.secondary' }}>
                  {restaurantName} · {branchName}
                </Typography>
              </Box>
              <IconButton size="small" aria-label="Close QR manager" onClick={onClose} disabled={isRegenerating}>
                <X size={18} />
              </IconButton>
            </Box>

            <Box sx={{ flex: 1, overflowY: 'auto', px: 2.5, py: 2.5, display: 'grid', gap: 2 }}>
              <Box
                sx={{
                  display: 'grid',
                  justifyItems: 'center',
                  gap: 1.25,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: '14px',
                  py: 2.5,
                  px: 2,
                  bgcolor: '#F8F9FB',
                }}
              >
                <QRCodeCanvas
                  ref={canvasRef}
                  value={url}
                  size={220}
                  marginSize={4}
                  style={{ background: '#ffffff', borderRadius: 12 }}
                />
                <Chip
                  size="small"
                  label="Active"
                  sx={{
                    height: 22,
                    fontSize: 11,
                    fontWeight: 700,
                    bgcolor: '#E7F8F0',
                    color: '#16A36A',
                    border: 'none',
                  }}
                />
                <Typography sx={{ fontSize: 12, color: 'text.secondary', textAlign: 'center' }}>
                  Place this code on the table. Guests scan it to open the menu for table{' '}
                  {table.tableNumber}.
                </Typography>
              </Box>

              <Box>
                <Typography sx={{ fontSize: 13, fontWeight: 700, mb: 1 }}>Menu link</Typography>
                <TextField
                  value={url}
                  size="small"
                  fullWidth
                  inputProps={{
                    'aria-label': 'Table menu link',
                    style: { fontSize: 12.5, fontFamily: 'monospace' },
                  }}
                  InputProps={{
                    readOnly: true,
                    endAdornment: (
                      <Tooltip title={copied ? 'Copied' : 'Copy link'}>
                        <IconButton size="small" aria-label="Copy link" onClick={() => void handleCopy()}>
                          {copied ? <Check size={16} color="#16A36A" /> : <Copy size={16} />}
                        </IconButton>
                      </Tooltip>
                    ),
                  }}
                />
              </Box>

              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.25 }}>
                <Button
                  variant="outlined"
                  startIcon={<Download size={15} />}
                  onClick={handleDownload}
                  sx={{ py: 0.9, fontSize: 13 }}
                >
                  Download PNG
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Printer size={15} />}
                  onClick={onPrint}
                  sx={{ py: 0.9, fontSize: 13 }}
                >
                  Print
                </Button>
                <Button
                  color="error"
                  variant="outlined"
                  fullWidth
                  startIcon={
                    isRegenerating ? (
                      <CircularProgress size={15} color="inherit" />
                    ) : (
                      <RefreshCw size={15} />
                    )
                  }
                  disabled={isRegenerating}
                  onClick={() => setConfirmRotate(true)}
                  sx={{ py: 0.9, fontSize: 13, gridColumn: '1 / -1' }}
                >
                  {isRegenerating ? 'Regenerating…' : 'Regenerate QR code'}
                </Button>
              </Box>

              <Divider />

              <Alert severity="info" variant="outlined" sx={{ borderRadius: '10px', fontSize: 12.5 }}>
                Regenerating creates a brand-new QR code. The previous QR code stops working
                immediately, so replace the printed copy on the table.
              </Alert>
            </Box>
          </Box>
        ) : null}
      </Drawer>

      <ConfirmDialog
        open={confirmRotate}
        title="Regenerate QR code?"
        description={`A new QR code will be generated for table ${table?.tableNumber ?? ''}. The current QR code and link will stop working.`}
        confirmLabel="Regenerate"
        destructive
        loading={isRegenerating}
        onConfirm={() => void handleRegenerateConfirm()}
        onCancel={() => setConfirmRotate(false)}
      />
    </>
  );
}
