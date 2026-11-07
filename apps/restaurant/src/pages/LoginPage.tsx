import { useState } from 'react';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  IconButton,
  InputAdornment,
  Paper,
  TextField,
  Typography,
} from '@mui/material';
import {
  BarChart3,
  ClipboardList,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ShieldCheck,
  Users,
  UtensilsCrossed,
} from 'lucide-react';
import { ApiClientError } from '@resto/api-client';
import { loginSchema, type LoginFormValues } from '@resto/validation';
import { useAuth } from '@/auth/AuthContext';
import { RESTO_NAVY, RESTO_ORANGE } from '@/theme';

const BRAND_ACCENT = '#F4511E';
const IMAGE_SRC = '/login-restaurant.jpg';

const features = [
  {
    icon: ClipboardList,
    title: 'Manage every order',
    description: 'From kitchen to customer, in real time.',
  },
  {
    icon: BarChart3,
    title: 'Know your numbers',
    description: 'Track sales, performance and growth.',
  },
  {
    icon: Users,
    title: 'Keep your team in sync',
    description: 'Roles, shifts and operations — simplified.',
  },
];

function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
      <Box
        sx={{
          width: compact ? 36 : 44,
          height: compact ? 36 : 44,
          borderRadius: '12px',
          bgcolor: BRAND_ACCENT,
          display: 'grid',
          placeItems: 'center',
          flexShrink: 0,
        }}
      >
        <UtensilsCrossed size={compact ? 18 : 22} color="#ffffff" />
      </Box>
      <Typography
        sx={{
          fontSize: compact ? 16 : 19,
          fontWeight: 700,
          letterSpacing: '-0.01em',
          color: compact ? 'text.primary' : '#ffffff',
        }}
      >
        Resto Manager
      </Typography>
    </Box>
  );
}

