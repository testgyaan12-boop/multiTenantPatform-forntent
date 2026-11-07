import { Box, Card, Skeleton, Typography } from '@mui/material';
import { ArrowDownRight, ArrowUpRight, Building2, ClipboardList, DollarSign, Users } from 'lucide-react';
import type { CustomerSummary, SalesSummary } from '@resto/types';
import { formatMoney } from '@/format';
import { percentChange } from './branchUtils';

interface BranchKpiCardsProps {
  totalBranches: number;
  activeBranches: number;
  salesCurrent?: SalesSummary;
  salesPrevious?: SalesSummary;
  customers?: CustomerSummary;
  isLoading: boolean;
  currency: string;
}

interface CardDef {
  label: string;
  value: string;
  description: string;
  icon: typeof Building2;
  accent: string;
  change?: number | null;
  changeAvailable: boolean;
}

export function BranchKpiCards({
  totalBranches,
  activeBranches,
  salesCurrent,
  salesPrevious,
  customers,
  isLoading,
  currency,
}: BranchKpiCardsProps) {
  const revenueChange =
    salesCurrent && salesPrevious
      ? percentChange(Number(salesCurrent.grossRevenue), Number(salesPrevious.grossRevenue))
      : null;
  const ordersChange =
    salesCurrent && salesPrevious
      ? percentChange(salesCurrent.orderCount, salesPrevious.orderCount)
      : null;
  const customersChange = customers
    ? percentChange(customers.customers, customers.previousCustomers)
    : null;

  const cards: CardDef[] = [
    {
      label: 'Total branches',
      value: String(totalBranches),
      description: `${activeBranches} active · ${totalBranches - activeBranches} paused/inactive`,
      icon: Building2,
      accent: '#3B82F6',
      changeAvailable: false,
    },
    {
      label: 'Total revenue',
      value: salesCurrent ? formatMoney(salesCurrent.grossRevenue, currency) : '—',
      description: 'Last 30 days, all branches',
      icon: DollarSign,
      accent: '#16A36A',
      change: revenueChange,
      changeAvailable: revenueChange !== null,
    },
    {
      label: 'Total orders',
      value: salesCurrent ? String(salesCurrent.orderCount) : '—',
      description: 'Last 30 days, all branches',
      icon: ClipboardList,
      accent: '#7C3AED',
      change: ordersChange,
      changeAvailable: ordersChange !== null,
    },
    {
      label: 'Total customers',
      value: customers ? String(customers.customers) : '—',
      description: customers
        ? `Ordered last 30 days · ${customers.registeredCustomers} registered`
        : 'Distinct customers, last 30 days',
      icon: Users,
      accent: '#F59E0B',
      change: customersChange,
      changeAvailable: customersChange !== null,
    },
  ];

  return (
    <Box
      sx={{
        display: 'grid',
        gap: 1.75,
        gridTemplateColumns: {
          xs: 'repeat(2, minmax(0, 1fr))',
          lg: 'repeat(4, minmax(0, 1fr))',
        },
      }}
    >
      {cards.map((card) => {
        const Icon = card.icon;
        const up = (card.change ?? 0) > 0;
        const flat = card.change === 0;
        return (
          <Card
            key={card.label}
            sx={{
              borderRadius: '14px',
              border: '1px solid',
              borderColor: 'divider',
              boxShadow: '0 1px 2px rgba(16,24,40,0.04)',
              p: 2,
              display: 'grid',
              gap: 1,
              minWidth: 0,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: '10px',
                  bgcolor: `${card.accent}14`,
                  color: card.accent,
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                <Icon size={18} />
              </Box>
              {card.changeAvailable && card.change != null ? (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.35,
                    color: flat ? 'text.secondary' : up ? '#16A36A' : '#DC2626',
                  }}
                >
                  {up ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                  <Typography sx={{ fontSize: 12, fontWeight: 700 }}>
                    {Math.abs(card.change)}%
                  </Typography>
                </Box>
              ) : null}
            </Box>
            {isLoading ? (
              <Skeleton variant="text" width="60%" height={28} />
            ) : (
              <Typography
                noWrap
                sx={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.2 }}
              >
                {card.value}
              </Typography>
            )}
            <Box>
              <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{card.label}</Typography>
              <Typography sx={{ fontSize: 11.5, color: 'text.secondary', lineHeight: 1.4 }}>
                {card.description}
              </Typography>
            </Box>
          </Card>
        );
      })}
    </Box>
  );
}
