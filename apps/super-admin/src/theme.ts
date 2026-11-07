import { createTheme } from '@mui/material/styles';
import { restoTheme } from '@resto/ui';

export const NAVY = '#111D32';
export const NAVY_DARK = '#0C1526';
export const NAVY_LIGHT = '#1B2A44';
export const ORANGE = '#FF5722';
export const APP_BG = '#F6F8FC';
export const BORDER = '#E4E9F2';
export const GREEN = '#16A34A';
export const AMBER = '#D97706';
export const RED = '#DC2626';
export const BLUE = '#2563EB';

export const superAdminTheme = createTheme(restoTheme, {
  palette: {
    primary: { main: ORANGE, contrastText: '#FFFFFF' },
    background: { default: APP_BG, paper: '#FFFFFF' },
    text: { primary: NAVY, secondary: '#5A6478' },
    success: { main: GREEN },
    warning: { main: AMBER },
    error: { main: RED },
    info: { main: BLUE },
  },
  shape: { borderRadius: 10 },
  typography: {
    h1: { fontSize: '1.75rem', fontWeight: 700, color: NAVY },
    h2: { fontSize: '1.375rem', fontWeight: 700, color: NAVY },
    h3: { fontSize: '1.125rem', fontWeight: 600, color: NAVY },
    h4: { fontSize: '1rem', fontWeight: 600, color: NAVY },
    subtitle1: { fontWeight: 600 },
    overline: { fontWeight: 600, letterSpacing: '0.06em' },
  },
  components: {
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: { border: `1px solid ${BORDER}`, backgroundImage: 'none' },
      },
    },
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: { border: `1px solid ${BORDER}`, borderRadius: 12 },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { borderRadius: 8, minHeight: 36 },
        contained: { boxShadow: 'none' },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: { borderRadius: 8, backgroundColor: '#FFFFFF' },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: { fontWeight: 600, color: NAVY, backgroundColor: '#F6F8FC' },
        root: { borderBottomColor: BORDER },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 8, fontWeight: 600, height: 26 },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: { backgroundColor: ORANGE, height: 3 },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: { textTransform: 'none', fontWeight: 600, minHeight: 46 },
      },
    },
    MuiAppBar: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: { backgroundColor: '#FFFFFF', borderBottom: `1px solid ${BORDER}`, color: NAVY },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: { backgroundColor: NAVY, borderRight: 'none' },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: { borderRadius: 14 },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: { '&:hover': { backgroundColor: '#F9FBFE !important' } },
      },
    },
  },
});