function BrandPanel() {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <Box
      aria-hidden="true"
      sx={{
        position: 'relative',
        display: { xs: 'none', md: 'flex' },
        flexDirection: 'column',
        justifyContent: 'space-between',
        minHeight: '100dvh',
        overflow: 'hidden',
        bgcolor: RESTO_NAVY,
        p: { md: 5, lg: 7 },
      }}
    >
      {!imageFailed ? (
        <Box
          component="img"
          src={IMAGE_SRC}
          alt=""
          onError={() => setImageFailed(true)}
          sx={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      ) : null}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(160deg, rgba(20,34,56,0.94) 0%, rgba(20,34,56,0.78) 45%, rgba(20,34,56,0.88) 100%)`,
        }}
      />

      <Box sx={{ position: 'relative', zIndex: 1 }}>
        <BrandMark />
      </Box>

      <Box sx={{ position: 'relative', zIndex: 1, py: { md: 3, lg: 4 } }}>
        <Typography
          component="h2"
          sx={{
            fontSize: { md: '2.4rem', lg: '3.1rem' },
            fontWeight: 700,
            lineHeight: 1.12,
            letterSpacing: '-0.025em',
            color: '#ffffff',
            maxWidth: 560,
          }}
        >
          Run your restaurant.
          <br />
          <Box component="span" sx={{ color: BRAND_ACCENT }}>
            Grow your business.
          </Box>
        </Typography>
        <Typography
          sx={{
            mt: 2,
            fontSize: { md: '1rem', lg: '1.125rem' },
            lineHeight: 1.6,
            color: 'rgba(232,236,243,0.82)',
            maxWidth: 480,
          }}
        >
          Orders, menus, staff, and performance — all in one place.
        </Typography>

        <Box sx={{ display: 'grid', gap: 2.25, mt: { md: 4, lg: 5 } }}>
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Box key={feature.title} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.75 }}>
                <Box
                  sx={{
                    width: 42,
                    height: 42,
                    borderRadius: '12px',
                    bgcolor: 'rgba(244,81,30,0.16)',
                    border: '1px solid rgba(244,81,30,0.35)',
                    display: 'grid',
                    placeItems: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Icon size={19} color={BRAND_ACCENT} />
                </Box>
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontSize: 15, fontWeight: 600, color: '#ffffff', lineHeight: 1.3 }}>
                    {feature.title}
                  </Typography>
                  <Typography sx={{ fontSize: 13.5, color: 'rgba(232,236,243,0.72)', mt: 0.25, lineHeight: 1.5 }}>
                    {feature.description}
                  </Typography>
                </Box>
              </Box>
            );
          })}
        </Box>
      </Box>

      <Typography sx={{ position: 'relative', zIndex: 1, fontSize: 13, color: 'rgba(232,236,243,0.55)' }}>
        Built for restaurants that care.
      </Typography>
    </Box>
  );
}

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState<string | null>(null);
  const [sessionExpired] = useState(() => {
    if (sessionStorage.getItem('resto.session-expired') === '1') {
      sessionStorage.removeItem('resto.session-expired');
      return true;
    }
    return false;
  });
  const [showPassword, setShowPassword] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  const from = (location.state as { from?: string } | null)?.from ?? '/';

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    try {
      await login(values);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Unable to sign in.');
    }
  });

  const fieldFocusSx = {
    '& .MuiOutlinedInput-root': {
      '&.Mui-focused fieldset': { borderColor: RESTO_ORANGE, borderWidth: 2 },
      '&:hover:not(.Mui-focused) fieldset': { borderColor: `${RESTO_ORANGE}99` },
    },
    '& .MuiFormHelperText-root': { ml: 0 },
  };

  return (
    <Box
      sx={{
        minHeight: '100dvh',
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: '52fr 48fr' },
        bgcolor: '#FAF9F6',
        '&, & *': {
          '@media (prefers-reduced-motion: reduce)': {
            transition: 'none !important',
            animation: 'none !important',
          },
        },
      }}
    >
      <BrandPanel />

      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: { xs: '100dvh', md: '100dvh' },
          px: { xs: 2, sm: 3, md: 4 },
          py: { xs: 3, md: 4 },
          pb: { xs: 'calc(24px + env(safe-area-inset-bottom))', md: 4 },
        }}
      >
        <Box sx={{ width: '100%', maxWidth: 420, display: { md: 'none' }, mb: 3 }}>
          <BrandMark compact />
        </Box>

        <Paper
          elevation={0}
          sx={{
            width: '100%',
            maxWidth: 420,
            p: { xs: 2.5, sm: 3.5 },
            borderRadius: '16px',
            border: '1px solid #EBE9E2',
            boxShadow: '0 12px 40px rgba(20,34,56,0.08)',
          }}
        >
          <Typography component="h1" variant="h2" sx={{ fontSize: { xs: '1.5rem', sm: '1.75rem' } }}>
            Welcome back
          </Typography>
          <Typography sx={{ mt: 0.75, mb: 3, fontSize: 14, color: 'text.secondary' }}>
            Sign in to manage your restaurant.
          </Typography>

          <Box component="form" onSubmit={onSubmit} noValidate>
            {sessionExpired ? (
              <Alert severity="info" sx={{ mb: 2, borderRadius: '10px', fontSize: 13.5 }}>
                Your session has expired. Please sign in again.
              </Alert>
            ) : null}
            {error ? (
              <Alert severity="error" sx={{ mb: 2, borderRadius: '10px', fontSize: 13.5 }}>
                {error}
              </Alert>
            ) : null}

            <Box sx={{ display: 'grid', gap: 2 }}>
              <TextField
                label="Email address"
                type="email"
                autoComplete="username"
                autoFocus
                fullWidth
                required
                {...register('email')}
                error={Boolean(errors.email)}
                helperText={errors.email?.message}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Mail size={17} color={errors.email ? '#B42318' : '#718096'} />
                    </InputAdornment>
                  ),
                }}
                sx={fieldFocusSx}
              />

              <TextField
                label="Password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                fullWidth
                required
                {...register('password')}
                error={Boolean(errors.password)}
                helperText={errors.password?.message}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock size={17} color={errors.password ? '#B42318' : '#718096'} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        onClick={() => setShowPassword((value) => !value)}
                        edge="end"
                        size="small"
                        sx={{ color: 'text.secondary' }}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={fieldFocusSx}
              />

              <Button
                type="submit"
                variant="contained"
                size="large"
                fullWidth
                disabled={isSubmitting}
                sx={{
                  mt: 0.5,
                  minHeight: 48,
                  borderRadius: '12px',
                  fontSize: 15,
                  fontWeight: 700,
                  bgcolor: BRAND_ACCENT,
                  color: '#ffffff',
                  boxShadow: 'none',
                  '&:hover': { bgcolor: '#d93f13', boxShadow: 'none' },
                  '&:disabled': { bgcolor: `${BRAND_ACCENT}99`, color: '#ffffff' },
                }}
              >
                {isSubmitting ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                    <CircularProgress size={18} color="inherit" thickness={5} />
                    Signing in…
                  </Box>
                ) : (
                  'Sign in'
                )}
              </Button>
            </Box>
          </Box>

          <Divider sx={{ my: 2.5 }} />

          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.75 }}>
            <ShieldCheck size={15} color={RESTO_NAVY} />
            <Typography sx={{ fontSize: 12.5, color: 'text.secondary', fontWeight: 500 }}>
              Secure restaurant workspace
            </Typography>
          </Box>
        </Paper>

        <Typography sx={{ mt: 2.5, fontSize: 13, color: 'text.secondary', textAlign: 'center' }}>
          Need an account? Contact your platform administrator.
        </Typography>
        <Typography
          component={RouterLink}
          to="/signup"
          sx={{
            mt: 1,
            fontSize: 13,
            fontWeight: 600,
            color: BRAND_ACCENT,
            textAlign: 'center',
            display: 'block',
            textDecoration: 'none',
            '&:hover': { textDecoration: 'underline' },
          }}
        >
          New restaurant? Create your account
        </Typography>
      </Box>
    </Box>
  );
}
