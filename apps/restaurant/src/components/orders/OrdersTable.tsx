import { useState } from 'react';
import {
  Box,
  Button,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import { ShoppingBag, Utensils, UtensilsCrossed } from 'lucide-react';
import { EmptyState, ErrorState } from '@resto/ui';
import type { Order } from '@resto/types';
import { useRestaurant } from '@/context/RestaurantContext';
import { formatMoney } from '@/format';
import { canCancel, exactTime, metaFor, nextStatus, nextStatusLabel, orderTypeMeta, timeAgo } from './orderUtils';

interface OrdersTableProps {
  orders: Order[];
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
  onRetry: () => void;
  totalCount: number;
  page: number;
  rowsPerPage: number;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (size: number) => void;
  onSelectOrder: (order: Order) => void;
  onAdvance: (order: Order) => void;
  onCancelOrder: (order: Order) => void;
  newOrderIds: Set<number>;
  isAdvancing: boolean;
  canManage: boolean;
}

function TypeIcon({ source, size = 15 }: { source?: string | null; size?: number }) {
  const meta = orderTypeMeta(source);
  if (meta.kind === 'dinein') return <Utensils size={size} color="#3B82F6" />;
  if (meta.kind === 'takeaway') return <ShoppingBag size={size} color="#F59E0B" />;
  return <UtensilsCrossed size={size} color="#718096" />;
}

export function OrdersTable({
  orders,
  isLoading,
  isError,
  errorMessage,
  onRetry,
  totalCount,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
  onSelectOrder,
  onAdvance,
  onCancelOrder,
  newOrderIds,
  isAdvancing,
  canManage,
}: OrdersTableProps) {
  const { profile } = useRestaurant();
  const [menuAnchor, setMenuAnchor] = useState<{ anchor: HTMLElement; order: Order } | null>(null);
  const closeMenu = () => setMenuAnchor(null);

  const menuOrder = menuOrderFor(menuAnchor?.order);
  const next = menuOrder ? nextStatus[menuOrder.status] : null;

  if (isError) {
    return <ErrorState message={errorMessage ?? 'Failed to load orders.'} onRetry={onRetry} />;
  }

  if (!isLoading && orders.length === 0) {
    return (
      <EmptyState
        title="No orders found"
        description="Try adjusting the filters, or new orders will appear here automatically."
      />
    );
  }

  return (
    <>
      <TableContainer sx={{ mx: -0.5 }}>
        <Table size="small" aria-label="Orders">
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
            {isLoading && orders.length === 0
              ? Array.from({ length: 6 }, (_, index) => (
                  <TableRow key={`skeleton-${index}`}>
                    {Array.from({ length: 8 }, (__, col) => (
                      <TableCell key={col}>
                        <Skeleton height={22} />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              : null}

            {orders.map((order) => {
              const meta = metaFor(order.status);
              const type = orderTypeMeta(order.source);
              const isNew = newOrderIds.has(order.id);
              const nextAction = nextStatus[order.status];
              return (
                <TableRow
                  key={order.id}
                  hover
                  onClick={() => onSelectOrder(order)}
                  className={isNew ? 'order-row-new' : undefined}
                  sx={{
                    cursor: 'pointer',
                    ...(isNew
                      ? { bgcolor: 'rgba(244,81,30,0.07)', '&:hover': { bgcolor: 'rgba(244,81,30,0.12)' } }
                      : {}),
                  }}
                >
                  <TableCell>
                    <Typography sx={{ fontSize: 13.5, fontWeight: 700, letterSpacing: '-0.01em' }}>
                      {order.orderNumber}
                    </Typography>
                    <Typography sx={{ fontSize: 11.5, color: 'text.secondary' }}>
                      {order.customerName ?? 'Guest'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, whiteSpace: 'nowrap' }}>
                      <TypeIcon source={order.source} />
                      <Typography sx={{ fontSize: 12.5 }}>{type.label}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ fontSize: 13 }}>{order.tableNumber ?? '—'}</TableCell>
                  <TableCell align="center">
                    <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{order.items.length}</Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap' }}>
                    {formatMoney(order.grandTotal, order.currency || profile?.currency || 'INR')}
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={meta.label}
                      sx={{ bgcolor: meta.bg, color: meta.color, fontWeight: 700, border: 'none' }}
                    />
                  </TableCell>
                  <TableCell sx={{ fontSize: 12.5, color: 'text.secondary', whiteSpace: 'nowrap' }}>
                    <Tooltip title={exactTime(order.placedAt ?? order.createdAt)}>
                      <span>{timeAgo(order.placedAt ?? order.createdAt)}</span>
                    </Tooltip>
                  </TableCell>
                  <TableCell align="right" onClick={(event) => event.stopPropagation()}>
                    <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end', alignItems: 'center' }}>
                      {canManage && nextAction ? (
                        <Button
                          size="small"
                          variant="outlined"
                          sx={{ minHeight: 28, fontSize: 11.5, px: 1, whiteSpace: 'nowrap' }}
                          disabled={isAdvancing}
                          onClick={() => onAdvance(order)}
                        >
                          {nextStatusLabel[order.status] ?? `Mark ${nextAction.toLowerCase()}`}
                        </Button>
                      ) : null}
                      <Tooltip title="More actions">
                        <IconButton
                          size="small"
                          aria-label={`Actions for order ${order.orderNumber}`}
                          onClick={(event) => setMenuAnchor({ anchor: event.currentTarget, order })}
                        >
                          <Box
                            sx={{
                              display: 'grid',
                              gridTemplateRows: 'repeat(3, 3px)',
                              gap: '2.5px',
                              alignItems: 'center',
                              justifyItems: 'center',
                            }}
                          >
                            {[0, 1, 2].map((dot) => (
                              <Box key={dot} sx={{ width: 3.5, height: 3.5, borderRadius: '50%', bgcolor: '#718096' }} />
                            ))}
                          </Box>
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component="div"
        count={totalCount}
        page={page}
        rowsPerPage={rowsPerPage}
        onPageChange={(_, nextPage) => onPageChange(nextPage)}
        onRowsPerPageChange={(event) => onRowsPerPageChange(Number(event.target.value))}
        rowsPerPageOptions={[10, 20, 50, 100]}
        labelRowsPerPage="Rows"
        sx={{ borderTop: '1px solid', borderColor: 'divider', mt: 0.5 }}
      />

      <Menu
        anchorEl={menuAnchor?.anchor}
        open={menuAnchor !== null}
        onClose={closeMenu}
        slotProps={{ paper: { sx: { minWidth: 210, borderRadius: '10px', border: '1px solid', borderColor: 'divider', mt: 1 } } }}
      >
        <MenuItem
          onClick={() => {
            if (menuAnchor) onSelectOrder(menuAnchor.order);
            closeMenu();
          }}
          sx={{ fontSize: 14, gap: 1.5 }}
        >
          View order details
        </MenuItem>
        {canManage && next ? (
          <MenuItem
            onClick={() => {
              if (menuAnchor) onAdvance(menuAnchor.order);
              closeMenu();
            }}
            sx={{ fontSize: 14, gap: 1.5 }}
          >
            {nextStatusLabel[menuAnchor?.order.status ?? '']}
          </MenuItem>
        ) : null}
        {canManage && menuOrder && canCancel[menuOrder.status] ? (
          <MenuItem
            onClick={() => {
              if (menuAnchor) onCancelOrder(menuAnchor.order);
              closeMenu();
            }}
            sx={{ fontSize: 14, gap: 1.5, color: 'error.main' }}
          >
            Cancel order
          </MenuItem>
        ) : null}
      </Menu>
    </>
  );
}

function menuOrderFor(order: Order | undefined): Order | undefined {
  return order;
}
