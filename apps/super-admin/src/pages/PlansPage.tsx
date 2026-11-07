import { useEffect, useMemo, useState, type MouseEvent as ReactMouseEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  Box,
  Button,
  Card,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Drawer,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Menu,
  MenuItem,
  Skeleton,
  Stack,
  Step,
  StepLabel,
  Stepper,
  Switch,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  Tabs,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  Archive,
  CalendarDays,
  Check,
  CheckCircle2,
  CircleDollarSign,
  Copy,
  Crown,
  Download,
  Eye,
  Layers,
  LayoutGrid,
  List,
  MoreVertical,
  Pencil,
  Plus,
  Rocket,
  Search,
  Sparkles,
  Trash2,
  TrendingUp,
  Users,
  X,
} from 'lucide-react';
import { ConfirmDialog, EmptyState, ErrorState, LoadingState, PageHeader } from '@resto/ui';
import {
  platformApi,
  type PlanPriceHistoryView,
  type PlanRequest,
  type PlanView,
  type SubscriptionView,
} from '@/api';
import { useToast } from '@/components/toast';
import { KpiCard } from '@/components/KpiCard';
import { ORANGE } from '@/theme';

const NAVY = '#111D32';
const BORDER = '#E4E9F2';
const MUTED = '#5A6478';

const BUSINESS_TYPES = [
  { value: 'RESTAURANT', label: 'Restaurant / Hotel', short: 'Restaurant', fg: '#B76E00', bg: '#FFF4E5' },
  { value: 'ELECTRONICS', label: 'Electronics Store', short: 'Electronics', fg: '#2F6FED', bg: '#EEF4FF' },
  { value: 'VEHICLE', label: 'Vehicle Dealership', short: 'Vehicle', fg: '#1B8A5A', bg: '#E8F7F0' },
  { value: 'REAL_ESTATE', label: 'Builder / Broker', short: 'Real estate', fg: '#7C3AED', bg: '#F3EEFF' },
] as const;

const BUSINESS_LOOKUP = new Map<string, (typeof BUSINESS_TYPES)[number]>(
  BUSINESS_TYPES.map((item) => [item.value, item]),
);

const STATUS_META: Record<string, { label: string; fg: string; bg: string }> = {
  ACTIVE: { label: 'Active', fg: '#1B8A5A', bg: '#E8F7F0' },
  INACTIVE: { label: 'Inactive', fg: '#5A6478', bg: '#F1F5F9' },
  DRAFT: { label: 'Draft', fg: '#B76E00', bg: '#FFF4E5' },
  ARCHIVED: { label: 'Archived', fg: '#9F1239', bg: '#FEF2F2' },
};

const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP', 'AED', 'SGD', 'AUD', 'CAD'];

const PRESET_FEATURES: Record<string, string[]> = {
  RESTAURANT: [
    'Menu Management',
    'Table Management',
    'QR Ordering',
    'Order Management',
    'Kitchen Display',
    'Employee Management',
    'Branch Management',
    'Reports',
    'Advanced Analytics',
  ],
  ELECTRONICS: [
    'Product Management',
    'Inventory Management',
    'POS',
    'Stock Alerts',
    'Supplier Management',
    'Sales Reports',
  ],
  VEHICLE: [
    'Vehicle Inventory',
    'Lead Management',
    'Customer Management',
    'Test Drive Scheduling',
    'Sales Management',
    'Reports',
  ],
  REAL_ESTATE: [
    'Property Listings',
    'Lead Management',
    'Project Management',
    'Customer Management',
    'Site Visit Scheduling',
    'Reports',
  ],
};

const STEP_LABELS = ['Basic information', 'Pricing', 'Features', 'Usage limits', 'Review & publish'];

type ViewMode = 'grid' | 'table';
type StatusFilter = 'ALL' | 'ACTIVE' | 'INACTIVE' | 'DRAFT' | 'ARCHIVED';
type IntervalFilter = 'ALL' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
type SortKey = 'name' | 'priceMonthly' | 'subscribers' | 'updatedAt';

const EMPTY_FORM = {
  code: '',
  name: '',
  description: '',
  businessType: 'RESTAURANT',
  status: 'DRAFT',
  sortOrder: '0',
  priceMonthly: '',
  priceQuarterly: '',
  priceYearly: '',
  currency: 'INR',
  trialDays: '0',
  setupFee: '',
  taxPercent: '',
  yearlyDiscountPercent: '',
  maxBranches: '',
  maxEmployees: '',
  maxMenuItems: '',
  maxOrdersPerMonth: '',
  maxStorageGb: '',
  maxAdminUsers: '',
  maxCustomers: '',
  isPublic: true,
  features: [] as string[],
};

type PlanFormState = typeof EMPTY_FORM;

function parseFeatures(features: string | null): string[] {
  if (!features) return [];
  try {
    const parsed = JSON.parse(features);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return features.split(',').map((part) => part.trim()).filter(Boolean);
  }
}

function formatMoney(value: number | null | undefined, _currency?: string): string {
  if (value === null || value === undefined) return '—';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(value);
}

function formatCompact(value: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
}

