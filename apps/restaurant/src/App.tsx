import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '@/auth/AuthContext';
import { RequireAuth } from '@/auth/RequireAuth';
import { RestaurantProvider } from '@/context/RestaurantContext';
import { AppLayout } from '@/layout/AppLayout';
import { AcceptInvitePage } from '@/pages/AcceptInvitePage';
import { BranchesPage } from '@/pages/BranchesPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { EmployeesPage } from '@/pages/EmployeesPage';
import { InquiriesPage } from '@/pages/InquiriesPage';
import { LoginPage } from '@/pages/LoginPage';
import { MenuPage } from '@/pages/MenuPage';
import { OrdersPage } from '@/pages/OrdersPage';
import { ReportsPage } from '@/pages/ReportsPage';
import { RestaurantProfilePage } from '@/pages/RestaurantProfilePage';
import { SignupPage } from '@/pages/SignupPage';
import { TablesPage } from '@/pages/TablesPage';

export function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/accept-invite" element={<AcceptInvitePage />} />
        <Route
          element={
            <RequireAuth>
              <RestaurantProvider>
                <AppLayout />
              </RestaurantProvider>
            </RequireAuth>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="menu" element={<MenuPage />} />
          <Route path="inquiries" element={<InquiriesPage />} />
          <Route path="tables" element={<TablesPage />} />
          <Route path="employees" element={<EmployeesPage />} />
          <Route path="reports" element={<ReportsPage />} />
            <Route path="branches" element={<BranchesPage />} />
            <Route path="profile" element={<RestaurantProfilePage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
