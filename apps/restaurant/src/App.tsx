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
import { ProductOrdersPage } from '@/pages/ProductOrdersPage';
import { ProductPage } from '@/pages/ProductPage';
import { ReportsPage } from '@/pages/ReportsPage';
import { RestaurantProfilePage } from '@/pages/RestaurantProfilePage';
import { SignupPage } from '@/pages/SignupPage';
import { TablesPage } from '@/pages/TablesPage';
import { RequirePermission } from '@/auth/RequirePermission';

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
          <Route index element={<RequirePermission code="dashboard.read"><DashboardPage /></RequirePermission>} />
          <Route path="orders" element={<RequirePermission code="order.read"><OrdersPage /></RequirePermission>} />
          <Route path="menu" element={<RequirePermission code="menu.read"><MenuPage /></RequirePermission>} />
          <Route path="products" element={<RequirePermission code="product.read"><ProductPage /></RequirePermission>} />
          <Route path="product-orders" element={<RequirePermission code="product_order.read"><ProductOrdersPage /></RequirePermission>} />
          <Route path="inquiries" element={<RequirePermission code="inquiry.read"><InquiriesPage /></RequirePermission>} />
          <Route path="tables" element={<RequirePermission code="table.read"><TablesPage /></RequirePermission>} />
          <Route path="employees" element={<RequirePermission code="employee.read"><EmployeesPage /></RequirePermission>} />
          <Route path="reports" element={<RequirePermission code="report.read"><ReportsPage /></RequirePermission>} />
          <Route path="branches" element={<RequirePermission code="branch.read"><BranchesPage /></RequirePermission>} />
          <Route path="profile" element={<RestaurantProfilePage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
