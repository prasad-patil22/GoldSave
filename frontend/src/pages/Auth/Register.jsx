import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Coins, ArrowLeft, ArrowRight, User, Phone, Mail, Lock, MapPin, Calendar, Users } from 'lucide-react';

const Register = () => {
  const { register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    email: '',
    password: '',
    confirmPassword: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    dob: '',
    gender: 'Male',
    nomineeName: '',
    nomineeMobile: '',
  });

  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validations
    if (!formData.name || !formData.mobile || !formData.email || !formData.password) {
      showToast('Please fill in all required fields (Name, Mobile, Email, Password).', 'error');
      return;
    }

    if (formData.password.length < 6) {
      showToast('Password must be at least 6 characters long.', 'error');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      showToast('Passwords do not match.', 'error');
      return;
    }

    setSubmitting(true);
    const result = await register(formData);
    setSubmitting(false);

    if (result.success) {
      showToast('Registration successful! Welcome to Ganesh Jewellers.', 'success');
      navigate('/customer/dashboard');
    } else {
      showToast(result.message, 'error');
    }
  };

  return (
    <div className="flex items-center justify-center py-16 px-4 relative overflow-hidden font-sans">
      {/* Background Glow */}
      <div className="absolute top-10 left-10 w-96 h-96 bg-gold-500/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-gold-600/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-2xl glass-card rounded-2xl overflow-hidden shadow-2xl z-10 border border-gold-500/15">
        
        {/* Header */}
        <div className="p-6 text-center border-b border-slate-800 bg-slate-950/40 flex items-center justify-between">
          <Link to="/login" className="text-slate-400 hover:text-gold-400 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </Link>
          <div className="flex items-center gap-2">
            <Coins className="w-6 h-6 text-gold-500" />
            <span className="font-extrabold text-sm tracking-widest text-slate-100 uppercase">GANESH JEWELLERS</span>
          </div>
          <div className="w-12"></div> {/* spacer */}
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="text-center">
            <h2 className="text-xl font-bold text-slate-100">Create Savings Account</h2>
            <p className="text-xs text-slate-400 mt-1">Start saving for gold. Fill in your details below.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Primary Details */}
            <div className="space-y-4">
              <h3 className="text-xs font-extrabold text-gold-500 uppercase tracking-widest border-b border-slate-800 pb-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                <span>Primary Account details</span>
              </h3>
              
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Full Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter Full Name"
                  className="w-full bg-slate-950/80 border border-slate-800 focus:border-gold-500 text-slate-100 rounded-lg px-3 py-2 text-sm focus:outline-none transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Mobile Number *</label>
                <input
                  type="tel"
                  name="mobile"
                  value={formData.mobile}
                  onChange={handleChange}
                  placeholder="Enter 10-digit Mobile"
                  className="w-full bg-slate-950/80 border border-slate-800 focus:border-gold-500 text-slate-100 rounded-lg px-3 py-2 text-sm focus:outline-none transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Email Address *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="name@gmail.com"
                  className="w-full bg-slate-950/80 border border-slate-800 focus:border-gold-500 text-slate-100 rounded-lg px-3 py-2 text-sm focus:outline-none transition-colors"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Date of Birth</label>
                  <input
                    type="date"
                    name="dob"
                    value={formData.dob}
                    onChange={handleChange}
                    className="w-full bg-slate-950/80 border border-slate-800 focus:border-gold-500 text-slate-100 rounded-lg px-3 py-2 text-xs focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Gender</label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="w-full bg-slate-950/80 border border-slate-800 focus:border-gold-500 text-slate-100 rounded-lg px-3 py-2 text-xs focus:outline-none transition-colors"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Address and Security */}
            <div className="space-y-4">
              <h3 className="text-xs font-extrabold text-gold-500 uppercase tracking-widest border-b border-slate-800 pb-1 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" />
                <span>Address & Nominee</span>
              </h3>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Residential Address</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Street Address"
                  className="w-full bg-slate-950/80 border border-slate-800 focus:border-gold-500 text-slate-100 rounded-lg px-3 py-2 text-sm focus:outline-none transition-colors"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">City</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="City"
                    className="w-full bg-slate-950/80 border border-slate-800 focus:border-gold-500 text-slate-100 rounded-lg px-3 py-2 text-xs focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Pincode</label>
                  <input
                    type="text"
                    name="pincode"
                    value={formData.pincode}
                    onChange={handleChange}
                    placeholder="Pincode"
                    className="w-full bg-slate-950/80 border border-slate-800 focus:border-gold-500 text-slate-100 rounded-lg px-3 py-2 text-xs focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Nominee Name</label>
                  <input
                    type="text"
                    name="nomineeName"
                    value={formData.nomineeName}
                    onChange={handleChange}
                    placeholder="Nominee Name"
                    className="w-full bg-slate-950/80 border border-slate-800 focus:border-gold-500 text-slate-100 rounded-lg px-3 py-2 text-sm focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Nominee Mobile</label>
                  <input
                    type="tel"
                    name="nomineeMobile"
                    value={formData.nomineeMobile}
                    onChange={handleChange}
                    placeholder="Nominee Mobile"
                    className="w-full bg-slate-950/80 border border-slate-800 focus:border-gold-500 text-slate-100 rounded-lg px-3 py-2 text-sm focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">State</label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  placeholder="State Name"
                  className="w-full bg-slate-950/80 border border-slate-800 focus:border-gold-500 text-slate-100 rounded-lg px-3 py-2 text-sm focus:outline-none transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Password Security section */}
          <div className="space-y-4 pt-4 border-t border-slate-900">
            <h3 className="text-xs font-extrabold text-gold-500 uppercase tracking-widest flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" />
              <span>Password & Security</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Set Password *</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="At least 6 characters"
                  className="w-full bg-slate-950/80 border border-slate-800 focus:border-gold-500 text-slate-100 rounded-lg px-3 py-2 text-sm focus:outline-none transition-colors"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Confirm Password *</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Re-enter Password"
                  className="w-full bg-slate-950/80 border border-slate-800 focus:border-gold-500 text-slate-100 rounded-lg px-3 py-2 text-sm focus:outline-none transition-colors"
                  required
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full gold-btn-gradient text-slate-950 font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-gold-500/20 active:scale-95 transition-all duration-300 text-sm tracking-wider uppercase"
          >
            {submitting ? (
              <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <span>Register Account</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <p className="text-center text-xs text-slate-500 font-medium">
            Already have an account?{' '}
            <Link to="/login" className="text-gold-500 hover:text-gold-400 font-bold hover:underline">
              Sign In Here
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Register;
