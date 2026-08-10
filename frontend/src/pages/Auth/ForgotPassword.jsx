import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Coins, ArrowLeft, Mail, Send } from 'lucide-react';

const ForgotPassword = () => {
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();
  
  // Extract role from query param, default to customer
  const roleParam = searchParams.get('role') === 'admin' ? 'admin' : 'customer';

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email) {
      showToast('Please enter your email.', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/forgot-password', { email, role: roleParam });
      if (response.data.success) {
        showToast(response.data.message, 'success');
        setDone(true);
      } else {
        showToast(response.data.message, 'error');
      }
    } catch (error) {
      showToast(error.response?.data?.message || 'Password reset request failed.', 'error');
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
          <h2 className="text-xl font-bold tracking-wide text-slate-100 uppercase">Reset Password</h2>
          <p className="text-[10px] text-gold-500 font-semibold tracking-widest uppercase mt-1">
            {roleParam === 'admin' ? 'Admin Portal' : 'Customer Account'}
          </p>
        </div>

        <div className="p-8">
          {!done ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              <p className="text-xs text-slate-400 leading-relaxed text-center">
                Enter your email address below. If a corresponding account exists, we will email you a temporary password code to log in.
              </p>
              
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2 tracking-wider">Email Address</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    type="email"
                    placeholder="Enter account email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
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
                    <span>Send Temporary Code</span>
                    <Send className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <div className="text-center space-y-4 py-4">
              <div className="w-12 h-12 rounded-full bg-emerald-950 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400 text-xl font-bold">
                ✓
              </div>
              <h3 className="text-sm font-bold text-slate-200">Email Dispatched</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                If the email is associated with a {roleParam} account, a temporary password code has been sent. Please check your inbox and spam folder.
              </p>
            </div>
          )}

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

export default ForgotPassword;
