import { useEffect, useRef, useState } from 'react';
import {
  Box,
  Button,
  IconButton,
  InputAdornment,
  MenuItem,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { CalendarDays, Filter, RotateCcw, Search, X } from 'lucide-react';

interface OrderFilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  paymentStatus: string;
  onPaymentStatusChange: (value: string) => void;
  source: string;
  onSourceChange: (value: string) => void;
  days: number;
  onDaysChange: (value: number) => void;
  activeFilterCount: number;
  onClear: () => void;
}

const datePresets = [
  { value: 1, label: 'Today' },
  { value: 7, label: 'Last 7 days' },
  { value: 30, label: 'Last 30 days' },
];

const paymentOptions = [
  { value: '', label: 'All payments' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'PAID', label: 'Paid' },
  { value: 'FAILED', label: 'Failed' },
  { value: 'REFUNDED', label: 'Refunded' },
];

const sourceOptions = [
  { value: '', label: 'All types' },
  { value: 'QR', label: 'Dine-in' },
  { value: 'PICKUP', label: 'Takeaway' },
];

export function OrderFilterBar({
  search,
  onSearchChange,
  paymentStatus,
  onPaymentStatusChange,
  source,
  onSourceChange,
  days,
  onDaysChange,
  activeFilterCount,
  onClear,
}: OrderFilterBarProps) {
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
    debounceRef.current = setTimeout(() => onSearchChange(value), 400);
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 1.25,
      }}
    >
      <TextField
        value={localSearch}
        onChange={(event) => handleSearchInput(event.target.value)}
        placeholder="Search order number or customer"
        inputProps={{ 'aria-label': 'Search orders' }}
        sx={{ minWidth: { xs: '100%', sm: 260 }, flexGrow: { sm: 1 } }}
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
        label="Payment"
        value={paymentStatus}
        onChange={(event) => onPaymentStatusChange(event.target.value)}
        sx={{ minWidth: 140 }}
        aria-label="Payment status filter"
      >
        {paymentOptions.map((option) => (
          <MenuItem key={option.value || 'all'} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </TextField>

      <TextField
        select
        label="Type"
        value={source}
        onChange={(event) => onSourceChange(event.target.value)}
        sx={{ minWidth: 130 }}
        aria-label="Order type filter"
      >
        {sourceOptions.map((option) => (
          <MenuItem key={option.value || 'all'} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </TextField>

      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.75,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: '10px',
          px: 1,
          height: 40,
        }}
      >
        <CalendarDays size={15} color="#718096" />
        <Box
          component="select"
          aria-label="Date range"
          value={days}
          onChange={(event: React.ChangeEvent<HTMLSelectElement>) => onDaysChange(Number(event.target.value))}
          sx={{
            appearance: 'none',
            border: 'none',
            outline: 'none',
            bgcolor: 'transparent',
            fontFamily: 'inherit',
            fontSize: 13,
            fontWeight: 600,
            color: 'text.primary',
            cursor: 'pointer',
            pr: '12px',
            py: 0,
          }}
        >
          {datePresets.map((preset) => (
            <option key={preset.value} value={preset.value}>
              {preset.label}
            </option>
          ))}
        </Box>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 'auto' }}>
        <Tooltip title="Clear all filters">
          <span>
            <Button
              size="small"
              color="inherit"
              startIcon={<RotateCcw size={14} />}
              disabled={activeFilterCount === 0}
              onClick={onClear}
              sx={{ color: activeFilterCount === 0 ? 'text.disabled' : 'text.secondary', fontSize: 13 }}
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

export function FilterSummary({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
      <Filter size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />
      {count} filter{count === 1 ? '' : 's'} active
    </Typography>
  );
}
