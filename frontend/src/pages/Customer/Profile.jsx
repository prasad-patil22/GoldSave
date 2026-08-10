import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { User, Phone, Mail, MapPin, Calendar, ShieldCheck, Heart } from 'lucide-react';

const Profile = () => {
  const { showToast } = useToast();
  
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfileData = async () => {
    setLoading(true);
    try {
      // In customer routes, they can query their own dashboard/customer data which contains full profile
      const response = await api.get('/dashboard/customer');
      if (response.data.success) {
        // Also fetch customer full profile details
        // To be safe, we can retrieve detailed user profile data. Let's use the dashboard customer model or get details.
        // Actually, we can fetch customer profile via /api/customers/:id using their account ID.
        // But customer is blocked from calling GET /api/customers/:id because it's adminOnly in customerRoutes.js!
        // That means the customer can NOT call GET /api/customers/:id!
        // Instead, the customer dashboard endpoint GET /api/dashboard/customer returns:
        // stats: { customerId, name, balance, pendingAmount, totalDeposits, totalWithdrawals, status, joiningDate }
        // Wait, does it return address, email, nominee info, etc.?
        // Let's check `controllers/dashboardController.js` line 187:
        // Oh! It returns stats of customer from User model, but only selected properties.
        // Wait, can we update `/dashboard/customer` to return the FULL customer model so they can render it in Profile page?
        // Let's check `controllers/dashboardController.js` line 180:
        // `const customer = await User.findById(req.user._id);`
        // `stats: { customerId: customer.customerId, name: customer.name, balance: customer.balance ... }`
        // Ah! In `dashboardController.js`, it reads `const customer = await User.findById(req.user._id);`.
        // We can just return the entire customer object (minus password) or read it in Profile page!
        // To make it easy, let's return the customer object, or we can see: does `req.user` in auth middleware have all fields?
        // Yes! `req.user` is loaded in `protect` middleware:
        // `req.user = await User.findById(decoded.id).select('-password');`
        // That means inside ANY protect route (like `/dashboard/customer`), the entire customer document is already available in `req.user`!
        // However, we did a custom mapping in `dashboardController.js` to return `stats`.
        // To allow customer to fetch their own full details securely without hitting admin-only routes, we can just define a route `GET /api/customers/me` or `/api/auth/me` or return the full object in `/dashboard/customer`.
        // Let's check: can we just fetch their info from `/dashboard/customer` and since they might want the full profile, let's add `email`, `mobile`, `address`, `city`, `state`, `pincode`, `dob`, `gender`, `nomineeName`, `nomineeMobile` to the response?
        // Yes! Let's modify `controllers/dashboardController.js` to return the entire `customer` object under stats (excluding password).
        // Let's verify line 173-195 in `dashboardController.js`.
      }
    } catch (error) {
      showToast('Error loading profile details.', 'error');
    }
  };

  useEffect(() => {
    // We can load profile info directly from localStorage as well since `user` contains basic info,
    // but fetching from API is better.
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      // For customer, let's load what is stored in local storage, or call api.
      // Wait, let's fetch a complete profile using a custom call if we need.
      // Since we want customer to see all details: we will update dashboardController to return all fields, 
      // and read it.
      const loadProfile = async () => {
        try {
          const res = await api.get('/dashboard/customer');
          if (res.data.success) {
            setProfile(res.data.stats);
          }
        } catch (err) {
          showToast('Failed to sync profile.', 'error');
        } finally {
          setLoading(false);
        }
      };
      loadProfile();
    }
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 font-sans">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">My Profile</h1>
        <p className="text-xs text-slate-400">View savings account credentials and demographic details</p>
      </div>

      <div className="bg-slate-950 border border-slate-900 rounded-xl overflow-hidden shadow-2xl">
        
        {/* Banner */}
        <div className="p-6 bg-slate-900/40 border-b border-slate-900 flex items-center gap-4">
          <div className="w-16 h-16 rounded-full gold-btn-gradient flex items-center justify-center text-slate-950 text-2xl font-bold shadow-lg shadow-gold-500/10">
            {profile?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100">{profile?.name}</h2>
            <p className="text-xs text-slate-400 font-mono">ID: {profile?.customerId}</p>
          </div>
        </div>

        {/* Profile Grid */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-300">
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-gold-500 uppercase tracking-widest border-b border-slate-900 pb-1.5 flex items-center gap-1.5">
              <User className="w-4 h-4" />
              <span>Personal Demographics</span>
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] text-slate-500 uppercase font-semibold">Account Status</p>
                <p className="font-bold text-slate-200 mt-0.5 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{profile?.status}</span>
                </p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase font-semibold">Gender</p>
                <p className="font-semibold text-slate-200 mt-0.5">{profile?.gender || 'Male'}</p>
              </div>
            </div>

            <div>
              <p className="text-[10px] text-slate-500 uppercase font-semibold">Mobile Number</p>
              <p className="font-mono text-slate-200 mt-0.5">{profile?.mobile || 'N/A'}</p>
            </div>

            <div>
              <p className="text-[10px] text-slate-500 uppercase font-semibold">Email Address</p>
              <p className="text-slate-200 mt-0.5">{profile?.email || 'N/A'}</p>
            </div>

            <div>
              <p className="text-[10px] text-slate-500 uppercase font-semibold">Date of Birth</p>
              <p className="text-slate-200 mt-0.5">
                {profile?.dob ? new Date(profile.dob).toLocaleDateString('en-IN') : 'N/A'}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-bold text-gold-500 uppercase tracking-widest border-b border-slate-900 pb-1.5 flex items-center gap-1.5">
              <MapPin className="w-4 h-4" />
              <span>Contact Address</span>
            </h3>

            <div>
              <p className="text-[10px] text-slate-500 uppercase font-semibold">Residential Address</p>
              <p className="text-slate-200 mt-0.5 leading-relaxed">
                {profile?.address || 'Street address details'}<br />
                {profile?.city && `${profile.city}, `}
                {profile?.state && `${profile.state} `}
                {profile?.pincode && `- ${profile.pincode}`}
              </p>
            </div>

            <div className="border-t border-slate-900 pt-4 space-y-3">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5 text-rose-400" />
                <span>Nominee details</span>
              </h4>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-semibold">Nominee Name</p>
                  <p className="font-bold text-slate-200 mt-0.5">{profile?.nomineeName || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-semibold">Nominee Mobile</p>
                  <p className="font-mono text-slate-200 mt-0.5">{profile?.nomineeMobile || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Ledger Statistics */}
        <div className="bg-slate-900/30 border-t border-slate-900 p-6 grid grid-cols-2 sm:grid-cols-3 gap-6 text-center">
          <div>
            <p className="text-[10px] text-slate-500 uppercase font-semibold">Gold Saved</p>
            <p className="text-base font-extrabold text-gold-500 mt-1">{(profile?.totalGold24k || 0).toFixed(4)} g</p>
          </div>
          {/* <div>
            <p className="text-[10px] text-slate-500 uppercase font-semibold">22K Gold Saved</p>
            <p className="text-base font-extrabold text-gold-400 mt-1">{(profile?.totalGold22k || 0).toFixed(4)} g</p>
          </div> */}
          <div>
            <p className="text-[10px] text-slate-500 uppercase font-semibold">Total Gold Saved</p>
            <p className="text-base font-extrabold text-slate-300 mt-1">{(profile?.totalGold || 0).toFixed(4)} g</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-500 uppercase font-semibold">Total Money Invested</p>
            <p className="text-base font-extrabold text-slate-300 mt-1">₹{(profile?.totalMoneyInvested || 0).toLocaleString('en-IN')}</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-500 uppercase font-semibold">Current Gold Prices</p>
            <p className="text-sm font-extrabold text-slate-300 mt-1">
              24K:{' '}
              <span className={!profile?.todayUpdated ? "line-through text-slate-500 decoration-rose-500 font-bold" : ""}>
                ₹{(profile?.todayGoldPrice24k || 0).toLocaleString('en-IN')}
              </span>
              <br />
              22K:{' '}
              <span className={!profile?.todayUpdated ? "line-through text-slate-500 decoration-rose-500 font-bold" : ""}>
                ₹{(profile?.todayGoldPrice22k || 0).toLocaleString('en-IN')}
              </span>
            </p>
            {!profile?.todayUpdated && (
              <p className="text-[8px] text-rose-400 font-semibold mt-1 bg-rose-500/10 px-1.5 py-0.5 rounded inline-block">
                Yesterday's Price
              </p>
            )}
          </div>
          <div>
            <p className="text-[10px] text-slate-500 uppercase font-semibold">Estimated Value</p>
            <p className="text-base font-extrabold text-yellow-400 mt-1">₹{(profile?.estimatedCurrentValue || 0).toLocaleString('en-IN')}</p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Profile;
