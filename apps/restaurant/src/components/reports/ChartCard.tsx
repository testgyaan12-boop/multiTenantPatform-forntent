import { Box, Paper, Stack, Typography } from '@mui/material';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  height?: number;
  noPadding?: boolean;
}

export function ChartCard({ title, subtitle, children, height = 300, noPadding = false }: ChartCardProps) {
  return (
    <Paper
      sx={{
        border: '1px solid #E4E9F2',
        borderRadius: 5,
        p: noPadding ? 0 : 2,
        overflow: 'hidden',
        background: '#fff',
        minHeight: height + (noPadding ? 0 : 80),
      }}
    >
      {!noPadding && (
        <Box sx={{ p: 2, borderBottom: '1px solid #F1F4F8', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Stack spacing={0.5}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {title}
            </Typography>
            {subtitle && <Typography variant="caption" color="text.secondary" sx={{ fontSize: 11 }}>{subtitle}</Typography>}
          </Stack>
        </Box>
      )}
      <Box sx={{ p: noPadding ? 0 : 2, minHeight: height }}>{children}</Box>
    </Paper>
  );
}
