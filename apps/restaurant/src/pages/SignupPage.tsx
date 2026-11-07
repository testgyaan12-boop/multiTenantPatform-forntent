import { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
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
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ShieldCheck,
  Store,
  User,
  UtensilsCrossed,
} from 'lucide-react';
import { ApiClientError } from '@resto/api-client';
import { registerRestaurantSchema, type RegisterRestaurantFormValues } from '@resto/validation';
import { authApi } from '@/api';
import { RESTO_ORANGE } from '@/theme';

const BRAND_ACCENT = '#F4511E';

function FieldIcon({ icon: Icon, active }: { icon: typeof Mail; active?: boolean }) {
  return <Icon size={17} color={active ? '#B42318' : '#718096'} />;
}

export function SignupPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterRestaurantFormValues>({ resolver: zodResolver(registerRestaurantSchema) });

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    try {
      await authApi.registerRestaurant({
        name: values.name,
        ownerFirstName: values.ownerFirstName,
        ownerLastName: values.ownerLastName,
        email: values.email,
        password: values.password,
      });
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Unable to submit. Please try again.');
    }
  });

  return (
    <Box
      sx={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: '#FAF9F6',
        px: 2,
        py: 3,
        pb: 'calc(24px + env(safe-area-inset-bottom))',
        '&, & *': {
          '@media (prefers-reduced-motion: reduce)': {
            transition: 'none !important',
            animation: 'none !important',
          },
        },
      }}
    >
      <Box sx={{ width: '100%', maxWidth: 480, display: 'flex', alignItems: 'center', gap: 1.25, mb: 3 }}>
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: '12px',
            bgcolor: BRAND_ACCENT,
            display: 'grid',
            placeItems: 'center',
          }}
        >
          <UtensilsCrossed size={20} color="#ffffff" />
        </Box>
        <Box sx={{ flexGrow: 1 }}>
          <Typography sx={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.01em' }}>
            Resto Manager
          </Typography>
          <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>
            Restaurant onboarding
          </Typography>
        </Box>
        <Button
          component={RouterLink}
          to="/login"
          startIcon={<ArrowLeft size={15} />}
          color="inherit"
          sx={{ fontSize: 13, fontWeight: 600 }}
        >
          Sign in
        </Button>
      </Box>

      <Paper
        elevation={0}
        sx={{
          width: '100%',
          maxWidth: 480,
          p: { xs: 2.5, sm: 3.5 },
          borderRadius: '16px',
          border: '1px solid #EBE9E2',
          boxShadow: '0 12px 40px rgba(20,34,56,0.08)',
        }}
      >
        {submitted ? (
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <CheckCircle2 size={44} color="#1E7B3C" />
            <Typography variant="h3" sx={{ mt: 1.5 }}>
              Submitted for verification
            </Typography>
            <Typography sx={{ mt: 1, fontSize: 14, color: 'text.secondary', lineHeight: 1.6 }}>
              Your restaurant has been received. Our team will verify it shortly — once
              approved, sign in with your email and password.
            </Typography>
            <Button
              component={RouterLink}
              to="/login"
              variant="contained"
              sx={{
                mt: 2.5,
                minHeight: 44,
                borderRadius: '12px',
                bgcolor: BRAND_ACCENT,
                '&:hover': { bgcolor: '#d93f13' },
              }}
            >
              Back to sign in
            </Button>
          </Box>
        ) : (
          <>
            <Typography component="h1" variant="h2" sx={{ fontSize: { xs: '1.5rem', sm: '1.75rem' } }}>
              Create your restaurant
            </Typography>
            <Typography sx={{ mt: 0.75, mb: 2.5, fontSize: 14, color: 'text.secondary' }}>
              Sign up your restaurant — our team verifies every account before sign-in.
            </Typography>

            <Box component="form" onSubmit={onSubmit} noValidate>
              {error ? (
                <Alert severity="error" sx={{ mb: 2, borderRadius: '10px', fontSize: 13.5 }}>
                  {error}
                </Alert>
              ) : null}

              <Box sx={{ display: 'grid', gap: 2 }}>
                <TextField
                  label="Restaurant name"
                  fullWidth
                  required
                  autoComplete="organization"
                  {...register('name')}
                  error={Boolean(errors.name)}
                  helperText={errors.name?.message}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <FieldIcon icon={Store} />
                      </InputAdornment>
                    ),
                  }}
                />
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                  <TextField
                    label="First name"
                    fullWidth
                    required
                    autoComplete="given-name"
                    {...register('ownerFirstName')}
                    error={Boolean(errors.ownerFirstName)}
                    helperText={errors.ownerFirstName?.message}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <FieldIcon icon={User} />
                        </InputAdornment>
                      ),
                    }}
                  />
                  <TextField
                    label="Last name"
                    fullWidth
                    required
                    autoComplete="family-name"
                    {...register('ownerLastName')}
                    error={Boolean(errors.ownerLastName)}
                    helperText={errors.ownerLastName?.message}
                  />
                </Box>
                <TextField
                  label="Email address"
                  type="email"
                  fullWidth
                  required
                  autoComplete="email"
                  {...register('email')}
                  error={Boolean(errors.email)}
                  helperText={errors.email?.message}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <FieldIcon icon={Mail} active={Boolean(errors.email)} />
                      </InputAdornment>
                    ),
                  }}
                />
                <TextField
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  fullWidth
                  required
                  autoComplete="new-password"
                  {...register('password')}
                  error={Boolean(errors.password)}
                  helperText={errors.password?.message}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <FieldIcon icon={Lock} active={Boolean(errors.password)} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                          onClick={() => setShowPassword((value) => !value)}
                          edge="end"
                          size="small"
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
                <TextField
                  label="Confirm password"
                  type={showPassword ? 'text' : 'password'}
                  fullWidth
                  required
                  autoComplete="new-password"
                  {...register('confirmPassword')}
                  error={Boolean(errors.confirmPassword)}
                  helperText={errors.confirmPassword?.message}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <FieldIcon icon={Lock} active={Boolean(errors.confirmPassword)} />
                      </InputAdornment>
                    ),
                  }}
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
                      Submitting…
                    </Box>
                  ) : (
                    'Request verification'
                  )}
                </Button>
              </Box>
            </Box>

            <Divider sx={{ my: 2.5 }} />

            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.75 }}>
              <ShieldCheck size={15} color="#142238" />
              <Typography sx={{ fontSize: 12.5, color: 'text.secondary', fontWeight: 500 }}>
                Every restaurant is verified before sign-in
              </Typography>
            </Box>
          </>
        )}
      </Paper>

      {!submitted ? (
        <Typography sx={{ mt: 2.5, fontSize: 13, color: 'text.secondary', textAlign: 'center' }}>
          Already have an account?{' '}
          <Typography
            component={RouterLink}
            to="/login"
            sx={{ color: RESTO_ORANGE, fontWeight: 600, fontSize: 13, display: 'inline' }}
          >
            Sign in
          </Typography>
        </Typography>
      ) : null}
    </Box>
  );
}
