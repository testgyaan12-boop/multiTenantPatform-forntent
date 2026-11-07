import { Box, Card, Skeleton, Typography } from '@mui/material';
import { Armchair, LayoutGrid, UserCheck, Users } from 'lucide-react';
import type { TableSummary } from './tablesUtils';

interface TableSummaryCardsProps {
  summary: TableSummary;
  isLoading: boolean;
}

interface CardDef {
  label: string;
  value: string;
  description: string;
  icon: typeof Users;
  accent: string;
}

export function TableSummaryCards({ summary, isLoading }: TableSummaryCardsProps) {
  const cards: CardDef[] = [
    {
      label: 'Total tables',
      value: String(summary.total),
      description: 'In this branch',
      icon: LayoutGrid,
      accent: '#3B82F6',
    },
    {
      label: 'Available',
      value: String(summary.available),
      description: 'Ready for guests',
      icon: UserCheck,
      accent: '#16A36A',
    },
    {
      label: 'Occupied',
      value: String(summary.occupied),
      description: 'Active dine-in orders',
      icon: Users,
      accent: '#DC2626',
    },
    {
      label: 'Total seating capacity',
      value: String(summary.seating),
      description: 'Seats across all tables',
      icon: Armchair,
      accent: '#7C3AED',
    },
  ];

  return (
    <Box
      sx={{
        display: 'grid',
        gap: 2,
        gridTemplateColumns: {
          xs: 'repeat(2, minmax(0, 1fr))',
          md: 'repeat(4, minmax(0, 1fr))',
        },
      }}
    >
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.label} sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontSize: 12, fontWeight: 600, color: 'text.secondary' }}>
                  {card.label}
                </Typography>
                {isLoading ? (
                  <Skeleton sx={{ width: 70, height: 30, mt: 0.5 }} />
                ) : (
                  <Typography
                    sx={{ fontSize: 26, fontWeight: 700, lineHeight: 1.2, mt: 0.25, letterSpacing: '-0.02em' }}
                  >
                    {card.value}
                  </Typography>
                )}
                <Typography noWrap sx={{ fontSize: 11.5, color: 'text.secondary', mt: 0.5 }}>
                  {card.description}
                </Typography>
              </Box>
              <Box
                sx={{
                  width: 38,
                  height: 38,
                  borderRadius: '12px',
                  display: 'grid',
                  placeItems: 'center',
                  flexShrink: 0,
                  bgcolor: `${card.accent}14`,
                  color: card.accent,
                }}
              >
                <Icon size={18} />
              </Box>
            </Box>
          </Card>
        );
      })}
    </Box>
  );
}
