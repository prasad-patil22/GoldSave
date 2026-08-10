import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { 
  Users, 
  Coins, 
  ArrowUpRight, 
  Hourglass, 
  CalendarDays, 
  TrendingUp, 
  RefreshCw,
  X,
  AlertCircle
} from 'lucide-react';
import DoubleConfirmModal from '../../components/DoubleConfirmModal';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';

const Dashboard = () => {
  const { showToast } = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Gold Rates State
  const [goldRate, setGoldRate] = useState(null);
  const [rateModalOpen, setRateModalOpen] = useState(false);
  const [blockModalOpen, setBlockModalOpen] = useState(false);
  const [goldPrice22kInput, setGoldPrice22kInput] = useState('');
  const [goldPrice24kInput, setGoldPrice24kInput] = useState('');
  const [submittingRate, setSubmittingRate] = useState(false);

  // Confirm Modal State
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmMessage, setConfirmMessage] = useState('');
  const [confirmActionType, setConfirmActionType] = useState('warning');

  const fetchGoldRates = async () => {
    try {
      const response = await api.get('/gold-rates');
      if (response.data.success) {
        setGoldRate(response.data.goldRate);
        setGoldPrice22kInput(response.data.goldRate?.goldPrice22k || '');
        setGoldPrice24kInput(response.data.goldRate?.goldPrice24k || '');
        if (!response.data.todayUpdated) {
          setBlockModalOpen(true);
        } else {
          setBlockModalOpen(false);
        }
      }
    } catch (error) {
      console.error('Failed to fetch gold rates:', error);
      // If error occurs (e.g. 404 when no rates exist in DB), force update is required
      setBlockModalOpen(true);
    }
  };

  const fetchDashboardStats = async () => {
    setLoading(true);
    try {
      const response = await api.get('/dashboard/admin');
      if (response.data.success) {
        setData(response.data);
      } else {
        showToast('Failed to load dashboard statistics.', 'error');
      }
      await fetchGoldRates();
    } catch (error) {
      showToast('Network error loading dashboard statistics.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRates = async (e) => {
    e.preventDefault();
    if (!goldPrice22kInput || !goldPrice24kInput) {
      showToast('Please enter both 22K and 24K gold rates.', 'error');
      return;
    }
    
    setSubmittingRate(true);
    try {
      const response = await api.put('/gold-rates', {
        goldPrice22k: goldPrice22kInput,
        goldPrice24k: goldPrice24kInput,
      });
      if (response.data.success) {
        showToast('Gold prices updated successfully.', 'success');
        setGoldRate(response.data.goldRate);
        setBlockModalOpen(false);
        setRateModalOpen(false);
        // Refresh dashboard metrics
        const statsResponse = await api.get('/dashboard/admin');
        if (statsResponse.data.success) {
          setData(statsResponse.data);
        }
      }
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to update gold prices.', 'error');
    } finally {
      setSubmittingRate(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-gold-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Syncing Ledger Data...</p>
        </div>
      </div>
    );
  }

  const stats = data?.stats || {};
  const recentTransactions = data?.recentTransactions || [];
  const collectionChartData = data?.charts?.collectionTrend || [];
  const growthChartData = data?.charts?.growthTrend || [];

  const cards = [
    { name: "24K Gold Price", value: `₹${(stats.todayGoldPrice24k || 0).toLocaleString('en-IN')} / g`, icon: TrendingUp, color: 'text-gold-500 bg-gold-500/10' },
    { name: "22K Gold Price", value: `₹${(stats.todayGoldPrice22k || 0).toLocaleString('en-IN')} / g`, icon: TrendingUp, color: 'text-gold-400 bg-gold-400/10' },
    { name: 'Total Gold Saved (All)', value: `${(stats.totalGoldSaved || 0).toFixed(4)} g`, icon: Coins, color: 'text-yellow-400 bg-yellow-500/10' },
    { name: "Today's Deposits", value: `₹${(stats.todayCollection || 0).toLocaleString('en-IN')}`, icon: ArrowUpRight, color: 'text-emerald-400 bg-emerald-500/10' },
    { name: 'Pending Deposits', value: stats.pendingDeposits || 0, icon: Hourglass, color: 'text-amber-400 bg-amber-500/10' },
    { name: 'Monthly Collection', value: `₹${(stats.monthlyCollection || 0).toLocaleString('en-IN')}`, icon: CalendarDays, color: 'text-purple-400 bg-purple-500/10' },
  ];

  return (
    <div className="space-y-8 font-sans">
      {/* Welcome & Refresh Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-950 border border-slate-900 rounded-xl p-5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gold-500/5 rounded-full blur-3xl pointer-events-none"></div>
        
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Performance Overview</h1>
          <p className="text-xs text-slate-400">Live statistics and collection charts</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          {/* Live Gold Rates */}
          <div className="flex gap-4 items-center bg-slate-900/40 border border-slate-900 py-2.5 px-4 rounded-xl">
            <div className="text-xs">
              <span className="text-gold-500 font-bold uppercase tracking-wider block mb-0.5">Today's Gold Prices</span>
              <span className="text-slate-400 font-semibold block text-[10px]">
                24K: <span className="text-slate-100 font-bold mr-3">₹{goldRate?.goldPrice24k || '...'} / g</span>
                22K: <span className="text-slate-100 font-bold">₹{goldRate?.goldPrice22k || '...'} / g</span>
              </span>
            </div>
            <button
              onClick={() => {
                setGoldPrice22kInput(goldRate?.goldPrice22k || '');
                setGoldPrice24kInput(goldRate?.goldPrice24k || '');
                setRateModalOpen(true);
              }}
              className="px-3 py-1.5 bg-gold-500/10 hover:bg-gold-500 text-gold-500 hover:text-slate-950 border border-gold-500/20 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all"
            >
              Update
            </button>
          </div>

          <button
            onClick={fetchDashboardStats}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 hover:border-gold-500 text-slate-300 hover:text-gold-500 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-300"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Data</span>
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {cards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className="bg-slate-950 border border-slate-900 rounded-xl p-5 hover-gold-grow flex items-center justify-between shadow-xl">
              <div className="space-y-1">
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider leading-none">{card.name}</p>
                <h3 className="text-xl font-bold text-slate-100">{card.value}</h3>
              </div>
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${card.color}`}>
                <Icon className="w-6 h-6" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Collection Trend */}
        <div className="bg-slate-950 border border-slate-900 rounded-xl p-6 shadow-xl">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-6">Deposit Collection Trend (₹)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={collectionChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#AA771C" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#AA771C" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#020617', borderColor: '#1e293b', borderRadius: '8px' }} labelStyle={{ color: '#94a3b8', fontSize: '11px', fontWeight: 'bold' }} itemStyle={{ color: '#e2e8f0', fontSize: '11px' }} />
                <Area type="monotone" dataKey="amount" stroke="#AA771C" strokeWidth={2} fillOpacity={1} fill="url(#colorAmount)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Customer Growth */}
        <div className="bg-slate-950 border border-slate-900 rounded-xl p-6 shadow-xl">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-6">Customer Registrations (New Users)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={growthChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#020617', borderColor: '#1e293b', borderRadius: '8px' }} labelStyle={{ color: '#94a3b8', fontSize: '11px', fontWeight: 'bold' }} itemStyle={{ color: '#e2e8f0', fontSize: '11px' }} />
                <Bar dataKey="count" fill="#D4AF37" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Recent Ledger Transactions */}
      <div className="bg-slate-950 border border-slate-900 rounded-xl overflow-hidden shadow-2xl">
        <div className="px-6 py-5 border-b border-slate-900 bg-slate-950/60">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Recent Activity Ledger</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-900/60 text-slate-400 font-semibold uppercase border-b border-slate-900">
                <th className="p-4">Txn Number</th>
                <th className="p-4">Customer Name</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Karat</th>
                <th className="p-4">Gold Purchased</th>
                <th className="p-4">Type</th>
                <th className="p-4">Method</th>
                <th className="p-4">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900 text-slate-300">
              {recentTransactions.length > 0 ? (
                recentTransactions.map((t) => (
                  <tr key={t._id} className="hover:bg-slate-900/30 transition-colors">
                    <td className="p-4 font-mono font-bold text-gold-500">{t.transactionNumber}</td>
                    <td className="p-4 font-semibold text-slate-200">{t.customerName}</td>
                    <td className="p-4 font-bold text-slate-100">₹{t.amount.toLocaleString('en-IN')}</td>
                    <td className="p-4 font-bold text-gold-400">{t.goldKarat || '24K'}</td>
                    <td className="p-4 font-bold text-gold-500">{t.goldPurchased ? `${t.goldPurchased.toFixed(4)} g` : 'N/A'}</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        t.type === 'Deposit' ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/20' : 'bg-rose-950 text-rose-400 border border-rose-500/20'
                      }`}>
                        {t.type}
                      </span>
                    </td>
                    <td className="p-4 text-slate-400">{t.paymentMethod}</td>
                    <td className="p-4 text-[10px] text-slate-400">{t.date}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="p-8 text-center text-slate-500 font-medium">No activity recorded today.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Rate Update Modal / Blocking Modal Overlay */}
      {(rateModalOpen || blockModalOpen) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm bg-slate-950 border border-slate-900 rounded-2xl p-6 shadow-2xl relative animate-scale-in space-y-6">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-slate-900 pb-3">
              <h3 className="text-xs font-bold text-gold-500 uppercase tracking-widest flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4" />
                <span>{blockModalOpen ? "Action Required: Daily Gold Price" : "Update Gold Price"}</span>
              </h3>
              {!blockModalOpen && (
                <button 
                  onClick={() => setRateModalOpen(false)}
                  className="text-slate-400 hover:text-slate-200 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {blockModalOpen && (
              <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-xl text-xs flex gap-2.5 leading-relaxed items-start">
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5 animate-pulse" />
                <div>
                  <p className="font-bold text-slate-100 mb-0.5">Mandatory Daily Update</p>
                  <p className="text-[10px] text-slate-400">
                    Today's gold prices have not been updated. Please enter today's rates before continuing.
                  </p>
                </div>
              </div>
            )}

            {/* Modal Form */}
            <form onSubmit={handleUpdateRates} className="space-y-4">
              
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">24K Gold Price (₹ / gram) *</label>
                <input
                  type="number"
                  placeholder="e.g. 7850"
                  value={goldPrice24kInput}
                  onChange={(e) => setGoldPrice24kInput(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 focus:border-gold-500 text-slate-100 rounded-lg px-3.5 py-2 text-xs focus:outline-none"
                  required
                  min="1"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">22K Gold Price (₹ / gram) *</label>
                <input
                  type="number"
                  placeholder="e.g. 7200"
                  value={goldPrice22kInput}
                  onChange={(e) => setGoldPrice22kInput(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 focus:border-gold-500 text-slate-100 rounded-lg px-3.5 py-2 text-xs focus:outline-none"
                  required
                  min="1"
                />
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-900 pt-4">
                {!blockModalOpen && (
                  <button
                    type="button"
                    onClick={() => setRateModalOpen(false)}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  disabled={submittingRate}
                  className="px-4 py-2 gold-btn-gradient text-slate-950 font-bold rounded-lg text-xs uppercase tracking-wider transition-all hover:shadow-lg hover:shadow-gold-500/10 flex items-center gap-2"
                >
                  {submittingRate ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                      <span>Saving Prices...</span>
                    </>
                  ) : (
                    'Save Prices'
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      <DoubleConfirmModal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={confirmAction}
        message={confirmMessage}
        actionType={confirmActionType}
      />
    </div>
  );
};

export default Dashboard;
