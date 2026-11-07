import { useMemo, useState } from 'react';
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Snackbar,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import { PageHeader } from '@resto/ui';
import type {
  AssignableRole,
  Employee,
  EmployeePerformance,
  StaffTask,
} from '@resto/types';
import { employeeApi, tableApi, tableAssignmentApi, taskApi } from '@/api';
import { useAuth } from '@/auth/AuthContext';
import { useRestaurant } from '@/context/RestaurantContext';
import { AddEmployeeDrawer } from '@/components/employees/AddEmployeeDrawer';
import { EmployeeGridView } from '@/components/employees/EmployeeGridView';
import { EmployeeKpiCards } from '@/components/employees/EmployeeKpiCards';
import { EmployeeProfileDrawer } from '@/components/employees/EmployeeProfileDrawer';
import { EmployeeTableView } from '@/components/employees/EmployeeTableView';
import { EmployeeToolbar } from '@/components/employees/EmployeeToolbar';
import { PerformanceTab } from '@/components/employees/PerformanceTab';
import { TableAssignmentsBoard } from '@/components/employees/TableAssignmentsBoard';
import { TaskBoard } from '@/components/employees/TaskBoard';
import { TaskFormDrawer } from '@/components/employees/TaskFormDrawer';
import {
  defaultEmployeeFilters,
  downloadCsv,
  filterEmployees,
  type DateRangeKey,
  type EmployeeFilters,
  instantEndOf,
  instantStartOf,
  resolveDateRange,
} from '@/components/employees/employeeUtils';

type SnackState = { open: boolean; severity: 'success' | 'error' | 'info'; message: string };

const PAGE_SIZE = 200;

