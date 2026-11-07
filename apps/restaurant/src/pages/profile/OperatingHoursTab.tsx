import { useEffect, useState } from 'react';
import { Alert, Box, Button, CircularProgress, Divider, Paper, Switch, TextField, Typography } from '@mui/material';
import { Copy } from 'lucide-react';
import type { RestaurantProfile } from '@resto/types';
import type { RestaurantUpdatePayload } from '@/api';
import {
  DAY_LABELS,
  parseOperatingHours,
  serializeOperatingHours,
  type DayHours,
} from './profileUtils';

interface OperatingHoursTabProps {
  profile: RestaurantProfile;
  onSave: (payload: RestaurantUpdatePayload) => Promise<unknown>;
}

function rowError(day: DayHours): string | null {
  if (!day.closed && day.open === day.close) return 'Opening and closing times cannot be the same.';
  return null;
}

export function OperatingHoursTab({ profile, onSave }: OperatingHoursTabProps) {
  const [days, setDays] = useState<DayHours[]>(() => parseOperatingHours(profile.operatingHours));
  const [baseline, setBaseline] = useState<DayHours[]>(() => parseOperatingHours(profile.operatingHours));
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    const parsed = parseOperatingHours(profile.operatingHours);
    setDays(parsed);
    setBaseline(parsed);
    setApiError(null);
  }, [profile.operatingHours]);

  const dirty = JSON.stringify(days) !== JSON.stringify(baseline);
  const hasErrors = days.some((day) => rowError(day) !== null);

  const updateDay = (index: number, patch: Partial<DayHours>) => {
    setDays((previous) => previous.map((day, position) => (position === index ? { ...day, ...patch } : day)));
  };

  const copyMondayToAll = () => {
    const monday = days[0];
    if (!monday) return;
    setDays((previous) =>
      previous.map((day) => ({ ...day, open: monday.open, close: monday.close, closed: monday.closed })),
    );
  };

  const handleSave = async () => {
    if (saving || hasErrors || !dirty) return;
    setSaving(true);
    setApiError(null);
    try {
      await onSave({
        name: profile.name,
        currency: profile.currency,
        operatingHours: serializeOperatingHours(days),
      });
      setBaseline(days);
    } catch (error) {
      setApiError(error instanceof Error && error.message ? error.message : 'Failed to save operating hours.');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (saving) return;
    setDays(baseline);
    setApiError(null);
  };

  return (
    <Paper variant="outlined" sx={{ borderRadius: '14px', p: 2.5, display: 'grid', gap: 1.75 }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 1.5,
          flexWrap: 'wrap',
        }}
      >
        <Box>
          <Typography sx={{ fontSize: 14, fontWeight: 700 }}>Operating Hours</Typography>
          <Typography sx={{ fontSize: 12.5, color: 'text.secondary', mt: 0.25 }}>
            Set the hours guests can place orders for each day of the week.
          </Typography>
        </Box>
        <Button
          variant="outlined"
          size="small"
          startIcon={<Copy size={15} />}
          onClick={copyMondayToAll}
          disabled={saving}
        >
          Copy Monday's hours to all days
        </Button>
      </Box>

      {apiError ? (
        <Alert severity="error" variant="outlined" sx={{ borderRadius: '10px' }}>
          {apiError}
        </Alert>
      ) : null}

      <Divider />

      <Box sx={{ display: 'grid', gap: 0.5 }}>
        {days.map((day, index) => {
          const error = rowError(day);
          return (
            <Box
              key={day.day}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: { xs: 1.5, sm: 2 },
                flexWrap: 'wrap',
                py: 0.5,
              }}
            >
              <Typography sx={{ fontSize: 13, fontWeight: 600, width: 100, flexShrink: 0 }}>
                {DAY_LABELS[day.day]}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: 116, flexShrink: 0 }}>
                <Switch
                  size="small"
                  checked={day.closed}
                  disabled={saving}
                  onChange={(event) => updateDay(index, { closed: event.target.checked })}
                  inputProps={{ 'aria-label': `Closed on ${DAY_LABELS[day.day]}` }}
                />
                <Typography
                  sx={{
                    fontSize: 12.5,
                    fontWeight: 600,
                    color: day.closed ? 'text.secondary' : 'text.primary',
                  }}
                >
                  {day.closed ? 'Closed' : 'Open'}
                </Typography>
              </Box>
              <TextField
                type="time"
                label="Opens"
                size="small"
                value={day.open}
                disabled={day.closed || saving}
                onChange={(event) => updateDay(index, { open: event.target.value })}
                error={Boolean(error)}
                inputProps={{ 'aria-label': `Opening time on ${DAY_LABELS[day.day]}` }}
                sx={{ width: 130 }}
              />
              <Typography sx={{ color: 'text.secondary' }}>–</Typography>
              <TextField
                type="time"
                label="Closes"
                size="small"
                value={day.close}
                disabled={day.closed || saving}
                onChange={(event) => updateDay(index, { close: event.target.value })}
                error={Boolean(error)}
                helperText={error ?? ' '}
                inputProps={{ 'aria-label': `Closing time on ${DAY_LABELS[day.day]}` }}
                sx={{ width: 130 }}
              />
            </Box>
          );
        })}
      </Box>

      <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
        A closing time earlier than the opening time (e.g. 18:00–02:00) is treated as overnight service and is
        valid.
      </Typography>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5 }}>
        <Button color="inherit" onClick={handleReset} disabled={!dirty || saving}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={() => void handleSave()}
          disabled={!dirty || saving || hasErrors}
          startIcon={saving ? <CircularProgress size={15} color="inherit" /> : undefined}
        >
          {saving ? 'Saving…' : 'Save'}
        </Button>
      </Box>
    </Paper>
  );
}
