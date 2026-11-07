import { useState, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  LinearProgress,
  Paper,
  Skeleton,
  Tooltip,
  Typography,
} from '@mui/material';
import { Building2, Coins, Phone, ReceiptText, UtensilsCrossed } from 'lucide-react';
import type { RestaurantProfile, RestaurantSubscription } from '@resto/types';
import { branchApi, reportApi } from '@/api';
import { formatDate, formatMoney } from '@/format';
import { composeAddress, parsePlanFeatures } from './profileUtils';

interface OverviewTabProps {
  profile: RestaurantProfile;
  subscription: RestaurantSubscription | undefined;
  subscriptionLoading: boolean;
  subscriptionError: boolean;
  onRetrySubscription: () => void;
}

const RANGE_OPTIONS = [7, 30, 90];

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2, py: 0.85 }}>
      <Typography sx={{ fontSize: 12.5, color: 'text.secondary', flexShrink: 0 }}>{label}</Typography>
      <Typography
        sx={{ fontSize: 12.5, fontWeight: 600, textAlign: 'right', minWidth: 0, wordBreak: 'break-word' }}
      >
        {value}
      </Typography>
    </Box>
  );
}

function InfoCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <Paper
      variant="outlined"
      sx={{ borderRadius: '14px', p: 2.5, display: 'grid', gap: 0.5, alignContent: 'start', minWidth: 0 }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
        <Box sx={{ color: 'primary.main', display: 'grid', placeItems: 'center' }}>{icon}</Box>
        <Typography sx={{ fontSize: 14, fontWeight: 700 }}>{title}</Typography>
      </Box>
      <Divider sx={{ mb: 0.5 }} />
      {children}
    </Paper>
  );
}