export function EmployeesPage() {
  const { activeBranchId, branches } = useRestaurant();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const canManage = user?.permissions?.includes('employee.manage') ?? false;
  const canReadTasks = user?.permissions?.includes('task.read') ?? canManage;

  const [tab, setTab] = useState(0);
  const [view, setView] = useState<'grid' | 'table'>('grid');
  const [filters, setFilters] = useState<EmployeeFilters>(defaultEmployeeFilters);
  const [dateKey, setDateKey] = useState<DateRangeKey>('today');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [tablePage, setTablePage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [snack, setSnack] = useState<SnackState>({ open: false, severity: 'success', message: '' });

  const [profileEmployee, setProfileEmployee] = useState<Employee | null>(null);
  const [drawerEmployee, setDrawerEmployee] = useState<Employee | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [taskDrawerOpen, setTaskDrawerOpen] = useState(false);
  const [taskEditing, setTaskEditing] = useState<StaffTask | null>(null);
  const [taskDefaultEmployeeId, setTaskDefaultEmployeeId] = useState<number | null>(null);

  const dateRange = useMemo(
    () => resolveDateRange(dateKey, { from: customFrom, to: customTo }),
    [dateKey, customFrom, customTo],
  );

  const notify = (severity: SnackState['severity'], message: string) =>
    setSnack({ open: true, severity, message });

  const invalidateAll = () => {
    void queryClient.invalidateQueries({ queryKey: ['employees'] });
    void queryClient.invalidateQueries({ queryKey: ['employee-stats'] });
    void queryClient.invalidateQueries({ queryKey: ['tasks'] });
    void queryClient.invalidateQueries({ queryKey: ['table-assignments'] });
    void queryClient.invalidateQueries({ queryKey: ['employee-performance'] });
  };

  const statsQuery = useQuery({
    queryKey: ['employee-stats', activeBranchId],
    enabled: activeBranchId != null,
    queryFn: () => employeeApi.stats(activeBranchId ?? undefined),
  });

  const rolesQuery = useQuery({
    queryKey: ['employee-roles'],
    queryFn: employeeApi.roles,
    staleTime: 5 * 60_000,
  });

  const employeesQuery = useQuery({
    queryKey: ['employees', 'list', activeBranchId, PAGE_SIZE],
    enabled: activeBranchId != null,
    queryFn: () => employeeApi.list({ branchId: activeBranchId ?? undefined, page: 0, size: PAGE_SIZE }),
  });

  const tasksQuery = useQuery({
    queryKey: ['tasks', 'branch', activeBranchId, dateRange.from, dateRange.to],
    enabled: activeBranchId != null && canReadTasks,
    queryFn: () =>
      taskApi.list({
        branchId: activeBranchId ?? undefined,
        from: instantStartOf(dateRange.from),
        to: instantEndOf(dateRange.to),
      }),
  });

  const taskSummaryQuery = useQuery({
    queryKey: ['employee-task-summary', activeBranchId, dateRange.from, dateRange.to],
    enabled: activeBranchId != null && canReadTasks,
    queryFn: () =>
      employeeApi.taskSummary({
        branchId: activeBranchId ?? undefined,
        from: instantStartOf(dateRange.from),
        to: instantEndOf(dateRange.to),
      }),
  });

  const tablesQuery = useQuery({
    queryKey: ['tables', activeBranchId],
    enabled: activeBranchId != null,
    queryFn: () => tableApi.list(activeBranchId as number),
  });

  const assignmentsQuery = useQuery({
    queryKey: ['table-assignments', activeBranchId],
    enabled: activeBranchId != null,
    queryFn: () => tableAssignmentApi.list(activeBranchId ?? undefined),
  });

  const allEmployees = employeesQuery.data?.content ?? [];
  const roles: AssignableRole[] = rolesQuery.data ?? [];
  const tasks = tasksQuery.data ?? [];
  const filtered = useMemo(() => filterEmployees(allEmployees, filters), [allEmployees, filters]);

  const performanceResults = useQueries({
    queries: filtered.map((employee) => ({
      queryKey: ['employee-performance', employee.id, dateRange.from, dateRange.to] as const,
      enabled: tab === 3,
      queryFn: () => employeeApi.performance(employee.id, dateRange.from, dateRange.to),
    })),
  });

  const performanceById = useMemo(() => {
    const map: Record<number, EmployeePerformance | undefined> = {};
    performanceResults.forEach((result, index) => {
      const employee = filtered[index];
      if (employee) map[employee.id] = result.data;
    });
    return map;
  }, [performanceResults, filtered]);

  const tasksByEmployee = useMemo(() => {
    const map = new Map<number, StaffTask[]>();
    for (const task of tasks) {
      if (task.assignedToEmployeeId == null) continue;
      const list = map.get(task.assignedToEmployeeId) ?? [];
      list.push(task);
      map.set(task.assignedToEmployeeId, list);
    }
    return map;
  }, [tasks]);

  const createEmployee = useMutation({
    mutationFn: (payload: Record<string, unknown>) => employeeApi.create(payload),
    onSuccess: (employee) => {
      invalidateAll();
      notify('success', `${employee.fullName} invited — copy the invite link.`);
    },
    onError: (error) =>
      notify('error', error instanceof Error && error.message ? error.message : 'Failed to invite employee.'),
  });

  const updateEmployee = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Record<string, unknown> }) =>
      employeeApi.update(id, payload),
    onSuccess: (employee) => {
      invalidateAll();
      notify('success', `${employee.fullName} updated.`);
    },
    onError: (error) =>
      notify('error', error instanceof Error && error.message ? error.message : 'Failed to update employee.'),
  });

  const dutyMutation = useMutation({
    mutationFn: ({ id, onDuty }: { id: number; onDuty: boolean }) => employeeApi.setDuty(id, onDuty),
    onSuccess: (employee) => {
      invalidateAll();
      notify('success', employee.onDuty ? `${employee.fullName} is now on duty.` : `${employee.fullName} is off duty.`);
    },
    onError: (error) =>
      notify('error', error instanceof Error && error.message ? error.message : 'Failed to update duty status.'),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      employeeApi.update(id, { status }),
    onSuccess: (employee) => {
      invalidateAll();
      notify('success', `${employee.fullName} is now ${employee.status.toLowerCase()}.`);
    },
    onError: (error) =>
      notify('error', error instanceof Error && error.message ? error.message : 'Failed to update status.'),
  });

  const taskCreate = useMutation({
    mutationFn: (payload: Parameters<typeof taskApi.create>[0]) => taskApi.create(payload),
    onSuccess: () => {
      invalidateAll();
      notify('success', 'Task assigned.');
    },
    onError: (error) =>
      notify('error', error instanceof Error && error.message ? error.message : 'Failed to assign task.'),
  });

  const taskUpdate = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Parameters<typeof taskApi.update>[1] }) =>
      taskApi.update(id, payload),
    onSuccess: () => {
      invalidateAll();
      notify('success', 'Task updated.');
    },
    onError: (error) =>
      notify('error', error instanceof Error && error.message ? error.message : 'Failed to update task.'),
  });

  const taskStatus = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => taskApi.updateStatus(id, status),
    onSuccess: () => {
      invalidateAll();
      notify('success', 'Task status updated.');
    },
    onError: (error) =>
      notify('error', error instanceof Error && error.message ? error.message : 'Failed to update task status.'),
  });

  const assignMutation = useMutation({
    mutationFn: ({ tableId, employeeId }: { tableId: number; employeeId: number }) =>
      tableAssignmentApi.assign({ tableId, employeeId, branchId: activeBranchId as number }),
    onSuccess: () => {
      invalidateAll();
      notify('success', 'Table assignment saved.');
    },
    onError: (error) =>
      notify('error', error instanceof Error && error.message ? error.message : 'Failed to assign table.'),
  });

  const releaseMutation = useMutation({
    mutationFn: (tableId: number) => tableAssignmentApi.release(tableId),
    onSuccess: () => {
      invalidateAll();
      notify('success', 'Table released.');
    },
    onError: (error) =>
      notify('error', error instanceof Error && error.message ? error.message : 'Failed to release table.'),
  });

  const handleExport = () => {
    const rows: (string | number)[][] = [
      ['Employee ID', 'Code', 'Name', 'Email', 'Role', 'Branch', 'Status', 'On duty', 'Job title', 'Shift'],
      ...filtered.map((employee) => [
        employee.id,
        employee.employeeCode,
        employee.fullName,
        employee.email,
        employee.roles?.join(' | ') ?? '',
        employee.branchName ?? '',
        employee.status,
        employee.onDuty ? 'Yes' : 'No',
        employee.jobTitle ?? '',
        employee.shiftName ?? '',
      ]),
    ];
    downloadCsv(`employees-${dateRange.from}-${dateRange.to}.csv`, rows);
    notify('success', `Exported ${filtered.length} employee${filtered.length === 1 ? '' : 's'}.`);
  };

  const openAddDrawer = () => {
    setDrawerEmployee(null);
    setDrawerOpen(true);
  };

  const openEditDrawer = (employee: Employee) => {
    setDrawerEmployee(employee);
    setDrawerOpen(true);
  };

  const openAssignTask = (employee?: Employee) => {
    setTaskEditing(null);
    setTaskDefaultEmployeeId(employee?.id ?? null);
    setTaskDrawerOpen(true);
  };

  const openEditTask = (task: StaffTask) => {
    setTaskEditing(task);
    setTaskDefaultEmployeeId(task.assignedToEmployeeId);
    setTaskDrawerOpen(true);
  };

  const tabs = [
    { label: 'Directory', count: filtered.length },
    { label: 'Task Board', count: tasksQuery.isPending ? null : tasks.length },
    { label: 'Table Assignments', count: assignmentsQuery.data?.length ?? null },
    { label: 'Performance', count: null },
  ];

  const isLoadingEmployees = employeesQuery.isPending && activeBranchId != null;

  return (
    <>
      <PageHeader
        title="Team & Staff Management"
        subtitle="Manage employees, allocate table-wise tasks, and track real performance."
        actions={
          canManage ? (
            <Button variant="contained" onClick={openAddDrawer} disabled={branchesEmpty(activeBranchId)}>
              + Add Employee
            </Button>
          ) : null
        }
      />

      <Box sx={{ display: 'grid', gap: 2 }}>
        {activeBranchId == null ? (
          <Alert severity="info" variant="outlined" sx={{ borderRadius: '10px' }}>
            Select a branch to manage its team.
          </Alert>
        ) : null}

        <EmployeeKpiCards
          stats={statsQuery.data}
          tasksPending={taskSummaryQuery.data?.pending ?? 0}
          tasksCompleted={taskSummaryQuery.data?.completed ?? 0}
          isLoading={statsQuery.isPending || taskSummaryQuery.isPending}
          tasksAvailable={taskSummaryQuery.data != null}
        />

        <Tabs
          value={tab}
          onChange={(_, value) => setTab(value)}
          variant="scrollable"
          allowScrollButtonsMobile
          sx={{ borderBottom: '1px solid', borderColor: 'divider', minHeight: 44 }}
        >
          {tabs.map((item) => (
            <Tab
              key={item.label}
              label={
                item.count == null
                  ? item.label
                  : `${item.label} (${item.count})`
              }
              sx={{ minHeight: 44, fontSize: 13, fontWeight: 600 }}
            />
          ))}
        </Tabs>

        {tab === 0 ? (
          <Box sx={{ display: 'grid', gap: 2 }}>
            <EmployeeToolbar
              filters={filters}
              onPatch={(patch) => {
                setFilters((previous) => ({ ...previous, ...patch }));
                setTablePage(0);
              }}
              onClear={() => {
                setFilters(defaultEmployeeFilters);
                setTablePage(0);
              }}
              roles={roles}
              view={view}
              onViewChange={setView}
              matchCount={filtered.length}
              dateKey={dateKey}
              onDateKeyChange={setDateKey}
              customFrom={customFrom}
              customTo={customTo}
              onCustomChange={(from, to) => {
                setCustomFrom(from);
                setCustomTo(to);
              }}
              onExport={handleExport}
              canExport={filtered.length > 0}
            />

            {employeesQuery.isError ? (
              <Alert severity="error" variant="outlined" sx={{ borderRadius: '10px' }}>
                Failed to load employees. Try again shortly.
              </Alert>
            ) : view === 'grid' ? (
              <EmployeeGridView
                employees={filtered}
                tasksByEmployee={tasksByEmployee}
                canManage={canManage}
                isLoading={isLoadingEmployees}
                onOpen={setProfileEmployee}
                onEdit={openEditDrawer}
                onAssignTask={(employee) => openAssignTask(employee)}
                onToggleDuty={(employee) =>
                  dutyMutation.mutate({ id: employee.id, onDuty: !employee.onDuty })
                }
                onToggleStatus={(employee) =>
                  statusMutation.mutate({
                    id: employee.id,
                    status: employee.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE',
                  })
                }
              />
            ) : (
              <EmployeeTableView
                employees={filtered}
                totalCount={filtered.length}
                page={tablePage}
                rowsPerPage={rowsPerPage}
                onPageChange={setTablePage}
                onRowsPerPageChange={(size) => {
                  setRowsPerPage(size);
                  setTablePage(0);
                }}
                tasksByEmployee={tasksByEmployee}
                canManage={canManage}
                onOpen={setProfileEmployee}
                onEdit={openEditDrawer}
                onAssignTask={(employee) => openAssignTask(employee)}
                onToggleDuty={(employee) =>
                  dutyMutation.mutate({ id: employee.id, onDuty: !employee.onDuty })
                }
                onToggleStatus={(employee) =>
                  statusMutation.mutate({
                    id: employee.id,
                    status: employee.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE',
                  })
                }
              />
            )}

            {filtered.length === 0 && !isLoadingEmployees && !employeesQuery.isError ? (
              <Box sx={{ display: 'grid', gap: 1.5, justifyItems: 'center', py: 5, textAlign: 'center' }}>
                <Typography sx={{ fontSize: 15, fontWeight: 700 }}>No employees match the current filters</Typography>
                <Typography sx={{ fontSize: 13, color: 'text.secondary', maxWidth: 380 }}>
                  Invite your first team member to get started.
                </Typography>
                {canManage ? (
                  <Button variant="contained" onClick={openAddDrawer} sx={{ mt: 1 }}>
                    + Add Employee
                  </Button>
                ) : null}
              </Box>
            ) : null}
          </Box>
        ) : null}

        {tab === 1 ? (
          tasksQuery.isError ? (
            <Alert severity="error" variant="outlined" sx={{ borderRadius: '10px' }}>
              Failed to load tasks for {dateRange.label.toLowerCase()}.
            </Alert>
          ) : tasksQuery.isPending ? (
            <Box sx={{ display: 'grid', placeItems: 'center', py: 6 }}>
              <CircularProgress size={26} />
            </Box>
          ) : (
            <TaskBoard
              tasks={tasks}
              employees={filtered}
              roles={roles}
              canManage={canManage}
              onEdit={openEditTask}
              onStatusChange={(task, status) => taskStatus.mutate({ id: task.id, status })}
              onAssign={() => openAssignTask()}
            />
          )
        ) : null}

        {tab === 2 ? (
          <TableAssignmentsBoard
            tables={tablesQuery.data ?? []}
            assignments={assignmentsQuery.data ?? []}
            employees={allEmployees}
            loading={tablesQuery.isPending || assignmentsQuery.isPending}
            canManage={canManage}
            onAssign={async (tableId, employeeId) => {
              await assignMutation.mutateAsync({ tableId, employeeId });
            }}
            onRelease={async (tableId) => {
              await releaseMutation.mutateAsync(tableId);
            }}
            onRefresh={() => {
              void assignmentsQuery.refetch();
              void tablesQuery.refetch();
            }}
          />
        ) : null}

        {tab === 3 ? (
          <PerformanceTab employees={filtered} performanceById={performanceById} />
        ) : null}
      </Box>

      <EmployeeProfileDrawer
        open={profileEmployee != null}
        employee={profileEmployee}
        tasks={tasks}
        from={dateRange.from}
        to={dateRange.to}
        canManage={canManage}
        onClose={() => setProfileEmployee(null)}
        onAssignTask={(employee) => {
          setProfileEmployee(null);
          openAssignTask(employee);
        }}
        onUpdateStatus={(task, status) => taskStatus.mutate({ id: task.id, status })}
      />

      <AddEmployeeDrawer
        open={drawerOpen}
        branches={branches}
        roles={roles}
        defaultBranchId={activeBranchId}
        editing={drawerEmployee}
        onClose={() => setDrawerOpen(false)}
        onSubmit={async (payload) => {
          const employee = await createEmployee.mutateAsync(payload);
          return employee;
        }}
        onUpdate={async (id, payload) => {
          const employee = await updateEmployee.mutateAsync({ id, payload });
          return employee;
        }}
      />

      <TaskFormDrawer
        open={taskDrawerOpen}
        editing={taskEditing}
        employees={allEmployees.filter((employee) => employee.status === 'ACTIVE')}
        tables={tablesQuery.data ?? []}
        branchId={activeBranchId}
        defaultEmployeeId={taskDefaultEmployeeId}
        onClose={() => setTaskDrawerOpen(false)}
        onSubmit={async (payload) => {
          if (taskEditing) {
            await taskUpdate.mutateAsync({ id: taskEditing.id, payload });
          } else {
            await taskCreate.mutateAsync(payload);
          }
          setTaskDrawerOpen(false);
        }}
      />

      <Snackbar
        open={snack.open}
        autoHideDuration={4000}
        onClose={() => setSnack((previous) => ({ ...previous, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          severity={snack.severity}
          variant="filled"
          onClose={() => setSnack((previous) => ({ ...previous, open: false }))}
          sx={{ minWidth: 260 }}
        >
          {snack.message}
        </Alert>
      </Snackbar>
    </>
  );
}

function branchesEmpty(branchId: number | null): boolean {
  return branchId == null;
}
