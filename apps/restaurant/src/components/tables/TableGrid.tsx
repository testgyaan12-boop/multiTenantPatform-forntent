import { Box, Card, Checkbox, Chip, Skeleton, Tooltip, Typography } from '@mui/material';
import { Armchair, QrCode } from 'lucide-react';
import type { DiningTable, Order } from '@resto/types';
import { formatMoney } from '@/format';
import { deriveStatus, statusMeta, timeAgoLabel, type DerivedStatus } from './tablesUtils';

interface TableGridProps {
  tables: DiningTable[];
  orderByTable: Map<number, Order>;
  statusByTable: Map<number, DerivedStatus>;
  selected: Set<number>;
  onToggleSelect: (id: number) => void;
  onOpen: (table: DiningTable) => void;
  isLoading: boolean;
}

export function TableGrid({
  tables,
  orderByTable,
  statusByTable,
  selected,
  onToggleSelect,
  onOpen,
  isLoading,
}: TableGridProps) {
  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: {
            xs: 'repeat(auto-fill, minmax(220px, 1fr))',
            sm: 'repeat(auto-fill, minmax(240px, 1fr))',
          },
        }}
      >
        {Array.from({ length: 8 }, (_, index) => (
          <Skeleton key={index} variant="rounded" height={168} sx={{ borderRadius: '14px' }} />
        ))}
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'grid',
        gap: 2,
        gridTemplateColumns: {
          xs: 'repeat(auto-fill, minmax(220px, 1fr))',
          sm: 'repeat(auto-fill, minmax(240px, 1fr))',
          lg: 'repeat(auto-fill, minmax(250px, 1fr))',
        },
      }}
    >
      {tables.map((table) => {
        const status = statusByTable.get(table.id) ?? deriveStatus(table, undefined);
        const meta = statusMeta[status];
        const StatusIcon = meta.icon;
        const order = orderByTable.get(table.id);
        const isSelected = selected.has(table.id);

        return (
          <Card
            key={table.id}
            role="button"
            tabIndex={0}
            aria-label={`Open details for table ${table.tableNumber}`}
            onClick={() => onOpen(table)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onOpen(table);
              }
            }}
            sx={{
              p: 1.75,
              cursor: 'pointer',
              borderRadius: '14px',
              border: '1px solid',
              borderColor: isSelected ? '#F4511E' : 'divider',
              boxShadow: isSelected ? '0 0 0 2px rgba(244,81,30,0.25)' : '0 1px 2px rgba(16,24,40,0.04)',
              transition: 'transform 0.15s ease, box-shadow 0.15s ease',
              bgcolor: status === 'OCCUPIED' ? 'rgba(220,38,38,0.03)' : '#ffffff',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 20px rgba(16,24,40,0.10)',
              },
              '&:focus-visible': { outline: '2px solid #F4511E', outlineOffset: 2 },
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 1,
                mb: 1.25,
              }}
            >
              <Chip
                size="small"
                icon={<StatusIcon size={13} />}
                label={meta.label}
                sx={{
                  height: 24,
                  fontSize: 11,
                  fontWeight: 700,
                  bgcolor: meta.bg,
                  color: meta.color,
                  border: 'none',
                  '& .MuiChip-icon': { color: meta.color },
                }}
              />
              <Tooltip title={isSelected ? 'Deselect for bulk QR' : 'Select for bulk QR'}>
                <Checkbox
                  size="small"
                  checked={isSelected}
                  aria-label={`Select table ${table.tableNumber}`}
                  onClick={(event) => event.stopPropagation()}
                  onChange={() => onToggleSelect(table.id)}
                  sx={{ p: 0.5 }}
                />
              </Tooltip>
            </Box>

            <Typography sx={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.15 }}>
              {table.tableNumber}
            </Typography>
            <Typography noWrap sx={{ fontSize: 12.5, color: 'text.secondary', mt: 0.25, minHeight: '1.2em' }}>
              {table.name?.trim() || 'Unnamed table'}
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 1.25, flexWrap: 'wrap' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
                <Armchair size={14} />
                <Typography sx={{ fontSize: 12, fontWeight: 600 }}>
                  {table.capacity} seat{table.capacity === 1 ? '' : 's'}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#16A36A' }}>
                <QrCode size={14} />
                <Typography sx={{ fontSize: 12, fontWeight: 600 }}>QR ready</Typography>
              </Box>
            </Box>

            {order ? (
              <Box
                onClick={(event) => event.stopPropagation()}
                sx={{
                  mt: 1.5,
                  pt: 1.25,
                  borderTop: '1px dashed',
                  borderColor: 'divider',
                  display: 'grid',
                  gap: 0.5,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                  <Typography noWrap sx={{ fontSize: 12.5, fontWeight: 700 }}>
                    {order.orderNumber}
                  </Typography>
                  <Typography sx={{ fontSize: 12.5, fontWeight: 800 }}>
                    {formatMoney(order.grandTotal, order.currency)}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                  <Typography sx={{ fontSize: 11.5, color: meta.color, fontWeight: 700 }}>
                    {order.status}
                  </Typography>
                  <Typography sx={{ fontSize: 11.5, color: 'text.secondary' }}>
                    {timeAgoLabel(order.placedAt ?? order.createdAt)}
                  </Typography>
                </Box>
              </Box>
            ) : null}
          </Card>
        );
      })}
    </Box>
  );
}
