import { useEffect, useState, type ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Button,
  Card,
  Chip,
  Divider,
  FormControlLabel,
  LinearProgress,
  Stack,
  Switch,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { ArrowLeft, Save } from 'lucide-react';
import { ConfirmDialog, ErrorState, LoadingState, PageHeader } from '@resto/ui';
import type { TenantSummary } from '@resto/types';
import { platformApi, tenantApi } from '@/api';
import { formatInr } from '@/format';
import { StatusBadge } from '@/components/StatusBadge';
import { useToast } from '@/components/toast';

type LifecycleAction = 'activate' | 'suspend' | 'verify' | 'reject';

function InfoRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <Stack direction="row" spacing={2} sx={{ py: 1.1 }}>
      <Typography variant="body2" sx={{ width: { xs: 120, sm: 170 }, fontWeight: 600, color: 'text.secondary' }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ minWidth: 0, wordBreak: 'break-word' }}>
        {value}
      </Typography>
    </Stack>
  );
}

function LimitRow({ label, used, limit }: { label: string; used: number; limit: number | null }) {
  const pct = limit && limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
  return (
    <Box sx={{ py: 1.25 }}>
      <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
        <Typography variant="body2" fontWeight={600}>
          {label}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {used} / {limit ?? '∞'}
        </Typography>
      </Stack>
      <LinearProgress
        variant="determinate"
        value={pct}
        color={pct >= 90 ? 'warning' : 'primary'}
        sx={{ height: 6, borderRadius: 3 }}
      />
    </Box>
  );
}

