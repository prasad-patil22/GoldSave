import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { 
  Coins, 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  ShieldCheck, 
  TrendingUp, 
  Sparkles, 
  ArrowRight,
  MessageSquare,
  BadgePercent,
  AlertCircle
} from 'lucide-react';

const LandingPage = () => {
  const { isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [rates, setRates] = useState(null);
  const [todayUpdated, setTodayUpdated] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRates = async () => {
      try {
        const response = await api.get('/gold-rates');
        if (response.data.success) {
          setRates(response.data.goldRate);
          setTodayUpdated(response.data.todayUpdated);
        }
      } catch (error) {
        console.error('Failed to load gold rates:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchRates();
  }, []);

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div>
      
      {/* 2. Hero Section */}
      <section className="relative overflow-hidden py-20 lg:py-32 px-6 border-b border-slate-900 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(212,175,55,0.08),rgba(255,255,255,0))]">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          {/* Left Hero Text */}
          <div className="space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gold-500/10 border border-gold-500/20 text-gold-500 text-[10px] font-bold uppercase tracking-widest rounded-full">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Ganesh Jewellers Gold Savings Scheme</span>
            </div>
            
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight text-slate-100 uppercase">
              Smart Gold Savings. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-400 via-gold-500 to-amber-500">
                Simplified.
              </span>
            </h1>

            <p className="text-sm text-slate-400 max-w-xl mx-auto lg:mx-0 leading-relaxed">
              Deposit cash or online funds to save gold balance securely. Monitor your ledger in real-time, get instant WhatsApp update notifications, and redeem your savings easily for jewellery at our store.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-4">
              <Link 
                to={isAuthenticated ? (isAdmin ? "/admin/dashboard" : "/customer/dashboard") : "/register"}
                className="px-6 py-3.5 gold-btn-gradient text-slate-950 font-bold rounded-lg text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-gold-500/20 active:scale-95 transition-all"
              >
                <span>Start Saving Gold Now</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a 
                href="#rates"
                className="px-6 py-3.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-gold-500 text-slate-300 font-bold rounded-lg text-xs uppercase tracking-wider text-center transition-all"
              >
                View Live Gold Rates
              </a>
            </div>
          </div>

          {/* Right Hero Live Rates Preview */}
          <div id="rates" className="w-full max-w-md mx-auto bg-slate-950 border border-slate-900 p-6 rounded-2xl shadow-2xl relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gold-500/5 rounded-full blur-3xl pointer-events-none"></div>
            
            <div className="border-b border-slate-900 pb-4 mb-6 text-center">
              <h3 className="text-xs font-bold text-gold-500 uppercase tracking-widest flex items-center justify-center gap-1.5">
                <TrendingUp className="w-4 h-4" />
                <span>Today's Live Gold Rates</span>
              </h3>
              <p className="text-[10px] text-slate-500 mt-1 uppercase font-semibold">Updated daily based on bullion index</p>
            </div>

            {loading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3">
                <div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-[10px] text-slate-500 uppercase font-semibold tracking-wider">Fetching Rates...</span>
              </div>
            ) : rates ? (
              <div className="space-y-5">
                
                {!todayUpdated && (
                  <div className="p-4 bg-amber-500/10 border border-amber-500/20 text-amber-300 rounded-xl text-xs flex gap-2.5 leading-relaxed items-start">
                    <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-slate-100 mb-0.5">Today's Gold Price Pending Update</p>
                      <p className="text-[10px] text-slate-400">
                        Current displayed gold price is yesterday's price. Today's gold price will be updated by the administrator soon. New deposits will use the gold price active at the time the deposit is approved or entered by the admin.
                      </p>
                    </div>
                  </div>
                )}

                {/* Gold Rate Cards */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-900/40 border border-slate-900 rounded-xl hover:border-gold-500/20 transition-colors">
                    <p className="text-[10px] text-gold-400 font-bold uppercase tracking-widest">22K Gold Price</p>
                    <p className="text-lg font-black text-slate-100 mt-2">₹{(rates.goldPrice22k || 0).toLocaleString('en-IN')}</p>
                    <p className="text-[9px] text-slate-500 uppercase mt-0.5">Per 1 gram</p>
                  </div>
                  <div className="p-4 bg-slate-900/40 border border-slate-900 rounded-xl hover:border-gold-500/20 transition-colors">
                    <p className="text-[10px] text-gold-500 font-bold uppercase tracking-widest">24K Gold Price</p>
                    <p className="text-lg font-black text-slate-100 mt-2">₹{(rates.goldPrice24k || 0).toLocaleString('en-IN')}</p>
                    <p className="text-[9px] text-slate-500 uppercase mt-0.5">Per 1 gram</p>
                  </div>
                </div>

                <div className="pt-2 text-center text-[9px] text-slate-500 font-medium space-y-1">
                  <div>Rate Feed Updated Date: {rates.date}</div>
                  <div>Last Updated Time: {new Date(rates.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div>
                </div>

              </div>
            ) : (
              <div className="py-8 text-center text-xs text-slate-500 italic">
                Could not load live rates. Please visit the store for current market prices.
              </div>
            )}
          </div>

        </div>
      </section>

      {/* About Us Section */}
      <section id="about" className="py-20 px-6 border-b border-slate-900 max-w-6xl mx-auto scroll-mt-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Narrative Column */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gold-500/10 border border-gold-500/20 text-gold-500 text-[10px] font-bold uppercase tracking-widest rounded-full">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Our Heritage</span>
            </div>
            
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-100 uppercase tracking-wider">
              A Legacy of Purity <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-400 to-amber-500">
                & Over 40 Years of Trust
              </span>
            </h2>
            
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Established in 1985 in the heart of Bengaluru, Ganesh Jewellers has been a hallmark of trust, craftsmanship, and pure gold values. For over four decades, we have been helping families save for their most precious milestones, building relationships that span generations.
            </p>
            
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Our Save Gold Scheme is designed to make gold accumulation simple, secure, and modern. By blending traditional savings concepts with an advanced digital ledger system, we offer a transparent pathway to accumulate gold weight, backed completely by physical store reserves.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gold-500/10 flex items-center justify-center text-gold-500 shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">100% BIS Hallmarked</h4>
                  <p className="text-[10px] text-slate-500 mt-0.5">Assured purity on redemption</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gold-500/10 flex items-center justify-center text-gold-500 shrink-0">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Real-time Rates</h4>
                  <p className="text-[10px] text-slate-500 mt-0.5">Fair, market-backed pricing</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Statistics / Visual Grid Card Column */}
          <div className="lg:col-span-5">
            <div className="relative">
              {/* Glow backdrops */}
              <div className="absolute -inset-1.5 bg-gradient-to-r from-gold-500 to-amber-500 rounded-2xl blur opacity-20 transition-all duration-300"></div>
              
              <div className="relative bg-slate-950 border border-slate-900/60 p-8 rounded-2xl shadow-2xl space-y-6">
                <h3 className="text-xs font-bold text-gold-500 uppercase tracking-widest border-b border-slate-900 pb-3">
                  Ganesh Jewellers by the Numbers
                </h3>

                <div className="space-y-6">
                  {/* Metric 1 */}
                  <div className="flex items-center justify-between border-b border-slate-900/60 pb-4">
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Years of Legacy</p>
                      <p className="text-xs text-slate-300 mt-0.5 font-medium">Serving since 1985</p>
                    </div>
                    <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-gold-400 to-gold-600">40+</span>
                  </div>

                  {/* Metric 2 */}
                  <div className="flex items-center justify-between border-b border-slate-900/60 pb-4">
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Active Gold Savers</p>
                      <p className="text-xs text-slate-300 mt-0.5 font-medium">Trusting our digital ledger</p>
                    </div>
                    <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-gold-400 to-gold-600">10,000+</span>
                  </div>

                  {/* Metric 3 */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Purity Guarantee</p>
                      <p className="text-xs text-slate-300 mt-0.5 font-medium">BIS Government Certified</p>
                    </div>
                    <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-gold-400 to-gold-600">100%</span>
                  </div>
                </div>

                <div className="pt-2">
                  <div className="p-3 bg-slate-900/30 border border-slate-900 rounded-xl text-center">
                    <p className="text-[9px] text-slate-500 uppercase tracking-widest font-semibold leading-relaxed">
                      Visit our showroom on Commercial Street, Bengaluru to experience our gold jewelry collection in person.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 3. Features Section */}
      <section id="features" className="py-20 px-6 border-b border-slate-900 max-w-6xl mx-auto scroll-mt-20">
        <div className="text-center space-y-3 mb-16">
          <h2 className="text-2xl font-bold text-slate-100 uppercase tracking-wider">Why Save Gold With Us?</h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto">A secure, modern, and transparent ledger system built to help you grow your wealth.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Feature 1 */}
          <div className="bg-slate-950 border border-slate-900 rounded-2xl p-6 text-center space-y-4 hover:border-gold-500/20 transition-all group">
            <div className="mx-auto w-12 h-12 rounded-xl bg-gold-500/10 flex items-center justify-center text-gold-500 group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-200">Secure Ledger Account</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Every deposit and purchase deduction is recorded in our unified transaction ledger. Your gold balance is always secure and backed by pure store reserves.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-slate-950 border border-slate-900 rounded-2xl p-6 text-center space-y-4 hover:border-gold-500/20 transition-all group">
            <div className="mx-auto w-12 h-12 rounded-xl bg-gold-500/10 flex items-center justify-center text-gold-500 group-hover:scale-110 transition-transform">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-200">WhatsApp Alert Notifications</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Never lose track of your records. Receive real-time WhatsApp updates containing your balance changes, deposit approvals, and transaction details directly.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-slate-950 border border-slate-900 rounded-2xl p-6 text-center space-y-4 hover:border-gold-500/20 transition-all group">
            <div className="mx-auto w-12 h-12 rounded-xl bg-gold-500/10 flex items-center justify-center text-gold-500 group-hover:scale-110 transition-transform">
              <BadgePercent className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-200">Flexible Redemptions</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Accumulate savings over time and redeem your total balance for gold ornaments, coins, or premium jewellery items at our local branch anytime.
            </p>
          </div>

        </div>
      </section>

      {/* 4. Contact Details Section */}
      <section id="contact" className="py-20 px-6 max-w-6xl mx-auto scroll-mt-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          {/* Shop information */}
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-100 uppercase tracking-wider">Contact Our Store</h2>
              <p className="text-xs text-slate-400 mt-2">Get in touch or visit our local showroom coordinates</p>
            </div>

            <div className="flex flex-col gap-4 text-xs text-slate-300">
              
              {/* Address */}
              <div className="flex gap-4 items-start bg-slate-900/20 border border-slate-900 p-4 rounded-xl">
                <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-gold-500 shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-slate-200 uppercase tracking-wider mb-1">Our Showroom Address</p>
                  <p className="text-slate-400 leading-relaxed uppercase">
                    Ganesh Jewellers Ltd,<br />
                    45 Gold Palace Towers, Commercial Street,<br />
                    Tasker Town, Shivaji Nagar,<br />
                    Bengaluru, Karnataka - 560001
                  </p>
                </div>
              </div>

              {/* Phone */}
              <div className="flex gap-4 items-start bg-slate-900/20 border border-slate-900 p-4 rounded-xl">
                <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-gold-500 shrink-0">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-slate-200 uppercase tracking-wider mb-1">Phone Number</p>
                  <p className="text-slate-400 font-bold select-all tracking-wider">+91 80 4912 3456</p>
                  <p className="text-slate-500 text-[10px] mt-0.5">Call or WhatsApp</p>
                </div>
              </div>

              {/* Email */}
              <div className="flex gap-4 items-start bg-slate-900/20 border border-slate-900 p-4 rounded-xl">
                <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-gold-500 shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-slate-200 uppercase tracking-wider mb-1">Email Address</p>
                  <p className="text-slate-400 font-bold select-all">contact.blr@ganeshjewellers.com</p>
                  <p className="text-slate-500 text-[10px] mt-0.5">Inquiries & Support</p>
                </div>
              </div>

              {/* Working Hours */}
              <div className="flex gap-4 items-start bg-slate-900/20 border border-slate-900 p-4 rounded-xl">
                <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-gold-500 shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-slate-200 uppercase tracking-wider mb-1">Working Hours</p>
                  <p className="text-slate-400">Monday - Saturday &bull; 10:00 AM - 08:30 PM</p>
                  <p className="text-slate-500 text-[10px] mt-0.5">Showroom remains closed on Sundays</p>
                </div>
              </div>

            </div>
          </div>
          {/* Map display representation with custom styled dark gold Google map */}
          <div className="bg-slate-950 border border-slate-900 rounded-2xl shadow-xl h-80 relative overflow-hidden flex items-center justify-center">
            {/* Themed Google Map using CSS filter */}
            <div className="absolute inset-0 w-full h-full filter grayscale invert-[0.9] sepia-[0.45] hue-rotate-[325deg] saturate-[180%] contrast-[1.15]">
              <iframe 
                title="Ganesh Jewellers Bengaluru Showroom Map"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3887.8936746824987!2d77.6094627757279!3d12.97864831471714!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bae1679904ee33f%3A0xe54d6faeb43d9ab0!2sCommercial%20St%2C%20Tasker%20Town%2C%20Shivaji%20Nagar%2C%20Bengaluru%2C%20Karnataka%20560001!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin"
                width="100%" 
                height="100%" 
                style={{ border: 0 }} 
                allowFullScreen="" 
                loading="lazy" 
                referrerPolicy="no-referrer-when-downgrade"
                className="absolute inset-0 w-full h-full"
              ></iframe>
            </div>
            
            {/* Minimal overlay elements to highlight map marker point */}
            <div className="absolute bottom-4 left-4 z-10 bg-slate-950/95 border border-gold-500/25 px-3.5 py-2 rounded-xl flex items-center gap-2 shadow-2xl backdrop-blur-sm pointer-events-none">
              <div className="w-2 h-2 rounded-full bg-gold-500 animate-ping"></div>
              <span className="text-[10px] font-bold text-slate-100 uppercase tracking-widest">Commercial Street, Bengaluru</span>
            </div>
          </div>

        </div>
      </section>

    </div>
  );
};

export default LandingPage;
