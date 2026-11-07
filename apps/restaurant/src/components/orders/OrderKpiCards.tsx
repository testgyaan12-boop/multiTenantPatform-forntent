import { Box, Card, Skeleton, Typography } from '@mui/material';
import { BadgeCheck, Coins, FileText, Receipt } from 'lucide-react';
import type { OrderCountsResponse, SalesSummary } from '@resto/types';
import { useRestaurant } from '@/context/RestaurantContext';
import { formatMoney } from '@/format';

interface OrderKpiCardsProps {
  counts: OrderCountsResponse | undefined;
  summary: SalesSummary | undefined;
  isLoading: boolean;
  days: number;
}

interface CardDef {
  label: string;
  value: string;
  description: string;
  icon: typeof Coins;
  accent: string;
}

export function OrderKpiCards({ counts, summary, isLoading, days }: OrderKpiCardsProps) {
  const { profile, activeBranch } = useRestaurant();
  const currency = profile?.currency ?? 'INR';
  const periodLabel = days === 1 ? 'Today' : `Last ${days} days`;

  const completed = (counts?.byStatus?.COMPLETED ?? 0) + (counts?.byStatus?.SERVED ?? 0);

  const cards: CardDef[] = [
    {
      label: 'Total orders',
      value: counts ? String(counts.total) : '—',
      description: `${periodLabel} · ${activeBranch?.name ?? 'all branches'}`,
      icon: FileText,
      accent: '#3B82F6',
    },
    {
      label: days === 1 ? 'Revenue today' : 'Revenue',
      value: summary ? formatMoney(summary.grossRevenue, currency) : '—',
      description: `${periodLabel} · paid & unpaid orders`,
      icon: Coins,
      accent: '#16A36A',
    },
    {
      label: 'Completed orders',
      value: counts ? String(completed) : '—',
      description: 'Served and completed',
      icon: BadgeCheck,
      accent: '#3B82F6',
    },
    {
      label: 'Average order value',
      value: summary ? formatMoney(summary.averageTicket, currency) : '—',
      description:
        summary && summary.orderCount === 0
          ? 'No orders in this period'
          : `${periodLabel} · per order`,
      icon: Receipt,
      accent: '#8B5CF6',
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
                  <Skeleton sx={{ width: 90, height: 30, mt: 0.5 }} />
                ) : (
                  <Typography
                    noWrap
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
