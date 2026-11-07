import { Box, Card, Skeleton, Typography } from '@mui/material';
import {
  AlertCircle,
  CheckCircle2,
  ChefHat,
  LayoutGrid,
  UserCheck,
  Users,
  type LucideIcon,
} from 'lucide-react';
import type { EmployeeStats } from '@resto/types';

interface EmployeeKpiCardsProps {
  stats?: EmployeeStats;
  tasksPending: number;
  tasksCompleted: number;
  isLoading: boolean;
  tasksAvailable: boolean;
}

interface CardDef {
  label: string;
  value: string;
  description: string;
  icon: LucideIcon;
  accent: string;
  unavailable?: boolean;
}

const KITCHEN_CODES = ['CHEF', 'KITCHEN_HELPER', 'KITCHEN'];
const MANAGER_CODES = ['TENANT_OWNER', 'TENANT_MANAGER', 'BRANCH_MANAGER'];

export function EmployeeKpiCards({
  stats,
  tasksPending,
  tasksCompleted,
  isLoading,
  tasksAvailable,
}: EmployeeKpiCardsProps) {
  const kitchen = KITCHEN_CODES.reduce((sum, code) => sum + (stats?.byRole?.[code] ?? 0), 0);
  const managers = MANAGER_CODES.reduce((sum, code) => sum + (stats?.byRole?.[code] ?? 0), 0);
  const totalCompleted = tasksAvailable ? tasksCompleted : null;
  const totalPending = tasksAvailable ? tasksPending : null;
  const rate =
    tasksAvailable && tasksPending + tasksCompleted > 0
      ? Math.round((tasksCompleted / (tasksPending + tasksCompleted)) * 100)
      : null;

  const cards: CardDef[] = [
    {
      label: 'Total employees',
      value: String(stats?.total ?? 0),
      description: 'Active accounts in this branch',
      icon: Users,
      accent: '#3B82F6',
    },
    {
      label: 'On duty',
      value: String(stats?.onDuty ?? 0),
      description: 'Clocked in right now',
      icon: UserCheck,
      accent: '#16A36A',
    },
    {
      label: 'Managers',
      value: String(managers),
      description: 'Owner & manager roles',
      icon: LayoutGrid,
      accent: '#7C3AED',
    },
    {
      label: 'Kitchen team',
      value: String(kitchen),
      description: 'Chefs & kitchen helpers',
      icon: ChefHat,
      accent: '#DC2626',
    },
    {
      label: 'Tasks pending',
      value: totalPending == null ? '—' : String(totalPending),
      description: totalPending == null ? 'Task tracking not available' : 'Open tasks in range',
      icon: AlertCircle,
      accent: '#F59E0B',
      unavailable: totalPending == null,
    },
    {
      label: 'Tasks completed',
      value: totalCompleted == null ? '—' : String(totalCompleted),
      description:
        rate == null
          ? totalCompleted == null
            ? 'Task tracking not available'
            : 'No tasks in range'
          : `${rate}% completion rate`,
      icon: CheckCircle2,
      accent: '#16A36A',
      unavailable: totalCompleted == null,
    },
  ];

  return (
    <Box
      sx={{
        display: 'grid',
        gap: 2,
        gridTemplateColumns: {
          xs: 'repeat(2, minmax(0, 1fr))',
          md: 'repeat(3, minmax(0, 1fr))',
          xl: 'repeat(6, minmax(0, 1fr))',
        },
      }}
    >
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.label} sx={{ p: 2, minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
              <Box sx={{ minWidth: 0 }}>
                <Typography noWrap sx={{ fontSize: 12, fontWeight: 600, color: 'text.secondary' }}>
                  {card.label}
                </Typography>
                {isLoading ? (
                  <Skeleton sx={{ width: 60, height: 30, mt: 0.5 }} />
                ) : (
                  <Typography
                    sx={{
                      fontSize: 26,
                      fontWeight: 700,
                      lineHeight: 1.2,
                      mt: 0.25,
                      letterSpacing: '-0.02em',
                      color: card.unavailable ? 'text.disabled' : undefined,
                    }}
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
