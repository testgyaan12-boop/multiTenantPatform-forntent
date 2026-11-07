import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { LogOut, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { profileSchema, type ProfileFormValues } from '@/schemas/checkout.schema';
import { useProfileStore } from '@/stores/profile.store';
import { useCartStore } from '@/stores/cart.store';
import { useSessionStore } from '@/stores/session.store';
import { PageHeader } from '@/components/layout/page-header';
import { Input, Textarea } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const ORDERS_KEY = 'resto-orders-v1';

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="mt-0.5 text-xs text-muted">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={
          checked
            ? 'relative h-6 w-11 shrink-0 rounded-full bg-primary transition-colors'
            : 'relative h-6 w-11 shrink-0 rounded-full bg-border transition-colors'
        }
      >
        <span
          className={
            checked
              ? 'absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform translate-x-5'
              : 'absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform'
          }
        />
      </button>
    </div>
  );
}

export function ProfilePage() {
  const profile = useProfileStore((state) => state.profile);
  const setProfile = useProfileStore((state) => state.setProfile);
  const clearProfile = useProfileStore((state) => state.clearProfile);
  const clearCart = useCartStore((state) => state.clear);
  const clearSessions = useSessionStore((state) => state.clearAll);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: profile?.name ?? '',
      email: profile?.email ?? '',
      phone: profile?.phone ?? '',
      diningNotes: profile?.diningNotes ?? '',
    },
  });

  const vegetarianOnly = Boolean(profile?.vegetarianOnly);
  const emailOffers = Boolean(profile?.emailOffers);

  function save(values: ProfileFormValues) {
    setProfile({
      name: values.name,
      email: values.email || undefined,
      phone: values.phone || undefined,
      diningNotes: values.diningNotes || undefined,
      vegetarianOnly,
      emailOffers,
    });
    toast.success('Preferences saved on this device');
  }

  function wipeLocalData() {
    clearProfile();
    clearCart();
    clearSessions();
    try {
      localStorage.removeItem(ORDERS_KEY);
    } catch {
      // storage unavailable
    }
    toast.success('Local data cleared');
  }

  function errorFor(name: keyof ProfileFormValues) {
    const error = form.formState.errors[name];
    return error ? error.message : undefined;
  }

  return (
    <>
      <PageHeader title="Profile & preferences" subtitle="Saved on this device only" />

      <div className="space-y-4 px-4 py-4">
        <form onSubmit={form.handleSubmit(save)} className="space-y-5" noValidate>
          <section className="rounded-xl border border-border bg-card p-4">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold">Contact details</h2>
              {profile ? <Badge variant="success">Saved</Badge> : <Badge variant="outline">New</Badge>}
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="profile-name">Name *</Label>
                <Input id="profile-name" autoComplete="name" {...form.register('name')} />
                {errorFor('name') ? (
                  <p className="text-xs text-destructive">{errorFor('name')}</p>
                ) : null}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="profile-phone">Mobile number</Label>
                <Input id="profile-phone" type="tel" autoComplete="tel" {...form.register('phone')} />
                {errorFor('phone') ? (
                  <p className="text-xs text-destructive">{errorFor('phone')}</p>
                ) : null}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="profile-email">Email</Label>
                <Input id="profile-email" type="email" autoComplete="email" {...form.register('email')} />
                {errorFor('email') ? (
                  <p className="text-xs text-destructive">{errorFor('email')}</p>
                ) : null}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="profile-notes">Notes for the kitchen</Label>
                <Textarea
                  id="profile-notes"
                  rows={2}
                  placeholder="e.g. no cilantro, extra napkins"
                  {...form.register('diningNotes')}
                />
              </div>
            </div>
          </section>

          <section className="space-y-4 rounded-xl border border-border bg-card p-4">
            <h2 className="text-sm font-semibold">Preferences</h2>
            <ToggleRow
              label="Vegetarian menu first"
              description="Highlight vegetarian dishes when you browse."
              checked={vegetarianOnly}
              onChange={(checked) => {
                if (profile) {
                  setProfile({ ...profile, vegetarianOnly: checked });
                } else {
                  setProfile({
                    name: form.getValues('name') || 'Guest',
                    vegetarianOnly: checked,
                    emailOffers,
                  });
                }
              }}
            />
            <Separator />
            <ToggleRow
              label="Email me offers"
              description="Occasional deals from restaurants you order from."
              checked={emailOffers}
              onChange={(checked) => {
                if (profile) {
                  setProfile({ ...profile, emailOffers: checked });
                } else {
                  setProfile({
                    name: form.getValues('name') || 'Guest',
                    vegetarianOnly,
                    emailOffers: checked,
                  });
                }
              }}
            />
          </section>

          <Button type="submit" size="lg" className="w-full" disabled={form.formState.isSubmitting}>
            Save preferences
          </Button>
        </form>

        <section className="rounded-xl border border-destructive/30 bg-card p-4">
          <h2 className="text-sm font-semibold text-destructive">Clear local data</h2>
          <p className="mt-1 text-xs text-muted">
            Removes your profile, cart, table sessions and saved order history from this browser.
            Placed orders stay with the restaurant.
          </p>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="mt-3" size="sm">
                <Trash2 className="h-4 w-4" aria-hidden />
                Clear everything
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Clear all local data?</AlertDialogTitle>
                <AlertDialogDescription>
                  This can&apos;t be undone. Your saved orders will no longer appear in this
                  browser.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Keep my data</AlertDialogCancel>
                <AlertDialogAction onClick={wipeLocalData}>
                  <LogOut className="h-4 w-4" aria-hidden />
                  Yes, clear it
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </section>

        <p className="pb-2 text-center text-xs text-muted">
          No account needed — orders are tied to this browser and your table QR code.
        </p>
      </div>
    </>
  );
}
