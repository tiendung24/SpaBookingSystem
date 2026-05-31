import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'

import ShopLandingPage from './pages/ShopLandingPage'
import PlatformLandingPage from './pages/PlatformLandingPage'
import PartnerShopsPage from './pages/PartnerShopsPage'
import LoginPage from './pages/LoginPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import RegisterPage from './pages/RegisterPage'

import ShopDashboardPage from './pages/ShopDashboardPage'
import ShopBookingsPage from './pages/ShopBookingsPage'
import ShopWalletPage from './pages/ShopWalletPage'
import ShopServicesPage from './pages/ShopServicesPage'
import ShopStaffPage from './pages/ShopStaffPage'
import ShopDepositConfigPage from './pages/ShopDepositConfigPage'
import ShopSlotsConfigPage from './pages/ShopSlotsConfigPage'
import ShopStatisticsPage from './pages/ShopStatisticsPage'
import ShopCreateBookingPage from './pages/ShopCreateBookingPage'
import ShopOnboardingPage from './pages/ShopOnboardingPage'
import ShopBookingDetailPage from './pages/ShopBookingDetailPage'
import ShopConfigPage from './pages/ShopConfigPage'

import AdminDashboardPage from './pages/AdminDashboardPage'
import AdminPartnersPage from './pages/AdminPartnersPage'
import AdminPartnerDetailPage from './pages/AdminPartnerDetailPage'
import AdminApprovalsPage from './pages/AdminApprovalsPage'
import AdminApprovalDetailPage from './pages/AdminApprovalDetailPage'
import AdminFinancePage from './pages/AdminFinancePage'
import AdminRiskPage from './pages/AdminRiskPage'
import AdminIncidentDetailPage from './pages/AdminIncidentDetailPage'
import AdminSupportPage from './pages/AdminSupportPage'
import AdminTicketDetailPage from './pages/AdminTicketDetailPage'
import AdminSettingsPage from './pages/AdminSettingsPage'
import AdminRefundsPage from './pages/AdminRefundsPage'
import AdminBookingDetailPage from './pages/AdminBookingDetailPage'

import CustomerHomePage from './pages/CustomerHomePage'
import CustomerServiceDetailPage from './pages/CustomerServiceDetailPage'
import CustomerSelectServicePage from './pages/CustomerSelectServicePage'
import CustomerBookingTimePage from './pages/CustomerBookingTimePage'
import CustomerPaymentPage from './pages/CustomerPaymentPage'
import CustomerAccountBookingsPage from './pages/CustomerAccountBookingsPage'
import CustomerRegisterPage from './pages/CustomerRegisterPage'
import CustomerProfilePage from './pages/CustomerProfilePage'

import { ShopProvider } from './context/ShopContext'
import { GuestOnly, RequireRole } from './components/auth/RouteGuards'
import { ToastProvider } from './components/ui/ToastProvider'

