import { Box, Paper, Stack, Typography } from '@mui/material';
import { ArrowDown, ArrowUp, Clock, type LucideIcon } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: React.ReactNode;
  subtitle?: string;
  change?: number; // percentage; positive = up, negative = down
  changeLabel?: string;
  icon: LucideIcon;
  tone?: 'default' | 'success' | 'warning' | 'error';
  isLoading?: boolean;
}

const TONE_COLORS: Record<string, string> = {
  default: '#5A6478',
  success: '#15803d',
  warning: '#b45309',
  error: '#dc2626',
};

const ICON_BG: Record<string, string> = {
  default: '#E4E9F2',
  success: '#E7F7EE',
  warning: '#FDF3E3',
  error: '#FDECEC',
};

export function KpiCard({
  title,
  value,
  subtitle,
  change,
  changeLabel,
  icon: Icon,
  tone = 'default',
  isLoading = false,
}: KpiCardProps) {
  const showChange = change !== undefined && change !== null;
  const isPositive = showChange && change >= 0;
  const absChange = showChange ? Math.abs(change) : 0;

  return (
    <Paper
      sx={{
        border: '1px solid #E4E9F2',
        borderRadius: 4,
        p: 2,
        overflow: 'hidden',
        background: '#fff',
        position: 'relative',
        minHeight: 150,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="start" spacing={1}>
        <Box sx={{ minWidth: 0 }}>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', mb: 0.5 }}
          >
            {title}
          </Typography>
          {isLoading ? (
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#111D32', mb: 0.25 }}>
              —
            </Typography>
          ) : (
            <Typography variant="h3" sx={{ fontWeight: 800, color: '#111D32', lineHeight: 1.1, mb: 0.25 }}>
              {value}
            </Typography>
          )}
          {subtitle && (
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: 11, mt: 0.25 }}>
              {subtitle}
            </Typography>
          )}
        </Box>
        <Box
          sx={{
            p: 1,
            borderRadius: 4,
            background: ICON_BG[tone],
            color: TONE_COLORS[tone],
            display: 'grid',
            placeItems: 'center',
            width: 36,
            height: 36,
            flexShrink: 0,
          }}
        >
          <Icon size={18} strokeWidth={2} />
        </Box>
      </Stack>
      {showChange && (
        <Box component="hr" sx={{ border: 0, borderTop: '1px solid #E4E9F2', mt: 1.5, mb: 0.5 }} />
      )}
      <Stack direction="row" spacing={0.5} alignItems="center">
        {showChange ? (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.25,
              fontSize: 11,
              fontWeight: 700,
              color: isPositive ? '#15803d' : '#dc2626',
            }}
          >
            {isPositive ? <ArrowUp size={12} strokeWidth={2} /> : <ArrowDown size={12} strokeWidth={2} />}
            {absChange.toFixed(1)}%
          </Box>
        ) : (
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10 }}>
            <Clock size={10} strokeWidth={2} /> live
          </Typography>
        )}
        {changeLabel && (
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10, ml: 0.5 }}>
            {changeLabel}
          </Typography>
        )}
      </Stack>
    </Paper>
  );
}
