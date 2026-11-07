import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import type { Order, OrderStatus } from '@resto/types';
import { orderApi } from '@/api';
import { formatDateTime, formatMoney } from '@/format';
import { useAdvanceOrder } from '@/hooks/useDashboardData';
import { StatusBadge } from './StatusBadge';

const nextStatus: Record<string, OrderStatus | null> = {
  PLACED: 'CONFIRMED',
  CONFIRMED: 'PREPARING',
  PREPARING: 'READY',
  READY: 'SERVED',
  SERVED: 'COMPLETED',
};

interface OrderDetailDialogProps {
  orderId: number | null;
  onClose: () => void;
}

export function OrderDetailDialog({ orderId, onClose }: OrderDetailDialogProps) {
  const advance = useAdvanceOrder();

  const order = useQuery({
    queryKey: ['order-detail', orderId],
    enabled: orderId !== null,
    queryFn: () => orderApi.get(orderId as number),
  });

  const data: Order | undefined = order.data;
  const next = data ? nextStatus[data.status] : null;

  return (
    <Dialog open={orderId !== null} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
        <Box>
          <Typography variant="h4">{data ? data.orderNumber : 'Order details'}</Typography>
          {data ? (
            <Typography sx={{ fontSize: 12.5, color: 'text.secondary', mt: 0.25 }}>
              {data.source === 'PICKUP' ? 'Pickup' : 'Dine-in'}
              {data.tableNumber ? ` · Table ${data.tableNumber}` : ''} · {formatDateTime(data.placedAt ?? data.createdAt)}
            </Typography>
          ) : null}
        </Box>
        {data ? <StatusBadge status={data.status} /> : null}
      </DialogTitle>
      <DialogContent dividers>
        {order.isPending ? (
          <Box sx={{ display: 'grid', gap: 1 }}>
            <Skeleton height={28} />
            <Skeleton height={28} />
            <Skeleton height={28} />
          </Box>
        ) : null}
        {order.isError ? (
          <Typography sx={{ color: 'error.main' }}>Could not load this order.</Typography>
        ) : null}
        {data ? (
          <>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(4, 1fr)' }, gap: 1.5, mb: 2 }}>
              <Box>
                <Typography sx={{ fontSize: 11, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.5 }}>Customer</Typography>
                <Typography sx={{ fontSize: 13.5, fontWeight: 600 }}>{data.customerName ?? 'Guest'}</Typography>
              </Box>
              <Box>
                <Typography sx={{ fontSize: 11, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.5 }}>Payment</Typography>
                <Typography sx={{ fontSize: 13.5, fontWeight: 600 }}>{data.paymentStatus}</Typography>
              </Box>
              <Box>
                <Typography sx={{ fontSize: 11, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.5 }}>Table</Typography>
                <Typography sx={{ fontSize: 13.5, fontWeight: 600 }}>{data.tableNumber ?? '—'}</Typography>
              </Box>
              <Box>
                <Typography sx={{ fontSize: 11, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.5 }}>Items</Typography>
                <Typography sx={{ fontSize: 13.5, fontWeight: 600 }}>{data.items.length}</Typography>
              </Box>
            </Box>

            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Item</TableCell>
                  <TableCell align="center">Qty</TableCell>
                  <TableCell align="right">Line total</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      {item.name}
                      {item.notes ? (
                        <Typography sx={{ fontSize: 11.5, color: 'text.secondary' }}>{item.notes}</Typography>
                      ) : null}
                    </TableCell>
                    <TableCell align="center">{item.quantity}</TableCell>
                    <TableCell align="right">{formatMoney(item.lineTotal, data.currency)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <Divider sx={{ my: 1.5 }} />
            <Box sx={{ display: 'grid', gap: 0.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>Subtotal</Typography>
                <Typography sx={{ fontSize: 13 }}>{formatMoney(data.subtotal, data.currency)}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>Tax</Typography>
                <Typography sx={{ fontSize: 13 }}>{formatMoney(data.taxTotal, data.currency)}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>Service charge</Typography>
                <Typography sx={{ fontSize: 13 }}>{formatMoney(data.serviceCharge, data.currency)}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                <Typography sx={{ fontSize: 15, fontWeight: 700 }}>Grand total</Typography>
                <Typography sx={{ fontSize: 15, fontWeight: 700, color: 'primary.main' }}>
                  {formatMoney(data.grandTotal, data.currency)}
                </Typography>
              </Box>
            </Box>
            {data.notes ? (
              <Box sx={{ mt: 1.5, p: 1.25, bgcolor: 'background.default', borderRadius: '10px' }}>
                <Typography sx={{ fontSize: 11, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.5 }}>Notes</Typography>
                <Typography sx={{ fontSize: 13 }}>{data.notes}</Typography>
              </Box>
            ) : null}
          </>
        ) : null}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        <Button onClick={onClose} color="inherit">
          Close
        </Button>
        {data && next ? (
          <Button
            variant="contained"
            disabled={advance.isPending}
            onClick={() =>
              advance.mutate(
                { order: data, next },
                { onSuccess: () => void order.refetch() },
              )
            }
          >
            Mark {next.toLowerCase()}
          </Button>
        ) : null}
      </DialogActions>
    </Dialog>
  );
}
