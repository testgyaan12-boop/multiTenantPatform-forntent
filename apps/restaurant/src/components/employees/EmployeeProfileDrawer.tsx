import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Alert, Box, Button, Chip, CircularProgress, Drawer, IconButton, Tab, Tabs, Typography } from '@mui/material';
import { X, ClipboardList } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { AuditHistoryEntry, Employee, EmployeePerformance, StaffTask } from '@resto/types';
import { employeeApi } from '@/api';
import { initials, roleMeta, TASK_STATUS_META, formatMinutes } from './employeeUtils';

interface EmployeeProfileDrawerProps {
  open: boolean;
  employee: Employee | null;
  tasks: StaffTask[];
  from: string;
  to: string;
  canManage: boolean;
  onClose: () => void;
  onAssignTask: (employee: Employee) => void;
  onUpdateStatus: (task: StaffTask, status: string) => void;
}

export function EmployeeProfileDrawer({
  open,
  employee,
  tasks,
  from,
  to,
  canManage,
  onClose,
  onAssignTask,
  onUpdateStatus,
}: EmployeeProfileDrawerProps) {
  const [tab, setTab] = useState(0);
  const employeeTasks = useMemo(
    () => (employee ? tasks.filter((task) => task.assignedToEmployeeId === employee.id) : []),
    [tasks, employee],
  );
  const done = employeeTasks.filter((task) => task.status === 'COMPLETED').length;
  const pending = employeeTasks.filter((task) => task.status !== 'COMPLETED' && task.status !== 'CANCELLED').length;
  const overdue = employeeTasks.filter((task) => task.overdue).length;

  const performance = useQuery({
    queryKey: ['employee-performance', employee?.id, from, to],
    enabled: open && employee != null,
    queryFn: () => employeeApi.performance(employee!.id, from, to),
  });
  const history = useQuery({
    queryKey: ['employee-history', employee?.id],
    enabled: open && employee != null && canManage,
    queryFn: () => employeeApi.history(employee!.id),
  });

  const meta = employee ? roleMeta(employee.roles?.[0]) : null;
  const perf: EmployeePerformance | undefined = performance.data;

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: {
            width: { xs: '100vw', sm: 520 },
            borderLeft: { sm: '1px solid' },
            borderLeftColor: { sm: 'divider' },
            backgroundImage: 'none',
          },
        },
      }}
    >
      {employee && meta ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <Box
            sx={{
              px: 2.5,
              py: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              borderBottom: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                bgcolor: meta.bg,
                color: meta.color,
                display: 'grid',
                placeItems: 'center',
                fontWeight: 800,
                flexShrink: 0,
              }}
            >
              {initials(employee.fullName)}
            </Box>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography noWrap sx={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.01em' }}>
                {employee.fullName}
              </Typography>
              <Typography noWrap sx={{ fontSize: 12.5, color: 'text.secondary' }}>
                {employee.employeeCode} · {employee.email}
              </Typography>
            </Box>
            <IconButton size="small" aria-label="Close profile" onClick={onClose}>
              <X size={18} />
            </IconButton>
          </Box>

          <Tabs
            value={tab}
            onChange={(_, value) => setTab(value)}
            variant="scrollable"
            allowScrollButtonsMobile
            sx={{ px: 2, borderBottom: '1px solid', borderColor: 'divider', minHeight: 44 }}
          >
            <Tab label="Profile" sx={{ minHeight: 44, fontSize: 13, fontWeight: 600 }} />
            <Tab label="Activity" sx={{ minHeight: 44, fontSize: 13, fontWeight: 600 }} />
            <Tab label="Performance" sx={{ minHeight: 44, fontSize: 13, fontWeight: 600 }} />
            <Tab label="History" sx={{ minHeight: 44, fontSize: 13, fontWeight: 600 }} />
          </Tabs>

          <Box sx={{ flex: 1, overflowY: 'auto', px: 2.5, py: 2.5, display: 'grid', gap: 2, alignContent: 'start' }}>
            {tab === 0 ? (
              <>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                  <Chip size="small" label={meta.label} sx={{ height: 24, fontSize: 11.5, fontWeight: 700, bgcolor: meta.bg, color: meta.color, border: 'none' }} />
                  <Chip
                    size="small"
                    label={employee.onDuty ? 'On duty' : 'Off duty'}
                    sx={{
                      height: 24,
                      fontSize: 11.5,
                      fontWeight: 700,
                      bgcolor: employee.onDuty ? '#E7F8F0' : '#F1F3F7',
                      color: employee.onDuty ? '#16A36A' : '#718096',
                      border: 'none',
                    }}
                  />
                  <Chip
                    size="small"
                    label={employee.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                    sx={{
                      height: 24,
                      fontSize: 11.5,
                      fontWeight: 700,
                      bgcolor: employee.status === 'ACTIVE' ? '#E7F8F0' : '#FEECEB',
                      color: employee.status === 'ACTIVE' ? '#16A36A' : '#DC2626',
                      border: 'none',
                    }}
                  />
                </Box>
                <InfoRow label="Branch" value={employee.branchName ?? '—'} />
                <InfoRow label="Job title" value={employee.jobTitle ?? '—'} />
                <InfoRow label="Shift" value={employee.shiftName ?? 'Not assigned'} />
                <InfoRow label="Joined" value={employee.hiredAt ?? '—'} />
                <InfoRow label="Phone" value={employee.phone ?? '—'} />
                <InfoRow label="Last login" value={employee.lastLoginAt ? new Date(employee.lastLoginAt).toLocaleString() : 'Never'} />
                {canManage ? (
                  <Button variant="outlined" startIcon={<ClipboardList size={15} />} onClick={() => onAssignTask(employee)} sx={{ justifySelf: 'start' }}>
                    Assign task
                  </Button>
                ) : null}
              </>
            ) : null}

            {tab === 1 ? (
              <>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1.25 }}>
                  <MiniStat label="Assigned" value={String(done + pending)} accent="#3B82F6" />
                  <MiniStat label="Completed" value={String(done)} accent="#16A36A" />
                  <MiniStat label="Pending" value={String(pending)} accent="#F59E0B" />
                </Box>
                {overdue > 0 ? (
                  <Alert severity="warning" variant="outlined" sx={{ borderRadius: '10px', fontSize: 12.5 }}>
                    {overdue} task{overdue === 1 ? '' : 's'} overdue — follow up.
                  </Alert>
                ) : null}
                <Box sx={{ display: 'grid', gap: 1 }}>
                  <Typography sx={{ fontSize: 13, fontWeight: 700 }}>Assigned tasks</Typography>
                  {employeeTasks.length === 0 ? (
                    <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>No tasks in the selected range.</Typography>
                  ) : (
                    employeeTasks.slice(0, 12).map((task) => {
                      const statusMeta = TASK_STATUS_META[task.status] ?? { label: task.status, color: '#718096', bg: '#F1F3F7' };
                      return (
                        <Box
                          key={task.id}
                          sx={{
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: '12px',
                            p: 1.25,
                            display: 'grid',
                            gap: 0.5,
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                            <Typography noWrap sx={{ fontSize: 13, fontWeight: 700 }}>
                              {task.title}
                            </Typography>
                            <Chip
                              size="small"
                              label={statusMeta.label}
                              sx={{ height: 20, fontSize: 10.5, fontWeight: 700, bgcolor: statusMeta.bg, color: statusMeta.color, border: 'none' }}
                            />
                          </Box>
                          <Typography sx={{ fontSize: 11.5, color: 'text.secondary' }}>
                            {task.tableNumber ? `Table ${task.tableNumber} · ` : ''}
                            {task.orderNumber ? `Order ${task.orderNumber} · ` : ''}
                            {task.dueAt ? `Due ${new Date(task.dueAt).toLocaleString()}` : 'No due time'}
                            {task.overdue ? ' · Overdue' : ''}
                          </Typography>
                          {canManage && task.status !== 'COMPLETED' && task.status !== 'CANCELLED' ? (
                            <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
                              {task.status === 'ASSIGNED' || task.status === 'ACCEPTED' ? (
                                <Button size="small" onClick={() => onUpdateStatus(task, 'IN_PROGRESS')} sx={{ fontSize: 11.5 }}>
                                  Start
                                </Button>
                              ) : null}
                              <Button size="small" color="success" onClick={() => onUpdateStatus(task, 'COMPLETED')} sx={{ fontSize: 11.5 }}>
                                Complete
                              </Button>
                            </Box>
                          ) : null}
                        </Box>
                      );
                    })
                  )}
                </Box>
              </>
            ) : null}

            {tab === 2 ? (
              performance.isPending ? (
                <Box sx={{ display: 'grid', placeItems: 'center', py: 6 }}>
                  <CircularProgress size={26} />
                </Box>
              ) : performance.isError ? (
                <Alert severity="error" variant="outlined" sx={{ borderRadius: '10px' }}>
                  Failed to load performance data.
                </Alert>
              ) : perf ? (
                <>
                  <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
                    {perf.from} → {perf.to} · real task and order data
                  </Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1.25 }}>
                    <MiniStat label="Tasks completed" value={String(perf.tasksCompleted)} accent="#16A36A" />
                    <MiniStat
                      label="Completion rate"
                      value={perf.completionRate == null ? 'No data' : `${perf.completionRate}%`}
                      accent="#3B82F6"
                    />
                    <MiniStat label="Avg completion" value={formatMinutes(perf.avgCompletionMinutes)} accent="#F59E0B" />
                    <MiniStat
                      label="Orders handled"
                      value={perf.ordersHandled == null ? 'Not tracked' : String(perf.ordersHandled)}
                      accent="#7C3AED"
                      muted={perf.ordersHandled == null}
                    />
                    <MiniStat
                      label="Avg confirm time"
                      value={formatMinutes(perf.avgConfirmationMinutes)}
                      accent="#0F766E"
                      muted={perf.avgConfirmationMinutes == null}
                    />
                    <MiniStat
                      label="Tables served"
                      value={perf.tablesServed == null ? '—' : String(perf.tablesServed)}
                      accent="#DC2626"
                    />
                  </Box>
                  {!perf.attendanceTracked ? (
                    <Alert severity="info" variant="outlined" sx={{ borderRadius: '10px', fontSize: 12.5 }}>
                      Attendance & punctuality tracking needs to be enabled in the backend to show this metric.
                    </Alert>
                  ) : null}
                  {perf.history.some((point) => point.assigned > 0 || point.completed > 0) ? (
                    <Box sx={{ height: 200, mt: 1 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={perf.history} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#E4E7EC" vertical={false} />
                          <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#718096' }} tickFormatter={(value: string) => value.slice(5)} />
                          <YAxis tick={{ fontSize: 10, fill: '#718096' }} allowDecimals={false} />
                          <ChartTooltip cursor={{ fill: '#F4F6F9' }} />
                          <Bar dataKey="assigned" name="Assigned" fill="#CBD5E1" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="completed" name="Completed" fill="#16A36A" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </Box>
                  ) : (
                    <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>
                      No task activity in this range.
                    </Typography>
                  )}
                </>
              ) : null
            ) : null}

            {tab === 3 ? (
              history.isPending ? (
                <Box sx={{ display: 'grid', placeItems: 'center', py: 6 }}>
                  <CircularProgress size={26} />
                </Box>
              ) : history.isError ? (
                <Alert severity="info" variant="outlined" sx={{ borderRadius: '10px', fontSize: 12.5 }}>
                  Audit history requires the audit.read permission.
                </Alert>
              ) : (history.data ?? []).length === 0 ? (
                <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>No recorded changes yet.</Typography>
              ) : (
                <Box sx={{ display: 'grid', gap: 1 }}>
                  {(history.data ?? []).map((entry: AuditHistoryEntry) => (
                    <Box key={entry.id} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '12px', p: 1.25 }}>
                      <Typography sx={{ fontSize: 13, fontWeight: 700 }}>
                        {entry.action.replace(/_/g, ' ').toLowerCase().replace(/^./, (c) => c.toUpperCase())}
                      </Typography>
                      <Typography sx={{ fontSize: 11.5, color: 'text.secondary' }}>
                        {entry.actorEmail ?? 'system'} · {new Date(entry.createdAt).toLocaleString()}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              )
            ) : null}
          </Box>
        </Box>
      ) : null}
    </Drawer>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
      <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>{label}</Typography>
      <Typography sx={{ fontSize: 13, fontWeight: 600, textAlign: 'right' }}>{value}</Typography>
    </Box>
  );
}

function MiniStat({ label, value, accent, muted }: { label: string; value: string; accent: string; muted?: boolean }) {
  return (
    <Box
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: '12px',
        p: 1.25,
        display: 'grid',
        gap: 0.25,
        minWidth: 0,
      }}
    >
      <Typography noWrap sx={{ fontSize: 11, fontWeight: 600, color: 'text.secondary' }}>
        {label}
      </Typography>
      <Typography sx={{ fontSize: 18, fontWeight: 800, color: muted ? 'text.disabled' : accent }}>{value}</Typography>
    </Box>
  );
}
