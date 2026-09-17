import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CurrencyProvider } from './context/CurrencyContext';

// Public Pages
import { HomePage } from './pages/public/HomePage';
import { RoomsPage } from './pages/public/RoomsPage';
import { BookingPage } from './pages/public/BookingPage';
import { BookingConfirmationPage } from './pages/public/BookingConfirmationPage';
import { AmenitiesPage } from './pages/public/AmenitiesPage';
import { OffersPage } from './pages/public/OffersPage';
import { AboutPage } from './pages/public/AboutPage';
import { ContactPage } from './pages/public/ContactPage';
import { GuestRoomPortalPage } from './pages/public/GuestRoomPortalPage';

// PMS Layout & Pages
import { PmsLayout } from './components/common/PmsLayout';
import { PmsLoginPage } from './pages/pms/PmsLoginPage';
import { PmsDashboardPage } from './pages/pms/PmsDashboardPage';
import { PmsFrontDeskPage } from './pages/pms/PmsFrontDeskPage';
import { PmsReservationsPage } from './pages/pms/PmsReservationsPage';
import { PmsTapeChartPage } from './pages/pms/PmsTapeChartPage';
import { PmsRoomsPage } from './pages/pms/PmsRoomsPage';
import { PmsGuestsPage } from './pages/pms/PmsGuestsPage';
import { PmsHousekeepingPage } from './pages/pms/PmsHousekeepingPage';
import { PmsMaintenancePage } from './pages/pms/PmsMaintenancePage';
import { PmsRestaurantPage } from './pages/pms/PmsRestaurantPage';
import { PmsBillingPage } from './pages/pms/PmsBillingPage';
import { PmsReportsPage } from './pages/pms/PmsReportsPage';
import { PmsStaffPage } from './pages/pms/PmsStaffPage';
import { PmsSettingsPage } from './pages/pms/PmsSettingsPage';
import { PmsAuditLogsPage } from './pages/pms/PmsAuditLogsPage';

