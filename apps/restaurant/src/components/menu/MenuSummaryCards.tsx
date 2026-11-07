import { Box, Card, Skeleton, Typography } from '@mui/material';
import { Ban, FolderTree, Sparkles, Utensils } from 'lucide-react';
import type { MenuCategory, MenuItem } from '@resto/types';
import type { MenuSummary } from './menuUtils';

interface MenuSummaryCardsProps {
  summary: MenuSummary;
  items: MenuItem[] | undefined;
  categories: MenuCategory[] | undefined;
  isLoading: boolean;
}

interface CardDef {
  label: string;
  value: number;
  description: string;
  icon: typeof Utensils;
  accent: string;
}

export function MenuSummaryCards({ summary, items, categories, isLoading }: MenuSummaryCardsProps) {
  const loaded = items !== undefined && categories !== undefined;

  const cards: CardDef[] = [
    {
      label: 'Total items',
      value: summary.total,
      description: 'Across all categories',
      icon: Utensils,
      accent: '#3B82F6',
    },
    {
      label: 'Available items',
      value: summary.available,
      description: 'Ready to order',
      icon: Sparkles,
      accent: '#16A36A',
    },
    {
      label: 'Unavailable items',
      value: summary.unavailable,
      description: 'Hidden from guests',
      icon: Ban,
      accent: '#DC2626',
    },
    {
      label: 'Categories',
      value: summary.categories,
      description: 'Active menu sections',
      icon: FolderTree,
      accent: '#F59E0B',
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
                {!loaded || isLoading ? (
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
