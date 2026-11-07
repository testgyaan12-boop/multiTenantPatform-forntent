import { createTheme } from '@mui/material/styles';

export const RESTO_ORANGE = '#F4511E';
export const RESTO_NAVY = '#152033';

export const restaurantTheme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: RESTO_ORANGE, dark: '#d94a1e', contrastText: '#ffffff' },
    secondary: { main: RESTO_NAVY, dark: '#0d1521', contrastText: '#ffffff' },
    background: { default: '#F7F8FA', paper: '#ffffff' },
    text: { primary: '#172033', secondary: '#718096' },
    divider: '#E7E7E2',
    success: { main: '#16A36A' },
    warning: { main: '#F59E0B' },
    error: { main: '#DC2626' },
    info: { main: '#3B82F6' },
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: '"Inter", "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    h1: { fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.02em' },
    h2: { fontSize: '1.375rem', fontWeight: 700, letterSpacing: '-0.01em' },
    h3: { fontSize: '1.125rem', fontWeight: 600 },
    h4: { fontSize: '1rem', fontWeight: 600 },
    body1: { fontSize: '0.9375rem' },
    body2: { fontSize: '0.875rem' },
    button: { textTransform: 'none', fontWeight: 600 },
    subtitle2: { fontWeight: 600 },
  },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { borderRadius: 10, minHeight: 38, boxShadow: 'none' },
      },
    },
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: { border: '1px solid #E7E7E2', borderRadius: 14, backgroundImage: 'none' },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: { border: '1px solid #E7E7E2', borderRadius: 14, boxShadow: '0 1px 2px rgba(21,31,48,0.04)' },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: { fontWeight: 600, color: '#718096', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 0.4, backgroundColor: '#ffffff' },
        root: { borderBottom: '1px solid #F0F0EC', padding: '10px 14px' },
      },
    },
    MuiChip: {
      styleOverrides: { root: { fontWeight: 600, height: 24, fontSize: '0.75rem' } },
    },
    MuiTextField: { defaultProps: { size: 'small' } },
    MuiSelect: { defaultProps: { size: 'small' } },
    MuiTooltip: { defaultProps: { arrow: true } },
  },
});