function StatTile({
  label,
  value,
  isLoading,
  caption,
}: {
  label: string;
  value: string;
  isLoading?: boolean;
  caption?: string;
}) {
  return (
    <Paper variant="outlined" sx={{ borderRadius: '12px', p: 1.75, minWidth: 0 }}>
      <Typography sx={{ fontSize: 11.5, color: 'text.secondary' }}>{label}</Typography>
      {isLoading ? (
        <Skeleton variant="text" width="65%" height={30} />
      ) : (
        <Typography
          noWrap
          sx={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.01em', mt: 0.25, lineHeight: 1.3 }}
        >
          {value}
        </Typography>
      )}
      {caption ? (
        <Typography sx={{ fontSize: 11, color: 'text.secondary', mt: 0.25, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {caption}
        </Typography>
      ) : null}
    </Paper>
  );
}

function SubscriptionBody({
  subscription,
  loading,
  error,
  onRetry,
}: {
  subscription: RestaurantSubscription | undefined;
  loading: boolean;
  error: boolean;
  onRetry: () => void;
}) {
  if (loading) {
    return (
      <Box sx={{ display: 'grid', gap: 1.25, mt: 0.5 }}>
        <Skeleton variant="text" width="60%" />
        <Skeleton variant="text" width="45%" />
        <Skeleton variant="text" width="55%" />
        <Skeleton variant="rectangular" height={8} sx={{ borderRadius: 4 }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert
        severity="error"
        variant="outlined"
        sx={{ borderRadius: '10px', fontSize: 12.5 }}
        action={
          <Button color="inherit" size="small" onClick={onRetry}>
            Retry
          </Button>
        }
      >
        Could not load subscription details.
      </Alert>
    );
  }

  if (!subscription || !subscription.planCode) {
    return (
      <Box sx={{ textAlign: 'center', py: 2.5, px: 1 }}>
        <Typography sx={{ fontSize: 13.5, fontWeight: 600 }}>No active subscription</Typography>
        <Typography sx={{ fontSize: 12.5, color: 'text.secondary', mt: 0.5 }}>
          Contact the platform administrator.
        </Typography>
      </Box>
    );
  }

  const features = parsePlanFeatures(subscription.features);
  const usage = subscription.branchUsage ?? 0;
  const limit = subscription.branchLimit;
  const progress =
    limit !== null && limit > 0 ? Math.min((usage / limit) * 100, 100) : 0;
  const renewal = subscription.currentPeriodEnd ?? subscription.trialEndsAt;

  return (
    <Box sx={{ display: 'grid', gap: 0 }}>
      <DetailRow label="Plan" value={subscription.planName ?? subscription.planCode} />
      <DetailRow
        label="Status"
        value={
          subscription.status ? (
            <Chip size="small" label={subscription.status} sx={{ height: 20, fontSize: 11, fontWeight: 700 }} />
          ) : (
            '—'
          )
        }
      />
      <DetailRow label="Billing interval" value={subscription.billingInterval ?? '—'} />
      <DetailRow label="Next renewal" value={formatDate(renewal)} />

      <Divider sx={{ my: 1 }} />

      <Box sx={{ display: 'grid', gap: 0.75 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
          <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>Branch allowance</Typography>
          <Typography sx={{ fontSize: 12.5, fontWeight: 600 }}>
            {usage}
            {limit !== null ? ` / ${limit}` : ''}
          </Typography>
        </Box>
        {limit !== null ? (
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{ height: 6, borderRadius: 4, bgcolor: 'grey.100' }}
          />
        ) : null}
      </Box>

      {features.length > 0 ? (
        <>
          <Divider sx={{ my: 1 }} />
          <Typography sx={{ fontSize: 12, fontWeight: 700, color: 'text.secondary' }}>
            Plan features
          </Typography>
          <Box component="ul" sx={{ m: 0, mt: 0.5, pl: 2, display: 'grid', gap: 0.4 }}>
            {features.map((feature, index) => (
              <Typography component="li" key={`${feature}-${index}`} sx={{ fontSize: 12.5 }}>
                {feature}
              </Typography>
            ))}
          </Box>
        </>
      ) : null}

      <Box sx={{ mt: 1.5 }}>
        <Tooltip title="Contact your platform administrator to change your plan.">
          <span>
            <Button variant="outlined" size="small" disabled>
              Manage Subscription
            </Button>
          </span>
        </Tooltip>
      </Box>
    </Box>
  );
}

export function OverviewTab({
  profile,
  subscription,
  subscriptionLoading,
  subscriptionError,
  onRetrySubscription,
}: OverviewTabProps) {
  const currency = profile.currency || 'INR';
  const [days, setDays] = useState(7);

  const sales = useQuery({
    queryKey: ['profile-performance', 'sales', days],
    queryFn: () => reportApi.sales(days),
    staleTime: 60_000,
  });
  const customers = useQuery({
    queryKey: ['profile-performance', 'customers', days],
    queryFn: () => reportApi.customers(days),
    staleTime: 60_000,
  });
  const branches = useQuery({
    queryKey: ['branches'],
    queryFn: branchApi.list,
    staleTime: 60_000,
  });

  const rangeLabel = `Last ${days} days`;

  return (
    <>
      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1fr) minmax(0, 1fr)' },
        }}
      >
        <InfoCard title="Restaurant Information" icon={<UtensilsCrossed size={16} />}>
          <DetailRow label="Name" value={profile.name || '—'} />
          <DetailRow label="Cuisine / category" value={profile.cuisine || profile.businessType || '—'} />
          <DetailRow label="Description" value={profile.description || '—'} />
          <DetailRow label="Website" value={profile.website || '—'} />
        </InfoCard>

        <InfoCard title="Contact Information" icon={<Phone size={16} />}>
          <DetailRow label="Business phone" value={profile.contactPhone || '—'} />
          <DetailRow label="Business email" value={profile.contactEmail || '—'} />
          <DetailRow label="Address" value={composeAddress(profile)} />
        </InfoCard>

        <InfoCard title="Business Details" icon={<Building2 size={16} />}>
          <DetailRow label="Legal business name" value={profile.legalName || '—'} />
          <DetailRow label="Business registration no." value={profile.businessRegistrationNumber || '—'} />
          <DetailRow label="Tax / GST number" value={profile.taxNumber || '—'} />
          <DetailRow label="Currency" value={profile.currency || '—'} />
          <DetailRow label="Time zone" value={profile.timezone || '—'} />
          <DetailRow label="Default language" value={profile.defaultLanguage || '—'} />
        </InfoCard>

        <InfoCard title="Subscription Overview" icon={<Coins size={16} />}>
          <SubscriptionBody
            subscription={subscription}
            loading={subscriptionLoading}
            error={subscriptionError}
            onRetry={onRetrySubscription}
          />
        </InfoCard>
      </Box>

      <Paper variant="outlined" sx={{ borderRadius: '14px', p: 2.5, display: 'grid', gap: 2 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1.5,
            flexWrap: 'wrap',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ color: 'primary.main', display: 'grid', placeItems: 'center' }}>
              <ReceiptText size={16} />
            </Box>
            <Typography sx={{ fontSize: 14, fontWeight: 700 }}>Business Performance</Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 0.75 }}>
            {RANGE_OPTIONS.map((option) => (
              <Chip
                key={option}
                label={`${option} days`}
                size="small"
                onClick={() => setDays(option)}
                color={days === option ? 'primary' : 'default'}
                variant={days === option ? 'filled' : 'outlined'}
                sx={{ fontSize: 11.5, fontWeight: 700 }}
              />
            ))}
          </Box>
        </Box>

        {sales.isError ? (
          <Alert
            severity="error"
            variant="outlined"
            sx={{ borderRadius: '10px', fontSize: 12.5 }}
            action={
              <Button color="inherit" size="small" onClick={() => void sales.refetch()}>
                Retry
              </Button>
            }
          >
            Sales metrics unavailable for this period.
          </Alert>
        ) : null}

        <Box
          sx={{
            display: 'grid',
            gap: 1.5,
            gridTemplateColumns: {
              xs: 'repeat(2, minmax(0, 1fr))',
              md: 'repeat(3, minmax(0, 1fr))',
              xl: 'repeat(5, minmax(0, 1fr))',
            },
          }}
        >
          <StatTile
            label="Gross revenue"
            value={formatMoney(sales.data?.grossRevenue, currency)}
            isLoading={sales.isPending}
            caption={rangeLabel}
          />
          <StatTile
            label="Total orders"
            value={String(sales.data?.orderCount ?? 0)}
            isLoading={sales.isPending}
            caption={rangeLabel}
          />
          <StatTile
            label="Average order value"
            value={formatMoney(sales.data?.averageTicket, currency)}
            isLoading={sales.isPending}
            caption={rangeLabel}
          />
          <StatTile
            label="Customers"
            value={customers.isError ? '—' : String(customers.data?.customers ?? 0)}
            isLoading={customers.isPending}
            caption={rangeLabel}
          />
          <StatTile
            label="Active branches"
            value={String(branches.data?.length ?? 0)}
            isLoading={branches.isPending}
            caption="All branches"
          />
        </Box>

        <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
          Sales revenue shown here excludes platform subscription fees.
        </Typography>
      </Paper>
    </>
  );
}

