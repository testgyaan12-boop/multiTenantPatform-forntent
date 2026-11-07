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
import type { AvailabilityFilter, FeaturedFilter, MenuView, SortKey } from './menuUtils';
import { sortOptions } from './menuUtils';

interface MenuToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  availability: AvailabilityFilter;
  onAvailabilityChange: (value: AvailabilityFilter) => void;
  featured: FeaturedFilter;
  onFeaturedChange: (value: FeaturedFilter) => void;
  sort: SortKey;
  onSortChange: (value: SortKey) => void;
  view: MenuView;
  onViewChange: (value: MenuView) => void;
  matchCount: number;
  activeFilterCount: number;
  onClear: () => void;
}

export function MenuToolbar({
  search,
  onSearchChange,
  availability,
  onAvailabilityChange,
  featured,
  onFeaturedChange,
  sort,
  onSortChange,
  view,
  onViewChange,
  matchCount,
  activeFilterCount,
  onClear,
}: MenuToolbarProps) {
  const [localSearch, setLocalSearch] = useState(search);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setLocalSearch(search);
  }, [search]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const handleSearchInput = (value: string) => {
    setLocalSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => onSearchChange(value), 300);
  };

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.25 }}>
      <TextField
        value={localSearch}
        onChange={(event) => handleSearchInput(event.target.value)}
        placeholder="Search by name or SKU"
        inputProps={{ 'aria-label': 'Search menu items' }}
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
                  onSearchChange('');
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
        label="Availability"
        value={availability}
        onChange={(event) => onAvailabilityChange(event.target.value as AvailabilityFilter)}
        sx={{ minWidth: 150 }}
      >
        <MenuItem value="">All</MenuItem>
        <MenuItem value="AVAILABLE">Available</MenuItem>
        <MenuItem value="UNAVAILABLE">Unavailable</MenuItem>
      </TextField>

      <TextField
        select
        size="small"
        label="Featured"
        value={featured}
        onChange={(event) => onFeaturedChange(event.target.value as FeaturedFilter)}
        sx={{ minWidth: 140 }}
      >
        <MenuItem value="">All items</MenuItem>
        <MenuItem value="FEATURED">Featured only</MenuItem>
        <MenuItem value="STANDARD">Standard only</MenuItem>
      </TextField>

      <TextField
        select
        size="small"
        label="Sort by"
        value={sort}
        onChange={(event) => onSortChange(event.target.value as SortKey)}
        sx={{ minWidth: 180 }}
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
          label={`${matchCount} item${matchCount === 1 ? '' : 's'}`}
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
              disabled={activeFilterCount === 0}
              onClick={onClear}
              sx={{
                color: activeFilterCount === 0 ? 'text.disabled' : 'text.secondary',
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              Clear
              {activeFilterCount > 0 ? (
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
                  {activeFilterCount}
                </Box>
              ) : null}
            </Button>
          </span>
        </Tooltip>
      </Box>
    </Box>
  );
}

export function FilterHint({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
      {count} filter{count === 1 ? '' : 's'} active
    </Typography>
  );
}
