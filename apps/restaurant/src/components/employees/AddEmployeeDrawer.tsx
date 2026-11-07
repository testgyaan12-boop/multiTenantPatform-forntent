import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Drawer,
  IconButton,
  MenuItem,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Typography,
} from '@mui/material';
import { Check, Copy, X } from 'lucide-react';
import type { AssignableRole, Branch, Employee } from '@resto/types';
import { roleMeta } from './employeeUtils';

interface AddEmployeeDrawerProps {
  open: boolean;
  branches: Branch[];
  roles: AssignableRole[];
  defaultBranchId: number | null;
  editing?: Employee | null;
  onClose: () => void;
  onSubmit: (payload: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    roleCode: string;
    branchId: number;
    employeeCode?: string;
    jobTitle?: string;
    shiftName?: string;
  }) => Promise<Employee>;
  onUpdate?: (id: number, payload: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    roleCode?: string;
    branchId?: number;
    jobTitle?: string;
    shiftName?: string;
    status?: string;
  }) => Promise<Employee>;
}

const STEPS = ['Personal details', 'Work details', 'Access & permissions', 'Review & invite'];

interface FormState {
  fullName: string;
  email: string;
  phone: string;
  roleCode: string;
  branchId: string;
  employeeCode: string;
  jobTitle: string;
  shiftName: string;
}

const initialForm = (defaultBranchId: number | null): FormState => ({
  fullName: '',
  email: '',
  phone: '',
  roleCode: '',
  branchId: defaultBranchId ? String(defaultBranchId) : '',
  employeeCode: '',
  jobTitle: '',
  shiftName: '',
});

