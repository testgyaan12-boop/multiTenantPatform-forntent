import { useMemo, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  IconButton,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import { ArrowRight, Eye, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ErrorState } from '@resto/ui';
import type { OrderStatus } from '@resto/types';
import { useRestaurant } from '@/context/RestaurantContext';
import { formatMoney } from '@/format';
import { bucketStatuses, useAdvanceOrder, useLiveOrders } from '@/hooks/useDashboardData';
import { OrderDetailDialog } from './OrderDetailDialog';
import { StatusBadge } from './StatusBadge';

const nextStatus: Record<string, OrderStatus | null> = {
  PLACED: 'CONFIRMED',
  CONFIRMED: 'PREPARING',
  PREPARING: 'READY',
  READY: 'SERVED',
  SERVED: 'COMPLETED',
};

function timeAgo(value: string | null | undefined): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  const minutes = Math.max(0, Math.round((Date.now() - date.getTime()) / 60_000));
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return date.toLocaleDateString();
}

function CountBlock({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <Box
      sx={{
        flex: 1,
        minWidth: 0,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: '12px',
        px: 1.5,
        py: 1,
        bgcolor: 'background.paper',
      }}
    >
      <Typography sx={{ fontSize: 11, fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.4 }}>
        {label}
      </Typography>
      <Typography sx={{ fontSize: 22, fontWeight: 700, lineHeight: 1.2, color }}>{count}</Typography>
    </Box>
  );
}

export function LiveOrdersCard() {
  const { profile, activeBranchId } = useRestaurant();
  const liveOrders = useLiveOrders();
  const advance = useAdvanceOrder();
  const navigate = useNavigate();
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);

  const orders = useMemo(() => liveOrders.data?.content ?? [], [liveOrders.data]);
  const buckets = useMemo(() => bucketStatuses(orders), [orders]);
  const currency = profile?.currency ?? 'INR';

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardHeader
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#F4511E' }} />
            <Typography variant="h4">Live orders</Typography>
            <Chip size="small" label="Auto-refresh 15s" variant="outlined" sx={{ ml: 0.5 }} />
          </Box>
        }
        action={
          <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
            <Tooltip title="Refresh now">
              <IconButton size="small" aria-label="Refresh orders" onClick={() => void liveOrders.refetch()}>
                <RefreshCw size={16} />
              </IconButton>
            </Tooltip>
            <Button
              size="small"
              endIcon={<ArrowRight size={15} />}
              onClick={() => navigate('/orders')}
            >
              View all
            </Button>
          </Box>
        }
        sx={{ pb: 1.5, pt: 2.5, px: 2.5, '& .MuiCardHeader-action': { m: 0 } }}
      />
      <CardContent sx={{ pt: 0, px: 2.5, pb: 2.5, flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <CountBlock label="New" count={buckets.new} color="#2563EB" />
          <CountBlock label="Preparing" count={buckets.preparing} color="#D9481E" />
          <CountBlock label="Ready" count={buckets.ready} color="#1E7B3C" />
          <CountBlock label="Completed" count={buckets.completed} color="#475467" />
        </Box>

        {liveOrders.isPending ? (
          <Box sx={{ display: 'grid', gap: 1 }}>
            {[0, 1, 2].map((row) => (
              <Skeleton key={row} height={44} />
            ))}
          </Box>
        ) : null}

        {liveOrders.isError ? (
          <ErrorState
            message={liveOrders.error.message}
            onRetry={() => void liveOrders.refetch()}
          />
        ) : null}

        {liveOrders.data && orders.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4, px: 2 }}>
            <Typography sx={{ fontSize: 14, fontWeight: 600 }}>No orders yet</Typography>
            <Typography sx={{ fontSize: 13, color: 'text.secondary', mt: 0.5 }}>
              New orders for this branch will appear here in real time.
            </Typography>
          </Box>
        ) : null}

        {orders.length > 0 ? (
          <TableContainer sx={{ mx: -1.25 }}>
            <Table size="small" aria-label="Live orders">
              <TableHead>
                <TableRow>
                  <TableCell>Order</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Table</TableCell>
                  <TableCell align="center">Items</TableCell>
                  <TableCell align="right">Total</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Placed</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {orders.slice(0, 8).map((order) => {
                  const next = nextStatus[order.status];
                  return (
                    <TableRow
                      key={order.id}
                      hover
                      onClick={() => setSelectedOrderId(order.id)}
                      sx={{ cursor: 'pointer' }}
                    >
                      <TableCell>
                        <Typography sx={{ fontSize: 13, fontWeight: 700 }}>{order.orderNumber}</Typography>
                        <Typography sx={{ fontSize: 11.5, color: 'text.secondary' }}>
                          {order.customerName ?? 'Guest'}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ fontSize: 13 }}>
                        {order.source === 'PICKUP' ? 'Pickup' : order.source ? 'Dine-in' : '—'}
                      </TableCell>
                      <TableCell sx={{ fontSize: 13 }}>{order.tableNumber ?? '—'}</TableCell>
                      <TableCell align="center" sx={{ fontSize: 13 }}>{order.items.length}</TableCell>
                      <TableCell align="right" sx={{ fontSize: 13, fontWeight: 600 }}>
                        {formatMoney(order.grandTotal, order.currency || currency)}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={order.status} />
                      </TableCell>
                      <TableCell sx={{ fontSize: 12.5, color: 'text.secondary', whiteSpace: 'nowrap' }}>
                        {timeAgo(order.placedAt ?? order.createdAt)}
                      </TableCell>
                      <TableCell align="right" onClick={(event) => event.stopPropagation()}>
                        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                          <Tooltip title="Order details">
                            <IconButton
                              size="small"
                              aria-label={`View order ${order.orderNumber}`}
                              onClick={() => setSelectedOrderId(order.id)}
                            >
                              <Eye size={15} />
                            </IconButton>
                          </Tooltip>
                          {next ? (
                            <Button
                              size="small"
                              variant="outlined"
                              sx={{ minHeight: 28, fontSize: 12, px: 1 }}
                              disabled={advance.isPending}
                              onClick={() => advance.mutate({ order, next })}
                            >
                              Mark {next.toLowerCase()}
                            </Button>
                          ) : null}
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        ) : null}

        {activeBranchId === null ? (
          <Typography sx={{ fontSize: 13, color: 'text.secondary', textAlign: 'center', py: 3 }}>
            Select a branch to see its orders.
          </Typography>
        ) : null}
      </CardContent>

      <OrderDetailDialog orderId={selectedOrderId} onClose={() => setSelectedOrderId(null)} />
    </Card>
  );
}
