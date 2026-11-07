import { useMemo } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Skeleton,
  Typography,
} from '@mui/material';
import { ArrowRight, TrendingUp } from 'lucide-react';
import { ErrorState, EmptyState } from '@resto/ui';
import type { SalesSummary } from '@resto/types';
import { useRestaurant } from '@/context/RestaurantContext';
import { formatMoney } from '@/format';
import { thumbnailFor, useMenuCatalog } from '@/hooks/useDashboardData';

interface PopularItemsCardProps {
  summary: SalesSummary | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  onRetry: () => void;
}

export function PopularItemsCard({ summary, isLoading, isError, error, onRetry }: PopularItemsCardProps) {
  const { profile } = useRestaurant();
  const menu = useMenuCatalog();
  const currency = profile?.currency ?? 'INR';

  const topItems = useMemo(() => (summary?.topItems ?? []).slice(0, 5), [summary]);

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardHeader
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#1E7B3C' }} />
            <Typography variant="h4">Popular items</Typography>
          </Box>
        }
        action={
          <Button size="small" endIcon={<ArrowRight size={15} />} component={RouterLink} to="/reports">
            View all
          </Button>
        }
        sx={{ pb: 1.5, pt: 2.5, px: 2.5, '& .MuiCardHeader-action': { m: 0 } }}
      />
      <CardContent sx={{ pt: 0, px: 2.5, pb: 2.5, flexGrow: 1 }}>
        {isLoading ? (
          <Box sx={{ display: 'grid', gap: 1.25 }}>
            {[0, 1, 2, 3, 4].map((row) => (
              <Skeleton key={row} height={48} />
            ))}
          </Box>
        ) : null}

        {isError ? <ErrorState message={error?.message ?? 'Failed to load'} onRetry={onRetry} /> : null}

        {!isLoading && !isError && topItems.length === 0 ? (
          <EmptyState
            title="No sales yet"
            description="Top-selling items will show up here once orders come in."
          />
        ) : null}

        {topItems.length > 0 ? (
          <Box sx={{ display: 'grid', gap: 0.75 }}>
            {topItems.map((item, index) => {
              const thumbnail = thumbnailFor(item.name, menu.data);
              return (
                <Box
                  key={`${item.name}-${index}`}
                  sx={{ display: 'flex', alignItems: 'center', gap: 1.25, py: 0.5 }}
                >
                  <Typography sx={{ width: 16, fontSize: 12, fontWeight: 700, color: 'text.secondary', textAlign: 'center' }}>
                    {index + 1}
                  </Typography>
                  {thumbnail ? (
                    <Box
                      component="img"
                      src={thumbnail}
                      alt=""
                      sx={{ width: 44, height: 44, borderRadius: '10px', objectFit: 'cover', border: '1px solid', borderColor: 'divider' }}
                    />
                  ) : (
                    <Box
                      sx={{
                        width: 44,
                        height: 44,
                        borderRadius: '10px',
                        display: 'grid',
                        placeItems: 'center',
                        bgcolor: '#FFF1EB',
                        color: '#D9481E',
                        fontWeight: 700,
                        fontSize: 16,
                      }}
                    >
                      {item.name.charAt(0).toUpperCase()}
                    </Box>
                  )}
                  <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                    <Typography noWrap sx={{ fontSize: 13.5, fontWeight: 600 }}>
                      {item.name}
                    </Typography>
                    <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
                      {item.quantity} sold
                    </Typography>
                  </Box>
                  <Typography sx={{ fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap' }}>
                    {formatMoney(item.revenue, currency)}
                  </Typography>
                </Box>
              );
            })}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 1, color: 'text.secondary' }}>
              <TrendingUp size={14} />
              <Typography sx={{ fontSize: 12 }}>
                Ranked by revenue for the selected period
              </Typography>
            </Box>
          </Box>
        ) : null}
      </CardContent>
    </Card>
  );
}
