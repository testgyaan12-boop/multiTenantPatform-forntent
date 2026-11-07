import { Box, Button, Card, Typography } from '@mui/material';
import { BarChart3, ChevronRight, Settings2, Store } from 'lucide-react';

interface ManagementActionCardsProps {
  onAnalytics: () => void;
  onManageBranches: () => void;
  onEditProfile: () => void;
}

const CARDS = [
  {
    key: 'performance',
    title: 'Business Performance',
    description:
      'Revenue trends, order volume, branch comparisons and top-selling items across your locations.',
    icon: BarChart3,
    accent: '#3B82F6',
    actionLabel: 'View Analytics',
  },
  {
    key: 'settings',
    title: 'Branch Settings',
    description:
      'Operating hours, branch contacts, order acceptance and per-location configuration.',
    icon: Settings2,
    accent: '#7C3AED',
    actionLabel: 'Manage Branches',
  },
  {
    key: 'profile',
    title: 'Restaurant Profile',
    description:
      'Branding, contact details, business information and public-facing restaurant data.',
    icon: Store,
    accent: '#F4511E',
    actionLabel: 'Edit Profile',
  },
] as const;

export function ManagementActionCards({ onAnalytics, onManageBranches, onEditProfile }: ManagementActionCardsProps) {
  const handlers: Record<string, () => void> = {
    performance: onAnalytics,
    settings: onManageBranches,
    profile: onEditProfile,
  };

  return (
    <Box
      sx={{
        display: 'grid',
        gap: 1.75,
        gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' },
      }}
    >
      {CARDS.map((card) => {
        const Icon = card.icon;
        return (
          <Card
            key={card.key}
            sx={{
              borderRadius: '14px',
              border: '1px solid',
              borderColor: 'divider',
              boxShadow: '0 1px 2px rgba(16,24,40,0.04)',
              p: 2.25,
              display: 'grid',
              gap: 1.25,
              alignContent: 'start',
              transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
              '&:hover': {
                borderColor: `${card.accent}55`,
                boxShadow: '0 4px 16px rgba(16,24,40,0.08)',
              },
            }}
          >
            <Box
              sx={{
                width: 38,
                height: 38,
                borderRadius: '10px',
                bgcolor: `${card.accent}14`,
                color: card.accent,
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <Icon size={19} />
            </Box>
            <Typography sx={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.01em' }}>{card.title}</Typography>
            <Typography sx={{ fontSize: 12.5, color: 'text.secondary', lineHeight: 1.55 }}>{card.description}</Typography>
            <Button
              variant="text"
              endIcon={<ChevronRight size={15} />}
              onClick={handlers[card.key]}
              sx={{
                justifySelf: 'start',
                mt: 0.5,
                px: 0,
                fontSize: 13,
                fontWeight: 700,
                color: card.accent,
                '&:hover': { bgcolor: 'transparent', opacity: 0.8 },
              }}
            >
              {card.actionLabel}
            </Button>
          </Card>
        );
      })}
    </Box>
  );
}
