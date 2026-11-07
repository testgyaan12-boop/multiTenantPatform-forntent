import { useMemo, useState } from 'react';
import {
  Box,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import { ClipboardList, Eye, MoreHorizontal, Pencil, Play, Power } from 'lucide-react';
import type { Employee, StaffTask } from '@resto/types';
import { initials, roleMeta } from './employeeUtils';

interface EmployeeTableViewProps {
  employees: Employee[];
  totalCount: number;
  page: number;
  rowsPerPage: number;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (size: number) => void;
  tasksByEmployee: Map<number, StaffTask[]>;
  canManage: boolean;
  onOpen: (employee: Employee) => void;
  onEdit: (employee: Employee) => void;
  onAssignTask: (employee: Employee) => void;
  onToggleDuty: (employee: Employee) => void;
  onToggleStatus: (employee: Employee) => void;
}

export function EmployeeTableView({
  employees,
  totalCount,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
  tasksByEmployee,
  canManage,
  onOpen,
  onEdit,
  onAssignTask,
  onToggleDuty,
  onToggleStatus,
}: EmployeeTableViewProps) {
  const slice = useMemo(
    () => employees.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [employees, page, rowsPerPage],
  );

  return (
    <>
      <TableContainer sx={{ mx: -0.5 }}>
        <Table size="small" aria-label="Employees">
          <TableHead>
            <TableRow>
              {['Employee', 'Role', 'Branch', 'Shift / duty', 'Tasks done', 'Performance', 'Account', 'Actions'].map(
                (label) => (
                  <TableCell key={label} sx={{ fontWeight: 700, fontSize: 12, color: 'text.secondary' }}>
                    {label}
                  </TableCell>
                ),
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {slice.map((employee) => {
              const meta = roleMeta(employee.roles?.[0]);
              const tasks = tasksByEmployee.get(employee.id) ?? [];
              const done = tasks.filter((task) => task.status === 'COMPLETED').length;
              const total = tasks.filter((task) => task.status !== 'CANCELLED').length;
              const rate = total > 0 ? Math.round((done / total) * 100) : null;
              return (
                <TableRow key={employee.id} hover sx={{ cursor: 'pointer' }} onClick={() => onOpen(employee)}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 0 }}>
                      <Box
                        sx={{
                          width: 34,
                          height: 34,
                          borderRadius: '50%',
                          bgcolor: meta.bg,
                          color: meta.color,
                          display: 'grid',
                          placeItems: 'center',
                          fontWeight: 800,
                          fontSize: 12,
                          flexShrink: 0,
                        }}
                      >
                        {initials(employee.fullName)}
                      </Box>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography noWrap sx={{ fontSize: 13.5, fontWeight: 700 }}>
                          {employee.fullName}
                        </Typography>
                        <Typography noWrap sx={{ fontSize: 11.5, color: 'text.secondary' }}>
                          {employee.employeeCode} · {employee.email}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={meta.label}
                      sx={{ height: 22, fontSize: 11, fontWeight: 700, bgcolor: meta.bg, color: meta.color, border: 'none' }}
                    />
                  </TableCell>
                  <TableCell sx={{ fontSize: 13 }}>{employee.branchName ?? '—'}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'grid', gap: 0.25 }}>
                      <Typography sx={{ fontSize: 12.5 }}>{employee.shiftName ?? '—'}</Typography>
                      <Typography sx={{ fontSize: 11.5, color: employee.onDuty ? '#16A36A' : 'text.secondary', fontWeight: 600 }}>
                        {employee.onDuty ? 'On duty' : 'Off duty'}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ fontSize: 13, fontWeight: 700 }}>
                    {done}/{total}
                  </TableCell>
                  <TableCell>
                    {rate == null ? (
                      <Typography sx={{ fontSize: 12, color: 'text.disabled' }}>—</Typography>
                    ) : (
                      <Chip
                        size="small"
                        label={`${rate}%`}
                        sx={{
                          height: 22,
                          fontSize: 11,
                          fontWeight: 700,
                          bgcolor: rate >= 80 ? '#E7F8F0' : rate >= 50 ? '#FFF4E5' : '#FEECEB',
                          color: rate >= 80 ? '#16A36A' : rate >= 50 ? '#F59E0B' : '#DC2626',
                          border: 'none',
                        }}
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={employee.status === 'ACTIVE' ? (employee.accountStatus === 'INVITED' ? 'Invited' : 'Active') : 'Inactive'}
                      sx={{
                        height: 22,
                        fontSize: 11,
                        fontWeight: 700,
                        bgcolor: employee.status === 'ACTIVE' ? '#E7F8F0' : '#FEECEB',
                        color: employee.status === 'ACTIVE' ? '#16A36A' : '#DC2626',
                        border: 'none',
                      }}
                    />
                  </TableCell>
                  <TableCell onClick={(event) => event.stopPropagation()}>
                    <RowActions
                      employee={employee}
                      canManage={canManage}
                      onOpen={onOpen}
                      onEdit={onEdit}
                      onAssignTask={onAssignTask}
                      onToggleDuty={onToggleDuty}
                      onToggleStatus={onToggleStatus}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        component="div"
        count={totalCount}
        page={page}
        rowsPerPage={rowsPerPage}
        onPageChange={(_, nextPage) => onPageChange(nextPage)}
        onRowsPerPageChange={(event) => onRowsPerPageChange(Number(event.target.value))}
        rowsPerPageOptions={[10, 20, 50]}
        labelRowsPerPage="Rows"
        sx={{ borderTop: '1px solid', borderColor: 'divider', mt: 0.5 }}
      />
    </>
  );
}

interface RowActionsProps {
  employee: Employee;
  canManage: boolean;
  onOpen: (employee: Employee) => void;
  onEdit: (employee: Employee) => void;
  onAssignTask: (employee: Employee) => void;
  onToggleDuty: (employee: Employee) => void;
  onToggleStatus: (employee: Employee) => void;
}

function RowActions({ employee, canManage, onOpen, onEdit, onAssignTask, onToggleDuty, onToggleStatus }: RowActionsProps) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  return (
    <>
      <Tooltip title="View profile">
        <IconButton size="small" aria-label={`View ${employee.fullName}`} onClick={() => onOpen(employee)}>
          <Eye size={15} />
        </IconButton>
      </Tooltip>
      <Tooltip title="More actions">
        <IconButton size="small" aria-label={`More actions for ${employee.fullName}`} onClick={(event) => setAnchor(event.currentTarget)}>
          <MoreHorizontal size={16} />
        </IconButton>
      </Tooltip>
      <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}>
        <MenuItem disabled={!canManage} onClick={() => { setAnchor(null); onEdit(employee); }}>
          <Pencil size={15} style={{ marginRight: 8 }} /> Edit
        </MenuItem>
        <MenuItem disabled={!canManage} onClick={() => { setAnchor(null); onAssignTask(employee); }}>
          <ClipboardList size={15} style={{ marginRight: 8 }} /> Assign task
        </MenuItem>
        <MenuItem disabled={!canManage} onClick={() => { setAnchor(null); onToggleDuty(employee); }}>
          <Play size={15} style={{ marginRight: 8 }} /> {employee.onDuty ? 'Clock off' : 'Clock on'}
        </MenuItem>
        <MenuItem disabled={!canManage} onClick={() => { setAnchor(null); onToggleStatus(employee); }}>
          <Power size={15} style={{ marginRight: 8 }} /> {employee.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
        </MenuItem>
      </Menu>
    </>
  );
}
