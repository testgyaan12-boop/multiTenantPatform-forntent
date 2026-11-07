import { useMemo } from 'react';
import {
  Box,
  Checkbox,
  Chip,
  IconButton,
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
import { Pencil, QrCode, Trash2 } from 'lucide-react';
import type { DiningTable, Order } from '@resto/types';
import { formatMoney } from '@/format';
import { statusMeta, timeAgoLabel, exactTime, type DerivedStatus } from './tablesUtils';

interface TableListViewProps {
  tables: DiningTable[];
  totalCount: number;
  page: number;
  rowsPerPage: number;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (size: number) => void;
  orderByTable: Map<number, Order>;
  statusByTable: Map<number, DerivedStatus>;
  selected: Set<number>;
  onToggleSelect: (id: number) => void;
  onToggleSelectAll: (ids: number[], checked: boolean) => void;
  onOpen: (table: DiningTable) => void;
  onEdit: (table: DiningTable) => void;
  onQr: (table: DiningTable) => void;
  onDelete: (table: DiningTable) => void;
  canManage: boolean;
  isLoading: boolean;
}

export function TableListView({
  tables,
  totalCount,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
  orderByTable,
  statusByTable,
  selected,
  onToggleSelect,
  onToggleSelectAll,
  onOpen,
  onEdit,
  onQr,
  onDelete,
  canManage,
  isLoading,
}: TableListViewProps) {
  const slice = useMemo(
    () => tables.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [tables, page, rowsPerPage],
  );
  const sliceIds = slice.map((table) => table.id);
  const allSelected = sliceIds.length > 0 && sliceIds.every((id) => selected.has(id));
  const someSelected = sliceIds.some((id) => selected.has(id));

  return (
    <>
      <TableContainer sx={{ mx: -0.5 }}>
        <Table size="small" aria-label="Tables">
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox" sx={{ width: 44 }}>
                <Checkbox
                  size="small"
                  checked={allSelected}
                  indeterminate={!allSelected && someSelected}
                  aria-label="Select all tables on this page"
                  onChange={(event) => onToggleSelectAll(sliceIds, event.target.checked)}
                />
              </TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: 12, color: 'text.secondary' }}>
                Table number
              </TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: 12, color: 'text.secondary' }}>
                Table name
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 700, fontSize: 12, color: 'text.secondary' }}>
                Capacity
              </TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: 12, color: 'text.secondary' }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: 12, color: 'text.secondary' }}>
                Active order
              </TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: 12, color: 'text.secondary' }}>QR</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700, fontSize: 12, color: 'text.secondary' }}>
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading && slice.length === 0
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

            {slice.map((table) => {
              const status = statusByTable.get(table.id) ?? 'UNKNOWN';
              const meta = statusMeta[status];
              const StatusIcon = meta.icon;
              const order = orderByTable.get(table.id);
              return (
                <TableRow
                  key={table.id}
                  hover
                  onClick={() => onOpen(table)}
                  sx={{ cursor: 'pointer' }}
                >
                  <TableCell padding="checkbox" onClick={(event) => event.stopPropagation()}>
                    <Checkbox
                      size="small"
                      checked={selected.has(table.id)}
                      aria-label={`Select table ${table.tableNumber}`}
                      onChange={() => onToggleSelect(table.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ fontSize: 13.5, fontWeight: 700 }}>{table.tableNumber}</Typography>
                  </TableCell>
                  <TableCell sx={{ fontSize: 13, color: 'text.secondary' }}>
                    {table.name?.trim() || '—'}
                  </TableCell>
                  <TableCell align="right" sx={{ fontSize: 13, fontWeight: 600 }}>
                    {table.capacity}
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      icon={<StatusIcon size={13} />}
                      label={meta.label}
                      sx={{
                        height: 24,
                        fontSize: 11.5,
                        fontWeight: 700,
                        bgcolor: meta.bg,
                        color: meta.color,
                        border: 'none',
                        '& .MuiChip-icon': { color: meta.color },
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    {order ? (
                      <Box sx={{ display: 'grid', gap: 0.1 }}>
                        <Typography sx={{ fontSize: 12.5, fontWeight: 700 }}>{order.orderNumber}</Typography>
                        <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>
                          {formatMoney(order.grandTotal, order.currency)} ·{' '}
                          <span title={exactTime(order.placedAt ?? order.createdAt)}>
                            {timeAgoLabel(order.placedAt ?? order.createdAt)}
                          </span>
                        </Typography>
                      </Box>
                    ) : (
                      <Typography sx={{ fontSize: 12.5, color: 'text.disabled' }}>—</Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label="Ready"
                      sx={{
                        height: 22,
                        fontSize: 11,
                        fontWeight: 700,
                        bgcolor: '#E7F8F0',
                        color: '#16A36A',
                        border: 'none',
                      }}
                    />
                  </TableCell>
                  <TableCell align="right" onClick={(event) => event.stopPropagation()}>
                    <Box sx={{ display: 'flex', gap: 0.4, justifyContent: 'flex-end' }}>
                      <Tooltip title="View QR">
                        <IconButton size="small" aria-label={`View QR for table ${table.tableNumber}`} onClick={() => onQr(table)}>
                          <QrCode size={15} />
                        </IconButton>
                      </Tooltip>
                      {canManage ? (
                        <>
                          <Tooltip title="Edit table">
                            <IconButton size="small" aria-label={`Edit table ${table.tableNumber}`} onClick={() => onEdit(table)}>
                              <Pencil size={15} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete table">
                            <IconButton
                              size="small"
                              aria-label={`Delete table ${table.tableNumber}`}
                              onClick={() => onDelete(table)}
                              sx={{ color: '#DC2626' }}
                            >
                              <Trash2 size={15} />
                            </IconButton>
                          </Tooltip>
                        </>
                      ) : null}
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
        rowsPerPageOptions={[10, 20, 50]}
        labelRowsPerPage="Rows"
        sx={{ borderTop: '1px solid', borderColor: 'divider', mt: 0.5 }}
      />
    </>
  );
}
