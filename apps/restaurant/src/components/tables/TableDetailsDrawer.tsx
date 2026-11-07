import { useState } from 'react';
import {
  Box,
  Button,
  Chip,
  Divider,
  Drawer,
  IconButton,
  Tooltip,
  Typography,
} from '@mui/material';
import { QRCodeCanvas } from 'qrcode.react';
import { Armchair, ExternalLink, Pencil, QrCode, Trash2, UtensilsCrossed, X } from 'lucide-react';
import type { DiningTable, Order } from '@resto/types';
import { formatMoney } from '@/format';
import { OrderDetailDialog } from '@/components/dashboard/OrderDetailDialog';
import { publicUrl, statusMeta, timeAgoLabel, exactTime, type DerivedStatus } from './tablesUtils';

interface TableDetailsDrawerProps {
  open: boolean;
  table: DiningTable | null;
  status: DerivedStatus;
  order: Order | undefined;
  branchName: string;
  currency: string;
  canManage: boolean;
  onClose: () => void;
  onEdit: () => void;
  onOpenQr: () => void;
  onDelete: () => void;
}

export function TableDetailsDrawer({
  open,
  table,
  status,
  order,
  branchName,
  currency,
  canManage,
  onClose,
  onEdit,
  onOpenQr,
  onDelete,
}: TableDetailsDrawerProps) {
  const [detailOrderId, setDetailOrderId] = useState<number | null>(null);
  const meta = statusMeta[status];

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
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
                Table {table.tableNumber}
              </Typography>
              <Typography noWrap sx={{ fontSize: 12.5, color: 'text.secondary' }}>
                {table.name?.trim() || branchName}
              </Typography>
            </Box>
            <Chip
              size="small"
              label={meta.label}
              icon={<meta.icon size={13} />}
              sx={{
                height: 26,
                fontSize: 11.5,
                fontWeight: 700,
                bgcolor: meta.bg,
                color: meta.color,
                border: 'none',
                '& .MuiChip-icon': { color: meta.color },
              }}
            />
            <IconButton size="small" aria-label="Close table details" onClick={onClose}>
              <X size={18} />
            </IconButton>
          </Box>

          <Box sx={{ flex: 1, overflowY: 'auto', px: 2.5, py: 2.5, display: 'grid', gap: 2 }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
              <InfoTile icon={<UtensilsCrossed size={15} />} label="Seating capacity">
                {table.capacity} seat{table.capacity === 1 ? '' : 's'}
              </InfoTile>
              <InfoTile icon={<Armchair size={15} />} label="Branch">
                {branchName}
              </InfoTile>
            </Box>

            <Divider />

            <Box>
              <Typography sx={{ fontSize: 13, fontWeight: 700, mb: 1.25 }}>QR code</Typography>
              <Box
                sx={{
                  display: 'flex',
                  gap: 2,
                  alignItems: 'center',
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: '12px',
                  p: 1.75,
                  bgcolor: '#F8F9FB',
                }}
              >
                <QRCodeCanvas
                  value={publicUrl(table)}
                  size={124}
                  marginSize={2}
                  style={{ borderRadius: 8, background: '#ffffff' }}
                />
                <Box sx={{ minWidth: 0, display: 'grid', gap: 1 }}>
                  <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: '#16A36A' }}>
                    QR active
                  </Typography>
                  <Typography sx={{ fontSize: 11.5, color: 'text.secondary' }}>
                    Guests scan it to open this table’s menu and place orders.
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<QrCode size={14} />}
                    onClick={onOpenQr}
                    sx={{ justifySelf: 'start', fontSize: 12.5 }}
                  >
                    Open QR manager
                  </Button>
                </Box>
              </Box>
            </Box>

            <Divider />

            <Box>
              <Typography sx={{ fontSize: 13, fontWeight: 700, mb: 1.25 }}>Active order</Typography>
              {order ? (
                <Box
                  sx={{
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: '12px',
                    p: 1.75,
                    display: 'grid',
                    gap: 1,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                    <Typography sx={{ fontSize: 14, fontWeight: 700 }}>{order.orderNumber}</Typography>
                    <Chip
                      size="small"
                      label={order.status}
                      sx={{
                        height: 22,
                        fontSize: 11,
                        fontWeight: 700,
                        bgcolor: '#FEECEB',
                        color: '#DC2626',
                        border: 'none',
                      }}
                    />
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                    <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>
                      {order.items.reduce((sum, item) => sum + (item.quantity ?? 0), 0)} item
                      {order.items.reduce((sum, item) => sum + (item.quantity ?? 0), 0) === 1 ? '' : 's'} ·{' '}
                      <span title={exactTime(order.placedAt ?? order.createdAt)}>
                        {timeAgoLabel(order.placedAt ?? order.createdAt)}
                      </span>
                    </Typography>
                    <Typography sx={{ fontSize: 15, fontWeight: 800 }}>
                      {formatMoney(order.grandTotal, order.currency || currency)}
                    </Typography>
                  </Box>
                  <Button
                    size="small"
                    variant="outlined"
                    endIcon={<ExternalLink size={13} />}
                    onClick={() => setDetailOrderId(order.id)}
                    sx={{ justifySelf: 'start', fontSize: 12.5 }}
                  >
                    View order
                  </Button>
                </Box>
              ) : (
                <Box
                  sx={{
                    border: '1px dashed',
                    borderColor: 'divider',
                    borderRadius: '12px',
                    p: 2,
                    textAlign: 'center',
                  }}
                >
                  <Typography sx={{ fontSize: 13, fontWeight: 600 }}>No active order</Typography>
                  <Typography sx={{ fontSize: 12, color: 'text.secondary', mt: 0.25 }}>
                    This table is {meta.label.toLowerCase()} and free to use.
                  </Typography>
                </Box>
              )}
            </Box>

            <Box
              sx={{
                display: 'flex',
                gap: 1,
                flexWrap: 'wrap',
                pt: 0.5,
                borderTop: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Button
                variant="contained"
                startIcon={<Pencil size={15} />}
                disabled={!canManage}
                onClick={onEdit}
                sx={{ fontSize: 13 }}
              >
                Edit table
              </Button>
              <Tooltip title={canManage ? 'Delete this table' : 'You do not have access'}>
                <span>
                  <Button
                    color="error"
                    variant="outlined"
                    startIcon={<Trash2 size={15} />}
                    disabled={!canManage}
                    onClick={onDelete}
                    sx={{ fontSize: 13 }}
                  >
                    Delete
                  </Button>
                </span>
              </Tooltip>
            </Box>
          </Box>

          <OrderDetailDialog orderId={detailOrderId} onClose={() => setDetailOrderId(null)} />
        </Box>
      ) : null}
    </Drawer>
  );
}

function InfoTile({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Box
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: '12px',
        px: 1.5,
        py: 1.25,
        display: 'grid',
        gap: 0.25,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, color: 'text.secondary' }}>
        {icon}
        <Typography sx={{ fontSize: 11.5, fontWeight: 600 }}>{label}</Typography>
      </Box>
      <Typography sx={{ fontSize: 14, fontWeight: 700 }}>{children}</Typography>
    </Box>
  );
}
