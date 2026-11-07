import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import {
  Alert,
  Box,
  Button,
  Card,
  CircularProgress,
  IconButton,
  InputAdornment,
  TextField,
  Typography,
} from '@mui/material';
import { Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { authApi } from '@/api';

export function AcceptInvitePage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const acceptInvite = useMutation({
    mutationFn: () => authApi.acceptInvite({ token, password }),
    onSuccess: () => {
      navigate('/login?invited=1', { replace: true });
    },
    onError: (err) => {
      setError(err instanceof Error && err.message ? err.message : 'This invitation link is invalid or has expired.');
    },
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!token) {
      setError('Missing invitation token — use the exact link from your manager.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    acceptInvite.mutate();
  };

  return (
    <Box
      sx={{
        minHeight: '100dvh',
        display: 'grid',
        placeItems: 'center',
        bgcolor: '#F7F8FA',
        px: 2,
      }}
    >
      <Card
        component="form"
        onSubmit={handleSubmit}
        sx={{
          width: '100%',
          maxWidth: 420,
          borderRadius: '16px',
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: '0 8px 30px rgba(16,24,40,0.06)',
          p: 3,
          display: 'grid',
          gap: 2,
        }}
      >
        <Box sx={{ display: 'grid', justifyItems: 'center', gap: 1, textAlign: 'center' }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: '14px',
              bgcolor: '#FFF4E5',
              color: '#F4511E',
              display: 'grid',
              placeItems: 'center',
            }}
          >
            <ShieldCheck size={24} />
          </Box>
          <Typography sx={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em' }}>
            Set your password
          </Typography>
          <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
            Choose a password to activate your restaurant staff account.
          </Typography>
        </Box>

        {error ? (
          <Alert severity="error" variant="outlined" sx={{ borderRadius: '10px' }}>
            {error}
          </Alert>
        ) : null}

        {!token ? (
          <Alert severity="warning" variant="outlined" sx={{ borderRadius: '10px' }}>
            No invitation token was found in the URL. Ask your manager to resend the invite link.
          </Alert>
        ) : null}

        <TextField
          label="New password"
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          fullWidth
          autoFocus
          disabled={acceptInvite.isPending}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword((value) => !value)}
                  edge="end"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
        <TextField
          label="Confirm password"
          type={showPassword ? 'text' : 'password'}
          value={confirm}
          onChange={(event) => setConfirm(event.target.value)}
          fullWidth
          disabled={acceptInvite.isPending}
        />

        <Button
          type="submit"
          variant="contained"
          disabled={acceptInvite.isPending || !password || !confirm}
          startIcon={acceptInvite.isPending ? <CircularProgress size={15} color="inherit" /> : undefined}
          sx={{ py: 0.9, fontSize: 14, fontWeight: 700 }}
        >
          {acceptInvite.isPending ? 'Activating…' : 'Activate account'}
        </Button>

        <Button color="inherit" onClick={() => navigate('/login')} sx={{ fontSize: 13 }}>
          Back to sign in
        </Button>
      </Card>
    </Box>
  );
}