function App() {
  return (
    <ShopProvider>
      <ToastProvider>
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Routes>
            <Route path="/" element={<PlatformLandingPage />} />
            <Route path="/partner-shops" element={<PartnerShopsPage />} />
            <Route path="/shop-landing" element={<ShopLandingPage />} />

            <Route path="/login" element={<GuestOnly><LoginPage /></GuestOnly>} />
            <Route path="/register" element={<GuestOnly><RegisterPage /></GuestOnly>} />
            <Route path="/customer/register" element={<GuestOnly><CustomerRegisterPage /></GuestOnly>} />
            <Route path="/forgot-password" element={<GuestOnly><ForgotPasswordPage /></GuestOnly>} />
            <Route path="/reset-password/:token" element={<GuestOnly><ResetPasswordPage /></GuestOnly>} />

            <Route path="/shop/dashboard" element={<RequireRole allow={['shop']}><ShopDashboardPage /></RequireRole>} />
            <Route path="/shop/onboarding" element={<RequireRole allow={['shop']}><ShopOnboardingPage /></RequireRole>} />
            <Route path="/shop/bookings" element={<RequireRole allow={['shop']}><ShopBookingsPage /></RequireRole>} />
            <Route path="/shop/bookings/new" element={<RequireRole allow={['shop']}><ShopCreateBookingPage /></RequireRole>} />
            <Route path="/shop/bookings/:id" element={<RequireRole allow={['shop']}><ShopBookingDetailPage /></RequireRole>} />
            <Route path="/shop/wallet" element={<RequireRole allow={['shop']}><ShopWalletPage /></RequireRole>} />
            <Route path="/shop/services" element={<RequireRole allow={['shop']}><ShopServicesPage /></RequireRole>} />
            <Route path="/shop/staff" element={<RequireRole allow={['shop']}><ShopStaffPage /></RequireRole>} />
            <Route path="/shop/config/deposit" element={<RequireRole allow={['shop']}><ShopDepositConfigPage /></RequireRole>} />
            <Route path="/shop/config/slots" element={<RequireRole allow={['shop']}><ShopSlotsConfigPage /></RequireRole>} />
            <Route path="/shop/config/shop" element={<RequireRole allow={['shop']}><ShopConfigPage /></RequireRole>} />
            <Route path="/shop/statistics" element={<RequireRole allow={['shop']}><ShopStatisticsPage /></RequireRole>} />

            <Route path="/admin/dashboard" element={<RequireRole allow={['admin']}><AdminDashboardPage /></RequireRole>} />
            <Route path="/admin/bookings/:id" element={<RequireRole allow={['admin']}><AdminBookingDetailPage /></RequireRole>} />
            <Route path="/admin/partners" element={<RequireRole allow={['admin']}><AdminPartnersPage /></RequireRole>} />
            <Route path="/admin/partners/:id" element={<RequireRole allow={['admin']}><AdminPartnerDetailPage /></RequireRole>} />
            <Route path="/admin/approvals" element={<RequireRole allow={['admin']}><AdminApprovalsPage /></RequireRole>} />
            <Route path="/admin/approvals/:id" element={<RequireRole allow={['admin']}><AdminApprovalDetailPage /></RequireRole>} />
            <Route path="/admin/finance" element={<RequireRole allow={['admin']}><AdminFinancePage /></RequireRole>} />
            <Route path="/admin/risk" element={<RequireRole allow={['admin']}><AdminRiskPage /></RequireRole>} />
            <Route path="/admin/risk/:id" element={<RequireRole allow={['admin']}><AdminIncidentDetailPage /></RequireRole>} />
            <Route path="/admin/support" element={<RequireRole allow={['admin']}><AdminSupportPage /></RequireRole>} />
            <Route path="/admin/support/:id" element={<RequireRole allow={['admin']}><AdminTicketDetailPage /></RequireRole>} />
            <Route path="/admin/settings" element={<RequireRole allow={['admin']}><AdminSettingsPage /></RequireRole>} />
            <Route path="/admin/refunds" element={<RequireRole allow={['admin']}><AdminRefundsPage /></RequireRole>} />

            <Route path="/customer/bookings" element={<RequireRole allow={['customer']}><CustomerAccountBookingsPage /></RequireRole>} />
            <Route path="/customer/profile" element={<RequireRole allow={['customer']}><CustomerProfilePage /></RequireRole>} />

            <Route path="/:slug/service/:serviceId" element={<CustomerServiceDetailPage />} />
            <Route path="/:slug/book" element={<RequireRole allow={['customer']}><CustomerSelectServicePage /></RequireRole>} />
            <Route path="/:slug/book/time" element={<RequireRole allow={['customer']}><CustomerBookingTimePage /></RequireRole>} />
            <Route path="/:slug/book/pay" element={<RequireRole allow={['customer']}><CustomerPaymentPage /></RequireRole>} />
            <Route path="/:slug" element={<CustomerHomePage />} />
          </Routes>
        </Router>
      </ToastProvider>
    </ShopProvider>
  )
}

export default App
