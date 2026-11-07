import { useEffect, useRef, useState } from 'react';
import {
  Box,
  Button,
  Chip,
  IconButton,
  InputAdornment,
  MenuItem,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { Download, LayoutGrid, RotateCcw, Search, Table2, X } from 'lucide-react';
import type { AssignableRole } from '@resto/types';
import {
  activeEmployeeFilterCount,
  type DateRangeKey,
  type EmployeeFilters,
} from './employeeUtils';

interface EmployeeToolbarProps {
  filters: EmployeeFilters;
  onPatch: (patch: Partial<EmployeeFilters>) => void;
  onClear: () => void;
  roles: AssignableRole[];
  view: 'grid' | 'table';
  onViewChange: (view: 'grid' | 'table') => void;
  matchCount: number;
  dateKey: DateRangeKey;
  onDateKeyChange: (key: DateRangeKey) => void;
  customFrom: string;
  customTo: string;
  onCustomChange: (from: string, to: string) => void;
  onExport: () => void;
  canExport: boolean;
}

const DATE_OPTIONS: { value: DateRangeKey; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: '7d', label: 'Last 7 days' },
  { value: 'month', label: 'This month' },
  { value: 'custom', label: 'Custom range' },
];

export function EmployeeToolbar({
  filters,
  onPatch,
  onClear,
  roles,
  view,
  onViewChange,
  matchCount,
  dateKey,
  onDateKeyChange,
  customFrom,
  customTo,
  onCustomChange,
  onExport,
  canExport,
}: EmployeeToolbarProps) {
  const [localSearch, setLocalSearch] = useState(filters.search);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const filterCount = activeEmployeeFilterCount(filters);

  useEffect(() => {
    setLocalSearch(filters.search);
  }, [filters.search]);

  useEffect(() => () => void (debounceRef.current && clearTimeout(debounceRef.current)), []);

  const handleSearch = (value: string) => {
    setLocalSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => onPatch({ search: value }), 300);
  };

  return (
    <Box sx={{ display: 'grid', gap: 1.5 }}>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.25 }}>
        <TextField
          value={localSearch}
          onChange={(event) => handleSearch(event.target.value)}
          placeholder="Search name, email or ID"
          inputProps={{ 'aria-label': 'Search employees' }}
          sx={{ minWidth: { xs: '100%', sm: 250 }, flexGrow: { sm: 1 } }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search size={16} color="#718096" />
              </InputAdornment>
            ),
            endAdornment: localSearch ? (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  aria-label="Clear search"
                  onClick={() => {
                    setLocalSearch('');
                    onPatch({ search: '' });
                  }}
                >
                  <X size={15} />
                </IconButton>
              </InputAdornment>
            ) : null,
          }}
        />

        <TextField
          select
          size="small"
          label="Role"
          value={filters.role}
          onChange={(event) => onPatch({ role: event.target.value })}
          sx={{ minWidth: 180 }}
        >
          <MenuItem value="">All roles</MenuItem>
          {roles.map((role) => (
            <MenuItem key={role.code} value={role.code}>
              {role.name}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          select
          size="small"
          label="Status"
          value={filters.status}
          onChange={(event) => onPatch({ status: event.target.value as EmployeeFilters['status'] })}
          sx={{ minWidth: 140 }}
        >
          <MenuItem value="">All</MenuItem>
          <MenuItem value="ACTIVE">Active</MenuItem>
          <MenuItem value="INACTIVE">Inactive</MenuItem>
        </TextField>

        <TextField
          select
          size="small"
          label="Duty"
          value={filters.duty}
          onChange={(event) => onPatch({ duty: event.target.value as EmployeeFilters['duty'] })}
          sx={{ minWidth: 140 }}
        >
          <MenuItem value="">All</MenuItem>
          <MenuItem value="on">On duty</MenuItem>
          <MenuItem value="off">Off duty</MenuItem>
        </TextField>

        <TextField
          select
          size="small"
          label="Date range"
          value={dateKey}
          onChange={(event) => onDateKeyChange(event.target.value as DateRangeKey)}
          sx={{ minWidth: 160 }}
        >
          {DATE_OPTIONS.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>

        <Box
          role="group"
          aria-label="View options"
          sx={{
            display: 'flex',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: '10px',
            overflow: 'hidden',
            height: 40,
          }}
        >
          <Tooltip title="Grid view">
            <IconButton
              aria-label="Switch to grid view"
              aria-pressed={view === 'grid'}
              onClick={() => onViewChange('grid')}
              sx={{
                width: 42,
                height: 40,
                borderRadius: 0,
                bgcolor: view === 'grid' ? '#F4511E' : 'transparent',
                color: view === 'grid' ? '#ffffff' : '#718096',
                '&:hover': { bgcolor: view === 'grid' ? '#F4511E' : '#F1F3F7' },
              }}
            >
              <LayoutGrid size={17} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Table view">
            <IconButton
              aria-label="Switch to table view"
              aria-pressed={view === 'table'}
              onClick={() => onViewChange('table')}
              sx={{
                width: 42,
                height: 40,
                borderRadius: 0,
                borderLeft: '1px solid',
                borderColor: 'divider',
                bgcolor: view === 'table' ? '#F4511E' : 'transparent',
                color: view === 'table' ? '#ffffff' : '#718096',
                '&:hover': { bgcolor: view === 'table' ? '#F4511E' : '#F1F3F7' },
              }}
            >
              <Table2 size={17} />
            </IconButton>
          </Tooltip>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, ml: { xs: 0, sm: 'auto' } }}>
          <Chip
            size="small"
            label={`${matchCount} employee${matchCount === 1 ? '' : 's'}`}
            sx={{ height: 26, fontSize: 12, fontWeight: 700, bgcolor: '#EEF4FF', color: '#3B82F6', border: 'none' }}
          />
          <Tooltip title="Clear all filters">
            <span>
              <Button
                size="small"
                color="inherit"
                startIcon={<RotateCcw size={14} />}
                disabled={filterCount === 0}
                onClick={onClear}
                sx={{ color: filterCount === 0 ? 'text.disabled' : 'text.secondary', fontSize: 13, fontWeight: 600 }}
              >
                Clear
                {filterCount > 0 ? (
                  <Box
                    component="span"
                    sx={{
                      ml: 0.75,
                      minWidth: 18,
                      height: 18,
                      borderRadius: '50%',
                      bgcolor: '#F4511E',
                      color: '#ffffff',
                      fontSize: 11,
                      fontWeight: 700,
                      display: 'inline-grid',
                      placeItems: 'center',
                      px: 0.4,
                    }}
                  >
                    {filterCount}
                  </Box>
                ) : null}
              </Button>
            </span>
          </Tooltip>
          <Tooltip title={canExport ? 'Export the filtered roster as CSV' : 'Nothing to export'}>
            <span>
              <Button
                size="small"
                variant="outlined"
                startIcon={<Download size={14} />}
                disabled={!canExport}
                onClick={onExport}
                sx={{ fontSize: 13, fontWeight: 600 }}
              >
                Export
              </Button>
            </span>
          </Tooltip>
        </Box>
      </Box>

      {dateKey === 'custom' ? (
        <Box sx={{ display: 'flex', gap: 1.25, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            size="small"
            type="date"
            label="From"
            value={customFrom}
            onChange={(event) => onCustomChange(event.target.value, customTo)}
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: 160 }}
          />
          <TextField
            size="small"
            type="date"
            label="To"
            value={customTo}
            onChange={(event) => onCustomChange(customFrom, event.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: 160 }}
          />
        </Box>
      ) : null}

      <Typography sx={{ fontSize: 11.5, color: 'text.secondary' }}>
        Performance metrics use real task and order history — unsupported metrics are shown as “not tracked”.
      </Typography>
    </Box>
  );
}
