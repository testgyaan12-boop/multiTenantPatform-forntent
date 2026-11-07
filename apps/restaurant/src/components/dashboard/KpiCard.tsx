import { Box, Card, Skeleton, Typography } from '@mui/material';
import type { LucideIcon } from 'lucide-react';

interface KpiCardProps {
  label: string;
  value: string;
  description: string;
  icon: LucideIcon;
  accent?: string;
  isLoading?: boolean;
}

export function KpiCard({ label, value, description, icon: Icon, accent = '#F4511E', isLoading }: KpiCardProps) {
  return (
    <Card sx={{ p: 2.25, height: '100%' }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1.5 }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontSize: 12.5, fontWeight: 600, color: 'text.secondary' }}>{label}</Typography>
          {isLoading ? (
            <Skeleton sx={{ width: 96, height: 34, mt: 0.5 }} />
          ) : (
            <Typography sx={{ fontSize: 30, fontWeight: 700, lineHeight: 1.15, mt: 0.25, letterSpacing: '-0.02em' }}>
              {value}
            </Typography>
          )}
          <Typography sx={{ fontSize: 12, color: 'text.secondary', mt: 0.5 }}>{description}</Typography>
        </Box>
        <Box
          sx={{
            width: 42,
            height: 42,
            borderRadius: '12px',
            display: 'grid',
            placeItems: 'center',
            flexShrink: 0,
            bgcolor: `${accent}14`,
            color: accent,
          }}
        >
          <Icon size={20} />
        </Box>
      </Box>
    </Card>
  );
}
