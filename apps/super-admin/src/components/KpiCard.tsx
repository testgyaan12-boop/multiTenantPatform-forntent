import { Box, Card, CardContent, Typography } from '@mui/material';
import type { ReactNode } from 'react';

export type KpiTone = 'success' | 'warning' | 'error' | 'info' | 'default';

export interface KpiCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon?: ReactNode;
  tone?: KpiTone;
  onClick?: () => void;
}

const TONES: Record<KpiTone, { fg: string; bg: string }> = {
  success: { fg: '#1B8A5A', bg: 'rgba(27,138,90,0.10)' },
  warning: { fg: '#B76E00', bg: 'rgba(183,110,0,0.10)' },
  error: { fg: '#D32F2F', bg: 'rgba(211,47,47,0.10)' },
  info: { fg: '#2F6FED', bg: 'rgba(47,111,237,0.10)' },
  default: { fg: '#5A6478', bg: 'rgba(90,100,120,0.10)' },
};

export function KpiCard({ label, value, sub, icon, tone = 'default', onClick }: KpiCardProps) {
  const palette = TONES[tone] ?? TONES.default;

  return (
    <Card
      elevation={0}
      onClick={onClick}
      sx={{
        borderRadius: 2,
        border: '1px solid #E4E9F2',
        bgcolor: '#FFFFFF',
        boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
        height: '100%',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
        '&:hover': onClick
          ? { borderColor: '#C9D2E3', boxShadow: '0 6px 16px rgba(15, 23, 42, 0.08)' }
          : undefined,
      }}
    >
      <CardContent
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 1.5,
          p: 2,
          '&:last-child': { pb: 2 },
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography
            variant="body2"
            sx={{ color: '#5A6478', fontWeight: 600, fontSize: 12.5, lineHeight: 1.3 }}
          >
            {label}
          </Typography>
          <Typography
            sx={{
              mt: 0.75,
              color: '#111D32',
              fontWeight: 700,
              fontSize: 24,
              lineHeight: 1.15,
              letterSpacing: '-0.01em',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {value}
          </Typography>
          {sub ? (
            <Typography
              variant="caption"
              sx={{ mt: 0.5, display: 'block', color: '#8A93A6', fontSize: 11.5, lineHeight: 1.35 }}
            >
              {sub}
            </Typography>
          ) : null}
        </Box>
        {icon ? (
          <Box
            sx={{
              width: 38,
              height: 38,
              borderRadius: '10px',
              bgcolor: palette.bg,
              color: palette.fg,
              display: 'grid',
              placeItems: 'center',
              flexShrink: 0,
            }}
          >
            {icon}
          </Box>
        ) : null}
      </CardContent>
    </Card>
  );
}

export default KpiCard;