// Protected Route Component for PMS
const ProtectedPmsRoute: React.FC<{ children: React.ReactNode; allowedRoles?: string[] }> = ({ 
  children, 
  allowedRoles 
}) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-900 text-gold-400">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-gold-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="font-serif text-sm tracking-wider text-slate-300">Authenticating Operator Session...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/pms/login" replace />;
  }

  if (allowedRoles && user.role && !allowedRoles.includes(user.role)) {
    return <Navigate to="/pms/dashboard" replace />;
  }

  return <PmsLayout>{children}</PmsLayout>;
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <CurrencyProvider>
        <AuthProvider>
          <Routes>
            {/* PUBLIC ONLINE WEBSITE & BOOKING ENGINE */}
            <Route path="/" element={<HomePage />} />
            <Route path="/rooms" element={<RoomsPage />} />
            <Route path="/booking" element={<BookingPage />} />
            <Route path="/booking/confirmation/:bookingNumber" element={<BookingConfirmationPage />} />
            <Route path="/amenities" element={<AmenitiesPage />} />
            <Route path="/offers" element={<OffersPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />

            {/* IN-ROOM SMART GUEST PORTAL (QR CODE & OTP ACCESS) */}
            <Route path="/room/:roomNumber" element={<GuestRoomPortalPage />} />
            <Route path="/room-portal" element={<GuestRoomPortalPage />} />

            {/* PMS AUTHENTICATION */}
            <Route path="/pms/login" element={<PmsLoginPage />} />

            {/* PMS PROTECTED OPERATIONAL WORKSPACES */}
            <Route
              path="/pms"
              element={<Navigate to="/pms/dashboard" replace />}
            />
            <Route
              path="/pms/dashboard"
              element={
                <ProtectedPmsRoute>
                  <PmsDashboardPage />
                </ProtectedPmsRoute>
              }
            />
            <Route
              path="/pms/front-desk"
              element={
                <ProtectedPmsRoute allowedRoles={['SUPER_ADMIN', 'HOTEL_MANAGER', 'RECEPTIONIST']}>
                  <PmsFrontDeskPage />
                </ProtectedPmsRoute>
              }
            />
            <Route
              path="/pms/reservations"
              element={
                <ProtectedPmsRoute allowedRoles={['SUPER_ADMIN', 'HOTEL_MANAGER', 'RECEPTIONIST', 'ACCOUNTANT']}>
                  <PmsReservationsPage />
                </ProtectedPmsRoute>
              }
            />
            <Route
              path="/pms/calendar"
              element={
                <ProtectedPmsRoute allowedRoles={['SUPER_ADMIN', 'HOTEL_MANAGER', 'RECEPTIONIST']}>
                  <PmsTapeChartPage />
                </ProtectedPmsRoute>
              }
            />
            <Route
              path="/pms/rooms"
              element={
                <ProtectedPmsRoute allowedRoles={['SUPER_ADMIN', 'HOTEL_MANAGER', 'RECEPTIONIST', 'HOUSEKEEPING', 'MAINTENANCE']}>
                  <PmsRoomsPage />
                </ProtectedPmsRoute>
              }
            />
            <Route
              path="/pms/guests"
              element={
                <ProtectedPmsRoute allowedRoles={['SUPER_ADMIN', 'HOTEL_MANAGER', 'RECEPTIONIST']}>
                  <PmsGuestsPage />
                </ProtectedPmsRoute>
              }
            />
            <Route
              path="/pms/housekeeping"
              element={
                <ProtectedPmsRoute allowedRoles={['SUPER_ADMIN', 'HOTEL_MANAGER', 'HOUSEKEEPING', 'RECEPTIONIST']}>
                  <PmsHousekeepingPage />
                </ProtectedPmsRoute>
              }
            />
            <Route
              path="/pms/maintenance"
              element={
                <ProtectedPmsRoute allowedRoles={['SUPER_ADMIN', 'HOTEL_MANAGER', 'MAINTENANCE', 'HOUSEKEEPING', 'RECEPTIONIST']}>
                  <PmsMaintenancePage />
                </ProtectedPmsRoute>
              }
            />
            <Route
              path="/pms/restaurant"
              element={
                <ProtectedPmsRoute allowedRoles={['SUPER_ADMIN', 'HOTEL_MANAGER', 'RESTAURANT_STAFF']}>
                  <PmsRestaurantPage />
                </ProtectedPmsRoute>
              }
            />
            <Route
              path="/pms/billing"
              element={
                <ProtectedPmsRoute allowedRoles={['SUPER_ADMIN', 'HOTEL_MANAGER', 'ACCOUNTANT', 'RECEPTIONIST']}>
                  <PmsBillingPage />
                </ProtectedPmsRoute>
              }
            />
            <Route
              path="/pms/reports"
              element={
                <ProtectedPmsRoute allowedRoles={['SUPER_ADMIN', 'HOTEL_MANAGER', 'ACCOUNTANT']}>
                  <PmsReportsPage />
                </ProtectedPmsRoute>
              }
            />
            <Route
              path="/pms/staff"
              element={
                <ProtectedPmsRoute allowedRoles={['SUPER_ADMIN', 'HOTEL_MANAGER']}>
                  <PmsStaffPage />
                </ProtectedPmsRoute>
              }
            />
            <Route
              path="/pms/settings"
              element={
                <ProtectedPmsRoute allowedRoles={['SUPER_ADMIN', 'HOTEL_MANAGER']}>
                  <PmsSettingsPage />
                </ProtectedPmsRoute>
              }
            />
            <Route
              path="/pms/audit-logs"
              element={
                <ProtectedPmsRoute allowedRoles={['SUPER_ADMIN', 'HOTEL_MANAGER']}>
                  <PmsAuditLogsPage />
                </ProtectedPmsRoute>
              }
            />

            {/* FALLBACK REDIRECT */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </CurrencyProvider>
    </BrowserRouter>
  );
};

export default App;