export function TenantDetailPage() {
  const { id = '' } = useParams();
  const tenantId = Number(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [tab, setTab] = useState(0);
  const [target, setTarget] = useState<LifecycleAction | null>(null);
  const [bookingEnabled, setBookingEnabled] = useState<boolean | null>(null);
  const [bookingAmount, setBookingAmount] = useState<string>('');

  const tenant = useQuery({
    queryKey: ['tenants', 'detail', tenantId],
    queryFn: () => tenantApi.get(tenantId),
    enabled: Number.isFinite(tenantId),
  });

  const branches = useQuery({
    queryKey: ['sa-branches', 'tenant', tenantId],
    queryFn: () => platformApi.branches({ tenantId, size: 50 }),
    enabled: tab === 2,
  });
  const users = useQuery({
    queryKey: ['sa-users', 'tenant', tenantId],
    queryFn: () => platformApi.users({ tenantId, size: 50 }),
    enabled: tab === 3,
  });
  const subscription = useQuery({
    queryKey: ['sa-subscriptions', 'tenant', tenantId],
    queryFn: () => platformApi.subscriptions({ tenantId, size: 5 }),
    enabled: tab === 4,
  });
  const invoices = useQuery({
    queryKey: ['sa-invoices', 'tenant', tenantId],
    queryFn: () => platformApi.invoices({ tenantId, size: 20 }),
    enabled: tab === 5,
  });
  const usage = useQuery({
    queryKey: ['sa-usage', tenantId],
    queryFn: () => platformApi.usage(tenantId),
    enabled: tab === 6,
  });
  const audit = useQuery({
    queryKey: ['sa-audit', 'tenant', tenantId],
    queryFn: () => platformApi.auditLogs({ tenantId, size: 20 }),
    enabled: tab === 7,
  });
  const storeSettings = useQuery({
    queryKey: ['sa-store-settings', tenantId],
    queryFn: () => platformApi.tenantStoreSettings(tenantId),
    enabled: tab === 8,
  });

  const act = useMutation({
    mutationFn: async (action: LifecycleAction) => {
      if (action === 'activate') await tenantApi.activate(tenantId);
      else if (action === 'suspend') await tenantApi.suspend(tenantId);
      else if (action === 'verify') await tenantApi.verify(tenantId);
      else await tenantApi.reject(tenantId);
    },
    onSuccess: (_data, action) => {
      toast(
        action === 'activate'
          ? 'Restaurant activated'
          : action === 'suspend'
            ? 'Restaurant suspended'
            : action === 'verify'
              ? 'Restaurant verified'
              : 'Restaurant rejected',
      );
      setTarget(null);
      void queryClient.invalidateQueries({ queryKey: ['tenants'] });
    },
    onError: (error: Error) => toast(error.message, 'error'),
  });

  useEffect(() => {
    if (storeSettings.data) {
      setBookingEnabled(storeSettings.data.bookingPaymentEnabled);
      setBookingAmount(String(storeSettings.data.bookingPaymentAmount));
    }
  }, [storeSettings.data]);

  const saveStore = useMutation({
    mutationFn: (payload: { bookingPaymentEnabled: boolean; bookingPaymentAmount: number }) =>
      platformApi.updateTenantStoreSettings(tenantId, payload),
    onSuccess: (updated) => {
      toast('Store settings saved');
      queryClient.setQueryData(['sa-store-settings', tenantId], updated);
      void queryClient.invalidateQueries({ queryKey: ['sa-store-settings'] });
    },
    onError: (error: Error) => toast(error.message, 'error'),
  });

  if (tenant.isPending) return <LoadingState />;
  if (tenant.isError) return <ErrorState message={tenant.error.message} onRetry={() => void tenant.refetch()} />;

  const data: TenantSummary = tenant.data;

  return (
    <>
      <PageHeader
        title={data.name}
        subtitle={`/${data.slug} · Tenant ID: ${data.id} · ${(data as any).businessType ?? 'Business'}`}
        actions={
          <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
            <StatusBadge status={data.status} />
            <Button startIcon={<ArrowLeft size={16} />} onClick={() => navigate('/tenants')}>
              Back to Tenants
            </Button>
            {data.status === 'PENDING_VERIFICATION' ? (
              <>
                <Button color="error" variant="outlined" onClick={() => setTarget('reject')}>
                  Reject
                </Button>
                <Button variant="contained" sx={{ bgcolor: '#FF5722', '&:hover': { bgcolor: '#F4511E' } }} onClick={() => setTarget('verify')}>
                  Verify
                </Button>
              </>
            ) : data.status === 'CANCELLED' ? (
              <Tooltip title="Cancelled tenants cannot be reactivated through this API">
                <span>
                  <Button disabled>Activate</Button>
                </span>
              </Tooltip>
            ) : data.status === 'SUSPENDED' ? (
              <Button variant="contained" sx={{ bgcolor: '#FF5722', '&:hover': { bgcolor: '#F4511E' } }} onClick={() => setTarget('activate')}>
                Activate
              </Button>
            ) : (
              <Button color="error" variant="outlined" onClick={() => setTarget('suspend')}>
                Suspend
              </Button>
            )}
          </Stack>
        }
      />

      <Box sx={{ mb: 2.5 }}>
        <Tabs value={tab} onChange={(_, value) => setTab(value)} variant="scrollable" allowScrollButtonsMobile>
          {['Overview', 'Business Profile', 'Branches', 'Users & Roles', 'Subscription & Billing', 'Usage & Limits', 'Activity & Audit Logs', 'Store Settings'].map(
            (label) => (
              <Tab key={label} label={label} />
            ),
          )}
        </Tabs>
      </Box>

      {tab === 0 ? (
        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' } }}>
          <Card sx={{ p: 2.5, borderRadius: 3, border: '1px solid #E4E9F2' }}>
            <Typography variant="h4" sx={{ mb: 1 }}>
              Business Information
            </Typography>
            <Divider sx={{ mb: 1 }} />
            <InfoRow label="Business Name" value={data.name} />
            <InfoRow label="Tenant ID" value={data.id} />
            <InfoRow label="Slug" value={<code>/{data.slug}</code>} />
            <InfoRow label="Business Type" value={(data as any).businessType ?? '—'} />
            <InfoRow label="Status" value={<StatusBadge status={data.status} />} />
            <InfoRow label="Owner / Contact" value={(data as any).ownerName ? `${(data as any).ownerName}${(data as any).ownerEmail ? ` · ${(data as any).ownerEmail}` : ''}` : data.contactEmail ?? '—'} />
            <InfoRow label="Contact Phone" value={data.contactPhone ?? '—'} />
            <InfoRow label="Currency" value={data.currency ?? '—'} />
            <InfoRow label="Timezone" value={data.timezone ?? '—'} />
            <InfoRow label="Created Date" value={new Date(data.createdAt).toLocaleString()} />
            <InfoRow label="Last Activity" value={(data as any).lastActivityAt ? new Date((data as any).lastActivityAt).toLocaleString() : '—'} />
            <InfoRow label="Trial Ends" value={data.trialEndsAt ? new Date(data.trialEndsAt).toLocaleString() : '—'} />
          </Card>
          <Card sx={{ p: 2.5, borderRadius: 3, border: '1px solid #E4E9F2' }}>
            <Typography variant="h4">Quick Access</Typography>
            <Typography variant="caption" color="text.secondary">
              Public storefront & management links
            </Typography>
            <Box sx={{ mt: 1.5, p: 1.5, bgcolor: '#F9FBFE', borderRadius: 2, border: '1px solid #E4E9F2' }}>
              <Typography sx={{ fontFamily: 'monospace', fontSize: 13 }}>/r/{data.slug}</Typography>
            </Box>
            <Divider sx={{ my: 1.5 }} />
            <InfoRow label="Invitations" value={<Chip size="small" label="Token via Users → Reinvite" variant="outlined" />} />
            <InfoRow label="Resend email" value={<Chip size="small" label="Mail provider = none" color="warning" variant="outlined" />} />
            <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
              <Button size="small" variant="outlined" onClick={() => navigate('/users')}>
                Manage Users
              </Button>
              <Button size="small" variant="outlined" onClick={() => navigate('/branches')}>
                Manage Branches
              </Button>
            </Stack>
          </Card>
        </Box>
      ) : null}

      {tab === 1 ? (
        <Card sx={{ p: 2.5, maxWidth: 900, borderRadius: 3, border: '1px solid #E4E9F2' }}>
          <Typography variant="h4" sx={{ mb: 1 }}>
            Business Profile
          </Typography>
          <Divider sx={{ mb: 1 }} />
          <InfoRow label="Business Name" value={data.name} />
          <InfoRow label="Slug" value={<code>/{data.slug}</code>} />
          <InfoRow label="Business Type" value={(data as any).businessType ?? '—'} />
          <InfoRow label="Status" value={<StatusBadge status={data.status} />} />
          <InfoRow label="Business Email" value={data.contactEmail ?? '—'} />
          <InfoRow label="Contact Phone" value={data.contactPhone ?? '—'} />
          <InfoRow label="Owner Name" value={(data as any).ownerName ?? (data as any).ownerFullName ?? '—'} />
          <InfoRow label="Owner Email" value={(data as any).ownerEmail ?? '—'} />
          <InfoRow label="Currency" value={data.currency ?? '—'} />
          <InfoRow label="Timezone" value={data.timezone ?? '—'} />
          <InfoRow label="Country" value={(data as any).country ?? '—'} />
          <InfoRow label="Website/Domain" value={(data as any).website ?? (data as any).domain ?? '—'} />
          <InfoRow label="Created" value={new Date(data.createdAt).toLocaleString()} />
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
            Edit Tenant uses existing API constraints where available.
          </Typography>
        </Card>
      ) : null}

      {tab === 2 ? (
        <TenantTabTable
          title="Branches"
          pending={branches.isPending}
          error={branches.error?.message}
          onRetry={() => void branches.refetch()}
          headers={['Branch', 'Location', 'Status', 'Default']}
          rows={(branches.data?.content ?? []).map((branch) => [
            `${branch.name} (${branch.code})`,
            `${branch.city ?? '—'}, ${branch.country}`,
            branch.status,
            branch.isDefault ? 'Yes' : '—',
          ])}
          empty="No branches for this tenant."
          action={
            <Button size="small" variant="outlined" onClick={() => navigate('/branches')}>
              Manage Branches
            </Button>
          }
        />
      ) : null}

      {tab === 3 ? (
        <TenantTabTable
          title="Users & Roles"
          pending={users.isPending}
          error={users.error?.message}
          onRetry={() => void users.refetch()}
          headers={['User', 'Email', 'Roles', 'Status']}
          rows={(users.data?.content ?? []).map((user) => [
            `${user.firstName} ${user.lastName}`,
            user.email,
            user.roles.join(', ') || '—',
            user.status,
          ])}
          empty="No users for this tenant."
          action={
            <Stack direction="row" spacing={1}>
              <Button size="small" variant="outlined" onClick={() => navigate('/users')}>
                Manage Users
              </Button>
              <Button size="small" variant="outlined" onClick={() => navigate('/roles')}>
                Roles & Permissions
              </Button>
            </Stack>
          }
        />
      ) : null}

      {tab === 4 ? (
        <>
          <TenantTabTable
            title="Subscription"
            pending={subscription.isPending}
            error={subscription.error?.message}
            onRetry={() => void subscription.refetch()}
            headers={['Plan', 'Status', 'Billing Cycle', 'Price', 'Period']}
            rows={(subscription.data?.content ?? []).map((sub) => [
              sub.planName ?? sub.planCode ?? '—',
              sub.status,
              (sub as any).billingCycle ?? '—',
              sub.priceMonthly != null ? `${formatInr(sub.priceMonthly)}/mo` : '—',
              `${sub.currentPeriodStart ? new Date(sub.currentPeriodStart).toLocaleDateString() : '—'} → ${
                sub.currentPeriodEnd ? new Date(sub.currentPeriodEnd).toLocaleDateString() : '—'
              }`,
            ])}
            empty="No subscription found for this tenant."
            action={
              <Button size="small" variant="outlined" onClick={() => navigate('/subscriptions')}>
                Change Subscription
              </Button>
            }
          />
          <Box sx={{ mt: 2 }}>
            <TenantTabTable
              title="Billing / Invoices"
              pending={invoices.isPending}
              error={invoices.error?.message}
              onRetry={() => void invoices.refetch()}
              headers={['Invoice', 'Amount', 'Status', 'Due', 'Paid']}
              rows={(invoices.data?.content ?? []).map((invoice) => [
                invoice.invoiceNumber,
                formatInr(invoice.amount),
                invoice.status,
                invoice.dueAt ? new Date(invoice.dueAt).toLocaleDateString() : '—',
                invoice.paidAt ? new Date(invoice.paidAt).toLocaleDateString() : '—',
              ])}
              empty="No invoices for this tenant."
              action={
                <Button size="small" variant="outlined" onClick={() => navigate('/invoices')}>
                  Manage Invoices
                </Button>
              }
            />
          </Box>
        </>
      ) : null}

      {tab === 5 ? (
        <Card sx={{ p: 2.5, maxWidth: 720 }}>
          {usage.isPending ? <LoadingState /> : null}
          {usage.isError ? <ErrorState message={usage.error.message} onRetry={() => void usage.refetch()} /> : null}
          {usage.data ? (
            <>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Typography variant="h4">Usage & Limits</Typography>
                <Chip
                  size="small"
                  label={usage.data.planCode ? `Plan ${usage.data.planCode}` : 'No plan'}
                  color="primary"
                  variant="outlined"
                />
              </Stack>
              <LimitRow label="Branches" used={usage.data.branches.used} limit={usage.data.branches.limit} />
              <LimitRow label="Employees / Users" used={usage.data.employees.used} limit={usage.data.employees.limit} />
              <LimitRow label="Menu items" used={usage.data.menuItems.used} limit={usage.data.menuItems.limit} />
              <Divider sx={{ my: 1.5 }} />
              <InfoRow label="Orders" value={usage.data.orders} />
              <InfoRow label="Customers" value={usage.data.customers} />
              <InfoRow label="Subscription Status" value={usage.data.subscriptionStatus ?? 'None'} />
            </>
          ) : null}
        </Card>
      ) : null}

      {tab === 6 ? (
        <TenantTabTable
          title="Activity & Audit Logs"
          pending={audit.isPending}
          error={audit.error?.message}
          onRetry={() => void audit.refetch()}
          headers={['When', 'Action', 'Entity', 'Actor', 'Outcome']}
          rows={(audit.data?.content ?? []).map((entry) => [
            entry.createdAt ? new Date(entry.createdAt).toLocaleString() : '—',
            entry.action,
            `${entry.entityType}${entry.entityId ? ` #${entry.entityId}` : ''}`,
            entry.actorEmail ?? 'system',
            (entry as any).outcome ?? '—',
          ])}
          empty="No audit entries for this tenant."
          action={
            <Button size="small" variant="outlined" onClick={() => navigate('/audit')}>
              Platform Audit Logs
            </Button>
          }
        />
      ) : null}

      {tab === 7 ? (
        <Card sx={{ p: 2.5, maxWidth: 720 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Box>
              <Typography variant="h4">Store settings</Typography>
              <Typography variant="caption" color="text.secondary">
                Storefront behaviour for /s/{data.slug}
              </Typography>
            </Box>
            <Chip
              size="small"
              color="primary"
              variant="outlined"
              label={data.businessType ?? 'RESTAURANT'}
            />
          </Stack>
          <Divider sx={{ mb: 2 }} />
          {storeSettings.isPending ? <LoadingState /> : null}
          {storeSettings.isError ? (
            <ErrorState
              message={storeSettings.error.message}
              onRetry={() => void storeSettings.refetch()}
            />
          ) : null}
          {storeSettings.data && bookingEnabled !== null ? (
            <Stack spacing={2.5}>
              <Box>
                <Typography variant="body2" fontWeight={700}>
                  Enquiry booking payment
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                  When enabled, storefront enquiries create a booking order for the amount below and the
                  customer pays online (sandbox). Defaults: ON for VEHICLE and REAL_ESTATE tenants, OFF
                  otherwise.
                </Typography>
                <FormControlLabel
                  control={
                    <Switch
                      checked={bookingEnabled}
                      onChange={(event) => setBookingEnabled(event.target.checked)}
                    />
                  }
                  label={bookingEnabled ? 'Enabled' : 'Disabled'}
                />
              </Box>
              <TextField
                label="Booking amount"
                type="number"
                value={bookingAmount}
                onChange={(event) => setBookingAmount(event.target.value)}
                inputProps={{ min: 0, step: 1 }}
                helperText="Flat amount charged per enquiry booking"
                sx={{ maxWidth: 260 }}
                disabled={!bookingEnabled}
              />
              <Stack direction="row" spacing={1.5}>
                <Button
                  variant="contained"
                  startIcon={<Save size={16} />}
                  disabled={
                    saveStore.isPending ||
                    bookingAmount.trim() === '' ||
                    Number(bookingAmount) < 0 ||
                    Number.isNaN(Number(bookingAmount))
                  }
                  onClick={() =>
                    saveStore.mutate({
                      bookingPaymentEnabled: bookingEnabled,
                      bookingPaymentAmount: Number(bookingAmount),
                    })
                  }
                >
                  Save changes
                </Button>
                <Button
                  variant="outlined"
                  disabled={saveStore.isPending}
                  onClick={() => {
                    setBookingEnabled(storeSettings.data!.bookingPaymentEnabled);
                    setBookingAmount(String(storeSettings.data!.bookingPaymentAmount));
                  }}
                >
                  Reset
                </Button>
              </Stack>
            </Stack>
          ) : null}
        </Card>
      ) : null}

      <ConfirmDialog
        open={target !== null}
        title={
          target === 'activate'
            ? 'Activate restaurant?'
            : target === 'suspend'
              ? 'Suspend restaurant?'
              : target === 'verify'
                ? 'Verify restaurant?'
                : 'Reject restaurant?'
        }
        description={`${target ? target.charAt(0).toUpperCase() + target.slice(1) : ''} "${data.name}"? This takes effect immediately for all of its users.`}
        confirmLabel={target ? target.charAt(0).toUpperCase() + target.slice(1) : 'Confirm'}
        destructive={target === 'suspend' || target === 'reject'}
        loading={act.isPending}
        onCancel={() => setTarget(null)}
        onConfirm={() => {
          if (target) act.mutate(target);
        }}
      />
    </>
  );
}

function TenantTabTable({
  title,
  headers,
  rows,
  empty,
  pending,
  error,
  onRetry,
  action,
}: {
  title: string;
  headers: string[];
  rows: ReactNode[][];
  empty: string;
  pending?: boolean;
  error?: string;
  onRetry?: () => void;
  action?: ReactNode;
}) {
  return (
    <Card>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: 2.5, py: 2 }}>
        <Typography variant="h4">{title}</Typography>
        {action}
      </Stack>
      <Divider />
      {pending ? <LoadingState /> : null}
      {error ? <ErrorState message={error} onRetry={onRetry} /> : null}
      {!pending && !error ? (
        <Table size="small">
          <TableHead>
            <TableRow>
              {headers.map((header) => (
                <TableCell key={header}>{header}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={headers.length} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                  {empty}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((cells, index) => (
                <TableRow key={index} hover>
                  {cells.map((cell, cellIndex) => (
                    <TableCell key={cellIndex}>{cell}</TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      ) : null}
    </Card>
  );
}
