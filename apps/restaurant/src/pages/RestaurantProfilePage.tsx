import { useState, type ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  Chip,
  Paper,
  Skeleton,
  Snackbar,
  Stack,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import { Building2, Globe, Mail, Pencil, Phone } from 'lucide-react';
import { ErrorState } from '@resto/ui';
import type { RestaurantProfile } from '@resto/types';
import {
  fetchRestaurantProfile,
  fetchRestaurantSubscription,
  updateRestaurantProfile,
  type RestaurantUpdatePayload,
} from '@/api';
import { useRestaurant } from '@/context/RestaurantContext';
import { initialsOf } from '@/components/branches/branchUtils';
import { composeAddress, tenantStatusMeta } from './profile/profileUtils';
import { BusinessDetailsTab, OverviewTab } from './profile/OverviewTab';
import { BrandingTab } from './profile/BrandingTab';
import { OperatingHoursTab } from './profile/OperatingHoursTab';
import { SocialMediaTab } from './profile/SocialMediaTab';
import { GalleryTab } from './profile/GalleryTab';
import { EditProfileDialog } from './profile/EditProfileDialog';

const TAB_LABELS = [
  'Overview',
  'Business Details',
  'Branding',
  'Operating Hours',
  'Social Media',
  'Gallery',
] as const;

const STATUS_CHIP_STYLES: Record<
  'success' | 'warning' | 'error' | 'default',
  { bgcolor: string; color: string }
> = {
  success: { bgcolor: '#E7F8F0', color: '#16A36A' },
  warning: { bgcolor: '#FFF4E5', color: '#B45309' },
  error: { bgcolor: '#FEECEB', color: '#DC2626' },
  default: { bgcolor: '#F1F3F7', color: '#718096' },
};

type SnackState = { open: boolean; severity: 'success' | 'error'; message: string };

function TabPanel({ index, active, children }: { index: number; active: number; children: ReactNode }) {
  return (
    <Box sx={{ display: index === active ? 'grid' : 'none', gap: 2 }}>{children}</Box>
  );
}

function ContactChip({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <Stack
      direction="row"
      spacing={0.75}
      alignItems="center"
      sx={{
        fontSize: 12.5,
        color: 'text.secondary',
        minWidth: 0,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: '8px',
        px: 1.25,
        py: 0.5,
        maxWidth: '100%',
      }}
    >
      <Box sx={{ display: 'grid', placeItems: 'center', flexShrink: 0, color: 'text.secondary' }}>{icon}</Box>
      <Typography sx={{ fontSize: 12.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {label}
      </Typography>
    </Stack>
  );
}

function ProfileSkeleton() {
  return (
    <Box sx={{ display: 'grid', gap: 2.5 }}>
      <Box>
        <Skeleton variant="text" width={280} height={40} />
        <Skeleton variant="text" width={360} />
      </Box>
      <Card sx={{ borderRadius: '14px', overflow: 'hidden' }}>
        <Skeleton variant="rectangular" height={140} />
        <Box sx={{ p: 2.5, display: 'grid', gap: 1 }}>
          <Skeleton variant="text" width="40%" height={32} />
          <Skeleton variant="text" width="55%" />
        </Box>
      </Card>
      <Skeleton variant="rectangular" height={48} sx={{ borderRadius: '14px' }} />
      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
        }}
      >
        <Skeleton variant="rectangular" height={220} sx={{ borderRadius: '14px' }} />
        <Skeleton variant="rectangular" height={220} sx={{ borderRadius: '14px' }} />
      </Box>
    </Box>
  );
}

export function RestaurantProfilePage() {
  const { profile: contextProfile } = useRestaurant();
  const queryClient = useQueryClient();

  const [tab, setTab] = useState(0);
  const [editOpen, setEditOpen] = useState(false);
  const [snack, setSnack] = useState<SnackState>({ open: false, severity: 'success', message: '' });

  const profileQuery = useQuery({
    queryKey: ['restaurant-profile'],
    queryFn: fetchRestaurantProfile,
    staleTime: 5 * 60_000,
  });

  const subscriptionQuery = useQuery({
    queryKey: ['restaurant-subscription'],
    queryFn: fetchRestaurantSubscription,
  });

  const saveProfile = useMutation({
    mutationFn: (payload: RestaurantUpdatePayload) => updateRestaurantProfile(payload),
  });

  const notify = (severity: SnackState['severity'], message: string) =>
    setSnack({ open: true, severity, message });

  const handleSave = async (payload: RestaurantUpdatePayload): Promise<RestaurantProfile> => {
    const updated = await saveProfile.mutateAsync(payload);
    void queryClient.invalidateQueries({ queryKey: ['restaurant-profile'] });
    notify('success', 'Changes saved.');
    return updated;
  };

  const profile = contextProfile ?? profileQuery.data ?? null;

  if (!profile) {
    if (profileQuery.isError) {
      return (
        <ErrorState
          message={
            profileQuery.error instanceof Error && profileQuery.error.message
              ? profileQuery.error.message
              : 'Could not load the restaurant profile.'
          }
          onRetry={() => void profileQuery.refetch()}
        />
      );
    }
    return <ProfileSkeleton />;
  }

  const statusMeta = tenantStatusMeta(profile.tenantStatus);
  const statusStyle = STATUS_CHIP_STYLES[statusMeta.color];
  const address = composeAddress(profile);
  const hasCover = Boolean(profile.coverImageUrl);

  return (
    <Box sx={{ display: 'grid', gap: 2.5 }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 2,
          flexWrap: 'wrap',
        }}
      >
        <Box>
          <Typography variant="h2">Restaurant Profile</Typography>
          <Typography sx={{ fontSize: 13.5, color: 'text.secondary', mt: 0.5 }}>
            Manage your restaurant information, branding, and business details.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1.25} alignItems="center">
          <Chip
            size="small"
            label={statusMeta.label}
            sx={{
              height: 24,
              fontSize: 11.5,
              fontWeight: 700,
              border: 'none',
              bgcolor: statusStyle.bgcolor,
              color: statusStyle.color,
            }}
          />
          <Button
            variant="contained"
            size="small"
            startIcon={<Pencil size={15} />}
            onClick={() => setEditOpen(true)}
            sx={{ px: 2 }}
          >
            Edit Profile
          </Button>
        </Stack>
      </Box>

      <Card sx={{ borderRadius: '14px', border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
        <Box
          sx={{
            height: 150,
            position: 'relative',
            bgcolor: 'linear-gradient(120deg, #152033 0%, #1E2F4A 100%)',
          }}
        >
          {hasCover ? (
            <Box
              component="img"
              src={profile.coverImageUrl ?? ''}
              alt=""
              sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : null}
        </Box>
        <Box
          sx={{
            px: { xs: 2, sm: 2.5 },
            pb: 2.5,
            pt: 0,
            mt: -4.5,
            display: 'flex',
            gap: 2,
            flexWrap: 'wrap',
            alignItems: 'flex-end',
          }}
        >
          <Avatar
            src={profile.logoUrl ?? undefined}
            sx={{
              width: 76,
              height: 76,
              border: '3px solid',
              borderColor: '#ffffff',
              bgcolor: '#F4511E',
              fontSize: 24,
              fontWeight: 800,
            }}
          >
            {initialsOf(profile.name || 'R')}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 240, display: 'grid', gap: 1 }}>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
              <Typography sx={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.01em' }}>
                {profile.name}
              </Typography>
              <Chip
                size="small"
                label={statusMeta.label}
                sx={{
                  height: 22,
                  fontSize: 11,
                  fontWeight: 700,
                  border: 'none',
                  bgcolor: statusStyle.bgcolor,
                  color: statusStyle.color,
                }}
              />
            </Stack>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 0.25 }}>
              {profile.cuisine || profile.businessType ? (
                <ContactChip icon={<Building2 size={13} />} label={profile.cuisine || profile.businessType || ''} />
              ) : null}
              {profile.contactPhone ? <ContactChip icon={<Phone size={13} />} label={profile.contactPhone} /> : null}
              {profile.contactEmail ? <ContactChip icon={<Mail size={13} />} label={profile.contactEmail} /> : null}
              {profile.website ? <ContactChip icon={<Globe size={13} />} label={profile.website} /> : null}
              {address !== '—' ? <ContactChip icon={<Building2 size={13} />} label={address} /> : null}
            </Stack>
          </Box>
        </Box>
      </Card>

      <Box sx={{ display: 'grid', gap: 2 }}>
        <Paper variant="outlined" sx={{ borderRadius: '14px', overflow: 'hidden' }}>
          <Tabs
            value={tab}
            onChange={(_, value: number) => setTab(value)}
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
            sx={{
              px: 1,
              minHeight: 48,
              '& .MuiTab-root': {
                minHeight: 48,
                fontSize: 13,
                fontWeight: 600,
                textTransform: 'none',
              },
            }}
          >
            {TAB_LABELS.map((label) => (
              <Tab key={label} label={label} />
            ))}
          </Tabs>
        </Paper>

        <TabPanel index={0} active={tab}>
          <OverviewTab
            profile={profile}
            subscription={subscriptionQuery.data}
            subscriptionLoading={subscriptionQuery.isPending}
            subscriptionError={subscriptionQuery.isError}
            onRetrySubscription={() => void subscriptionQuery.refetch()}
          />
        </TabPanel>

        <TabPanel index={1} active={tab}>
          <BusinessDetailsTab profile={profile} />
        </TabPanel>

        <TabPanel index={2} active={tab}>
          <BrandingTab profile={profile} onSave={handleSave} onNotify={notify} />
        </TabPanel>

        <TabPanel index={3} active={tab}>
          <OperatingHoursTab profile={profile} onSave={handleSave} />
        </TabPanel>

        <TabPanel index={4} active={tab}>
          <SocialMediaTab profile={profile} onSave={handleSave} />
        </TabPanel>

        <TabPanel index={5} active={tab}>
          <GalleryTab profile={profile} onSave={handleSave} />
        </TabPanel>
      </Box>

      <EditProfileDialog
        open={editOpen}
        profile={profile}
        onClose={() => setEditOpen(false)}
        onSave={handleSave}
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
    </Box>
  );
}
