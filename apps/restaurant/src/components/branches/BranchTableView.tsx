import { useMemo, useState } from 'react';
import {
  Box,
  Button,
  Chip,
  IconButton,
  InputAdornment,
  Menu,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  Building2,
  Download,
  Eye,
  MoreHorizontal,
  Pause,
  Pencil,
  Play,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import type { Branch, RestaurantProfile, SalesSummary } from '@resto/types';
import { formatMoney } from '@/format';
import {
  BRANCH_STATUS_META,
  type BranchFilters,
  filterBranches,
  formatBranchAddress,
  initialsOf,
} from './branchUtils';

export interface BranchMetrics {
  activeOrders: number;
  revenue30d?: SalesSummary;
}

interface BranchTableViewProps {
  branches: Branch[];
  metricsByBranchId: Record<number, BranchMetrics | undefined>;
  filters: BranchFilters;
  onFiltersChange: (filters: BranchFilters) => void;
  profile: RestaurantProfile | null;
  canManage: boolean;
  isLoading: boolean;
  onAdd: () => void;
  onView: (branch: Branch) => void;
  onEdit: (branch: Branch) => void;
  onToggleStatus: (branch: Branch) => void;
  onDelete: (branch: Branch) => void;
  onExport: () => void;
}

const STATUS_OPTIONS: { value: '' | 'ACTIVE' | 'PAUSED' | 'INACTIVE'; label: string }[] = [
  { value: '', label: 'All statuses' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'PAUSED', label: 'Paused' },
  { value: 'INACTIVE', label: 'Inactive' },
];

export function BranchTableView({
  branches,
  metricsByBranchId,
  filters,
  onFiltersChange,
  profile,
  canManage,
  isLoading,
  onAdd,
  onView,
  onEdit,
  onToggleStatus,
  onDelete,
  onExport,
}: BranchTableViewProps) {
  const [menuAnchor, setMenuAnchor] = useState<{ element: HTMLElement; branch: Branch } | null>(null);

  const filtered = useMemo(() => filterBranches(branches, filters), [branches, filters]);
  const currency = profile?.currency ?? 'INR';

  return (
    <Box sx={{ display: 'grid', gap: 1.5 }}>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.25 }}>
        <TextField
          size="small"
          placeholder="Search branches…"
          value={filters.search}
          onChange={(event) => onFiltersChange({ ...filters, search: event.target.value })}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Search size={15} color="#718096" />
                </InputAdornment>
              ),
            },
          }}
          sx={{ minWidth: { xs: '100%', sm: 260 }, bgcolor: '#ffffff' }}
        />
        <TextField
          select
          size="small"
          value={filters.status}
          onChange={(event) =>
            onFiltersChange({ ...filters, status: event.target.value as BranchFilters['status'] })
          }
          sx={{ minWidth: 150, bgcolor: '#ffffff' }}
          aria-label="Filter by status"
        >
          {STATUS_OPTIONS.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>
        <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>
          {filtered.length} of {branches.length} branch{branches.length === 1 ? '' : 'es'}
        </Typography>
        <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
          <Tooltip title="Export CSV">
            <span>
              <IconButton size="small" aria-label="Export branches" onClick={onExport} disabled={filtered.length === 0}>
                <Download size={17} />
              </IconButton>
            </span>
          </Tooltip>
          {canManage ? (
            <Button variant="contained" startIcon={<Plus size={16} />} onClick={onAdd} sx={{ px: 2.5 }}>
              Add Branch
            </Button>
          ) : null}
        </Box>
      </Box>

      <TableContainer
        sx={{
          borderRadius: '14px',
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: '#ffffff',
          boxShadow: '0 1px 2px rgba(16,24,40,0.04)',
        }}
      >
        <Table size="small" sx={{ minWidth: 940 }}>
          <TableHead>
            <TableRow sx={{ bgcolor: '#F8F9FB' }}>
              {['Branch', 'Code', 'Address', 'Phone', 'Status', 'Active orders', 'Revenue (30d)', 'Last activity', ''].map(
                (label) => (
                  <TableCell
                    key={label || 'actions'}
                    sx={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: 'text.secondary',
                      textTransform: 'uppercase',
                      letterSpacing: 0.04,
                      borderBottom: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    {label}
                  </TableCell>
                ),
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 5, color: 'text.secondary', fontSize: 13 }}>
                  Loading branches…
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 5 }}>
                  <Typography sx={{ fontSize: 14, fontWeight: 700 }}>
                    {branches.length === 0 ? 'No branches yet' : 'No branches match the current filters'}
                  </Typography>
                  <Typography sx={{ fontSize: 12.5, color: 'text.secondary', mt: 0.5 }}>
                    {branches.length === 0
                      ? 'Add your first location to start taking orders.'
                      : 'Try a different search or status filter.'}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((branch) => {
                const status = branch.status ?? 'ACTIVE';
                const meta = BRANCH_STATUS_META[status];
                const metrics = metricsByBranchId[branch.id];
                return (
                  <TableRow key={branch.id} hover sx={{ '&:last-child td': { borderBottom: 'none' } }}>
                    <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 0 }}>
                        <Box
                          sx={{
                            width: 34,
                            height: 34,
                            borderRadius: '9px',
                            bgcolor: '#FFF4E5',
                            color: '#F4511E',
                            display: 'grid',
                            placeItems: 'center',
                            fontWeight: 800,
                            fontSize: 12,
                            flexShrink: 0,
                          }}
                        >
                          {initialsOf(branch.name)}
                        </Box>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography noWrap sx={{ fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            {branch.name}
                            {branch.isDefault ? (
                              <Chip
                                size="small"
                                label="Default"
                                sx={{ height: 18, fontSize: 10, fontWeight: 700, bgcolor: '#EEF4FF', color: '#2563EB', border: 'none' }}
                              />
                            ) : null}
                            {branch.currency ? (
                              <Chip
                                size="small"
                                label={branch.currency}
                                sx={{ height: 18, fontSize: 10, fontWeight: 700, bgcolor: '#E7F8F0', color: '#16A36A', border: 'none' }}
                              />
                            ) : null}
                          </Typography>
                          {branch.managerName ? (
                            <Typography noWrap sx={{ fontSize: 11.5, color: 'text.secondary' }}>
                              Mgr: {branch.managerName}
                            </Typography>
                          ) : null}
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider', fontSize: 12.5, fontFamily: 'monospace' }}>
                      {branch.code}
                    </TableCell>
                    <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider', fontSize: 12.5, color: 'text.secondary', maxWidth: 200 }}>
                      <Typography noWrap>{formatBranchAddress(branch)}</Typography>
                    </TableCell>
                    <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider', fontSize: 12.5 }}>
                      {branch.phone ?? '—'}
                    </TableCell>
                    <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                      <Chip
                        size="small"
                        label={meta.label}
                        sx={{ height: 22, fontSize: 11, fontWeight: 700, bgcolor: meta.bg, color: meta.color, border: 'none' }}
                      />
                    </TableCell>
                    <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider', fontSize: 13, fontWeight: 600 }}>
                      {metrics ? String(metrics.activeOrders) : '—'}
                    </TableCell>
                    <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider', fontSize: 13, fontWeight: 600 }}>
                      {metrics?.revenue30d ? formatMoney(metrics.revenue30d.grossRevenue, branch.currency ?? currency) : '—'}
                    </TableCell>
                    <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider', fontSize: 12, color: 'text.secondary' }}>
                      {branch.updatedAt ? new Date(branch.updatedAt).toLocaleDateString() : '—'}
                    </TableCell>
                    <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider' }} align="right">
                      <IconButton
                        size="small"
                        aria-label={`Actions for ${branch.name}`}
                        onClick={(event) => setMenuAnchor({ element: event.currentTarget, branch })}
                      >
                        <MoreHorizontal size={17} />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Menu
        anchorEl={menuAnchor?.element ?? null}
        open={menuAnchor !== null}
        onClose={() => setMenuAnchor(null)}
        slotProps={{ paper: { sx: { minWidth: 200, borderRadius: '12px', border: '1px solid', borderColor: 'divider', mt: 1 } } }}
      >
        {menuAnchor ? (
          <>
            <MenuItem
              onClick={() => {
                onView(menuAnchor.branch);
                setMenuAnchor(null);
              }}
              sx={{ gap: 1.5, fontSize: 14 }}
            >
              <Eye size={16} /> View
            </MenuItem>
            {canManage ? (
              <MenuItem
                onClick={() => {
                  onEdit(menuAnchor.branch);
                  setMenuAnchor(null);
                }}
                sx={{ gap: 1.5, fontSize: 14 }}
              >
                <Pencil size={16} /> Edit
              </MenuItem>
            ) : null}
            {canManage && !menuAnchor.branch.isDefault ? (
              <MenuItem
                onClick={() => {
                  onToggleStatus(menuAnchor.branch);
                  setMenuAnchor(null);
                }}
                sx={{ gap: 1.5, fontSize: 14 }}
              >
                {(menuAnchor.branch.status ?? 'ACTIVE') === 'ACTIVE' ? (
                  <>
                    <Pause size={16} /> Pause branch
                  </>
                ) : (
                  <>
                    <Play size={16} /> Reactivate
                  </>
                )}
              </MenuItem>
            ) : null}
            {canManage && !menuAnchor.branch.isDefault ? (
              <MenuItem
                onClick={() => {
                  onDelete(menuAnchor.branch);
                  setMenuAnchor(null);
                }}
                sx={{ gap: 1.5, fontSize: 14, color: '#DC2626' }}
              >
                <Trash2 size={16} /> Delete
              </MenuItem>
            ) : null}
            {menuAnchor.branch.isDefault && canManage ? (
              <MenuItem disabled sx={{ fontSize: 12.5, color: 'text.secondary' }}>
                <Building2 size={16} /> Default branch cannot be paused or deleted
              </MenuItem>
            ) : null}
          </>
        ) : null}
      </Menu>
    </Box>
  );
}
