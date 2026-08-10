import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';
import { ShieldAlert, Lock, Save, LogOut } from 'lucide-react';

const ForcePasswordChange = () => {
  const { user, logout, updatePasswordSession } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!password || !confirmPassword) {
      showToast('Please fill in all fields.', 'error');
      return;
    }

    if (password.length < 6) {
      showToast('New password must be at least 6 characters long.', 'error');
      return;
    }

    if (password !== confirmPassword) {
      showToast('Passwords do not match.', 'error');
      return;
    }

    setLoading(true);
    try {
      const endpoint = user?.role === 'admin' 
        ? '/auth/admin/change-temp-password' 
        : '/auth/customer/change-temp-password';
      
      const response = await api.post(endpoint, { newPassword: password });
      
      if (response.data.success) {
        showToast('Password updated successfully! Welcome to your dashboard.', 'success');
        updatePasswordSession(false); // Clear temporaryPassword flag in context and local storage
        
        const redirectPath = user?.role === 'admin' 
          ? '/admin/dashboard' 
          : '/customer/dashboard';
        navigate(redirectPath);
      } else {
        showToast(response.data.message, 'error');
      }
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to update password.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#070b13] flex items-center justify-center p-4 relative overflow-hidden font-sans">
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-rose-500/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md glass-card rounded-2xl overflow-hidden shadow-2xl z-10 border border-gold-500/10">
        
        {/* Banner Alert */}
        <div className="p-8 pb-4 text-center border-b border-slate-800 bg-slate-950/40">
          <div className="mx-auto w-14 h-14 rounded-full bg-rose-950/50 border border-rose-500/30 flex items-center justify-center mb-3 text-rose-400">
            <ShieldAlert className="w-8 h-8 animate-bounce" />
          </div>
          <h2 className="text-xl font-bold tracking-wide text-slate-100">Update Password</h2>
          <p className="text-xs text-slate-400 mt-1">
            Welcome, <span className="font-semibold text-gold-500">{user?.name}</span>. You must change your temporary password to secure your account.
          </p>
        </div>

        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2 tracking-wider">New Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  placeholder="Min 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-800 focus:border-gold-500 text-slate-100 rounded-lg pl-10 pr-4 py-3 text-sm focus:outline-none transition-colors placeholder-slate-600"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2 tracking-wider">Confirm New Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-800 focus:border-gold-500 text-slate-100 rounded-lg pl-10 pr-4 py-3 text-sm focus:outline-none transition-colors placeholder-slate-600"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full gold-btn-gradient text-slate-950 font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-gold-500/20 active:scale-95 transition-all duration-300 text-sm tracking-wider uppercase"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>Secure My Account</span>
                  <Save className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="text-center mt-6 pt-6 border-t border-slate-900">
            <button
              onClick={handleLogout}
              className="text-xs text-rose-400 hover:text-rose-300 font-semibold flex items-center justify-center gap-1.5 mx-auto transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Cancel & Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForcePasswordChange;
