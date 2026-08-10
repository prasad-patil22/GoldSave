import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';
import { KeyRound, Lock, Save } from 'lucide-react';

const ChangePassword = () => {
  const { updatePasswordSession } = useAuth();
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
      const response = await api.post('/auth/customer/change-temp-password', { newPassword: password });
      
      if (response.data.success) {
        showToast('Password updated successfully!', 'success');
        updatePasswordSession(false); // Update state to enable access
        navigate('/customer/dashboard');
      } else {
        showToast(response.data.message, 'error');
      }
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to change password.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-6 font-sans">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Update Credentials</h1>
        <p className="text-xs text-slate-400">Change your savings account password. Choose a secure, memorable phrase.</p>
      </div>

      <div className="bg-slate-950 border border-slate-900 rounded-xl p-6 shadow-2xl">
        <h3 className="text-xs font-bold text-gold-500 uppercase tracking-widest border-b border-slate-900 pb-2 flex items-center gap-1.5 mb-5">
          <KeyRound className="w-4 h-4" />
          <span>Change Account Password</span>
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">New Password *</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type="password"
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 focus:border-gold-500 text-slate-100 rounded-lg pl-10 pr-3 py-2 text-xs focus:outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Confirm New Password *</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type="password"
                placeholder="Re-enter password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 focus:border-gold-500 text-slate-100 rounded-lg pl-10 pr-3 py-2 text-xs focus:outline-none"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full gold-btn-gradient text-slate-950 font-bold py-2.5 px-4 rounded-lg flex items-center justify-center gap-1.5 hover:shadow-lg hover:shadow-gold-500/10 transition-all uppercase text-xs tracking-wider"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save New Password</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChangePassword;
