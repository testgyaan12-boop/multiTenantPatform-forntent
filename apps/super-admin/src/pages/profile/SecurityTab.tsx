import { useMemo, useState, type ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Button,
  Card,
  Chip,
  Divider,
  IconButton,
  InputAdornment,
  LinearProgress,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { Eye, EyeOff, Info, KeyRound, Lock, ShieldCheck } from 'lucide-react';
import { ErrorState, LoadingState } from '@resto/ui';
import type { AuthUser } from '@resto/types';
import { profileApi } from '@/api';
import { useToast } from '@/components/toast';
import { GREEN, ORANGE, RED } from '@/theme';

const SECURITY_ACTIONS = new Set([
  'LOGIN',
  'LOGOUT',
  'PASSWORD_CHANGED',
  'SESSION_REVOKED',
  'OTHER_SESSIONS_REVOKED',
]);

interface StrengthResult {
  score: number;
  label: string;
  color: string;
}

function evaluateStrength(password: string): StrengthResult {
  if (!password) return { score: 0, label: 'Enter a password', color: RED };
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  if (score <= 2) return { score, label: 'Weak', color: RED };
  if (score <= 3) return { score, label: 'Fair', color: ORANGE };
  return { score, label: 'Strong', color: GREEN };
}

function SectionCard({
  title,
  caption,
  icon,
  children,
}: {
  title: string;
  caption?: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <Card sx={{ p: 2.5 }}>
      <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ mb: 2 }}>
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: 2,
            display: 'grid',
            placeItems: 'center',
            bgcolor: 'rgba(255,87,34,0.1)',
            color: ORANGE,
            flexShrink: 0,
          }}
        >
          {icon}
        </Box>
        <Box>
          <Typography variant="h4">{title}</Typography>
          {caption ? (
            <Typography variant="caption" color="text.secondary">
              {caption}
            </Typography>
          ) : null}
        </Box>
      </Stack>
      {children}
    </Card>
  );
}

