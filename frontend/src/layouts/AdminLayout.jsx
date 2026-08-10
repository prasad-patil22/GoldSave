import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';
import { 
  LayoutDashboard, 
  Users, 
  Wallet, 
  BadgeIndianRupee, 
  FileSpreadsheet, 
  History, 
  LogOut, 
  Menu, 
  X, 
  Coins,
  TrendingUp,
  AlertCircle
} from 'lucide-react';

const AdminLayout = ({ children }) => {
  const { user, logout, isTempPasswordActive } = useAuth();
  const { showToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  // If admin has a temporary password active, FORCE redirect to change password route
  if (isTempPasswordActive && location.pathname !== '/admin/change-password') {
    return <Navigate to="/admin/change-password" replace />;
  }

  // Mandatory Daily Rate states
  const [todayUpdated, setTodayUpdated] = useState(true);
  const [showForceModal, setShowForceModal] = useState(false);
  const [latestRate, setLatestRate] = useState(null);
  const [goldPrice22k, setGoldPrice22k] = useState('');
  const [goldPrice24k, setGoldPrice24k] = useState('');
  const [submittingRate, setSubmittingRate] = useState(false);

  const fetchRateStatus = async () => {
    try {
      const response = await api.get('/gold-rates');
      if (response.data.success) {
        setLatestRate(response.data.goldRate);
        setTodayUpdated(response.data.todayUpdated);
        if (!response.data.todayUpdated) {
          setShowForceModal(true);
        } else {
          setShowForceModal(false);
        }
      }
    } catch (error) {
      console.error('Error fetching gold rate status:', error);
      // If error occurs (e.g. 404 when no rates exist in DB), force update is required
      setTodayUpdated(false);
      setShowForceModal(true);
    }
  };

  useEffect(() => {
    if (user && user.role === 'admin' && !isTempPasswordActive) {
      fetchRateStatus();
    }
  }, [location.pathname, user, isTempPasswordActive]);

  const handleForceUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!goldPrice22k || !goldPrice24k) {
      showToast("Please enter both 22K and 24K gold rates.", "error");
      return;
    }
    setSubmittingRate(true);
    try {
      const response = await api.put('/gold-rates', {
        goldPrice22k: parseFloat(goldPrice22k),
        goldPrice24k: parseFloat(goldPrice24k),
      });
      if (response.data.success) {
        showToast("Gold rates updated successfully.", "success");
        setShowForceModal(false);
        setTodayUpdated(true);
        // Reload page to apply changes
        window.location.reload();
      }
    } catch (error) {
      showToast(error.response?.data?.message || "Failed to update gold rates.", "error");
    } finally {
      setSubmittingRate(false);
    }
  };

  const menuItems = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Customers', path: '/admin/customers', icon: Users },
    { name: 'Pending Deposits', path: '/admin/deposits/pending', icon: Wallet },
    { name: 'Reports', path: '/admin/reports', icon: FileSpreadsheet },
    { name: 'Price History', path: '/admin/gold-price-history', icon: History },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col md:flex-row">
      
      {/* Mobile Top Header */}
      <div className="md:hidden flex justify-between items-center p-4 bg-slate-950 border-b border-gold-500/20 text-gold-500">
        <div className="flex items-center gap-2">
          <Coins className="w-6 h-6 text-gold-500 animate-pulse" />
          <span className="font-bold tracking-wider font-sans text-lg">GANESH JEWELLERS</span>
        </div>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="p-1 hover:bg-slate-800 rounded">
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-slate-950 border-r border-gold-500/10 flex flex-col justify-between p-4 transition-transform duration-300 md:translate-x-0 md:static md:h-screen
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div>
          {/* Logo and Brand */}
          <div className="hidden md:flex items-center gap-3 py-6 px-2 border-b border-slate-800 mb-6">
            <div className="w-10 h-10 rounded-full gold-btn-gradient flex items-center justify-center shadow-lg shadow-gold-500/20">
              <Coins className="w-6 h-6 text-slate-950" />
            </div>
            <div>
              <h1 className="font-extrabold text-gold-500 text-sm tracking-wider font-sans">GANESH JEWELLERS</h1>
              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">Save Gold Admin</p>
            </div>
          </div>

          <div className="md:hidden flex justify-between items-center mb-6 px-2">
            <span className="text-gold-500 font-bold">Admin Menu</span>
            <button onClick={() => setMobileOpen(false)} className="p-1 hover:bg-slate-800 rounded text-slate-400">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1.5">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              if (isTempPasswordActive) {
                return null;
              }
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200
                    ${isActive 
                      ? 'bg-gold-500 text-slate-950 font-semibold shadow-md shadow-gold-500/20' 
                      : 'text-slate-400 hover:text-gold-400 hover:bg-slate-900/60'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Info / Logout */}
        <div className="border-t border-slate-800 pt-4 flex flex-col gap-3">
          <div className="px-2">
            <p className="text-xs text-slate-500 font-medium">Logged in as</p>
            <p className="text-sm font-semibold truncate text-slate-200">{user?.name || 'Administrator'}</p>
            <p className="text-[11px] text-gold-500/80 truncate font-mono">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium text-rose-400 hover:bg-rose-950/20 transition-all duration-200"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto bg-[#0b0f19]">
        {/* Top Navbar */}
        <header className="hidden md:flex justify-between items-center px-8 py-5 bg-slate-950 border-b border-gold-500/10">
          <div>
            <h2 className="text-lg font-bold text-slate-100 font-sans">
              {menuItems.find((item) => item.path === location.pathname)?.name || 'Admin Area'}
            </h2>
            <p className="text-xs text-slate-500">Ganesh Jewellers Save Gold Scheme Control Panel</p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="bg-slate-900 border border-slate-800 px-4 py-2 rounded-lg flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></div>
              <span className="text-xs font-semibold text-slate-400">Ledger Server Online</span>
            </div>
          </div>
        </header>

        {/* Dynamic page container */}
        <div className="flex-1 p-6 md:p-8">
          {children}
        </div>
      </main>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div 
          onClick={() => setMobileOpen(false)} 
          className="fixed inset-0 z-40 bg-black/60 md:hidden backdrop-blur-sm"
        />
      )}

      {/* Fullscreen Force Gold Rate Update Modal */}
      {showForceModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
          <div className="w-full max-w-md bg-slate-900 border border-gold-500/20 rounded-2xl p-8 shadow-2xl space-y-6 animate-scale-in">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 rounded-full gold-btn-gradient flex items-center justify-center mx-auto shadow-lg shadow-gold-500/20 mb-4 animate-bounce">
                <Coins className="w-8 h-8 text-slate-950" />
              </div>
              <h3 className="text-lg font-bold text-gold-500 uppercase tracking-widest">
                Action Required: Daily Gold Price
              </h3>
              <p className="text-xs text-slate-400">
                Today's gold prices have not been set. Updating daily rates is mandatory before accessing administrative tools.
              </p>
            </div>

            {latestRate && (
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs space-y-2">
                <p className="font-bold text-slate-300 border-b border-slate-800 pb-1.5 mb-1.5 uppercase tracking-wider text-[10px]">
                  Reference (Last Update: {latestRate.date})
                </p>
                <div className="flex justify-between">
                  <span className="text-slate-400">Yesterday's 24K Price:</span>
                  <span className="font-bold text-gold-500">₹{latestRate.goldPrice24k.toLocaleString('en-IN')} / g</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Yesterday's 22K Price:</span>
                  <span className="font-bold text-gold-400">₹{latestRate.goldPrice22k.toLocaleString('en-IN')} / g</span>
                </div>
              </div>
            )}

            <form onSubmit={handleForceUpdateSubmit} className="space-y-4">
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Today's 24K Gold Price (₹ / gram) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g. 7850"
                    value={goldPrice24k}
                    onChange={(e) => setGoldPrice24k(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-gold-500 text-slate-100 rounded-lg px-4 py-2.5 text-xs focus:outline-none"
                    required
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Today's 22K Gold Price (₹ / gram) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g. 7200"
                    value={goldPrice22k}
                    onChange={(e) => setGoldPrice22k(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-gold-500 text-slate-100 rounded-lg px-4 py-2.5 text-xs focus:outline-none"
                    required
                    min="1"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex-1 px-4 py-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-rose-400 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors"
                >
                  Sign Out
                </button>
                <button
                  type="submit"
                  disabled={submittingRate}
                  className="flex-1 px-4 py-2.5 gold-btn-gradient text-slate-950 font-bold rounded-lg text-xs uppercase tracking-wider transition-all hover:shadow-lg flex items-center justify-center gap-2"
                >
                  {submittingRate ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                      <span>Updating...</span>
                    </>
                  ) : (
                    <span>Update Price</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLayout;