export function AddEmployeeDrawer({
  open,
  branches,
  roles,
  defaultBranchId,
  editing = null,
  onClose,
  onSubmit,
  onUpdate,
}: AddEmployeeDrawerProps) {
  const isEdit = editing != null;
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(() => initialForm(defaultBranchId));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [invited, setInvited] = useState<Employee | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (open) {
      if (editing) {
        setForm({
          fullName: editing.fullName,
          email: editing.email,
          phone: editing.phone ?? '',
          roleCode: editing.roles?.[0] ?? '',
          branchId: String(editing.branchId),
          employeeCode: editing.employeeCode,
          jobTitle: editing.jobTitle ?? '',
          shiftName: editing.shiftName ?? '',
        });
        setStep(1);
      } else {
        setForm(initialForm(defaultBranchId));
        setStep(0);
      }
      setErrors({});
      setApiError(null);
      setSaving(false);
      setInvited(null);
      setCopied(false);
    }
  }, [open, defaultBranchId, editing]);

  const set = (key: keyof FormState, value: string) => {
    setForm((previous) => ({ ...previous, [key]: value }));
    setErrors((previous) => {
      if (!(key in previous)) return previous;
      const next = { ...previous };
      delete next[key];
      return next;
    });
  };

  const validateStep = (index: number): boolean => {
    const next: Record<string, string> = {};
    if (index === 0) {
      if (!form.fullName.trim()) next.fullName = 'Full name is required';
      if (!form.email.trim()) next.email = 'Email is required';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) next.email = 'Enter a valid email address';
    }
    if (index === 1) {
      if (!form.roleCode) next.roleCode = 'Select a role';
      if (!form.branchId) next.branchId = 'Select a branch';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleNext = () => {
    if (!validateStep(step)) return;
    setApiError(null);
    setStep((value) => value + 1);
  };

  const handleSubmit = async () => {
    if (saving || invited) return;
    if (!validateStep(0) || !validateStep(1)) {
      setStep(form.fullName.trim() && form.email.trim() ? 1 : 0);
      return;
    }
    const nameParts = form.fullName.trim().split(/\s+/);
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || firstName;
    setSaving(true);
    setApiError(null);
    try {
      if (isEdit && onUpdate) {
        const updated = await onUpdate(editing.id, {
          firstName,
          lastName,
          phone: form.phone.trim() || undefined,
          roleCode: form.roleCode,
          branchId: Number(form.branchId),
          jobTitle: form.jobTitle.trim() || undefined,
          shiftName: form.shiftName.trim() || undefined,
        });
        setInvited({ ...updated, inviteUrl: null });
        setStep(3);
      } else {
        const employee = await onSubmit({
          firstName: firstName ?? '',
          lastName: lastName ?? '',
          email: form.email.trim().toLowerCase(),
          phone: form.phone.trim() || undefined,
          roleCode: form.roleCode,
          branchId: Number(form.branchId),
          employeeCode: form.employeeCode.trim() || undefined,
          jobTitle: form.jobTitle.trim() || undefined,
          shiftName: form.shiftName.trim() || undefined,
        });
        setInvited(employee);
        setStep(3);
      }
    } catch (error) {
      setApiError(error instanceof Error && error.message ? error.message : 'Failed to save the employee.');
    } finally {
      setSaving(false);
    }
  };

  const selectedRole = roles.find((role) => role.code === form.roleCode);
  const selectedRoleMeta = roleMeta(form.roleCode);
  const inviteUrl = invited?.inviteUrl ?? null;

  const copyInvite = async () => {
    if (!inviteUrl) return;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setApiError('Could not copy the invite link — select it and copy manually.');
    }
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={saving ? undefined : onClose}
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
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography sx={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.01em' }}>
              {invited ? (isEdit ? 'Employee updated' : 'Invitation created') : isEdit ? 'Edit employee' : 'Add employee'}
            </Typography>
            <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>
              {invited
                ? isEdit
                  ? 'Changes saved. The role decides what this employee can access.'
                  : 'Share the invite link with your new team member.'
                : isEdit
                  ? 'Update profile, role, branch, and shift.'
                  : 'Invite a new team member to your restaurant.'}
            </Typography>
          </Box>
          <IconButton size="small" aria-label="Close" onClick={onClose} disabled={saving}>
            <X size={18} />
          </IconButton>
        </Box>

          {!invited ? (
            <Stepper activeStep={step} sx={{ px: 2.5, py: 1.5 }}>
              {(isEdit ? STEPS.slice(0, 3) : STEPS).map((label) => (
                <Step key={label}>
                  <StepLabel sx={{ '& .MuiStepLabel-label': { fontSize: 11 } }}>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
          ) : null}

        <Box sx={{ flex: 1, overflowY: 'auto', px: 2.5, py: 2.5, display: 'grid', gap: 2, alignContent: 'start' }}>
          {apiError ? (
            <Alert severity="error" variant="outlined" sx={{ borderRadius: '10px' }}>
              {apiError}
            </Alert>
          ) : null}

          {!invited && step === 0 ? (
            <>
              <TextField
                label="Full name"
                value={form.fullName}
                onChange={(event) => set('fullName', event.target.value)}
                error={Boolean(errors.fullName)}
                helperText={errors.fullName ?? 'e.g. Jordan Lee'}
                fullWidth
                autoFocus
              />
              <TextField
                label="Email address"
                type="email"
                value={form.email}
                onChange={(event) => set('email', event.target.value)}
                error={Boolean(errors.email)}
                helperText={errors.email ?? (isEdit ? 'Email cannot be changed after creation' : 'They will receive an invitation link for this address')}
                disabled={isEdit}
                fullWidth
              />
              <TextField
                label="Phone number"
                value={form.phone}
                onChange={(event) => set('phone', event.target.value)}
                helperText="Optional"
                fullWidth
              />
            </>
          ) : null}

          {!invited && step === 1 ? (
            <>
              <TextField
                select
                label="Role"
                value={form.roleCode}
                onChange={(event) => set('roleCode', event.target.value)}
                error={Boolean(errors.roleCode)}
                helperText={errors.roleCode ?? 'Sets the permissions this employee receives'}
                fullWidth
              >
                {roles.map((role) => (
                  <MenuItem key={role.code} value={role.code}>
                    {role.name}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                label="Branch"
                value={form.branchId}
                onChange={(event) => set('branchId', event.target.value)}
                error={Boolean(errors.branchId)}
                fullWidth
              >
                {branches.map((branch) => (
                  <MenuItem key={branch.id} value={branch.id}>
                    {branch.name}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label="Employee identifier"
                value={form.employeeCode}
                onChange={(event) => set('employeeCode', event.target.value)}
                helperText="Optional — auto-generated when left blank"
                fullWidth
              />
              <TextField
                label="Job title"
                value={form.jobTitle}
                onChange={(event) => set('jobTitle', event.target.value)}
                helperText="Optional — defaults to the role name"
                fullWidth
              />
              <TextField
                label="Shift"
                value={form.shiftName}
                onChange={(event) => set('shiftName', event.target.value)}
                helperText="Optional, e.g. Morning Shift"
                fullWidth
              />
            </>
          ) : null}

          {!invited && step === 2 && !isEdit && selectedRole ? (
            <>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                <Chip
                  size="small"
                  label={selectedRoleMeta.label}
                  sx={{ height: 26, fontSize: 12, fontWeight: 700, bgcolor: selectedRoleMeta.bg, color: selectedRoleMeta.color, border: 'none' }}
                />
                <Typography sx={{ fontSize: 13, fontWeight: 700 }}>{selectedRole.name}</Typography>
              </Box>
              <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>
                {selectedRole.description ?? 'Permissions come from the role and are enforced by the backend.'}
              </Typography>
              <Divider />
              <Alert severity="info" variant="outlined" sx={{ borderRadius: '10px', fontSize: 12.5 }}>
                The account is created in an <strong>Invited</strong> state with no password. The employee sets
                their own password through the secure invite link. No elevated permissions are granted beyond the
                selected role.
              </Alert>
            </>
          ) : null}

          {!invited && (isEdit ? step === 2 : step === 3) ? (
            <ReviewSummary form={form} roles={roles} branches={branches} isEdit={isEdit} />
          ) : null}

          {invited ? (
            <>
              <Alert severity="success" sx={{ borderRadius: '10px' }}>
                {isEdit
                  ? `${invited.fullName}'s profile was updated as ${roleMeta(invited.roles?.[0]).label}.`
                  : `${invited.fullName} was invited as ${roleMeta(invited.roles?.[0]).label}. Share the link below so they can set a password — the invitation expires in 7 days.`}
              </Alert>
              {inviteUrl ? (
                <Box
                  sx={{
                    display: 'flex',
                    gap: 1,
                    alignItems: 'center',
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: '12px',
                    px: 1.5,
                    py: 1,
                    bgcolor: '#F8F9FB',
                  }}
                >
                  <Typography
                    sx={{
                      flex: 1,
                      minWidth: 0,
                      fontFamily: 'monospace',
                      fontSize: 12,
                      wordBreak: 'break-all',
                      userSelect: 'all',
                    }}
                  >
                    {inviteUrl}
                  </Typography>
                  <TooltipShim>
                    <IconButton size="small" aria-label="Copy invite link" onClick={() => void copyInvite()}>
                      {copied ? <Check size={16} color="#16A36A" /> : <Copy size={16} />}
                    </IconButton>
                  </TooltipShim>
                </Box>
              ) : null}
            </>
          ) : null}
        </Box>

        <Box
          sx={{
            px: 2.5,
            py: 2,
            borderTop: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            gap: 1,
            justifyContent: 'flex-end',
            bgcolor: '#ffffff',
          }}
        >
          {invited ? (
            <Button variant="contained" onClick={onClose} sx={{ px: 3 }}>
              Done
            </Button>
          ) : (
            <>
              <Button color="inherit" onClick={step === 0 ? onClose : () => setStep((value) => value - 1)} disabled={saving} sx={{ px: 2 }}>
                {step === 0 ? 'Cancel' : 'Back'}
              </Button>
              {step < (isEdit ? 2 : 3) ? (
                <Button variant="contained" onClick={handleNext} sx={{ px: 3 }}>
                  Next
                </Button>
              ) : (
                <Button
                  variant="contained"
                  onClick={() => void handleSubmit()}
                  disabled={saving}
                  startIcon={saving ? <CircularProgress size={15} color="inherit" /> : undefined}
                  sx={{ px: 3 }}
                >
                  {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Send invitation'}
                </Button>
              )}
            </>
          )}
        </Box>
      </Box>
    </Drawer>
  );
}

function TooltipShim({ children }: { children: React.ReactNode }) {
  return <span>{children}</span>;
}

function ReviewSummary({
  form,
  roles,
  branches,
  isEdit,
}: {
  form: FormState;
  roles: AssignableRole[];
  branches: Branch[];
  isEdit: boolean;
}) {
  const role = roles.find((item) => item.code === form.roleCode);
  const branch = branches.find((item) => String(item.id) === form.branchId);
  const rows: [string, string][] = [
    ['Full name', form.fullName || '—'],
    ['Email', form.email || '—'],
    ['Phone', form.phone || '—'],
    ['Role', role?.name ?? '—'],
    ['Branch', branch?.name ?? '—'],
    ['Employee ID', form.employeeCode || 'Auto-generated'],
    ['Job title', form.jobTitle || role?.name || '—'],
    ['Shift', form.shiftName || 'Not assigned'],
  ];
  return (
    <>
      <Typography sx={{ fontSize: 13, fontWeight: 700 }}>Review</Typography>
      {rows.map(([label, value]) => (
        <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
          <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>{label}</Typography>
          <Typography sx={{ fontSize: 13, fontWeight: 600, textAlign: 'right' }}>{value}</Typography>
        </Box>
      ))}
      <Alert severity="info" variant="outlined" sx={{ borderRadius: '10px', fontSize: 12.5 }}>
        {isEdit
          ? 'Saving applies the new profile and role immediately — backend re-checks permissions on every request.'
          : 'Submitting creates the account and a one-time invite link on the backend. Nothing is marked as sent until the server confirms.'}
      </Alert>
    </>
  );
}
