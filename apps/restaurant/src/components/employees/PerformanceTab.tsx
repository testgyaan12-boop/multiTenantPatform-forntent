import { useMemo } from 'react';
import {
  Alert,
  Box,
  Card,
  Chip,
  LinearProgress,
  Typography,
} from '@mui/material';
import { CheckCircle2, ClipboardList, Clock, TrendingUp, Utensils } from 'lucide-react';
import type { Employee, EmployeePerformance } from '@resto/types';
import { initials, roleMeta, formatMinutes, isKitchenRole } from './employeeUtils';

interface PerformanceTabProps {
  employees: Employee[];
  performanceById: Record<number, EmployeePerformance | undefined>;
}

export function PerformanceTab({ employees, performanceById }: PerformanceTabProps) {
  const rows = useMemo(
    () =>
      employees
        .map((employee) => ({ employee, perf: performanceById[employee.id] }))
        .filter((row) => row.perf != null) as { employee: Employee; perf: EmployeePerformance }[],
    [employees, performanceById],
  );

  const totals = useMemo(() => {
    let assigned = 0;
    let completed = 0;
    let completionMinutesSum = 0;
    let completionMinutesCount = 0;
    let ordersHandled = 0;
    let tablesServed = 0;
    let confirmationsWithTime = 0;
    let confirmationMinutesSum = 0;
    for (const { perf } of rows) {
      assigned += perf.tasksAssigned;
      completed += perf.tasksCompleted;
      if (perf.avgCompletionMinutes != null) {
        completionMinutesSum += perf.avgCompletionMinutes;
        completionMinutesCount += 1;
      }
      ordersHandled += perf.ordersHandled ?? 0;
      tablesServed += perf.tablesServed ?? 0;
      if (perf.avgConfirmationMinutes != null) {
        confirmationMinutesSum += perf.avgConfirmationMinutes;
        confirmationsWithTime += 1;
      }
    }
    return {
      assigned,
      completed,
      completionRate: assigned > 0 ? Math.round((completed / assigned) * 100) : null,
      avgCompletionMinutes: completionMinutesCount > 0 ? completionMinutesSum / completionMinutesCount : null,
      ordersHandled,
      tablesServed,
      avgConfirmationMinutes: confirmationsWithTime > 0 ? confirmationMinutesSum / confirmationsWithTime : null,
    };
  }, [rows]);

  if (rows.length === 0) {
    return (
      <Box sx={{ display: 'grid', gap: 1.5, justifyItems: 'center', py: 6, textAlign: 'center' }}>
        <Typography sx={{ fontSize: 15, fontWeight: 700 }}>No performance data yet</Typography>
        <Typography sx={{ fontSize: 13, color: 'text.secondary', maxWidth: 420 }}>
          Metrics appear once employees have assigned tasks in the selected date range.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'grid', gap: 1.75 }}>
      <Box
        sx={{
          display: 'grid',
          gap: 1.5,
          gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', md: 'repeat(3, minmax(0, 1fr))', xl: 'repeat(6, minmax(0, 1fr))' },
        }}
      >
        <SummaryCard icon={<ClipboardList size={16} />} label="Tasks assigned" value={String(totals.assigned)} accent="#3B82F6" />
        <SummaryCard icon={<CheckCircle2 size={16} />} label="Tasks completed" value={String(totals.completed)} accent="#16A36A" />
        <SummaryCard
          icon={<TrendingUp size={16} />}
          label="Completion rate"
          value={totals.completionRate == null ? 'No data' : `${totals.completionRate}%`}
          accent="#7C3AED"
        />
        <SummaryCard
          icon={<Clock size={16} />}
          label="Avg completion"
          value={formatMinutes(totals.avgCompletionMinutes)}
          accent="#F59E0B"
        />
        <SummaryCard
          icon={<Utensils size={16} />}
          label="Tables served"
          value={String(totals.tablesServed)}
          accent="#DC2626"
        />
        <SummaryCard
          icon={<Clock size={16} />}
          label="Avg order confirm"
          value={formatMinutes(totals.avgConfirmationMinutes)}
          accent="#0F766E"
          muted={totals.avgConfirmationMinutes == null}
        />
      </Box>

      <Alert severity="info" variant="outlined" sx={{ borderRadius: '10px', fontSize: 12.5 }}>
        All metrics are computed from real task and order-status-history data on the backend. Attendance and
        punctuality tracking is not enabled yet — enable it in the backend to show shift adherence here.
      </Alert>

      <Card sx={{ borderRadius: '14px', border: '1px solid', borderColor: 'divider', boxShadow: 'none', overflow: 'auto' }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: 'minmax(200px, 2fr) repeat(4, minmax(90px, 1fr)) minmax(120px, 1.2fr)', lg: 'minmax(220px, 2.2fr) repeat(5, minmax(100px, 1fr)) minmax(140px, 1.4fr)' },
            gap: 1,
            px: 2,
            py: 1.25,
            borderBottom: '1px solid',
            borderColor: 'divider',
            bgcolor: '#F8F9FB',
            minWidth: 720,
          }}
        >
          {['Employee', 'Assigned', 'Completed', 'Rate', 'Avg time', 'Tables / Orders', 'Role fit'].map((label) => (
            <Typography key={label} sx={{ fontSize: 11, fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.04 }}>
              {label}
            </Typography>
          ))}
        </Box>
        {rows.map(({ employee, perf }) => {
          const meta = roleMeta(employee.roles?.[0]);
          const rate = perf.tasksAssigned > 0 ? Math.round((perf.tasksCompleted / perf.tasksAssigned) * 100) : 0;
          const kitchen = isKitchenRole(employee);
          return (
            <Box
              key={employee.id}
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: 'minmax(200px, 2fr) repeat(4, minmax(90px, 1fr)) minmax(120px, 1.2fr)', lg: 'minmax(220px, 2.2fr) repeat(5, minmax(100px, 1fr)) minmax(140px, 1.4fr)' },
                gap: 1,
                px: 2,
                py: 1.25,
                borderBottom: '1px solid',
                borderColor: 'divider',
                alignItems: 'center',
                minWidth: 720,
                '&:last-child': { borderBottom: 'none' },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                <Box
                  sx={{
                    width: 30,
                    height: 30,
                    borderRadius: '50%',
                    bgcolor: meta.bg,
                    color: meta.color,
                    display: 'grid',
                    placeItems: 'center',
                    fontWeight: 800,
                    fontSize: 11,
                    flexShrink: 0,
                  }}
                >
                  {initials(employee.fullName)}
                </Box>
                <Box sx={{ minWidth: 0 }}>
                  <Typography noWrap sx={{ fontSize: 13, fontWeight: 700 }}>
                    {employee.fullName}
                  </Typography>
                  <Typography noWrap sx={{ fontSize: 11, color: 'text.secondary' }}>
                    {employee.employeeCode}
                  </Typography>
                </Box>
              </Box>
              <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{perf.tasksAssigned}</Typography>
              <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#16A36A' }}>{perf.tasksCompleted}</Typography>
              <Typography sx={{ fontSize: 13, fontWeight: 700 }}>{rate}%</Typography>
              <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>{formatMinutes(perf.avgCompletionMinutes)}</Typography>
              <Box sx={{ display: 'grid', gap: 0.25 }}>
                <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
                  {perf.tablesServed ?? '—'} tables · {perf.ordersHandled ?? 'n/a'} orders
                </Typography>
                {perf.avgConfirmationMinutes != null ? (
                  <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>confirm {formatMinutes(perf.avgConfirmationMinutes)}</Typography>
                ) : null}
              </Box>
              <Box sx={{ display: 'grid', gap: 0.4, minWidth: 0 }}>
                <Chip
                  size="small"
                  label={kitchen ? 'Kitchen role (no tables)' : meta.label}
                  sx={{ height: 20, fontSize: 10.5, fontWeight: 700, bgcolor: meta.bg, color: meta.color, border: 'none', justifySelf: 'start' }}
                />
                <LinearProgress
                  variant="determinate"
                  value={rate}
                  sx={{
                    height: 5,
                    borderRadius: 4,
                    bgcolor: '#F1F3F7',
                    '& .MuiLinearProgress-bar': { borderRadius: 4, bgcolor: rate >= 80 ? '#16A36A' : rate >= 50 ? '#F59E0B' : '#DC2626' },
                  }}
                />
              </Box>
            </Box>
          );
        })}
      </Card>

      <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
        Kitchen roles (Chef, Kitchen Helper) are compared on task completion and time — table and order metrics
        only apply to service roles per the backend rules.
      </Typography>
    </Box>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  accent,
  muted,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent: string;
  muted?: boolean;
}) {
  return (
    <Card sx={{ borderRadius: '12px', border: '1px solid', borderColor: 'divider', boxShadow: 'none', p: 1.5, display: 'grid', gap: 0.5, minWidth: 0 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, color: muted ? 'text.disabled' : accent }}>
        {icon}
        <Typography noWrap sx={{ fontSize: 11.5, fontWeight: 600, color: 'text.secondary' }}>
          {label}
        </Typography>
      </Box>
      <Typography noWrap sx={{ fontSize: 20, fontWeight: 800, color: muted ? 'text.disabled' : accent, letterSpacing: '-0.02em' }}>
        {value}
      </Typography>
    </Card>
  );
}
