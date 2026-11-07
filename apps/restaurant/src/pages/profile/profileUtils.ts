import type { RestaurantProfile } from '@resto/types';

export interface SocialLinksForm {
  website: string;
  facebook: string;
  instagram: string;
  twitter: string;
  linkedin: string;
  youtube: string;
  whatsapp: string;
}

export const SOCIAL_LINK_FIELDS: { key: keyof SocialLinksForm; label: string }[] = [
  { key: 'website', label: 'Website' },
  { key: 'facebook', label: 'Facebook' },
  { key: 'instagram', label: 'Instagram' },
  { key: 'twitter', label: 'X (Twitter)' },
  { key: 'linkedin', label: 'LinkedIn' },
  { key: 'youtube', label: 'YouTube' },
  { key: 'whatsapp', label: 'WhatsApp' },
];

export function emptySocialLinks(): SocialLinksForm {
  return {
    website: '',
    facebook: '',
    instagram: '',
    twitter: '',
    linkedin: '',
    youtube: '',
    whatsapp: '',
  };
}

export function parseSocialLinks(raw: string | null | undefined): SocialLinksForm {
  const base = emptySocialLinks();
  if (!raw) return base;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return base;
    const record = parsed as Record<string, unknown>;
    for (const { key } of SOCIAL_LINK_FIELDS) {
      const value = record[key] ?? (key === 'twitter' ? record['x'] : undefined);
      if (typeof value === 'string') base[key] = value;
    }
    return base;
  } catch {
    return base;
  }
}

export function serializeSocialLinks(links: SocialLinksForm): string {
  return JSON.stringify({
    website: links.website.trim(),
    facebook: links.facebook.trim(),
    instagram: links.instagram.trim(),
    twitter: links.twitter.trim(),
    linkedin: links.linkedin.trim(),
    youtube: links.youtube.trim(),
    whatsapp: links.whatsapp.trim(),
  });
}

export function parseGallery(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === 'string' && item.trim() !== '');
  } catch {
    return [];
  }
}

export interface BrandColors {
  primary: string;
  secondary: string;
}

export function parseBrandColors(raw: string | null | undefined): BrandColors {
  const base: BrandColors = { primary: '#FF5722', secondary: '#152033' };
  if (!raw) return base;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return base;
    const record = parsed as Record<string, unknown>;
    if (typeof record.primary === 'string' && record.primary.trim()) base.primary = record.primary;
    if (typeof record.secondary === 'string' && record.secondary.trim()) base.secondary = record.secondary;
    return base;
  } catch {
    return base;
  }
}

export function serializeBrandColors(colors: BrandColors): string {
  return JSON.stringify({ primary: colors.primary, secondary: colors.secondary });
}

export const DAY_CODES = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'] as const;
export type DayCode = (typeof DAY_CODES)[number];

export const DAY_LABELS: Record<DayCode, string> = {
  MON: 'Monday',
  TUE: 'Tuesday',
  WED: 'Wednesday',
  THU: 'Thursday',
  FRI: 'Friday',
  SAT: 'Saturday',
  SUN: 'Sunday',
};

export interface DayHours {
  day: DayCode;
  open: string;
  close: string;
  closed: boolean;
}

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

export function defaultOperatingHours(): DayHours[] {
  return DAY_CODES.map((day) => ({ day, open: '09:00', close: '22:00', closed: false }));
}

export function parseOperatingHours(raw: string | null | undefined): DayHours[] {
  const defaults = defaultOperatingHours();
  if (!raw) return defaults;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return defaults;
    const entries: Record<string, unknown>[] = [];
    for (const item of parsed) {
      if (item && typeof item === 'object' && !Array.isArray(item)) {
        entries.push(item as Record<string, unknown>);
      }
    }
    const byDay = new Map<string, Record<string, unknown>>();
    for (const entry of entries) {
      const day = typeof entry.day === 'string' ? entry.day.toUpperCase() : '';
      if (day) byDay.set(day, entry);
    }
    return DAY_CODES.map((day, index) => {
      const fallback = defaults[index] ?? { day, open: '09:00', close: '22:00', closed: false };
      const entry = byDay.get(day) ?? entries[index];
      if (!entry) return fallback;
      const open = typeof entry.open === 'string' && TIME_PATTERN.test(entry.open) ? entry.open : fallback.open;
      const close = typeof entry.close === 'string' && TIME_PATTERN.test(entry.close) ? entry.close : fallback.close;
      const closed = typeof entry.closed === 'boolean' ? entry.closed : fallback.closed;
      return { day, open, close, closed };
    });
  } catch {
    return defaults;
  }
}

export function serializeOperatingHours(days: DayHours[]): string {
  return JSON.stringify(
    days.map((entry) => ({
      day: entry.day,
      open: entry.open,
      close: entry.close,
      closed: entry.closed,
    })),
  );
}

export interface TenantStatusMeta {
  label: string;
  color: 'success' | 'warning' | 'error' | 'default';
}

export function tenantStatusMeta(status: string | null | undefined): TenantStatusMeta {
  switch (status) {
    case 'ACTIVE':
      return { label: 'Active', color: 'success' };
    case 'PENDING':
      return { label: 'Pending', color: 'warning' };
    case 'SUSPENDED':
      return { label: 'Suspended', color: 'error' };
    default:
      return { label: 'Inactive', color: 'default' };
  }
}

export function parsePlanFeatures(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === 'string' && item.trim() !== '');
  } catch {
    return [];
  }
}

export function composeAddress(profile: RestaurantProfile): string {
  const line1 = profile.addressLine?.trim() ?? '';
  const locality = [profile.city, profile.state].filter(Boolean).join(', ');
  const tail = [profile.country, profile.postalCode].filter(Boolean).join(' ');
  const line2 = [locality, tail].filter(Boolean).join(' ');
  const full = [line1, line2].filter(Boolean).join(', ');
  return full || '—';
}