interface BusinessDetailsTabProps {
  profile: RestaurantProfile;
}

export function BusinessDetailsTab({ profile }: BusinessDetailsTabProps) {
  return (
    <Paper
      variant="outlined"
      sx={{ borderRadius: '14px', p: 2.5, display: 'grid', gap: 0.5, maxWidth: 760, alignContent: 'start' }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
        <Box sx={{ color: 'primary.main', display: 'grid', placeItems: 'center' }}>
          <Building2 size={16} />
        </Box>
        <Typography sx={{ fontSize: 14, fontWeight: 700 }}>Business Details</Typography>
      </Box>
      <Typography sx={{ fontSize: 12.5, color: 'text.secondary', mb: 0.5 }}>
        Legal, tax, and regional settings used across invoices and reports.
      </Typography>
      <Divider sx={{ mb: 0.5 }} />
      <DetailRow label="Legal business name" value={profile.legalName || '—'} />
      <DetailRow label="Business registration number" value={profile.businessRegistrationNumber || '—'} />
      <DetailRow label="Tax / GST number" value={profile.taxNumber || '—'} />
      <DetailRow label="Currency" value={profile.currency || '—'} />
      <DetailRow label="Time zone" value={profile.timezone || '—'} />
      <DetailRow label="Default language" value={profile.defaultLanguage || '—'} />
      <DetailRow
        label="Tax rate"
        value={`${(Number(profile.taxRate) * 100).toFixed(1)}%`}
      />
      <DetailRow
        label="Service charge rate"
        value={`${(Number(profile.serviceChargeRate) * 100).toFixed(1)}%`}
      />
    </Paper>
  );
}
