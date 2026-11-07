import { Box, Card, Chip, Typography } from '@mui/material';
import type { OrderCountsResponse } from '@resto/types';
import { statusTabs } from './orderUtils';

interface OrderStatusTabsProps {
  value: string;
  onChange: (status: string) => void;
  counts: OrderCountsResponse | undefined;
}

export function OrderStatusTabs({ value, onChange, counts }: OrderStatusTabsProps) {
  const countFor = (tabValue: string): number => {
    if (!counts) return 0;
    return tabValue === '' ? counts.total : (counts.byStatus[tabValue] ?? 0);
  };

  return (
    <Card sx={{ p: 1.25, overflowX: 'auto' }}>
      <Box sx={{ display: 'flex', gap: 0.75, minWidth: 'max-content' }}>
        {statusTabs.map((tab) => {
          const active = value === tab.value;
          const count = countFor(tab.value);
          return (
            <Chip
              key={tab.value || 'all'}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{tab.label}</Typography>
                  <Typography
                    sx={{
                      fontSize: 11.5,
                      fontWeight: 700,
                      color: active ? '#ffffff' : 'text.secondary',
                      bgcolor: active ? 'rgba(255,255,255,0.24)' : 'rgba(23,32,51,0.06)',
                      borderRadius: '6px',
                      px: 0.6,
                      py: '1px',
                      minWidth: 18,
                      textAlign: 'center',
                    }}
                  >
                    {count}
                  </Typography>
                </Box>
              }
              onClick={() => onChange(tab.value)}
              aria-pressed={active}
              sx={{
                height: 34,
                px: 0.5,
                borderRadius: '10px',
                bgcolor: active ? '#F4511E' : '#F1F3F7',
                color: active ? '#ffffff' : '#475467',
                border: 'none',
                '&:hover': { bgcolor: active ? '#F4511E' : '#E6E9EF' },
              }}
            />
          );
        })}
      </Box>
    </Card>
  );
}
