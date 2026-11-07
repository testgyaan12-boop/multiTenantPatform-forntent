import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Drawer,
  IconButton,
  Paper,
  Typography,
} from '@mui/material';
import { CheckCircle2, Clock, Receipt, User, Utensils, X } from 'lucide-react';
import type { Order, OrderTimelineEntry } from '@resto/types';
import { useRestaurant } from '@/context/RestaurantContext';
import { formatMoney } from '@/format';
import {
  canCancel,
  exactTime,
  metaFor,
  nextStatus,
  nextStatusLabel,
  orderTypeMeta,
  timeAgo,
} from './orderUtils';

interface OrderDetailsDrawerProps {
  order: Order | null;
  timeline: OrderTimelineEntry[] | undefined;
  isLoading: boolean;
  isAdvancing: boolean;
  canManage: boolean;
  onClose: () => void;
  onAdvance: (order: Order) => void;
  onCancel: (order: Order) => void;
}

function TimelineEvent({ entry, isLast }: { entry: OrderTimelineEntry; isLast: boolean }) {
  const to = metaFor(entry.toStatus);
  return (
    <Box sx={{ display: 'flex', gap: 1.5, position: 'relative', pb: isLast ? 0 : 1.75 }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
        <Box
          sx={{
            width: 24,
            height: 24,
            borderRadius: '50%',
            bgcolor: to.bg,
            color: to.color,
            display: 'grid',
            placeItems: 'center',
            zIndex: 1,
          }}
        >
          {entry.toStatus === 'CANCELLED' ? <X size={13} /> : <CheckCircle2 size={13} />}
        </Box>
        {!isLast ? (
          <Box sx={{ flex: 1, width: 2, bgcolor: 'divider', mt: 0.5, minHeight: 14 }} />
        ) : null}
      </Box>
      <Box sx={{ minWidth: 0, pb: 0.25 }}>
        <Typography sx={{ fontSize: 13, fontWeight: 700 }}>
          {entry.fromStatus ? `${metaFor(entry.fromStatus).label} → ` : ''}
          {to.label}
        </Typography>
        <Typography sx={{ fontSize: 11.5, color: 'text.secondary' }}>
          {exactTime(entry.changedAt)}
          {entry.changedBy ? ` · ${entry.changedBy}` : ''}
        </Typography>
      </Box>
    </Box>
  );
}

export function OrderDetailsDrawer({
  order,
  timeline,
  isLoading,
  isAdvancing,
  canManage,
  onClose,
  onAdvance,
  onCancel,
}: OrderDetailsDrawerProps) {
  const { profile, activeBranch } = useRestaurant();
  const currency = order?.currency || profile?.currency || 'INR';
  const type = order ? orderTypeMeta(order.source) : null;
  const next = order ? nextStatus[order.status] : null;

  return (
    <Drawer
      anchor="right"
      open={order !== null}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: {
            width: { xs: '100vw', sm: 480 },
            borderLeft: { sm: '1px solid' },
            borderLeftColor: { sm: 'divider' },
            backgroundImage: 'none',
          },
        },
      }}
    >
      {order ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <Box
            sx={{
              px: 2.5,
              py: 2,
              display: 'flex',
              alignItems: 'flex-start',
              gap: 1.5,
              borderBottom: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Typography sx={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.01em' }}>
                  {order.orderNumber}
                </Typography>
                <Chip
                  size="small"
                  label={metaFor(order.status).label}
                  sx={{
                    bgcolor: metaFor(order.status).bg,
                    color: metaFor(order.status).color,
                    fontWeight: 700,
                    border: 'none',
                  }}
                />
                <Chip
                  size="small"
                  label={order.paymentStatus}
                  sx={{
                    fontWeight: 700,
                    border: 'none',
                    bgcolor: order.paymentStatus === 'PAID' ? '#E7F8F0' : '#FFF4E5',
                    color: order.paymentStatus === 'PAID' ? '#16A36A' : '#F4511E',
                  }}
                />
              </Box>
              <Typography sx={{ fontSize: 12.5, color: 'text.secondary', mt: 0.5, display: 'flex', gap: 1 }}>
                <span>{type?.label}</span>
                <span>·</span>
                <span>{order.tableNumber ?? activeBranch?.name ?? '—'}</span>
                <span>·</span>
                <span title={exactTime(order.placedAt ?? order.createdAt)}>
                  {timeAgo(order.placedAt ?? order.createdAt)}
                </span>
              </Typography>
            </Box>
            <IconButton size="small" aria-label="Close order details" onClick={onClose}>
              <X size={18} />
            </IconButton>
          </Box>

          <Box sx={{ flex: 1, overflowY: 'auto', px: 2.5, py: 2, display: 'grid', gap: 2 }}>
            <Box>
              <SectionTitle icon={<User size={14} />} title="Customer" />
              <Paper variant="outlined" sx={{ p: 1.75, borderRadius: '12px', bgcolor: '#F8F9FB', border: 'none' }}>
                <Typography sx={{ fontSize: 14, fontWeight: 700 }}>
                  {order.customerName ?? 'Guest'}
                </Typography>
                <Typography sx={{ fontSize: 12.5, color: 'text.secondary', mt: 0.25 }}>
                  {order.customerPhone ?? 'No phone number'}
                </Typography>
                {order.notes ? (
                  <Typography sx={{ fontSize: 12.5, color: 'text.secondary', mt: 1, fontStyle: 'italic' }}>
                    “{order.notes}”
                  </Typography>
                ) : null}
              </Paper>
            </Box>

            <Box>
              <SectionTitle icon={<Utensils size={14} />} title={`Items (${order.items.length})`} />
              <Paper variant="outlined" sx={{ p: 1.75, borderRadius: '12px', bgcolor: '#F8F9FB', border: 'none' }}>
                <Box sx={{ display: 'grid', gap: 1.25 }}>
                  {order.items.map((item) => (
                    <Box key={item.id}>
                      <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'baseline' }}>
                        <Typography sx={{ fontSize: 13, fontWeight: 700, minWidth: 24 }}>
                          {item.quantity}×
                        </Typography>
                        <Typography sx={{ fontSize: 13.5, fontWeight: 600, flex: 1, minWidth: 0 }}>
                          {item.name}
                        </Typography>
                        <Typography sx={{ fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap' }}>
                          {formatMoney(item.lineTotal, currency)}
                        </Typography>
                      </Box>
                      {item.modifiers && item.modifiers.length > 0 ? (
                        <Typography sx={{ fontSize: 12, color: 'text.secondary', pl: '39px', mt: 0.25 }}>
                          {item.modifiers
                            .map((modifier) =>
                              modifier.priceDelta
                                ? `${modifier.name} (+${formatMoney(modifier.priceDelta, currency)})`
                                : modifier.name,
                            )
                            .join(', ')}
                        </Typography>
                      ) : null}
                      {item.notes ? (
                        <Typography sx={{ fontSize: 12, color: 'text.secondary', pl: '39px', fontStyle: 'italic' }}>
                          {item.notes}
                        </Typography>
                      ) : null}
                    </Box>
                  ))}
                </Box>
              </Paper>
            </Box>

            <Box>
              <SectionTitle icon={<Receipt size={14} />} title="Bill summary" />
              <Paper variant="outlined" sx={{ p: 1.75, borderRadius: '12px', bgcolor: '#F8F9FB', border: 'none' }}>
                <BillRow label="Subtotal" value={formatMoney(order.subtotal, currency)} />
                {order.discountTotal ? (
                  <BillRow
                    label="Discount"
                    value={`-${formatMoney(order.discountTotal, currency)}`}
                    highlight="#16A36A"
                  />
                ) : null}
                <BillRow label="Tax" value={formatMoney(order.taxTotal, currency)} />
                <BillRow label="Service charge" value={formatMoney(order.serviceCharge, currency)} />
                <Divider sx={{ my: 1 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <Typography sx={{ fontSize: 14, fontWeight: 800 }}>Grand total</Typography>
                  <Typography sx={{ fontSize: 17, fontWeight: 800, letterSpacing: '-0.02em' }}>
                    {formatMoney(order.grandTotal, currency)}
                  </Typography>
                </Box>
              </Paper>
            </Box>

            <Box>
              <SectionTitle icon={<Clock size={14} />} title="Timeline" />
              <Paper variant="outlined" sx={{ p: 1.75, borderRadius: '12px', bgcolor: '#F8F9FB', border: 'none' }}>
                {isLoading ? (
                  <Box sx={{ display: 'grid', placeItems: 'center', py: 2 }}>
                    <CircularProgress size={22} />
                  </Box>
                ) : timeline && timeline.length > 0 ? (
                  timeline.map((entry, index) => (
                    <TimelineEvent
                      key={`${entry.toStatus}-${entry.changedAt}-${index}`}
                      entry={entry}
                      isLast={index === timeline.length - 1}
                    />
                  ))
                ) : (
                  <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>
                    No status history for this order yet.
                  </Typography>
                )}
              </Paper>
            </Box>
          </Box>

          <Box
            sx={{
              px: 2.5,
              py: 2,
              borderTop: '1px solid',
              borderColor: 'divider',
              display: 'flex',
              gap: 1,
              flexWrap: 'wrap',
              bgcolor: '#ffffff',
            }}
          >
            {canManage && next ? (
              <Button
                variant="contained"
                disabled={isAdvancing}
                startIcon={isAdvancing ? <CircularProgress size={15} color="inherit" /> : undefined}
                onClick={() => onAdvance(order)}
                sx={{ flex: 1, minWidth: 160, py: 0.9 }}
              >
                {nextStatusLabel[order.status] ?? `Mark ${next.toLowerCase()}`}
              </Button>
            ) : null}
            {canManage && canCancel[order.status] ? (
              <Button
                color="error"
                variant="outlined"
                disabled={isAdvancing}
                onClick={() => onCancel(order)}
                sx={{ py: 0.9, px: 2 }}
              >
                Cancel order
              </Button>
            ) : null}
            {!canManage ? (
              <Typography sx={{ fontSize: 12.5, color: 'text.secondary', width: '100%' }}>
                You don’t have permission to change order status.
              </Typography>
            ) : null}
            {!next && canManage && !canCancel[order.status] ? (
              <Typography sx={{ fontSize: 12.5, color: 'text.secondary', width: '100%' }}>
                This order is {metaFor(order.status).label.toLowerCase()} — no further actions available.
              </Typography>
            ) : null}
          </Box>
        </Box>
      ) : null}
    </Drawer>
  );
}

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1 }}>
      <Box sx={{ color: 'text.secondary', display: 'grid', placeItems: 'center' }}>{icon}</Box>
      <Typography sx={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'text.secondary' }}>
        {title}
      </Typography>
    </Box>
  );
}

function BillRow({ label, value, highlight }: { label: string; value: string; highlight?: string }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
      <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>{label}</Typography>
      <Typography sx={{ fontSize: 13, fontWeight: 600, color: highlight ?? 'text.primary' }}>{value}</Typography>
    </Box>
  );
}
