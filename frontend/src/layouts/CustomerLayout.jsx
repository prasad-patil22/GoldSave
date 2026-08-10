import React, { useState } from 'react';
import { Link, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Wallet, 
  History, 
  User as UserIcon, 
  KeyRound, 
  LogOut, 
  Menu, 
  X, 
  Coins 
} from 'lucide-react';

const CustomerLayout = ({ children }) => {
  const { user, logout, isTempPasswordActive } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  // If customer has a temporary password active, FORCE redirect to change password route
  if (isTempPasswordActive && location.pathname !== '/customer/change-password') {
    return <Navigate to="/customer/change-password" replace />;
  }

  const menuItems = [
    { name: 'Dashboard', path: '/customer/dashboard', icon: LayoutDashboard },
    { name: 'Add Money (Deposit)', path: '/customer/deposit', icon: Wallet },
    { name: 'Ledger History', path: '/customer/history', icon: History },
    { name: 'My Profile', path: '/customer/profile', icon: UserIcon },
    { name: 'Change Password', path: '/customer/change-password', icon: KeyRound },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col md:flex-row">
      
      {/* Mobile Top Navbar */}
      <div className="md:hidden flex justify-between items-center p-4 bg-slate-950 border-b border-gold-500/20 text-gold-500">
        <div className="flex items-center gap-2">
          <Coins className="w-6 h-6 animate-spin-slow" />
          <span className="font-bold tracking-wider text-md font-sans">GANESH JEWELLERS</span>
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
              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">Save Gold Customer</p>
            </div>
          </div>

          <div className="md:hidden flex justify-between items-center mb-6 px-2">
            <span className="text-gold-500 font-bold">Menu Options</span>
            <button onClick={() => setMobileOpen(false)} className="p-1 hover:bg-slate-800 rounded text-slate-400">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1.5">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              // If temporary password is active, we only allow access to change password
              if (isTempPasswordActive && item.path !== '/customer/change-password') {
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
            <p className="text-xs text-slate-500 font-medium">Customer ID</p>
            <p className="text-sm font-bold truncate text-gold-500">{user?.customerId}</p>
            <p className="text-xs font-semibold text-slate-300 mt-1 truncate">{user?.name}</p>
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
              {menuItems.find((item) => item.path === location.pathname)?.name || 'Gold Account'}
            </h2>
            <p className="text-xs text-slate-500">Manage savings balance and purchase jewelry</p>
          </div>

          <div className="flex items-center gap-4">
            {isTempPasswordActive && (
              <div className="bg-rose-950/30 border border-rose-500/30 text-rose-300 text-xs px-4 py-2 rounded-lg font-medium animate-pulse">
                Action Required: Update Temporary Password
              </div>
            )}
            <div className="bg-slate-900 border border-slate-800 px-4 py-2 rounded-lg flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-gold-500 animate-ping"></div>
              <span className="text-xs font-semibold text-slate-400">Save Gold Ledger API Online</span>
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
    </div>
  );
};

export default CustomerLayout;
