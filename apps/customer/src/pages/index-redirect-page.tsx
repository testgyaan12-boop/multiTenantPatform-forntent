import { Navigate } from 'react-router-dom';
import { DEFAULT_RESTAURANT } from '@/lib/env';

export function IndexRedirectPage() {
  return <Navigate to={`/r/${DEFAULT_RESTAURANT}`} replace />;
}
