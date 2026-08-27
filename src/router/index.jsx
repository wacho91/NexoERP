import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './ProtectedRoute'
import MainLayout from '../layout/MainLayout'
import LoginPage from '../pages/auth/LoginPage'
import RegisterPage from '../pages/auth/RegisterPage'
import DashboardPage from '../pages/dashboard/DashboardPage'
import PosPage from '../pages/pos/PosPage'
import InventoryPage from '../pages/inventory/InventoryPage'
import ProductDetailPage from '../pages/inventory/ProductDetailPage'
import SalesPage from '../pages/sales/SalesPage'
import SaleDetailPage from '../pages/sales/SaleDetailPage'
import InvoicesPage from '../pages/invoices/InvoicesPage'
import InvoiceDetailPage from '../pages/invoices/InvoiceDetailPage'
import ReportsPage from '../pages/reports/ReportsPage'
import UsersPage from '../pages/users/UsersPage'
import AuditLogsPage from '../pages/audit/AuditLogsPage'
import SettingsPage from '../pages/settings/SettingsPage'

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<DashboardPage />} />
        <Route path="/pos" element={<PosPage />} />
        <Route path="/inventory" element={<InventoryPage />} />
        <Route path="/inventory/:id" element={<ProductDetailPage />} />
        <Route path="/sales" element={<SalesPage />} />
        <Route path="/sales/:id" element={<SaleDetailPage />} />
        <Route path="/invoices" element={<InvoicesPage />} />
        <Route path="/invoices/:id" element={<InvoiceDetailPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="/audit-logs" element={<AuditLogsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
