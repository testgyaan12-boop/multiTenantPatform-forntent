import { useMemo, useState } from 'react';
import {
  Box,
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
import { ArrowDownUp, Eye, EyeOff, Pencil, Star, Trash2, UtensilsCrossed } from 'lucide-react';
import { ErrorState } from '@resto/ui';
import type { MenuCategory, MenuItem as MenuItemModel } from '@resto/types';
import { formatMoney } from '@/format';
import type { SortKey } from './menuUtils';
import { exactTime, timeAgo } from './menuUtils';

interface MenuTableViewProps {
  items: MenuItemModel[];
  totalCount: number;
  page: number;
  rowsPerPage: number;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (size: number) => void;
  sort: SortKey;
  onSortChange: (sort: SortKey) => void;
  categories: MenuCategory[];
  currency: string;
  canManage: boolean;
  onEdit: (item: MenuItemModel) => void;
  onToggleAvailability: (item: MenuItemModel) => void;
  onDelete: (item: MenuItemModel) => void;
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
  onRetry: () => void;
}

type HeaderCell = {
  label: string;
  align?: 'left' | 'right';
  width?: number | string;
  sort?: SortKey;
  sortable?: boolean;
};

const headers: HeaderCell[] = [
  { label: 'Item', width: 64 },
  { label: 'Item name', sort: 'name-asc', sortable: true },
  { label: 'Category' },
  { label: 'SKU' },
  { label: 'Price', align: 'right', sort: 'price-asc', sortable: true },
  { label: 'Availability' },
  { label: 'Featured', width: 90 },
  { label: 'Last updated', sort: 'updated-desc', sortable: true, width: 130 },
  { label: 'Actions', align: 'right', width: 110 },
];

export function MenuTableView({
  items,
  totalCount,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
  sort,
  onSortChange,
  categories,
  currency,
  canManage,
  onEdit,
  onToggleAvailability,
  onDelete,
  isLoading,
  isError,
  errorMessage,
  onRetry,
}: MenuTableViewProps) {
  const [imageFailures, setImageFailures] = useState<Set<number>>(new Set());

  const slice = useMemo(
    () => items.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [items, page, rowsPerPage],
  );

  const categoryName = (id: number) =>
    categories.find((category) => category.id === id)?.name ?? '—';

  if (isError) {
    return <ErrorState message={errorMessage ?? 'Failed to load menu items.'} onRetry={onRetry} />;
  }

  return (
    <>
      <TableContainer sx={{ mx: -0.5 }}>
        <Table size="small" aria-label="Menu items">
          <TableHead>
            <TableRow>
              {headers.map((header) => (
                <TableCell
                  key={header.label}
                  align={header.align ?? 'left'}
                  sx={{
                    width: header.width,
                    fontWeight: 700,
                    fontSize: 12,
                    color: 'text.secondary',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {header.sortable && header.sort ? (
                    <Box
                      component="button"
                      type="button"
                      onClick={() => onSortChange(header.sort as SortKey)}
                      aria-label={`Sort by ${header.label.toLowerCase()}`}
                      sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 0.5,
                        border: 'none',
                        bgcolor: 'transparent',
                        p: 0,
                        fontFamily: 'inherit',
                        fontSize: 12,
                        fontWeight: 700,
                        color: sort === header.sort ? '#F4511E' : 'text.secondary',
                        cursor: 'pointer',
                        '&:hover': { color: '#F4511E' },
                      }}
                    >
                      {header.label}
                      <ArrowDownUp
                        size={13}
                        style={{ opacity: sort === header.sort ? 1 : 0.45 }}
                      />
                    </Box>
                  ) : (
                    header.label
                  )}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading && slice.length === 0
              ? Array.from({ length: 6 }, (_, index) => (
                  <TableRow key={`skeleton-${index}`}>
                    {headers.map((header) => (
                      <TableCell key={header.label}>
                        <Skeleton height={22} />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              : null}

            {slice.map((item) => (
              <TableRow key={item.id} hover>
                <TableCell>
                  <Box
                    sx={{
                      width: 42,
                      height: 42,
                      borderRadius: '10px',
                      overflow: 'hidden',
                      position: 'relative',
                      bgcolor: '#EEF1F5',
                      display: 'grid',
                      placeItems: 'center',
                      color: '#98A2B3',
                    }}
                  >
                    <UtensilsCrossed size={18} strokeWidth={1.5} />
                    {item.imageUrl && !imageFailures.has(item.id) ? (
                      <Box
                        component="img"
                        src={item.imageUrl}
                        alt=""
                        onError={() =>
                          setImageFailures((previous) => new Set(previous).add(item.id))
                        }
                        sx={{
                          position: 'absolute',
                          inset: 0,
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                      />
                    ) : null}
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography sx={{ fontSize: 13.5, fontWeight: 700 }}>{item.name}</Typography>
                  {item.description ? (
                    <Typography noWrap sx={{ maxWidth: 260, fontSize: 11.5, color: 'text.secondary' }}>
                      {item.description}
                    </Typography>
                  ) : null}
                </TableCell>
                <TableCell sx={{ fontSize: 13 }}>{categoryName(item.categoryId)}</TableCell>
                <TableCell sx={{ fontSize: 12.5, fontFamily: 'monospace', color: 'text.secondary' }}>
                  {item.sku}
                </TableCell>
                <TableCell align="right" sx={{ fontSize: 13.5, fontWeight: 700, whiteSpace: 'nowrap' }}>
                  {formatMoney(item.price, item.currency || currency)}
                </TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    label={item.isAvailable ? 'Available' : 'Unavailable'}
                    sx={{
                      height: 24,
                      fontSize: 11.5,
                      fontWeight: 700,
                      border: 'none',
                      bgcolor: item.isAvailable ? '#E7F8F0' : '#FEECEB',
                      color: item.isAvailable ? '#16A36A' : '#DC2626',
                    }}
                  />
                </TableCell>
                <TableCell>
                  {item.isFeatured ? (
                    <Star size={16} fill="#F59E0B" color="#F59E0B" aria-label="Featured" />
                  ) : (
                    <Typography sx={{ fontSize: 12, color: 'text.disabled' }}>—</Typography>
                  )}
                </TableCell>
                <TableCell sx={{ fontSize: 12.5, color: 'text.secondary', whiteSpace: 'nowrap' }}>
                  <Tooltip title={exactTime(item.updatedAt)}>
                    <span>{timeAgo(item.updatedAt)}</span>
                  </Tooltip>
                </TableCell>
                <TableCell align="right">
                  {canManage ? (
                    <Box sx={{ display: 'flex', gap: 0.4, justifyContent: 'flex-end' }}>
                      <Tooltip title="Edit item">
                        <IconButton
                          size="small"
                          aria-label={`Edit ${item.name}`}
                          onClick={() => onEdit(item)}
                        >
                          <Pencil size={15} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={item.isAvailable ? 'Mark unavailable' : 'Mark available'}>
                        <IconButton
                          size="small"
                          aria-label={`Toggle availability of ${item.name}`}
                          onClick={() => onToggleAvailability(item)}
                          sx={{ color: item.isAvailable ? '#16A36A' : '#98A2B3' }}
                        >
                          {item.isAvailable ? <Eye size={15} /> : <EyeOff size={15} />}
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete item">
                        <IconButton
                          size="small"
                          aria-label={`Delete ${item.name}`}
                          onClick={() => onDelete(item)}
                          sx={{ color: '#DC2626' }}
                        >
                          <Trash2 size={15} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  ) : null}
                </TableCell>
              </TableRow>
            ))}
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
