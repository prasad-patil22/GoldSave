import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';

// Layout wrappers
import AdminLayout from './layouts/AdminLayout';
import CustomerLayout from './layouts/CustomerLayout';
import GuestLayout from './layouts/GuestLayout';

// Auth Pages
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import ForgotPassword from './pages/Auth/ForgotPassword';
import ResetPassword from './pages/Auth/ResetPassword';
import ForcePasswordChange from './pages/Auth/ForcePasswordChange';

// Admin Pages
import AdminDashboard from './pages/Admin/Dashboard';
import CustomersList from './pages/Admin/Customers';
import CustomerProfile from './pages/Admin/CustomerProfile';
import PendingDeposits from './pages/Admin/PendingDeposits';
import ReportsPage from './pages/Admin/Reports';
import PriceHistory from './pages/Admin/PriceHistory';

// Customer Pages
import CustomerDashboard from './pages/Customer/Dashboard';
import RequestDeposit from './pages/Customer/RequestDeposit';
import CustomerHistory from './pages/Customer/History';
import CustomerProfileDetails from './pages/Customer/Profile';
import CustomerChangePassword from './pages/Customer/ChangePassword';
import LandingPage from './pages/Public/LandingPage';

// Route Guards
const AdminRoute = ({ children }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/customer/dashboard" replace />;

  return <AdminLayout>{children}</AdminLayout>;
};

const CustomerRoute = ({ children }) => {
  const { isAuthenticated, isCustomer, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isCustomer) return <Navigate to="/admin/dashboard" replace />;

  return <CustomerLayout>{children}</CustomerLayout>;
};

// Root index redirect based on authentication status
const RootRedirect = () => {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  
  return isAdmin 
    ? <Navigate to="/admin/dashboard" replace /> 
    : <Navigate to="/customer/dashboard" replace />;
};

const NotFound = () => (
  <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
    <span className="text-4xl">🪙</span>
    <h1 className="text-3xl font-extrabold text-slate-100 tracking-wider uppercase mt-4">Page Not Found</h1>
    <p className="text-xs text-slate-500 max-w-sm mt-2">The gold ledger page you are looking for does not exist or has been moved.</p>
    <Link to="/" className="mt-6 px-5 py-2.5 gold-btn-gradient text-slate-950 font-bold rounded-lg text-xs uppercase tracking-wider transition-all">
      Return Home
    </Link>
  </div>
);

// Link export for NotFound page
import { Link } from 'react-router-dom';

function App() {
  return (
    <Router>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<GuestLayout><LandingPage /></GuestLayout>} />
            <Route path="/login" element={<GuestLayout><Login /></GuestLayout>} />
            <Route path="/register" element={<GuestLayout><Register /></GuestLayout>} />
            <Route path="/forgot-password" element={<GuestLayout><ForgotPassword /></GuestLayout>} />
            <Route path="/reset-password/:token" element={<GuestLayout><ResetPassword /></GuestLayout>} />

            {/* Admin Portal Protected Routes */}
            <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
            <Route path="/admin/customers" element={<AdminRoute><CustomersList /></AdminRoute>} />
            <Route path="/admin/customers/:id" element={<AdminRoute><CustomerProfile /></AdminRoute>} />
            <Route path="/admin/deposits/pending" element={<AdminRoute><PendingDeposits /></AdminRoute>} />
            <Route path="/admin/reports" element={<AdminRoute><ReportsPage /></AdminRoute>} />
            <Route path="/admin/gold-price-history" element={<AdminRoute><PriceHistory /></AdminRoute>} />
            <Route path="/admin/change-password" element={<AdminRoute><ForcePasswordChange /></AdminRoute>} />

            {/* Customer Portal Protected Routes */}
            <Route path="/customer/dashboard" element={<CustomerRoute><CustomerDashboard /></CustomerRoute>} />
            <Route path="/customer/deposit" element={<CustomerRoute><RequestDeposit /></CustomerRoute>} />
            <Route path="/customer/history" element={<CustomerRoute><CustomerHistory /></CustomerRoute>} />
            <Route path="/customer/profile" element={<CustomerRoute><CustomerProfileDetails /></CustomerRoute>} />
            
            {/* Customer Change password routes - does not load full CustomerLayout redirect guard */}
            <Route path="/customer/change-password" element={
              <CustomerRoute>
                <CustomerChangePassword />
              </CustomerRoute>
            } />

            {/* 404 Route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </Router>
  );
}

export default App;