function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function downloadCsv(filename: string, headers: string[], rows: (string | number)[][]) {
  const escape = (value: string | number) => `"${String(value ?? '').replace(/"/g, '""')}"`;
  const csv = [headers.map(escape).join(','), ...rows.map((row) => row.map(escape).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function limitText(value: number | null | undefined): string {
  return value === null || value === undefined ? 'Unlimited' : value.toLocaleString('en-IN');
}

function numberOrNull(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

function formFromPlan(plan: PlanView): PlanFormState {
  return {
    code: plan.code,
    name: plan.name,
    description: plan.description ?? '',
    businessType: plan.businessType || 'RESTAURANT',
    status: plan.status || 'ACTIVE',
    sortOrder: String(plan.sortOrder ?? 0),
    priceMonthly: String(plan.priceMonthly ?? 0),
    priceQuarterly: plan.priceQuarterly === null ? '' : String(plan.priceQuarterly),
    priceYearly: plan.priceYearly === null ? '' : String(plan.priceYearly),
    currency: plan.currency || 'INR',
    trialDays: String(plan.trialDays ?? 0),
    setupFee: plan.setupFee === null ? '' : String(plan.setupFee),
    taxPercent: plan.taxPercent === null ? '' : String(plan.taxPercent),
    yearlyDiscountPercent: plan.yearlyDiscountPercent === null ? '' : String(plan.yearlyDiscountPercent),
    maxBranches: plan.maxBranches === null ? '' : String(plan.maxBranches),
    maxEmployees: plan.maxEmployees === null ? '' : String(plan.maxEmployees),
    maxMenuItems: plan.maxMenuItems === null ? '' : String(plan.maxMenuItems),
    maxOrdersPerMonth: plan.maxOrdersPerMonth === null ? '' : String(plan.maxOrdersPerMonth),
    maxStorageGb: plan.maxStorageGb === null ? '' : String(plan.maxStorageGb),
    maxAdminUsers: plan.maxAdminUsers === null ? '' : String(plan.maxAdminUsers),
    maxCustomers: plan.maxCustomers === null ? '' : String(plan.maxCustomers),
    isPublic: plan.isPublic,
    features: parseFeatures(plan.features),
  };
}

function requestFromForm(form: PlanFormState, statusOverride?: string): PlanRequest {
  return {
    code: form.code.trim().toUpperCase(),
    name: form.name.trim(),
    description: form.description.trim() || undefined,
    businessType: form.businessType,
    priceMonthly: numberOrNull(form.priceMonthly) ?? 0,
    priceQuarterly: numberOrNull(form.priceQuarterly),
    priceYearly: numberOrNull(form.priceYearly),
    currency: form.currency,
    status: statusOverride ?? form.status,
    trialDays: numberOrNull(form.trialDays) ?? 0,
    setupFee: numberOrNull(form.setupFee),
    taxPercent: numberOrNull(form.taxPercent),
    yearlyDiscountPercent: numberOrNull(form.yearlyDiscountPercent),
    maxBranches: numberOrNull(form.maxBranches),
    maxEmployees: numberOrNull(form.maxEmployees),
    maxMenuItems: numberOrNull(form.maxMenuItems),
    maxOrdersPerMonth: numberOrNull(form.maxOrdersPerMonth),
    maxStorageGb: numberOrNull(form.maxStorageGb),
    maxAdminUsers: numberOrNull(form.maxAdminUsers),
    maxCustomers: numberOrNull(form.maxCustomers),
    features: JSON.stringify(form.features),
    isPublic: form.isPublic,
    sortOrder: numberOrNull(form.sortOrder) ?? 0,
  };
}

function requestFromPlan(plan: PlanView, overrides: Partial<PlanRequest>): PlanRequest {
  return {
    code: plan.code,
    name: plan.name,
    description: plan.description ?? undefined,
    businessType: plan.businessType,
    priceMonthly: plan.priceMonthly,
    priceQuarterly: plan.priceQuarterly,
    priceYearly: plan.priceYearly,
    currency: plan.currency,
    status: plan.status,
    trialDays: plan.trialDays,
    setupFee: plan.setupFee,
    taxPercent: plan.taxPercent,
    yearlyDiscountPercent: plan.yearlyDiscountPercent,
    maxBranches: plan.maxBranches,
    maxEmployees: plan.maxEmployees,
    maxMenuItems: plan.maxMenuItems,
    maxOrdersPerMonth: plan.maxOrdersPerMonth,
    maxStorageGb: plan.maxStorageGb,
    maxAdminUsers: plan.maxAdminUsers,
    maxCustomers: plan.maxCustomers,
    features: plan.features ?? undefined,
    isPublic: plan.isPublic,
    sortOrder: plan.sortOrder,
    ...overrides,
  };
}

function validateStep(step: number, form: PlanFormState): string | null {
  if (step === 0) {
    if (!form.code.trim()) return 'Plan code is required.';
    if (!/^[A-Z0-9_-]{2,40}$/.test(form.code.trim().toUpperCase())) {
      return 'Plan code may only contain letters, numbers, hyphens and underscores (2-40 characters).';
    }
    if (!form.name.trim()) return 'Plan name is required.';
    return null;
  }
  if (step === 1) {
    if (numberOrNull(form.priceMonthly) === null) return 'Monthly price is required.';
    if ((numberOrNull(form.priceMonthly) ?? 0) < 0) return 'Prices cannot be negative.';
    if (form.priceQuarterly.trim() && numberOrNull(form.priceQuarterly) === null) {
      return 'Quarterly price must be a number.';
    }
    if (form.priceYearly.trim() && numberOrNull(form.priceYearly) === null) {
      return 'Yearly price must be a number.';
    }
    for (const [key, label] of [
      ['setupFee', 'Setup fee'],
      ['taxPercent', 'Tax percentage'],
      ['yearlyDiscountPercent', 'Yearly discount'],
    ] as const) {
      if (form[key].trim() && numberOrNull(form[key]) === null) return `${label} must be a number.`;
      const value = numberOrNull(form[key]);
      if (key !== 'setupFee' && value !== null && (value < 0 || value > 100)) {
        return `${label} must be between 0 and 100.`;
      }
    }
    if ((numberOrNull(form.trialDays) ?? 0) < 0) return 'Trial duration cannot be negative.';
    return null;
  }
  if (step === 3) {
    for (const [key, label] of [
      ['maxBranches', 'Maximum branches'],
      ['maxEmployees', 'Maximum employees'],
      ['maxMenuItems', 'Maximum products / menu items'],
      ['maxOrdersPerMonth', 'Maximum orders per month'],
      ['maxStorageGb', 'Maximum storage'],
      ['maxAdminUsers', 'Maximum admin users'],
      ['maxCustomers', 'Maximum customers / leads'],
    ] as const) {
      if (form[key].trim() && numberOrNull(form[key]) === null) return `${label} must be a number.`;
      const value = numberOrNull(form[key]);
      if (value !== null && value < 0) return `${label} cannot be negative.`;
    }
    return null;
  }
  return null;
}

function BusinessChip({ type }: { type: string }) {
  const meta = BUSINESS_LOOKUP.get(type);
  return (
    <Chip
      size="small"
      label={meta?.short ?? type}
      sx={{ bgcolor: meta?.bg ?? '#F1F5F9', color: meta?.fg ?? MUTED, fontWeight: 600, fontSize: 11.5 }}
    />
  );
}

function StatusChip({ status }: { status: string }) {
  const meta = STATUS_META[status] ?? { label: status, fg: MUTED, bg: '#F1F5F9' };
  return (
    <Chip
      size="small"
      label={meta.label}
      sx={{ bgcolor: meta.bg, color: meta.fg, fontWeight: 700, fontSize: 11.5 }}
    />
  );
}

function InfoRow({ label, value }: { label: string; value: string | number }) {
  return (
    <Stack direction="row" justifyContent="space-between" spacing={2} sx={{ py: 0.75 }}>
      <Typography variant="body2" sx={{ color: MUTED, fontSize: 13 }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 600, fontSize: 13, textAlign: 'right' }}>
        {value}
      </Typography>
    </Stack>
  );
}

export function PlansPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [view, setView] = useState<ViewMode>('grid');
  const [search, setSearch] = useState('');
  const [businessType, setBusinessType] = useState('ALL');
  const [status, setStatus] = useState<StatusFilter>('ALL');
  const [intervalFilter, setIntervalFilter] = useState<IntervalFilter>('ALL');
  const [currency, setCurrency] = useState('ALL');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(9);
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [selectedCodes, setSelectedCodes] = useState<string[]>([]);
  const [actionMenu, setActionMenu] = useState<{ anchor: HTMLElement; plan: PlanView } | null>(null);

  const [wizardOpen, setWizardOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<PlanView | null>(null);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<PlanFormState>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [featureDraft, setFeatureDraft] = useState('');

  const [detailPlan, setDetailPlan] = useState<PlanView | null>(null);
  const [detailTab, setDetailTab] = useState(0);

  const [deleteTarget, setDeleteTarget] = useState<PlanView | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<PlanView | null>(null);
  const [compareOpen, setCompareOpen] = useState(false);

  const plans = useQuery({ queryKey: ['sa-plans'], queryFn: () => platformApi.plans() });
  const stats = useQuery({ queryKey: ['sa-stats'], queryFn: () => platformApi.stats() });

  const priceHistory = useQuery({
    queryKey: ['sa-plan-price-history', detailPlan?.code],
    queryFn: () => platformApi.planPriceHistory(detailPlan?.code ?? ''),
    enabled: Boolean(detailPlan) && detailTab === 3,
  });

  const subscribers = useQuery({
    queryKey: ['sa-plan-subscribers', detailPlan?.code],
    queryFn: () => platformApi.subscriptions({ planCode: detailPlan?.code ?? '', page: 0, size: 50 }),
    enabled: Boolean(detailPlan) && detailTab === 2,
  });

  const activity = useQuery({
    queryKey: ['sa-plan-activity', detailPlan?.code],
    queryFn: () => platformApi.auditLogs({ entityType: 'SUBSCRIPTION_PLAN', page: 0, size: 100 }),
    enabled: Boolean(detailPlan) && detailTab === 4,
  });

  useEffect(() => {
    setPage(0);
  }, [search, businessType, status, intervalFilter, currency]);

  const allPlans = plans.data ?? [];

  const filteredPlans = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return allPlans.filter((plan) => {
      if (needle && !plan.name.toLowerCase().includes(needle) && !plan.code.toLowerCase().includes(needle)) {
        return false;
      }
      if (businessType !== 'ALL' && plan.businessType !== businessType) return false;
      if (status !== 'ALL' && plan.status !== status) return false;
      if (currency !== 'ALL' && plan.currency !== currency) return false;
      if (intervalFilter === 'QUARTERLY' && !(plan.priceQuarterly && plan.priceQuarterly > 0)) return false;
      if (intervalFilter === 'YEARLY' && !(plan.priceYearly && plan.priceYearly > 0)) return false;
      return true;
    });
  }, [allPlans, search, businessType, status, intervalFilter, currency]);

  const sortedPlans = useMemo(() => {
    const sorted = [...filteredPlans];
    sorted.sort((a, b) => {
      let diff = 0;
      if (sortKey === 'name') diff = a.name.localeCompare(b.name);
      if (sortKey === 'priceMonthly') diff = a.priceMonthly - b.priceMonthly;
      if (sortKey === 'subscribers') diff = a.subscriberCount - b.subscriberCount;
      if (sortKey === 'updatedAt') diff = (a.updatedAt ?? '').localeCompare(b.updatedAt ?? '');
      return sortDir === 'asc' ? diff : -diff;
    });
    return sorted;
  }, [filteredPlans, sortKey, sortDir]);

  const pagedPlans = useMemo(
    () => sortedPlans.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [sortedPlans, page, rowsPerPage],
  );

  const currencies = useMemo(() => Array.from(new Set(allPlans.map((plan) => plan.currency))).sort(), [allPlans]);
  const maxSubscribers = useMemo(
    () => allPlans.reduce((max, plan) => Math.max(max, plan.subscriberCount), 0),
    [allPlans],
  );
  const popularCodes = useMemo(
    () =>
      new Set(
        maxSubscribers > 0
          ? allPlans.filter((plan) => plan.subscriberCount === maxSubscribers).map((plan) => plan.code)
          : [],
      ),
    [allPlans, maxSubscribers],
  );
  const totalSubscribers = useMemo(
    () => allPlans.reduce((sum, plan) => sum + plan.subscriberCount, 0),
    [allPlans],
  );
  const activePlans = allPlans.filter((plan) => plan.status === 'ACTIVE').length;
  const draftInactive = allPlans.filter((plan) => plan.status === 'DRAFT' || plan.status === 'INACTIVE').length;
  const verticalCount = new Set(allPlans.map((plan) => plan.businessType)).size;
  const popularPlan = allPlans.find((plan) => plan.code === Array.from(popularCodes)[0]);
  const selectedPlans = allPlans.filter((plan) => selectedCodes.includes(plan.code));
  const comparePlans = selectedPlans.slice(0, 3);

  const invalidateAll = () => {
    void queryClient.invalidateQueries({ queryKey: ['sa-plans'] });
    void queryClient.invalidateQueries({ queryKey: ['sa-stats'] });
    void queryClient.invalidateQueries({ queryKey: ['plans'] });
  };

  const saveMutation = useMutation({
    mutationFn: async (payload: { request: PlanRequest; code?: string }) =>
      payload.code ? platformApi.updatePlan(payload.code, payload.request) : platformApi.createPlan(payload.request),
    onSuccess: (_data, variables) => {
      toast(variables.code ? 'Plan updated' : 'Plan created');
      setWizardOpen(false);
      setEditingPlan(null);
      setFormError(null);
      invalidateAll();
    },
    onError: (error: Error) => setFormError(error.message),
  });

  const statusMutation = useMutation({
    mutationFn: (payload: { code: string; status: string }) =>
      platformApi.changePlanStatus(payload.code, payload.status),
    onSuccess: () => {
      toast('Plan status updated');
      invalidateAll();
    },
    onError: (error: Error) => toast(error.message, 'error'),
  });

  const bulkStatusMutation = useMutation({
    mutationFn: async (payload: { codes: string[]; status: string }) => {
      await Promise.all(payload.codes.map((code) => platformApi.changePlanStatus(code, payload.status)));
      return payload.codes.length;
    },
    onSuccess: (count) => {
      toast(`${count} plan${count === 1 ? '' : 's'} updated`);
      setSelectedCodes([]);
      invalidateAll();
    },
    onError: (error: Error) => toast(error.message, 'error'),
  });

  const deleteMutation = useMutation({
    mutationFn: (code: string) => platformApi.deletePlan(code),
    onSuccess: () => {
      toast('Plan deleted');
      setDeleteTarget(null);
      if (detailPlan && deleteTarget && detailPlan.code === deleteTarget.code) setDetailPlan(null);
      invalidateAll();
    },
    onError: (error: Error) => toast(error.message, 'error'),
  });

  const openCreate = () => {
    setEditingPlan(null);
    setForm({ ...EMPTY_FORM, businessType: businessType === 'ALL' ? 'RESTAURANT' : businessType });
    setStep(0);
    setFormError(null);
    setFeatureDraft('');
    setWizardOpen(true);
  };

  const openEdit = (plan: PlanView) => {
    setEditingPlan(plan);
    setForm(formFromPlan(plan));
    setStep(0);
    setFormError(null);
    setFeatureDraft('');
    setWizardOpen(true);
    setActionMenu(null);
  };

  const duplicatePlan = async (plan: PlanView) => {
    setActionMenu(null);
    const existing = new Set(allPlans.map((item) => item.code));
    let code = `${plan.code}_COPY`;
    let suffix = 2;
    while (existing.has(code)) {
      code = `${plan.code}_COPY${suffix}`;
      suffix += 1;
    }
    try {
      await platformApi.createPlan(
        requestFromPlan(plan, { code, name: `${plan.name} (Copy)`, status: 'DRAFT' }),
      );
      toast(`Duplicated as ${code} (draft)`);
      invalidateAll();
    } catch (error) {
      toast((error as Error).message, 'error');
    }
  };

  const exportPlans = () => {
    downloadCsv(
      'subscription-plans.csv',
      [
        'Code',
        'Name',
        'Business Type',
        'Status',
        'Monthly',
        'Quarterly',
        'Yearly',
        'Currency',
        'Trial Days',
        'Branches',
        'Employees',
        'Products',
        'Orders / month',
        'Storage GB',
        'Admin Users',
        'Customers / Leads',
        'Subscribers',
        'Features',
        'Created',
      ],
      sortedPlans.map((plan) => [
        plan.code,
        plan.name,
        BUSINESS_LOOKUP.get(plan.businessType)?.label ?? plan.businessType,
        plan.status,
        plan.priceMonthly,
        plan.priceQuarterly ?? '',
        plan.priceYearly ?? '',
        plan.currency,
        plan.trialDays,
        plan.maxBranches ?? 'Unlimited',
        plan.maxEmployees ?? 'Unlimited',
        plan.maxMenuItems ?? 'Unlimited',
        plan.maxOrdersPerMonth ?? 'Unlimited',
        plan.maxStorageGb ?? 'Unlimited',
        plan.maxAdminUsers ?? 'Unlimited',
        plan.maxCustomers ?? 'Unlimited',
        plan.subscriberCount,
        parseFeatures(plan.features).join('; '),
        plan.createdAt,
      ]),
    );
    toast('Plans exported');
  };

  const exportSelected = () => {
    if (selectedPlans.length === 0) return;
    downloadCsv(
      'selected-plans.csv',
      ['Code', 'Name', 'Business Type', 'Status', 'Monthly', 'Yearly', 'Subscribers'],
      selectedPlans.map((plan) => [
        plan.code,
        plan.name,
        plan.businessType,
        plan.status,
        plan.priceMonthly,
        plan.priceYearly ?? '',
        plan.subscriberCount,
      ]),
    );
    toast('Selection exported');
  };

  const toggleSelected = (code: string) => {
    setSelectedCodes((current) =>
      current.includes(code) ? current.filter((item) => item !== code) : [...current, code],
    );
  };

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((current) => (current === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const setField = <K extends keyof PlanFormState>(key: K, value: PlanFormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const addFeature = (value: string) => {
    const feature = value.trim();
    if (!feature) return;
    setForm((current) =>
      current.features.includes(feature)
        ? current
        : { ...current, features: [...current.features, feature] },
    );
    setFeatureDraft('');
  };

  const removeFeature = (feature: string) => {
    setForm((current) => ({ ...current, features: current.features.filter((item) => item !== feature) }));
  };

  const goNext = () => {
    const error = validateStep(step, form);
    if (error) {
      setFormError(error);
      return;
    }
    setFormError(null);
    setStep((current) => Math.min(current + 1, STEP_LABELS.length - 1));
  };

  const goBack = () => {
    setFormError(null);
    setStep((current) => Math.max(current - 1, 0));
  };

  const submitPlan = (statusOverride?: string) => {
    for (let index = 0; index < 4; index += 1) {
      const error = validateStep(index, form);
      if (error) {
        setStep(index);
        setFormError(error);
        return;
      }
    }
    saveMutation.mutate({
      request: requestFromForm(form, statusOverride),
      code: editingPlan?.code,
    });
  };

  const closeWizard = () => {
    if (saveMutation.isPending) return;
    setWizardOpen(false);
    setEditingPlan(null);
    setFormError(null);
  };

  const confirmArchive = () => {
    if (!archiveTarget) return;
    statusMutation.mutate({ code: archiveTarget.code, status: 'ARCHIVED' });
    setArchiveTarget(null);
  };

  const showDetails = (plan: PlanView) => {
    setDetailPlan(plan);
    setDetailTab(0);
    setActionMenu(null);
  };

  const renderActionsMenu = () => (
    <Menu
      anchorEl={actionMenu?.anchor ?? null}
      open={Boolean(actionMenu)}
      onClose={() => setActionMenu(null)}
      slotProps={{ paper: { sx: { minWidth: 210 } } }}
    >
      <MenuItem onClick={() => actionMenu && showDetails(actionMenu.plan)}>
        <Eye size={15} style={{ marginRight: 10 }} /> View details
      </MenuItem>
      <MenuItem
        disabled={actionMenu?.plan.status === 'ARCHIVED'}
        onClick={() => actionMenu && openEdit(actionMenu.plan)}
      >
        <Pencil size={15} style={{ marginRight: 10 }} /> Edit plan
      </MenuItem>
      <MenuItem onClick={() => actionMenu && void duplicatePlan(actionMenu.plan)}>
        <Copy size={15} style={{ marginRight: 10 }} /> Duplicate plan
      </MenuItem>
      <Divider />
      {actionMenu?.plan.status === 'ACTIVE' ? (
        <MenuItem
          onClick={() => {
            statusMutation.mutate({ code: actionMenu.plan.code, status: 'INACTIVE' });
            setActionMenu(null);
          }}
        >
          <Archive size={15} style={{ marginRight: 10 }} /> Deactivate
        </MenuItem>
      ) : (
        <MenuItem
          disabled={actionMenu?.plan.status === 'ARCHIVED'}
          onClick={() => {
            if (!actionMenu) return;
            statusMutation.mutate({ code: actionMenu.plan.code, status: 'ACTIVE' });
            setActionMenu(null);
          }}
        >
          <CheckCircle2 size={15} style={{ marginRight: 10 }} /> Activate
        </MenuItem>
      )}
      <MenuItem
        disabled={actionMenu?.plan.status === 'ARCHIVED'}
        onClick={() => {
          if (actionMenu) setArchiveTarget(actionMenu.plan);
          setActionMenu(null);
        }}
      >
        <Archive size={15} style={{ marginRight: 10 }} /> Archive
      </MenuItem>
      <Divider />
      <MenuItem
        sx={{ color: '#D32F2F' }}
        onClick={() => {
          if (actionMenu) setDeleteTarget(actionMenu.plan);
          setActionMenu(null);
        }}
      >
        <Trash2 size={15} style={{ marginRight: 10 }} /> Delete
      </MenuItem>
    </Menu>
  );

  const renderGrid = () => (
    <Box
      sx={{
        display: 'grid',
        gap: 2,
        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(3, minmax(0, 1fr))' },
      }}
    >
      {pagedPlans.map((plan) => {
        const features = parseFeatures(plan.features);
        const popular = popularCodes.has(plan.code);
        const selected = selectedCodes.includes(plan.code);
        return (
          <Card
            key={plan.code}
            elevation={0}
            sx={{
              p: 2.25,
              borderRadius: 2.5,
              border: popular ? `1.5px solid ${ORANGE}` : `1px solid ${BORDER}`,
              boxShadow: '0 1px 2px rgba(15,23,42,0.04)',
              display: 'flex',
              flexDirection: 'column',
              gap: 1.5,
              position: 'relative',
              transition: 'box-shadow 0.15s ease, border-color 0.15s ease',
              '&:hover': { boxShadow: '0 8px 24px rgba(15,23,42,0.08)' },
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
              <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" useFlexGap>
                <Checkbox
                  size="small"
                  checked={selected}
                  onChange={() => toggleSelected(plan.code)}
                  inputProps={{ 'aria-label': `Select ${plan.name}` }}
                  sx={{ p: 0.25 }}
                />
                <BusinessChip type={plan.businessType} />
                <StatusChip status={plan.status} />
                {popular ? (
                  <Chip
                    size="small"
                    icon={<Crown size={12} />}
                    label="Most popular"
                    sx={{ bgcolor: '#FFF1EC', color: ORANGE, fontWeight: 700, fontSize: 11 }}
                  />
                ) : null}
              </Stack>
              <IconButton
                size="small"
                aria-label={`Actions for ${plan.name}`}
                onClick={(event: ReactMouseEvent<HTMLElement>) =>
                  setActionMenu({ anchor: event.currentTarget, plan })
                }
              >
                <MoreVertical size={16} />
              </IconButton>
            </Stack>

            <Box>
              <Typography sx={{ fontSize: 18, fontWeight: 700, color: NAVY, lineHeight: 1.25 }}>
                {plan.name}
              </Typography>
              <Typography sx={{ fontSize: 11.5, color: '#8A93A6', mt: 0.25, letterSpacing: '0.04em' }}>
                {plan.code}
              </Typography>
            </Box>

            <Box>
              <Stack direction="row" alignItems="baseline" spacing={0.75}>
                <Typography sx={{ fontSize: 26, fontWeight: 800, color: NAVY, letterSpacing: '-0.02em' }}>
                  {formatMoney(plan.priceMonthly, plan.currency)}
                </Typography>
                <Typography sx={{ fontSize: 12, color: MUTED }}>/ month</Typography>
              </Stack>
              <Typography sx={{ fontSize: 12, color: MUTED, mt: 0.25 }}>
                {plan.priceYearly
                  ? `${formatMoney(plan.priceYearly, plan.currency)} / year`
                  : 'Yearly billing not configured'}
              </Typography>
            </Box>

            <Typography
              sx={{
                fontSize: 12.5,
                color: MUTED,
                lineHeight: 1.5,
                minHeight: 38,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {plan.description || 'No description provided.'}
            </Typography>

            <Stack direction="row" spacing={0.5} useFlexGap flexWrap="wrap" sx={{ minHeight: 26 }}>
              {features.slice(0, 4).map((feature) => (
                <Chip
                  key={feature}
                  size="small"
                  label={feature}
                  sx={{ bgcolor: '#F5F7FB', color: '#475569', fontSize: 11, height: 22 }}
                />
              ))}
              {features.length > 4 ? (
                <Chip
                  size="small"
                  label={`+${features.length - 4} more`}
                  sx={{ bgcolor: '#F5F7FB', color: MUTED, fontSize: 11, height: 22 }}
                />
              ) : null}
            </Stack>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 0.75,
                bgcolor: '#F8FAFC',
                borderRadius: 1.5,
                p: 1,
              }}
            >
              {[
                ['Branches', plan.maxBranches],
                ['Staff', plan.maxEmployees],
                ['Items', plan.maxMenuItems],
              ].map(([label, value]) => (
                <Box key={String(label)}>
                  <Typography sx={{ fontSize: 10.5, color: '#8A93A6', textTransform: 'uppercase' }}>
                    {label}
                  </Typography>
                  <Typography sx={{ fontSize: 12.5, fontWeight: 600, color: NAVY }}>
                    {limitText(value as number | null)}
                  </Typography>
                </Box>
              ))}
            </Box>

            <Divider sx={{ borderColor: '#EEF2F7' }} />

            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <Users size={14} color={MUTED} />
                  <Typography sx={{ fontSize: 12, color: MUTED }}>
                    {plan.subscriberCount} subscriber{plan.subscriberCount === 1 ? '' : 's'}
                  </Typography>
                </Stack>
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <CalendarDays size={14} color={MUTED} />
                  <Typography sx={{ fontSize: 12, color: MUTED }}>{formatDate(plan.updatedAt)}</Typography>
                </Stack>
              </Stack>
              <Stack direction="row" spacing={0.5}>
                <Button size="small" onClick={() => showDetails(plan)} sx={{ fontSize: 12 }}>
                  Details
                </Button>
                <Tooltip title="Edit plan">
                  <span>
                    <IconButton
                      size="small"
                      disabled={plan.status === 'ARCHIVED'}
                      onClick={() => openEdit(plan)}
                      aria-label={`Edit ${plan.name}`}
                    >
                      <Pencil size={15} />
                    </IconButton>
                  </span>
                </Tooltip>
              </Stack>
            </Stack>
          </Card>
        );
      })}
    </Box>
  );

  const renderTable = () => (
    <Card elevation={0} sx={{ border: `1px solid ${BORDER}`, borderRadius: 2.5, overflow: 'hidden' }}>
      <Box sx={{ overflowX: 'auto' }}>
        <Table sx={{ minWidth: 1080 }}>
          <TableHead>
            <TableRow sx={{ bgcolor: '#F8FAFC' }}>
              <TableCell padding="checkbox">
                <Checkbox
                  size="small"
                  checked={pagedPlans.length > 0 && pagedPlans.every((plan) => selectedCodes.includes(plan.code))}
                  onChange={() => {
                    const allSelected = pagedPlans.every((plan) => selectedCodes.includes(plan.code));
                    setSelectedCodes((current) =>
                      allSelected
                        ? current.filter((code) => !pagedPlans.some((plan) => plan.code === code))
                        : Array.from(new Set([...current, ...pagedPlans.map((plan) => plan.code)])),
                    );
                  }}
                  inputProps={{ 'aria-label': 'Select all plans on this page' }}
                />
              </TableCell>
              {[
                ['name', 'Plan name'],
                ['', 'Business type'],
                ['priceMonthly', 'Monthly price'],
                ['', 'Yearly price'],
                ['', 'Features'],
                ['', 'Usage limits'],
                ['subscribers', 'Subscribers'],
                ['', 'Status'],
                ['updatedAt', 'Updated'],
                ['', 'Actions'],
              ].map(([key, label], index) => (
                <TableCell
                  key={`${label}-${index}`}
                  sx={{ fontSize: 11.5, fontWeight: 700, color: MUTED, whiteSpace: 'nowrap' }}
                  sortDirection={sortKey === key && key ? sortDir : false}
                >
                  {key ? (
                    <Stack
                      direction="row"
                      spacing={0.5}
                      alignItems="center"
                      onClick={() => toggleSort(key as SortKey)}
                      sx={{ cursor: 'pointer' }}
                    >
                      {label}
                      {sortKey === key ? (
                        <Typography component="span" sx={{ fontSize: 10, color: NAVY }}>
                          {sortDir === 'asc' ? '▲' : '▼'}
                        </Typography>
                      ) : null}
                    </Stack>
                  ) : (
                    label
                  )}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {pagedPlans.map((plan) => {
              const features = parseFeatures(plan.features);
              return (
                <TableRow key={plan.code} hover>
                  <TableCell padding="checkbox">
                    <Checkbox
                      size="small"
                      checked={selectedCodes.includes(plan.code)}
                      onChange={() => toggleSelected(plan.code)}
                      inputProps={{ 'aria-label': `Select ${plan.name}` }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ fontWeight: 600, fontSize: 13, color: NAVY }}>{plan.name}</Typography>
                    <Typography sx={{ fontSize: 11, color: '#8A93A6' }}>{plan.code}</Typography>
                  </TableCell>
                  <TableCell>
                    <BusinessChip type={plan.businessType} />
                  </TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap', fontSize: 13 }}>
                    {formatMoney(plan.priceMonthly, plan.currency)}
                  </TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap', fontSize: 13 }}>
                    {formatMoney(plan.priceYearly, plan.currency)}
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ fontSize: 12 }}>
                      {features.length} feature{features.length === 1 ? '' : 's'}
                    </Typography>
                    <Typography sx={{ fontSize: 11, color: '#8A93A6', maxWidth: 180 }} noWrap>
                      {features.slice(0, 3).join(', ') || '—'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ fontSize: 11.5, color: MUTED }}>
                      {limitText(plan.maxBranches)} branches · {limitText(plan.maxEmployees)} staff
                    </Typography>
                    <Typography sx={{ fontSize: 11.5, color: MUTED }}>
                      {limitText(plan.maxMenuItems)} items · {limitText(plan.maxStorageGb)} GB
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{plan.subscriberCount}</Typography>
                  </TableCell>
                  <TableCell>
                    <StatusChip status={plan.status} />
                  </TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap', fontSize: 12 }}>
                    {formatDate(plan.updatedAt)}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={(event: ReactMouseEvent<HTMLElement>) =>
                        setActionMenu({ anchor: event.currentTarget, plan })
                      }
                      aria-label={`Actions for ${plan.name}`}
                    >
                      <MoreVertical size={16} />
                    </IconButton>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Box>
      <TablePagination
        component="div"
        count={sortedPlans.length}
        page={page}
        onPageChange={(_event, nextPage) => setPage(nextPage)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(event) => {
          setRowsPerPage(Number(event.target.value));
          setPage(0);
        }}
        rowsPerPageOptions={[6, 9, 12, 25, 50]}
      />
    </Card>
  );

  const renderWizardStep = () => {
    if (step === 0) {
      return (
        <Stack spacing={2.25}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label="Plan code"
              value={form.code}
              onChange={(event) => setField('code', event.target.value.toUpperCase())}
              fullWidth
              required
              disabled={Boolean(editingPlan)}
              helperText={editingPlan ? 'Plan codes are immutable' : 'e.g. REST_PRO, ELEC_STARTER'}
              inputProps={{ maxLength: 40 }}
            />
            <TextField
              label="Plan name"
              value={form.name}
              onChange={(event) => setField('name', event.target.value)}
              fullWidth
              required
              inputProps={{ maxLength: 100 }}
            />
          </Stack>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              select
              label="Business type"
              value={form.businessType}
              onChange={(event) => setField('businessType', event.target.value)}
              fullWidth
            >
              {BUSINESS_TYPES.map((item) => (
                <MenuItem key={item.value} value={item.value}>
                  {item.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Plan status"
              value={form.status}
              onChange={(event) => setField('status', event.target.value)}
              fullWidth
              disabled={form.status === 'ARCHIVED'}
              helperText={form.status === 'ARCHIVED' ? 'Archived plans are read-only' : undefined}
            >
              {['DRAFT', 'ACTIVE', 'INACTIVE'].map((value) => (
                <MenuItem key={value} value={value}>
                  {STATUS_META[value]?.label ?? value}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
          <TextField
            label="Description"
            value={form.description}
            onChange={(event) => setField('description', event.target.value)}
            fullWidth
            multiline
            minRows={3}
            inputProps={{ maxLength: 500 }}
            helperText={`${form.description.length}/500`}
          />
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label="Display order"
              type="number"
              value={form.sortOrder}
              onChange={(event) => setField('sortOrder', event.target.value)}
              fullWidth
              inputProps={{ min: 0, step: 1 }}
              helperText="Lower values appear first"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={form.isPublic}
                  onChange={(event) => setField('isPublic', event.target.checked)}
                />
              }
              label="Visible on public pricing page"
              sx={{ flex: 1 }}
            />
          </Stack>
        </Stack>
      );
    }

    if (step === 1) {
      return (
        <Stack spacing={2.25}>
          {editingPlan && editingPlan.subscriberCount > 0 ? (
            <Alert severity="info">
              {editingPlan.subscriberCount} active subscriber
              {editingPlan.subscriberCount === 1 ? '' : 's'} keep their recorded pricing and invoices. New
              pricing applies to new subscriptions and renewals.
            </Alert>
          ) : null}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label="Monthly price"
              type="number"
              value={form.priceMonthly}
              onChange={(event) => setField('priceMonthly', event.target.value)}
              fullWidth
              required
              inputProps={{ min: 0, step: 0.01 }}
            />
            <TextField
              select
              label="Currency"
              value={form.currency}
              onChange={(event) => setField('currency', event.target.value)}
              fullWidth
            >
              {CURRENCIES.map((item) => (
                <MenuItem key={item} value={item}>
                  {item}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label="Quarterly price"
              type="number"
              value={form.priceQuarterly}
              onChange={(event) => setField('priceQuarterly', event.target.value)}
              fullWidth
              placeholder="Optional"
              inputProps={{ min: 0, step: 0.01 }}
            />
            <TextField
              label="Yearly price"
              type="number"
              value={form.priceYearly}
              onChange={(event) => setField('priceYearly', event.target.value)}
              fullWidth
              placeholder="Optional"
              inputProps={{ min: 0, step: 0.01 }}
            />
          </Stack>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label="Free trial (days)"
              type="number"
              value={form.trialDays}
              onChange={(event) => setField('trialDays', event.target.value)}
              fullWidth
              inputProps={{ min: 0, step: 1 }}
            />
            <TextField
              label="One-time setup fee"
              type="number"
              value={form.setupFee}
              onChange={(event) => setField('setupFee', event.target.value)}
              fullWidth
              placeholder="Optional"
              inputProps={{ min: 0, step: 0.01 }}
            />
          </Stack>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label="Yearly discount (%)"
              type="number"
              value={form.yearlyDiscountPercent}
              onChange={(event) => setField('yearlyDiscountPercent', event.target.value)}
              fullWidth
              placeholder="Optional"
              inputProps={{ min: 0, max: 100, step: 0.01 }}
            />
            <TextField
              label="Tax (%)"
              type="number"
              value={form.taxPercent}
              onChange={(event) => setField('taxPercent', event.target.value)}
              fullWidth
              placeholder="Optional"
              inputProps={{ min: 0, max: 100, step: 0.01 }}
            />
          </Stack>
          <Alert severity="warning">
            Existing subscribers keep their recorded pricing. Entitlement changes apply to every tenant on
            this plan immediately.
          </Alert>
        </Stack>
      );
    }

    if (step === 2) {
      const presets = PRESET_FEATURES[form.businessType] ?? [];
      const availablePresets = presets.filter((feature) => !form.features.includes(feature));
      return (
        <Stack spacing={2.25}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25}>
            <TextField
              label="Add feature"
              value={featureDraft}
              onChange={(event) => setFeatureDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  addFeature(featureDraft);
                }
              }}
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Sparkles size={16} />
                  </InputAdornment>
                ),
              }}
            />
            <Button
              variant="outlined"
              onClick={() => addFeature(featureDraft)}
              disabled={!featureDraft.trim()}
              sx={{ whiteSpace: 'nowrap' }}
            >
              Add feature
            </Button>
          </Stack>
          {availablePresets.length > 0 ? (
            <Box>
              <Typography sx={{ fontSize: 12, fontWeight: 600, color: MUTED, mb: 1 }}>
                Suggested for {BUSINESS_LOOKUP.get(form.businessType)?.label ?? form.businessType}
              </Typography>
              <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap">
                {availablePresets.map((feature) => (
                  <Chip
                    key={feature}
                    label={`+ ${feature}`}
                    size="small"
                    onClick={() => addFeature(feature)}
                    sx={{ bgcolor: '#F5F7FB', color: '#475569', cursor: 'pointer' }}
                  />
                ))}
              </Stack>
            </Box>
          ) : null}
          <Box>
            <Typography sx={{ fontSize: 12, fontWeight: 600, color: MUTED, mb: 1 }}>
              Included features ({form.features.length})
            </Typography>
            {form.features.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No features added yet.
              </Typography>
            ) : (
              <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap">
                {form.features.map((feature) => (
                  <Chip
                    key={feature}
                    label={feature}
                    onDelete={() => removeFeature(feature)}
                    sx={{ bgcolor: '#EEF4FF', color: '#2F6FED', fontWeight: 500 }}
                  />
                ))}
              </Stack>
            )}
          </Box>
          {form.features.length > 0 ? (
            <Button
              size="small"
              color="inherit"
              onClick={() => setForm((current) => ({ ...current, features: [] }))}
              sx={{ alignSelf: 'flex-start' }}
            >
              Clear all features
            </Button>
          ) : null}
        </Stack>
      );
    }

    if (step === 3) {
      const limits = [
        ['maxBranches', 'Maximum branches', 'Branch count allowed on the plan'],
        ['maxEmployees', 'Maximum employees', 'Staff accounts across all branches'],
        ['maxMenuItems', 'Maximum products / menu items', 'Catalogue size across the tenant'],
        ['maxOrdersPerMonth', 'Maximum orders per month', 'Monthly order volume'],
        ['maxStorageGb', 'Maximum storage (GB)', 'Media and document storage'],
        ['maxAdminUsers', 'Maximum admin users', 'Users with administrative access'],
        ['maxCustomers', 'Maximum customers / leads', 'Customer and lead records'],
      ] as const;
      return (
        <Stack spacing={2.25}>
          <Alert severity="info">Leave a field empty to allow unlimited usage for that limit.</Alert>
          <Box
            sx={{
              display: 'grid',
              gap: 2,
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' },
            }}
          >
            {limits.map(([key, label, helper]) => (
              <TextField
                key={key}
                label={label}
                type="number"
                value={form[key]}
                onChange={(event) => setField(key, event.target.value)}
                fullWidth
                placeholder="Unlimited"
                inputProps={{ min: 0, step: 1 }}
                helperText={helper}
              />
            ))}
          </Box>
        </Stack>
      );
    }

    return (
      <Stack spacing={2.25}>
        <Box sx={{ p: 2, borderRadius: 2, border: `1px solid ${BORDER}`, bgcolor: '#F8FAFC' }}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={1}>
            <Box>
              <Typography sx={{ fontSize: 20, fontWeight: 700, color: NAVY }}>{form.name || 'Untitled plan'}</Typography>
              <Typography sx={{ fontSize: 12, color: '#8A93A6' }}>{form.code || 'NO_CODE'}</Typography>
            </Box>
            <Stack direction="row" spacing={0.75}>
              <BusinessChip type={form.businessType} />
              <StatusChip status={form.status} />
            </Stack>
          </Stack>
          <Typography sx={{ fontSize: 13, color: MUTED, mt: 1 }}>
            {form.description || 'No description provided.'}
          </Typography>
          <Stack direction="row" spacing={2.5} sx={{ mt: 1.5 }} flexWrap="wrap" useFlexGap>
            <Box>
              <Typography sx={{ fontSize: 10.5, color: '#8A93A6', textTransform: 'uppercase' }}>Monthly</Typography>
              <Typography sx={{ fontSize: 16, fontWeight: 700 }}>
                {formatMoney(numberOrNull(form.priceMonthly), form.currency)}
              </Typography>
            </Box>
            <Box>
              <Typography sx={{ fontSize: 10.5, color: '#8A93A6', textTransform: 'uppercase' }}>Quarterly</Typography>
              <Typography sx={{ fontSize: 16, fontWeight: 700 }}>
                {formatMoney(numberOrNull(form.priceQuarterly), form.currency)}
              </Typography>
            </Box>
            <Box>
              <Typography sx={{ fontSize: 10.5, color: '#8A93A6', textTransform: 'uppercase' }}>Yearly</Typography>
              <Typography sx={{ fontSize: 16, fontWeight: 700 }}>
                {formatMoney(numberOrNull(form.priceYearly), form.currency)}
              </Typography>
            </Box>
            <Box>
              <Typography sx={{ fontSize: 10.5, color: '#8A93A6', textTransform: 'uppercase' }}>Trial</Typography>
              <Typography sx={{ fontSize: 16, fontWeight: 700 }}>{form.trialDays || 0} days</Typography>
            </Box>
          </Stack>
        </Box>

        <Box
          sx={{
            display: 'grid',
            gap: 2,
            gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
          }}
        >
          <Box sx={{ p: 2, borderRadius: 2, border: `1px solid ${BORDER}` }}>
            <Typography sx={{ fontSize: 13, fontWeight: 700, mb: 1 }}>Usage limits</Typography>
            <InfoRow label="Branches" value={limitText(numberOrNull(form.maxBranches))} />
            <InfoRow label="Employees" value={limitText(numberOrNull(form.maxEmployees))} />
            <InfoRow label="Products / menu items" value={limitText(numberOrNull(form.maxMenuItems))} />
            <InfoRow label="Orders per month" value={limitText(numberOrNull(form.maxOrdersPerMonth))} />
            <InfoRow label="Storage (GB)" value={limitText(numberOrNull(form.maxStorageGb))} />
            <InfoRow label="Admin users" value={limitText(numberOrNull(form.maxAdminUsers))} />
            <InfoRow label="Customers / leads" value={limitText(numberOrNull(form.maxCustomers))} />
          </Box>
          <Box sx={{ p: 2, borderRadius: 2, border: `1px solid ${BORDER}` }}>
            <Typography sx={{ fontSize: 13, fontWeight: 700, mb: 1 }}>
              Features ({form.features.length})
            </Typography>
            {form.features.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No features included.
              </Typography>
            ) : (
              <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap">
                {form.features.map((feature) => (
                  <Chip key={feature} size="small" label={feature} sx={{ bgcolor: '#F5F7FB' }} />
                ))}
              </Stack>
            )}
          </Box>
        </Box>
        <Alert severity="success">Review complete. Save as a draft or publish the plan.</Alert>
      </Stack>
    );
  };

  return (
    <>
      <PageHeader
        title="Plans & Pricing"
        subtitle="Create and manage subscription plans, pricing, features, limits and availability across all business verticals."
        actions={
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
            <TextField
              select
              size="small"
              value={businessType}
              onChange={(event) => setBusinessType(event.target.value)}
              sx={{ minWidth: 180, bgcolor: '#FFFFFF', borderRadius: 1 }}
              inputProps={{ 'aria-label': 'Business type selector' }}
            >
              <MenuItem value="ALL">All Business Types</MenuItem>
              {BUSINESS_TYPES.map((item) => (
                <MenuItem key={item.value} value={item.value}>
                  {item.label}
                </MenuItem>
              ))}
            </TextField>
            <Button variant="outlined" startIcon={<Download size={15} />} onClick={exportPlans}>
              Export Plans
            </Button>
            <Button variant="contained" startIcon={<Plus size={16} />} onClick={openCreate}>
              Create New Plan
            </Button>
          </Stack>
        }
      />

      <Box
        sx={{
          display: 'grid',
          gap: 1.5,
          gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', md: 'repeat(3, minmax(0, 1fr))', xl: 'repeat(6, minmax(0, 1fr))' },
          mb: 2.5,
        }}
      >
        <KpiCard
          label="Total Plans"
          value={plans.data ? allPlans.length : '—'}
          sub={`${verticalCount} business vertical${verticalCount === 1 ? '' : 's'}`}
          icon={<Layers size={18} />}
          tone="info"
        />
        <KpiCard
          label="Active Plans"
          value={plans.data ? activePlans : '—'}
          sub={allPlans.length ? `${Math.round((activePlans / allPlans.length) * 100)}% of catalogue` : 'No plans yet'}
          icon={<CheckCircle2 size={18} />}
          tone="success"
        />
        <KpiCard
          label="Total Subscribers"
          value={plans.data ? totalSubscribers.toLocaleString('en-IN') : '—'}
          sub="Active and trialing subscriptions"
          icon={<Users size={18} />}
          tone="default"
        />
        <KpiCard
          label="Most Popular Plan"
          value={popularPlan ? popularPlan.name : 'None yet'}
          sub={popularPlan ? `${popularPlan.subscriberCount} subscribers` : 'No subscribers yet'}
          icon={<Crown size={18} />}
          tone="warning"
        />
        <KpiCard
          label="Monthly Recurring Revenue"
          value={stats.data ? `${formatCompact(stats.data.mrr)}` : '—'}
          sub="Platform-reported MRR"
          icon={<TrendingUp size={18} />}
          tone="success"
        />
        <KpiCard
          label="Draft / Inactive"
          value={plans.data ? draftInactive : '—'}
          sub="Not available for new subscriptions"
          icon={<CircleDollarSign size={18} />}
          tone="error"
        />
      </Box>

      <Card
        elevation={0}
        sx={{ border: `1px solid ${BORDER}`, borderRadius: 2.5, p: 1.5, mb: 2, bgcolor: '#FFFFFF' }}
      >
        <Stack direction={{ xs: 'column', lg: 'row' }} spacing={1.25} alignItems={{ lg: 'center' }}>
          <TextField
            size="small"
            placeholder="Search by plan name or ID"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            sx={{ minWidth: { lg: 260 }, flex: 1 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search size={16} />
                </InputAdornment>
              ),
              endAdornment: search ? (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearch('')} aria-label="Clear search">
                    <X size={14} />
                  </IconButton>
                </InputAdornment>
              ) : undefined,
            }}
          />
          <TextField
            select
            size="small"
            label="Status"
            value={status}
            onChange={(event) => setStatus(event.target.value as StatusFilter)}
            sx={{ minWidth: 140 }}
          >
            <MenuItem value="ALL">All statuses</MenuItem>
            <MenuItem value="ACTIVE">Active</MenuItem>
            <MenuItem value="INACTIVE">Inactive</MenuItem>
            <MenuItem value="DRAFT">Draft</MenuItem>
            <MenuItem value="ARCHIVED">Archived</MenuItem>
          </TextField>
          <TextField
            select
            size="small"
            label="Billing interval"
            value={intervalFilter}
            onChange={(event) => setIntervalFilter(event.target.value as IntervalFilter)}
            sx={{ minWidth: 160 }}
          >
            <MenuItem value="ALL">All intervals</MenuItem>
            <MenuItem value="MONTHLY">Monthly</MenuItem>
            <MenuItem value="QUARTERLY">Quarterly</MenuItem>
            <MenuItem value="YEARLY">Yearly</MenuItem>
          </TextField>
          <TextField
            select
            size="small"
            label="Currency"
            value={currency}
            onChange={(event) => setCurrency(event.target.value)}
            sx={{ minWidth: 130 }}
          >
            <MenuItem value="ALL">All currencies</MenuItem>
            {currencies.map((item) => (
              <MenuItem key={item} value={item}>
                {item}
              </MenuItem>
            ))}
          </TextField>
          <Button
            size="small"
            color="inherit"
            onClick={() => {
              setSearch('');
              setBusinessType('ALL');
              setStatus('ALL');
              setIntervalFilter('ALL');
              setCurrency('ALL');
            }}
            disabled={
              !search && businessType === 'ALL' && status === 'ALL' && intervalFilter === 'ALL' && currency === 'ALL'
            }
          >
            Clear filters
          </Button>
          <Box sx={{ flex: 1 }} />
          <ToggleButtonGroup
            size="small"
            exclusive
            value={view}
            onChange={(_event, next: ViewMode | null) => {
              if (next) setView(next);
            }}
            aria-label="Plan view mode"
          >
            <ToggleButton value="grid" aria-label="Grid view">
              <LayoutGrid size={16} />
            </ToggleButton>
            <ToggleButton value="table" aria-label="Table view">
              <List size={16} />
            </ToggleButton>
          </ToggleButtonGroup>
        </Stack>
      </Card>

      {selectedCodes.length > 0 ? (
        <Card
          elevation={0}
          sx={{
            border: `1px solid ${BORDER}`,
            borderRadius: 2,
            px: 2,
            py: 1,
            mb: 2,
            bgcolor: '#F8FAFC',
          }}
        >
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25} alignItems={{ sm: 'center' }}>
            <Typography sx={{ fontSize: 13, fontWeight: 600 }}>
              {selectedCodes.length} plan{selectedCodes.length === 1 ? '' : 's'} selected
            </Typography>
            <Box sx={{ flex: 1 }} />
            <Button
              size="small"
              startIcon={<Check size={14} />}
              disabled={bulkStatusMutation.isPending}
              onClick={() =>
                bulkStatusMutation.mutate({
                  codes: selectedPlans.filter((plan) => plan.status !== 'ARCHIVED').map((plan) => plan.code),
                  status: 'ACTIVE',
                })
              }
            >
              Activate
            </Button>
            <Button
              size="small"
              startIcon={<Archive size={14} />}
              disabled={bulkStatusMutation.isPending}
              onClick={() =>
                bulkStatusMutation.mutate({
                  codes: selectedPlans.filter((plan) => plan.status === 'ACTIVE').map((plan) => plan.code),
                  status: 'INACTIVE',
                })
              }
            >
              Deactivate
            </Button>
            <Tooltip title={selectedCodes.length > 3 ? 'Select up to 3 plans to compare' : 'Compare plans'}>
              <span>
                <Button
                  size="small"
                  startIcon={<Layers size={14} />}
                  disabled={selectedCodes.length === 0 || selectedCodes.length > 3}
                  onClick={() => setCompareOpen(true)}
                >
                  Compare
                </Button>
              </span>
            </Tooltip>
            <Button size="small" startIcon={<Download size={14} />} onClick={exportSelected}>
              Export
            </Button>
            <Button size="small" color="inherit" onClick={() => setSelectedCodes([])}>
              Clear
            </Button>
          </Stack>
        </Card>
      ) : null}

      {plans.isPending ? <LoadingState /> : null}
      {plans.isError ? (
        <ErrorState message={plans.error.message} onRetry={() => void plans.refetch()} />
      ) : null}

      {plans.data && filteredPlans.length === 0 ? (
        <EmptyState
          title="No plans match these filters"
          description="Adjust the filters or create a new subscription plan."
        />
      ) : null}

      {plans.data && filteredPlans.length > 0 ? (
        <>
          {view === 'grid' ? renderGrid() : renderTable()}
          {view === 'grid' ? (
            <Card elevation={0} sx={{ border: `1px solid ${BORDER}`, borderRadius: 2.5, mt: 2 }}>
              <TablePagination
                component="div"
                count={sortedPlans.length}
                page={page}
                onPageChange={(_event, nextPage) => setPage(nextPage)}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={(event) => {
                  setRowsPerPage(Number(event.target.value));
                  setPage(0);
                }}
                rowsPerPageOptions={[6, 9, 12, 25, 50]}
              />
            </Card>
          ) : null}
        </>
      ) : null}

      {renderActionsMenu()}

      <Dialog open={wizardOpen} onClose={closeWizard} fullWidth maxWidth="md">
        <DialogTitle sx={{ pb: 1 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography sx={{ fontSize: 18, fontWeight: 700, color: NAVY }}>
                {editingPlan ? `Edit ${editingPlan.name}` : 'Create subscription plan'}
              </Typography>
              <Typography sx={{ fontSize: 12, color: MUTED, mt: 0.25 }}>
                {editingPlan ? editingPlan.code : 'Configure pricing, features and limits for a business vertical.'}
              </Typography>
            </Box>
            <IconButton onClick={closeWizard} aria-label="Close plan wizard">
              <X size={18} />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent dividers>
          <Stepper activeStep={step} alternativeLabel sx={{ mb: 3, display: { xs: 'none', sm: 'flex' } }}>
            {STEP_LABELS.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
          <Typography sx={{ display: { xs: 'block', sm: 'none' }, fontSize: 12, color: MUTED, mb: 2 }}>
            Step {step + 1} of {STEP_LABELS.length} · {STEP_LABELS[step]}
          </Typography>
          {formError ? (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setFormError(null)}>
              {formError}
            </Alert>
          ) : null}
          {renderWizardStep()}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={closeWizard} color="inherit">
            Cancel
          </Button>
          <Box sx={{ flex: 1 }} />
          <Button onClick={goBack} disabled={step === 0 || saveMutation.isPending}>
            Back
          </Button>
          {step < STEP_LABELS.length - 1 ? (
            <Button variant="contained" onClick={goNext} disabled={saveMutation.isPending}>
              Next
            </Button>
          ) : editingPlan ? (
            <Button
              variant="contained"
              onClick={() => submitPlan()}
              disabled={saveMutation.isPending}
              startIcon={saveMutation.isPending ? <CircularProgress size={14} color="inherit" /> : <Check size={15} />}
            >
              Save changes
            </Button>
          ) : (
            <>
              <Button
                variant="outlined"
                onClick={() => submitPlan('DRAFT')}
                disabled={saveMutation.isPending}
              >
                Save as draft
              </Button>
              <Button
                variant="contained"
                onClick={() => submitPlan('ACTIVE')}
                disabled={saveMutation.isPending}
                startIcon={saveMutation.isPending ? <CircularProgress size={14} color="inherit" /> : <Rocket size={15} />}
              >
                Publish plan
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      <Drawer
        anchor="right"
        open={Boolean(detailPlan)}
        onClose={() => setDetailPlan(null)}
        slotProps={{ paper: { sx: { width: { xs: '100%', sm: 560, md: 640 } } } }}
      >
        {detailPlan ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <Box sx={{ p: 2.5, borderBottom: `1px solid ${BORDER}` }}>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                <Box>
                  <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" useFlexGap>
                    <BusinessChip type={detailPlan.businessType} />
                    <StatusChip status={detailPlan.status} />
                    {popularCodes.has(detailPlan.code) ? (
                      <Chip
                        size="small"
                        icon={<Crown size={12} />}
                        label="Most popular"
                        sx={{ bgcolor: '#FFF1EC', color: ORANGE, fontWeight: 700 }}
                      />
                    ) : null}
                  </Stack>
                  <Typography sx={{ fontSize: 22, fontWeight: 800, color: NAVY, mt: 1 }}>
                    {detailPlan.name}
                  </Typography>
                  <Typography sx={{ fontSize: 12, color: '#8A93A6', letterSpacing: '0.04em' }}>
                    {detailPlan.code} · {detailPlan.currency}
                  </Typography>
                </Box>
                <Stack direction="row" spacing={0.5}>
                  <Tooltip title="Edit plan">
                    <span>
                      <IconButton
                        disabled={detailPlan.status === 'ARCHIVED'}
                        onClick={() => {
                          const plan = detailPlan;
                          setDetailPlan(null);
                          openEdit(plan);
                        }}
                        aria-label="Edit plan"
                      >
                        <Pencil size={16} />
                      </IconButton>
                    </span>
                  </Tooltip>
                  <IconButton onClick={() => setDetailPlan(null)} aria-label="Close details">
                    <X size={18} />
                  </IconButton>
                </Stack>
              </Stack>
              <Stack direction="row" spacing={2.5} sx={{ mt: 2 }} flexWrap="wrap" useFlexGap>
                <Box>
                  <Typography sx={{ fontSize: 10.5, color: '#8A93A6', textTransform: 'uppercase' }}>
                    Monthly
                  </Typography>
                  <Typography sx={{ fontSize: 18, fontWeight: 700 }}>
                    {formatMoney(detailPlan.priceMonthly, detailPlan.currency)}
                  </Typography>
                </Box>
                <Box>
                  <Typography sx={{ fontSize: 10.5, color: '#8A93A6', textTransform: 'uppercase' }}>
                    Yearly
                  </Typography>
                  <Typography sx={{ fontSize: 18, fontWeight: 700 }}>
                    {formatMoney(detailPlan.priceYearly, detailPlan.currency)}
                  </Typography>
                </Box>
                <Box>
                  <Typography sx={{ fontSize: 10.5, color: '#8A93A6', textTransform: 'uppercase' }}>
                    Subscribers
                  </Typography>
                  <Typography sx={{ fontSize: 18, fontWeight: 700 }}>{detailPlan.subscriberCount}</Typography>
                </Box>
              </Stack>
            </Box>
            <Tabs
              value={detailTab}
              onChange={(_event, value: number) => setDetailTab(value)}
              variant="scrollable"
              scrollButtons="auto"
              sx={{ px: 2, borderBottom: `1px solid ${BORDER}` }}
            >
              <Tab label="Overview" />
              <Tab label="Features & Limits" />
              <Tab label="Subscribers" />
              <Tab label="Pricing History" />
              <Tab label="Activity" />
            </Tabs>
            <Box sx={{ p: 2.5, overflowY: 'auto', flex: 1 }}>
              {detailTab === 0 ? (
                <Stack spacing={2.5}>
                  <Box>
                    <Typography sx={{ fontSize: 13, fontWeight: 700, mb: 1 }}>Plan details</Typography>
                    <InfoRow label="Description" value={detailPlan.description || '—'} />
                    <InfoRow label="Business type" value={BUSINESS_LOOKUP.get(detailPlan.businessType)?.label ?? detailPlan.businessType} />
                    <InfoRow label="Status" value={STATUS_META[detailPlan.status]?.label ?? detailPlan.status} />
                    <InfoRow label="Public pricing page" value={detailPlan.isPublic ? 'Visible' : 'Hidden'} />
                    <InfoRow label="Display order" value={detailPlan.sortOrder} />
                    <InfoRow label="Created" value={formatDate(detailPlan.createdAt)} />
                    <InfoRow label="Updated" value={formatDate(detailPlan.updatedAt)} />
                  </Box>
                  <Divider />
                  <Box>
                    <Typography sx={{ fontSize: 13, fontWeight: 700, mb: 1 }}>Pricing configuration</Typography>
                    <InfoRow label="Monthly" value={formatMoney(detailPlan.priceMonthly, detailPlan.currency)} />
                    <InfoRow label="Quarterly" value={formatMoney(detailPlan.priceQuarterly, detailPlan.currency)} />
                    <InfoRow label="Yearly" value={formatMoney(detailPlan.priceYearly, detailPlan.currency)} />
                    <InfoRow label="Setup fee" value={formatMoney(detailPlan.setupFee, detailPlan.currency)} />
                    <InfoRow label="Free trial" value={`${detailPlan.trialDays} days`} />
                    <InfoRow label="Tax" value={detailPlan.taxPercent === null ? 'Not configured' : `${detailPlan.taxPercent}%`} />
                    <InfoRow
                      label="Yearly discount"
                      value={
                        detailPlan.yearlyDiscountPercent === null
                          ? 'Not configured'
                          : `${detailPlan.yearlyDiscountPercent}%`
                      }
                    />
                  </Box>
                </Stack>
              ) : null}

              {detailTab === 1 ? (
                <Stack spacing={2.5}>
                  <Box>
                    <Typography sx={{ fontSize: 13, fontWeight: 700, mb: 1 }}>
                      Features ({parseFeatures(detailPlan.features).length})
                    </Typography>
                    {parseFeatures(detailPlan.features).length === 0 ? (
                      <Typography variant="body2" color="text.secondary">
                        No features configured.
                      </Typography>
                    ) : (
                      <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap">
                        {parseFeatures(detailPlan.features).map((feature) => (
                          <Chip key={feature} label={feature} size="small" sx={{ bgcolor: '#F5F7FB' }} />
                        ))}
                      </Stack>
                    )}
                  </Box>
                  <Divider />
                  <Box>
                    <Typography sx={{ fontSize: 13, fontWeight: 700, mb: 1 }}>Usage limits</Typography>
                    <InfoRow label="Branches" value={limitText(detailPlan.maxBranches)} />
                    <InfoRow label="Employees" value={limitText(detailPlan.maxEmployees)} />
                    <InfoRow label="Products / menu items" value={limitText(detailPlan.maxMenuItems)} />
                    <InfoRow label="Orders per month" value={limitText(detailPlan.maxOrdersPerMonth)} />
                    <InfoRow label="Storage (GB)" value={limitText(detailPlan.maxStorageGb)} />
                    <InfoRow label="Admin users" value={limitText(detailPlan.maxAdminUsers)} />
                    <InfoRow label="Customers / leads" value={limitText(detailPlan.maxCustomers)} />
                  </Box>
                </Stack>
              ) : null}

              {detailTab === 2 ? (
                <Box>
                  {subscribers.isPending ? <Skeleton variant="rounded" height={120} /> : null}
                  {subscribers.isError ? (
                    <ErrorState message={subscribers.error.message} onRetry={() => void subscribers.refetch()} />
                  ) : null}
                  {subscribers.data ? (
                    subscribers.data.content.length === 0 ? (
                      <EmptyState title="No subscribers" description="No tenants are currently on this plan." />
                    ) : (
                      <Stack spacing={1}>
                        {subscribers.data.content.map((subscription: SubscriptionView) => (
                          <Card key={subscription.id} elevation={0} sx={{ p: 1.5, border: `1px solid ${BORDER}` }}>
                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                              <Box>
                                <Typography sx={{ fontSize: 13, fontWeight: 600 }}>
                                  {subscription.tenantName}
                                </Typography>
                                <Typography sx={{ fontSize: 11.5, color: MUTED }}>
                                  {subscription.status} · renews {formatDate(subscription.currentPeriodEnd)}
                                </Typography>
                              </Box>
                              <Typography sx={{ fontSize: 13, fontWeight: 600 }}>
                                {formatMoney(subscription.priceMonthly, detailPlan.currency)}
                              </Typography>
                            </Stack>
                          </Card>
                        ))}
                      </Stack>
                    )
                  ) : null}
                </Box>
              ) : null}

              {detailTab === 3 ? (
                <Box>
                  {priceHistory.isPending ? <Skeleton variant="rounded" height={120} /> : null}
                  {priceHistory.isError ? (
                    <ErrorState message={priceHistory.error.message} onRetry={() => void priceHistory.refetch()} />
                  ) : null}
                  {priceHistory.data ? (
                    priceHistory.data.length === 0 ? (
                      <EmptyState title="No pricing changes" description="Pricing has not changed since creation." />
                    ) : (
                      <Stack spacing={1}>
                        {priceHistory.data.map((history: PlanPriceHistoryView) => (
                          <Card key={history.id} elevation={0} sx={{ p: 1.5, border: `1px solid ${BORDER}` }}>
                            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                              <Box>
                                <Typography sx={{ fontSize: 12.5, color: MUTED }}>
                                  Monthly {formatMoney(history.oldPriceMonthly, history.currency)} →{' '}
                                  <strong>{formatMoney(history.newPriceMonthly, history.currency)}</strong>
                                </Typography>
                                <Typography sx={{ fontSize: 12.5, color: MUTED }}>
                                  Yearly {formatMoney(history.oldPriceYearly, history.currency)} →{' '}
                                  <strong>{formatMoney(history.newPriceYearly, history.currency)}</strong>
                                </Typography>
                              </Box>
                              <Box sx={{ textAlign: 'right' }}>
                                <Typography sx={{ fontSize: 11.5, color: '#8A93A6' }}>
                                  {formatDate(history.createdAt)}
                                </Typography>
                                <Typography sx={{ fontSize: 11.5, color: '#8A93A6' }}>
                                  {history.changedBy || 'system'}
                                </Typography>
                              </Box>
                            </Stack>
                          </Card>
                        ))}
                      </Stack>
                    )
                  ) : null}
                </Box>
              ) : null}

              {detailTab === 4 ? (
                <Box>
                  {activity.isPending ? <Skeleton variant="rounded" height={120} /> : null}
                  {activity.isError ? (
                    <ErrorState message={activity.error.message} onRetry={() => void activity.refetch()} />
                  ) : null}
                  {activity.data ? (
                    (() => {
                      const entries = activity.data.content.filter(
                        (entry) => entry.entityId === detailPlan.code,
                      );
                      return entries.length === 0 ? (
                        <EmptyState
                          title="No activity yet"
                          description="Plan create, update, status and delete events will appear here."
                        />
                      ) : (
                        <Stack spacing={1}>
                          {entries.map((entry) => (
                            <Card key={entry.id} elevation={0} sx={{ p: 1.5, border: `1px solid ${BORDER}` }}>
                              <Stack direction="row" justifyContent="space-between" alignItems="center">
                                <Box>
                                  <Typography sx={{ fontSize: 12.5, fontWeight: 600 }}>
                                    {entry.action.replaceAll('_', ' ')}
                                  </Typography>
                                  <Typography sx={{ fontSize: 11.5, color: MUTED }}>
                                    {entry.actorEmail || 'system'}
                                  </Typography>
                                </Box>
                                <Typography sx={{ fontSize: 11.5, color: '#8A93A6' }}>
                                  {formatDate(entry.createdAt)}
                                </Typography>
                              </Stack>
                            </Card>
                          ))}
                        </Stack>
                      );
                    })()
                  ) : null}
                </Box>
              ) : null}
            </Box>
          </Box>
        ) : null}
      </Drawer>

      <Dialog open={compareOpen} onClose={() => setCompareOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>Compare plans</DialogTitle>
        <DialogContent dividers>
          {comparePlans.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              Select up to three plans to compare.
            </Typography>
          ) : (
            <Box sx={{ overflowX: 'auto' }}>
              <Table size="small" sx={{ minWidth: 560 }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Attribute</TableCell>
                    {comparePlans.map((plan) => (
                      <TableCell key={plan.code} sx={{ fontWeight: 700 }}>
                        {plan.name}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {[
                    ['Business type', (plan: PlanView) => BUSINESS_LOOKUP.get(plan.businessType)?.label ?? plan.businessType],
                    ['Status', (plan: PlanView) => STATUS_META[plan.status]?.label ?? plan.status],
                    ['Monthly price', (plan: PlanView) => formatMoney(plan.priceMonthly, plan.currency)],
                    ['Quarterly price', (plan: PlanView) => formatMoney(plan.priceQuarterly, plan.currency)],
                    ['Yearly price', (plan: PlanView) => formatMoney(plan.priceYearly, plan.currency)],
                    ['Trial duration', (plan: PlanView) => `${plan.trialDays} days`],
                    ['Branches', (plan: PlanView) => limitText(plan.maxBranches)],
                    ['Employees', (plan: PlanView) => limitText(plan.maxEmployees)],
                    ['Products / menu items', (plan: PlanView) => limitText(plan.maxMenuItems)],
                    ['Orders per month', (plan: PlanView) => limitText(plan.maxOrdersPerMonth)],
                    ['Storage (GB)', (plan: PlanView) => limitText(plan.maxStorageGb)],
                    ['Admin users', (plan: PlanView) => limitText(plan.maxAdminUsers)],
                    ['Customers / leads', (plan: PlanView) => limitText(plan.maxCustomers)],
                    ['Features', (plan: PlanView) => parseFeatures(plan.features).join(', ') || '—'],
                  ].map(([label, render]) => (
                    <TableRow key={String(label)}>
                      <TableCell sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{label as string}</TableCell>
                      {comparePlans.map((plan) => (
                        <TableCell key={`${plan.code}-${String(label)}`} sx={{ fontSize: 12.5 }}>
                          {(render as (plan: PlanView) => string)(plan)}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCompareOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={Boolean(archiveTarget)}
        title="Archive plan?"
        description={
          archiveTarget
            ? `"${archiveTarget.name}" will be archived and can no longer be edited or assigned. Existing subscribers stay on their current pricing.`
            : ''
        }
        confirmLabel="Archive plan"
        destructive
        loading={statusMutation.isPending}
        onCancel={() => setArchiveTarget(null)}
        onConfirm={confirmArchive}
      />

      <Dialog open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} fullWidth maxWidth="xs">
        <DialogTitle>Delete plan?</DialogTitle>
        <DialogContent>
          {deleteTarget ? (
            <Stack spacing={1.5}>
              <Typography variant="body2">
                "{deleteTarget.name}" will be soft deleted. This cannot be undone.
              </Typography>
              {deleteTarget.subscriberCount > 0 ? (
                <Alert severity="warning">
                  This plan still has {deleteTarget.subscriberCount} active subscriber
                  {deleteTarget.subscriberCount === 1 ? '' : 's'}. Migrate them to another plan or archive
                  this plan instead.
                </Alert>
              ) : (
                <Alert severity="info">No active subscribers. The plan can be safely deleted.</Alert>
              )}
            </Stack>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)}>Cancel</Button>
          {deleteTarget && deleteTarget.subscriberCount > 0 ? (
            <Button
              variant="outlined"
              onClick={() => {
                setArchiveTarget(deleteTarget);
                setDeleteTarget(null);
              }}
            >
              Archive instead
            </Button>
          ) : null}
          <Button
            color="error"
            variant="contained"
            disabled={!deleteTarget || deleteTarget.subscriberCount > 0 || deleteMutation.isPending}
            onClick={() => {
              if (deleteTarget) deleteMutation.mutate(deleteTarget.code);
            }}
          >
            Delete plan
          </Button>
        </DialogActions>
      </Dialog>

      {statusMutation.isPending || bulkStatusMutation.isPending ? (
        <Box sx={{ position: 'fixed', bottom: 16, right: 16, zIndex: 1500 }}>
          <CircularProgress size={20} />
        </Box>
      ) : null}
    </>
  );
}
