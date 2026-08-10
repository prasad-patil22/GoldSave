import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Coins, Lock, Mail, Phone, ArrowRight } from 'lucide-react';

const Login = () => {
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [role, setRole] = useState('customer'); // 'customer' or 'admin'
  const [identifier, setIdentifier] = useState(''); // email or mobile
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!identifier || !password) {
      showToast('Please fill in all fields.', 'error');
      return;
    }

    setSubmitting(true);
    const result = await login(identifier, password, role);
    setSubmitting(false);

    if (result.success) {
      showToast('Successfully logged in!', 'success');
      
      if (role === 'admin') {
        if (result.user.temporaryPassword) {
          navigate('/admin/change-password');
        } else {
          navigate('/admin/dashboard');
        }
      } else {
        if (result.user.temporaryPassword) {
          navigate('/customer/change-password');
        } else {
          navigate('/customer/dashboard');
        }
      }
    } else {
      showToast(result.message, 'error');
    }
  };

  return (
    <div className="flex items-center justify-center py-16 px-4 relative overflow-hidden font-sans">
      
      {/* Background Decorative Gradients */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gold-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-gold-600/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md glass-card rounded-2xl overflow-hidden shadow-2xl z-10 border border-gold-500/15">
        
        {/* Logo and Header */}
        <div className="p-8 pb-4 text-center border-b border-slate-800 bg-slate-950/40">
          <div className="mx-auto w-14 h-14 rounded-full gold-btn-gradient flex items-center justify-center shadow-lg shadow-gold-500/20 mb-3 animate-pulse">
            <Coins className="w-8 h-8 text-slate-950" />
          </div>
          <h2 className="text-2xl font-extrabold tracking-wide text-slate-100 uppercase">Ganesh Jewellers</h2>
          <p className="text-xs text-gold-500 font-semibold tracking-widest uppercase mt-1">Save Gold Ledger</p>
        </div>

        <div className="p-8">
          
          {/* Role Selection Tabs */}
          <div className="flex border-b border-slate-800 mb-6 bg-slate-950/60 rounded-lg p-1">
            <button
              onClick={() => { setRole('customer'); setIdentifier(''); }}
              className={`flex-1 py-2 text-center text-xs font-semibold uppercase tracking-wider rounded-md transition-all duration-300 ${
                role === 'customer'
                  ? 'gold-btn-gradient text-slate-950'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Customer
            </button>
            <button
              onClick={() => { setRole('admin'); setIdentifier(''); }}
              className={`flex-1 py-2 text-center text-xs font-semibold uppercase tracking-wider rounded-md transition-all duration-300 ${
                role === 'admin'
                  ? 'gold-btn-gradient text-slate-950'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Admin Portal
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2 tracking-wider">
                {role === 'admin' ? 'Email Address' : 'Email or Mobile Number'}
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  {role === 'admin' ? <Mail className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
                </span>
                <input
                  type={role === 'admin' ? 'email' : 'text'}
                  placeholder={role === 'admin' ? 'name@gmail.com' : 'Email or Mobile Number'}
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-800 focus:border-gold-500 text-slate-100 rounded-lg pl-10 pr-4 py-3 text-sm focus:outline-none transition-all duration-300 placeholder-slate-600"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Password</label>
                <Link
                  to={`/forgot-password?role=${role}`}
                  className="text-xs text-gold-500 hover:text-gold-400 hover:underline font-medium"
                >
                  Forgot?
                </Link>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  placeholder="Enter Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-800 focus:border-gold-500 text-slate-100 rounded-lg pl-10 pr-4 py-3 text-sm focus:outline-none transition-all duration-300 placeholder-slate-600"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full gold-btn-gradient text-slate-950 font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-gold-500/20 active:scale-95 transition-all duration-300 text-sm tracking-wider uppercase mt-6"
            >
              {submitting ? (
                <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Self Register link for customers only */}
          {role === 'customer' && (
            <div className="text-center mt-6 pt-6 border-t border-slate-900">
              <p className="text-xs text-slate-500 font-medium">
                Want to save gold?{' '}
                <Link to="/register" className="text-gold-500 hover:text-gold-400 font-bold hover:underline">
                  Register Account
                </Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
