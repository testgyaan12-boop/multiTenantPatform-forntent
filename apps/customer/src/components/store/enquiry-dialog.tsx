import { useState } from 'react';
import { Loader2, CheckCircle2, CreditCard, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input, Textarea } from '@/components/ui/input';
import { errorMessage } from '@/lib/api-client';
import { formatCurrency } from '@/lib/format-currency';
import { service } from '@/services';
import type { StoreInquiryResult } from '@/types';

interface EnquiryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  slug: string;
  currency: string;
  itemName?: string | null;
}

type Phase = 'form' | 'submitting' | 'done' | 'paying' | 'paid' | 'error';

export function EnquiryDialog({
  open,
  onOpenChange,
  slug,
  currency,
  itemName = null,
}: EnquiryDialogProps) {
  const [phase, setPhase] = useState<Phase>('form');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [result, setResult] = useState<StoreInquiryResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setPhase('form');
    setResult(null);
    setError(null);
    setMessage('');
  };

  const close = (nextOpen: boolean) => {
    if (!nextOpen) {
      setTimeout(reset, 200);
    }
    onOpenChange(nextOpen);
  };

  const submit = async () => {
    setError(null);
    if (!name.trim()) {
      setError('Please enter your name.');
      return;
    }
    if (!phone.trim()) {
      setError('Please enter your phone number.');
      return;
    }
    setPhase('submitting');
    try {
      const created = await service.submitInquiry(slug, {
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        message: message.trim() || undefined,
        sourceUrl: window.location.href,
      });
      setResult(created);
      setPhase('done');
    } catch (err) {
      setError(errorMessage(err));
      setPhase('form');
    }
  };

  const pay = async () => {
    if (!result?.booking.orderPublicToken) return;
    setPhase('paying');
    setError(null);
    try {
      const key =
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      await service.payOrder(result.booking.orderPublicToken, key);
      setPhase('paid');
    } catch (err) {
      setError(errorMessage(err));
      setPhase('done');
    }
  };

  const needsPayment = result?.booking.required && result.booking.orderPublicToken;

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-w-md">
        {phase === 'form' || phase === 'submitting' ? (
          <>
            <DialogHeader>
              <DialogTitle>Send an enquiry</DialogTitle>
            </DialogHeader>
            {itemName ? (
              <p className="text-sm text-muted">About: <span className="font-medium text-foreground">{itemName}</span></p>
            ) : null}
            <div className="space-y-3">
              <Input placeholder="Your name *" value={name} onChange={(e) => setName(e.target.value)} disabled={phase === 'submitting'} />
              <Input placeholder="Phone number *" value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" disabled={phase === 'submitting'} />
              <Input placeholder="Email (optional)" value={email} onChange={(e) => setEmail(e.target.value)} inputMode="email" disabled={phase === 'submitting'} />
              <Textarea
                placeholder="Your message (optional)"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                disabled={phase === 'submitting'}
              />
              {error ? <p className="text-sm text-destructive">{error}</p> : null}
              <Button className="w-full" onClick={submit} disabled={phase === 'submitting'}>
                {phase === 'submitting' ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                Send enquiry
              </Button>
            </div>
          </>
        ) : null}

        {phase === 'done' && result ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                Enquiry sent
              </DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted">
              Thanks {name.trim()}! We received your enquiry and will contact you on {phone.trim()} shortly.
            </p>
            {needsPayment ? (
              <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-100">
                A booking payment of{' '}
                <span className="font-semibold">
                  {formatCurrency(result.booking.amount, currency)}
                </span>{' '}
                is required to confirm your booking.
                <Button className="mt-3 w-full" onClick={pay}>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Pay {formatCurrency(result.booking.amount, currency)}
                </Button>
              </div>
            ) : null}
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <Button variant="outline" className="w-full" onClick={() => close(false)}>
              Close
            </Button>
          </>
        ) : null}

        {phase === 'paying' ? (
          <div className="flex flex-col items-center gap-3 py-6">
            <Loader2 className="h-6 w-6 animate-spin" />
            <p className="text-sm text-muted">Processing payment…</p>
          </div>
        ) : null}

        {phase === 'paid' && result ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                Booking confirmed
              </DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted">
              Payment of {formatCurrency(result.booking.amount, currency)} received. We will contact you
              shortly to schedule the next steps.
            </p>
            <Button className="w-full" onClick={() => close(false)}>
              Done
            </Button>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