export function SecurityTab({ user }: { user: AuthUser }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const events = useQuery({
    queryKey: ['sa-profile', 'security-activity'],
    queryFn: () => profileApi.activity({ size: 10 }),
  });

  const changePassword = useMutation({
    mutationFn: (payload: { currentPassword: string; newPassword: string }) => profileApi.changePassword(payload),
    onSuccess: () => {
      toast('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setFormError(null);
      void queryClient.invalidateQueries({ queryKey: ['sa-profile'] });
    },
    onError: (error: Error) => toast(error.message, 'error'),
  });

  const strength = useMemo(() => evaluateStrength(newPassword), [newPassword]);

  const securityEvents = useMemo(
    () => (events.data?.content ?? []).filter((item) => SECURITY_ACTIONS.has(item.action)),
    [events.data],
  );

  const handleSubmit = () => {
    if (!currentPassword) {
      setFormError('Enter your current password.');
      return;
    }
    if (newPassword.length < 8) {
      setFormError('New password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setFormError('New password and confirmation do not match.');
      return;
    }
    if (newPassword === currentPassword) {
      setFormError('New password must be different from the current password.');
      return;
    }
    setFormError(null);
    changePassword.mutate({ currentPassword, newPassword });
  };

  return (
    <Stack spacing={2.5}>
      <SectionCard title="Change password" caption="Your new password must be at least 8 characters." icon={<KeyRound size={18} />}>
        <Box component="form" onSubmit={(event) => { event.preventDefault(); handleSubmit(); }} sx={{ maxWidth: 520 }}>
          <Stack spacing={2}>
            <TextField
              label="Current password"
              type={showCurrent ? 'text' : 'password'}
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              fullWidth
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setShowCurrent((value) => !value)} edge="end">
                        {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />
            <TextField
              label="New password"
              type={showNew ? 'text' : 'password'}
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              fullWidth
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setShowNew((value) => !value)} edge="end">
                        {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />
            {newPassword ? (
              <Box>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.75 }}>
                  <Typography variant="caption" color="text.secondary">
                    Password strength
                  </Typography>
                  <Chip size="small" label={strength.label} sx={{ height: 20, fontSize: 11, color: strength.color }} variant="outlined" />
                </Stack>
                <LinearProgress
                  variant="determinate"
                  value={Math.min((strength.score / 5) * 100, 100)}
                  sx={{
                    height: 6,
                    borderRadius: 3,
                    bgcolor: '#EEF1F6',
                    '& .MuiLinearProgress-bar': { borderRadius: 3, bgcolor: strength.color },
                  }}
                />
              </Box>
            ) : null}
            <TextField
              label="Confirm new password"
              type={showConfirm ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              fullWidth
              error={confirmPassword.length > 0 && confirmPassword !== newPassword}
              helperText={
                confirmPassword.length > 0 && confirmPassword !== newPassword ? 'Passwords do not match.' : ' '
              }
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setShowConfirm((value) => !value)} edge="end">
                        {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />
            {formError ? (
              <Typography variant="body2" color="error">
                {formError}
              </Typography>
            ) : null}
            <Stack direction="row" spacing={1.5}>
              <Button
                type="submit"
                variant="contained"
                startIcon={<Lock size={15} />}
                disabled={changePassword.isPending}
              >
                {changePassword.isPending ? 'Changing…' : 'Change password'}
              </Button>
              <Button
                variant="outlined"
                color="inherit"
                disabled={changePassword.isPending}
                onClick={() => {
                  setCurrentPassword('');
                  setNewPassword('');
                  setConfirmPassword('');
                  setFormError(null);
                }}
              >
                Cancel
              </Button>
            </Stack>
          </Stack>
        </Box>
      </SectionCard>

      <SectionCard
        title="Two-factor authentication"
        caption="Add an extra layer of security when signing in."
        icon={<ShieldCheck size={18} />}
      >
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1.5}
          alignItems={{ sm: 'center' }}
          justifyContent="space-between"
        >
          <Typography variant="body2" color="text.secondary">
            Two-factor authentication is not yet available on this platform.
          </Typography>
          <Chip size="small" label="Not available" variant="outlined" color="default" />
        </Stack>
      </SectionCard>

      <SectionCard title="Recovery methods" caption="Ways to regain access if you lose your password." icon={<KeyRound size={18} />}>
        <Stack direction="row" spacing={1} alignItems="flex-start">
          <Info size={16} color="#5A6478" style={{ flexShrink: 0, marginTop: 2 }} />
          <Typography variant="body2" color="text.secondary">
            Recovery codes and backup email recovery are not supported by the platform yet. The email on your account
            ({user.email}) is used for sign-in and password recovery notifications.
          </Typography>
        </Stack>
      </SectionCard>

      <SectionCard title="Recent security events" caption="Sign-ins, sign-outs and password changes from your account." icon={<Lock size={18} />}>
        {events.isPending ? <LoadingState label="Loading security events…" /> : null}
        {events.isError ? (
          <ErrorState message={events.error.message} onRetry={() => void events.refetch()} />
        ) : null}
        {events.data ? (
          securityEvents.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No recent security events found.
            </Typography>
          ) : (
            <Stack divider={<Divider />}>
              {securityEvents.map((event) => (
                <Stack
                  key={event.id}
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={1}
                  justifyContent="space-between"
                  alignItems={{ sm: 'center' }}
                  sx={{ py: 1.25 }}
                >
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Chip size="small" label={event.action} variant="outlined" />
                    <Typography variant="body2" color="text.secondary">
                      {new Date(event.timestamp).toLocaleString()}
                    </Typography>
                  </Stack>
                  <Chip
                    size="small"
                    label={event.result}
                    color={event.result === 'SUCCESS' ? 'success' : 'error'}
                    variant="outlined"
                  />
                </Stack>
              ))}
            </Stack>
          )
        ) : null}
      </SectionCard>

      <SectionCard title="Account recovery" caption="How to recover this account." icon={<Info size={18} />}>
        <Typography variant="body2" color="text.secondary">
          If you lose access to this account, contact another platform administrator to reset your password or recover
          access. Self-service account recovery is not available yet. The email on this account is{' '}
          <strong>{user.email}</strong>.
        </Typography>
      </SectionCard>
    </Stack>
  );
}
