import { Alert, Snackbar } from '@mui/material';
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

type Severity = 'success' | 'error' | 'info' | 'warning';

interface ToastState {
  message: string;
  severity: Severity;
}

const ToastContext = createContext<{ toast: (message: string, severity?: Severity) => void }>({
  toast: () => undefined,
});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ToastState | null>(null);

  const toast = useCallback((message: string, severity: Severity = 'success') => {
    setState({ message, severity });
  }, []);

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Snackbar
        open={Boolean(state)}
        autoHideDuration={4000}
        onClose={() => setState(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          severity={state?.severity ?? 'info'}
          variant="filled"
          onClose={() => setState(null)}
          sx={{ width: '100%' }}
        >
          {state?.message}
        </Alert>
      </Snackbar>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
