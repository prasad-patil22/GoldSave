import React, { useState } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Coins, Lock, ArrowLeft, RefreshCw } from 'lucide-react';

const ResetPassword = () => {
  const { token } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const roleParam = searchParams.get('role') === 'admin' ? 'admin' : 'customer';

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
      showToast('Password must be at least 6 characters long.', 'error');
      return;
    }

    if (password !== confirmPassword) {
      showToast('Passwords do not match.', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post(`/auth/reset-password/${token}`, { password, role: roleParam });
      if (response.data.success) {
        showToast('Password updated successfully! Please log in.', 'success');
        navigate('/login');
      } else {
        showToast(response.data.message, 'error');
      }
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to reset password.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center py-16 px-4 relative overflow-hidden font-sans">
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gold-500/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md glass-card rounded-2xl overflow-hidden shadow-2xl z-10 border border-gold-500/15">
        <div className="p-8 pb-4 text-center border-b border-slate-800 bg-slate-950/40">
          <div className="mx-auto w-14 h-14 rounded-full gold-btn-gradient flex items-center justify-center shadow-lg shadow-gold-500/20 mb-3">
            <Coins className="w-8 h-8 text-slate-950" />
          </div>
          <h2 className="text-xl font-bold tracking-wide text-slate-100 uppercase">Set New Password</h2>
          <p className="text-[10px] text-gold-500 font-semibold tracking-widest uppercase mt-1">
            Account recovery configuration
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
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2 tracking-wider">Confirm Password</label>
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
                  <span>Save Password</span>
                  <RefreshCw className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="text-center mt-6 pt-6 border-t border-slate-900">
            <Link to="/login" className="text-xs text-slate-400 hover:text-gold-400 font-semibold flex items-center justify-center gap-1.5 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Login</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
