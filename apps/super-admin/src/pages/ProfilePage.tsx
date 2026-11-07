import { useState, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Avatar, Box, Button, Card, Chip, Stack, Tab, Tabs, Typography } from '@mui/material';
import { Clock, Mail, Pencil, Phone } from 'lucide-react';
import { ErrorState, LoadingState, PageHeader } from '@resto/ui';
import type { AuthUser } from '@resto/types';
import { profileApi } from '@/api';
import { NAVY } from '@/theme';
import { AccessPanel } from './profile/AccessPanel';
import { ActivityTab } from './profile/ActivityTab';
import { PersonalInfoTab } from './profile/PersonalInfoTab';
import { PreferencesTab } from './profile/PreferencesTab';
import { SecurityTab } from './profile/SecurityTab';
import { SessionsTab } from './profile/SessionsTab';

const TAB_LABELS = ['Personal Information', 'Security', 'Preferences', 'Sessions & Devices', 'Activity Log'];

function TabPanel({ value, index, children }: { value: number; index: number; children: ReactNode }) {
  if (value !== index) return null;
  return <Box sx={{ pt: 3 }}>{children}</Box>;
}

function statusChipColor(status?: string | null) {
  if (status === 'ACTIVE') return 'success' as const;
  if (status === 'SUSPENDED') return 'error' as const;
  if (status === 'PENDING_VERIFICATION') return 'warning' as const;
  return 'default' as const;
}

function IdentityCard({ user, onEdit }: { user: AuthUser; onEdit: () => void }) {
  const fullName = `${user.firstName} ${user.lastName}`.trim() || user.email;
  const initials = `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase() || 'A';
  const roleLabel = user.roles.includes('SUPER_ADMIN') ? 'Super Admin' : user.roles.join(', ') || '—';

  return (
    <Card sx={{ p: 2.5 }}>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2.5}
        alignItems={{ md: 'center' }}
        justifyContent="space-between"
      >
        <Stack direction="row" spacing={2} alignItems="center" sx={{ minWidth: 0 }}>
          <Avatar
            src={user.avatarUrl ?? undefined}
            sx={{ width: 64, height: 64, bgcolor: NAVY, fontSize: 24, fontWeight: 700, flexShrink: 0 }}
          >
            {initials}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Stack direction="row" spacing={1} alignItems="center" useFlexGap flexWrap="wrap" sx={{ mb: 0.5 }}>
              <Typography variant="h3" sx={{ minWidth: 0 }}>
                {fullName}
              </Typography>
              <Chip size="small" color="primary" variant="outlined" label={roleLabel} />
              {user.status ? (
                <Chip
                  size="small"
                  color={statusChipColor(user.status)}
                  variant="outlined"
                  label={user.status.replace(/_/g, ' ')}
                />
              ) : null}
            </Stack>
            <Stack direction="row" spacing={2} useFlexGap flexWrap="wrap" alignItems="center">
              <Stack direction="row" spacing={0.75} alignItems="center">
                <Mail size={14} color="#5A6478" />
                <Typography variant="body2" color="text.secondary">
                  {user.email}
                </Typography>
              </Stack>
              <Stack direction="row" spacing={0.75} alignItems="center">
                <Phone size={14} color="#5A6478" />
                <Typography variant="body2" color="text.secondary">
                  {user.phone ?? '—'}
                </Typography>
              </Stack>
            </Stack>
            <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mt: 0.5 }}>
              <Clock size={13} color="#9AA3B5" />
              <Typography sx={{ fontSize: 12, color: '#5A6478' }}>
                Created {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'} · Last login{' '}
                {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'Never'}
              </Typography>
            </Stack>
          </Box>
        </Stack>
        <Button
          variant="contained"
          startIcon={<Pencil size={16} />}
          onClick={onEdit}
          sx={{ alignSelf: { xs: 'stretch', md: 'flex-start' } }}
        >
          Edit Profile
        </Button>
      </Stack>
    </Card>
  );
}

export function ProfilePage() {
  const [tab, setTab] = useState(0);
  const me = useQuery({ queryKey: ['sa-profile', 'me'], queryFn: () => profileApi.me() });

  const header = (
    <PageHeader
      title="Super Admin Profile"
      subtitle="Manage your administrator account, security, and preferences."
    />
  );

  if (me.isError) {
    return (
      <>
        {header}
        <ErrorState message={me.error.message} onRetry={() => void me.refetch()} />
      </>
    );
  }
  if (!me.data) {
    return (
      <>
        {header}
        <LoadingState label="Loading profile…" />
      </>
    );
  }

  const user = me.data;

  return (
    <>
      {header}
      <Stack spacing={3}>
        <IdentityCard user={user} onEdit={() => setTab(0)} />

        <Box>
          <Tabs
            value={tab}
            onChange={(_event, next: number) => setTab(next)}
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            {TAB_LABELS.map((label) => (
              <Tab key={label} label={label} />
            ))}
          </Tabs>
          <TabPanel value={tab} index={0}>
            <PersonalInfoTab user={user} />
          </TabPanel>
          <TabPanel value={tab} index={1}>
            <SecurityTab user={user} />
          </TabPanel>
          <TabPanel value={tab} index={2}>
            <PreferencesTab />
          </TabPanel>
          <TabPanel value={tab} index={3}>
            <SessionsTab />
          </TabPanel>
          <TabPanel value={tab} index={4}>
            <ActivityTab />
          </TabPanel>
        </Box>

        <AccessPanel user={user} />
      </Stack>
    </>
  );
}
