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
import { LayoutGrid, RotateCcw, Search, Table2, X } from 'lucide-react';
import type { DerivedStatus, TableFilters } from './tablesUtils';

interface TableToolbarProps {
  filters: TableFilters;
  onPatch: (patch: Partial<TableFilters>) => void;
  onClear: () => void;
  view: 'grid' | 'list';
  onViewChange: (view: 'grid' | 'list') => void;
  matchCount: number;
}

const statusOptions: { value: '' | DerivedStatus; label: string }[] = [
  { value: '', label: 'All statuses' },
  { value: 'AVAILABLE', label: 'Available' },
  { value: 'OCCUPIED', label: 'Occupied' },
  { value: 'RESERVED', label: 'Reserved' },
  { value: 'CLEANING', label: 'Cleaning' },
];

const sortOptions: { value: TableFilters['sort']; label: string }[] = [
  { value: 'number-asc', label: 'Table number ↑' },
  { value: 'number-desc', label: 'Table number ↓' },
  { value: 'capacity-asc', label: 'Capacity ↑' },
  { value: 'capacity-desc', label: 'Capacity ↓' },
];

export function TableToolbar({ filters, onPatch, onClear, view, onViewChange, matchCount }: TableToolbarProps) {
  const [localSearch, setLocalSearch] = useState(filters.search);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeCount = [
    filters.search.trim() !== '',
    filters.status !== '',
    filters.sort !== 'number-asc',
  ].filter(Boolean).length;

  useEffect(() => {
    setLocalSearch(filters.search);
  }, [filters.search]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const handleSearchInput = (value: string) => {
    setLocalSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => onPatch({ search: value }), 300);
  };

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.25 }}>
      <TextField
        value={localSearch}
        onChange={(event) => handleSearchInput(event.target.value)}
        placeholder="Search table number or name"
        inputProps={{ 'aria-label': 'Search tables' }}
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
        label="Status"
        value={filters.status}
        onChange={(event) => onPatch({ status: event.target.value as TableFilters['status'] })}
        sx={{ minWidth: 150 }}
      >
        {statusOptions.map((option) => (
          <MenuItem key={option.value || 'all'} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </TextField>

      <TextField
        select
        size="small"
        label="Sort by"
        value={filters.sort}
        onChange={(event) => onPatch({ sort: event.target.value as TableFilters['sort'] })}
        sx={{ minWidth: 170 }}
      >
        {sortOptions.map((option) => (
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
        <Tooltip title="Floor view">
          <IconButton
            aria-label="Switch to floor view"
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
        <Tooltip title="List view">
          <IconButton
            aria-label="Switch to list view"
            aria-pressed={view === 'list'}
            onClick={() => onViewChange('list')}
            sx={{
              width: 42,
              height: 40,
              borderRadius: 0,
              borderLeft: '1px solid',
              borderColor: 'divider',
              bgcolor: view === 'list' ? '#F4511E' : 'transparent',
              color: view === 'list' ? '#ffffff' : '#718096',
              '&:hover': { bgcolor: view === 'list' ? '#F4511E' : '#F1F3F7' },
            }}
          >
            <Table2 size={17} />
          </IconButton>
        </Tooltip>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, ml: { xs: 0, sm: 'auto' } }}>
        <Chip
          size="small"
          label={`${matchCount} table${matchCount === 1 ? '' : 's'}`}
          sx={{
            height: 26,
            fontSize: 12,
            fontWeight: 700,
            bgcolor: '#EEF4FF',
            color: '#3B82F6',
            border: 'none',
          }}
        />
        <Tooltip title="Clear all filters">
          <span>
            <Button
              size="small"
              color="inherit"
              startIcon={<RotateCcw size={14} />}
              disabled={activeCount === 0}
              onClick={onClear}
              sx={{
                color: activeCount === 0 ? 'text.disabled' : 'text.secondary',
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              Clear
              {activeCount > 0 ? (
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
                  {activeCount}
                </Box>
              ) : null}
            </Button>
          </span>
        </Tooltip>
      </Box>

      <Typography sx={{ width: '100%', fontSize: 11.5, color: 'text.secondary' }}>
        Select tables to enable bulk QR download and print.
      </Typography>
    </Box>
  );
}
