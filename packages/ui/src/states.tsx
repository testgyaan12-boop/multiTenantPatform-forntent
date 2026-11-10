import type { ReactNode } from 'react';
import { Alert, Box, CircularProgress, Stack, Typography } from '@mui/material';

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  icon?: ReactNode;
}

export function PageHeader({ title, subtitle, actions, icon }: PageHeaderProps) {
  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      justifyContent="space-between"
      alignItems={{ xs: 'flex-start', sm: 'center' }}
      spacing={2}
      sx={{ mb: 3 }}
    >
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
        {icon ? (
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: '12px',
              bgcolor: 'rgba(255,87,34,0.10)',
              color: 'primary.main',
              display: 'grid',
              placeItems: 'center',
              flexShrink: 0,
            }}
          >
            {icon}
          </Box>
        ) : null}
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h2" component="h1">
            {title}
          </Typography>
          {subtitle ? (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {subtitle}
            </Typography>
          ) : null}
        </Box>
      </Stack>
      {actions ? <Box>{actions}</Box> : null}
    </Stack>
  );
}

export interface LoadingStateProps {
  label?: string;
}

export function LoadingState({ label = 'Loading…' }: LoadingStateProps) {
  return (
    <Stack alignItems="center" justifyContent="center" spacing={2} sx={{ py: 8 }} role="status">
      <CircularProgress size={32} />
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
    </Stack>
  );
}

export interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <Alert
      severity="error"
      action={
        onRetry ? (
          <Typography
            component="button"
            onClick={onRetry}
            sx={{
              background: 'none',
              border: 0,
              cursor: 'pointer',
              color: 'inherit',
              fontWeight: 600,
              textDecoration: 'underline',
            }}
          >
            Retry
          </Typography>
        ) : undefined
      }
    >
      {message}
    </Alert>
  );
}

export interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <Stack alignItems="center" spacing={1.5} sx={{ py: 8, textAlign: 'center' }}>
      <Typography variant="h3" component="h2">
        {title}
      </Typography>
      {description ? (
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 420 }}>
          {description}
        </Typography>
      ) : null}
      {action}
    </Stack>
  );
}

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}
