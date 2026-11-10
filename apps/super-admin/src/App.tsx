import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '@/auth/AuthContext';
import { RequireAuth } from '@/auth/RequireAuth';
import { ToastProvider } from '@/components/toast';
import { AppLayout } from '@/layout/AppLayout';
import { AuditPage } from '@/pages/AuditPage';
import { BranchesPage } from '@/pages/BranchesPage';
import { CouponsPage } from '@/pages/CouponsPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { FeatureFlagsPage } from '@/pages/FeatureFlagsPage';
import { HelpPage } from '@/pages/HelpPage';
import { IntegrationsPage } from '@/pages/IntegrationsPage';
import { InvoicesPage } from '@/pages/InvoicesPage';
import { LoginPage } from '@/pages/LoginPage';
import { NotificationsPage } from '@/pages/NotificationsPage';
import { OnboardingPage } from '@/pages/OnboardingPage';
import { PlansPage } from '@/pages/PlansPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { ReportsPage } from '@/pages/ReportsPage';
import { RevenuePage } from '@/pages/RevenuePage';
import { RolesPage } from '@/pages/RolesPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { StoragePage } from '@/pages/StoragePage';
import { SubscriptionsPage } from '@/pages/SubscriptionsPage';
import { TenantDetailPage } from '@/pages/TenantDetailPage';
import { TenantsPage } from '@/pages/TenantsPage';
import { UsersPage } from '@/pages/UsersPage';

export function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            element={
              <RequireAuth>
                <AppLayout />
              </RequireAuth>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="tenants" element={<TenantsPage />} />
            <Route path="tenants/:id" element={<TenantDetailPage />} />
            <Route path="branches" element={<BranchesPage />} />
            <Route path="onboarding" element={<OnboardingPage />} />
            <Route path="subscriptions" element={<SubscriptionsPage />} />
            <Route path="plans" element={<PlansPage />} />
            <Route path="invoices" element={<InvoicesPage />} />
            <Route path="coupons" element={<CouponsPage />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="roles" element={<RolesPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="revenue" element={<RevenuePage />} />
            <Route path="audit" element={<AuditPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="storage" element={<StoragePage />} />
            <Route path="feature-flags" element={<FeatureFlagsPage />} />
            <Route path="integrations" element={<IntegrationsPage />} />
            <Route path="help" element={<HelpPage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ToastProvider>
    </AuthProvider>
  );
}
