import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { 
  Coins, 
  Hourglass, 
  ArrowUpRight, 
  ArrowDownRight, 
  Bell, 
  Wallet, 
  History, 
  Info,
  Calendar,
  AlertCircle
} from 'lucide-react';

const Dashboard = () => {
  const { showToast } = useToast();

  const [stats, setStats] = useState(null);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchCustomerDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Dashboard Stats
      const statsRes = await api.get('/dashboard/customer');
      if (statsRes.data.success) {
        setStats(statsRes.data.stats);
        setRecentTransactions(statsRes.data.recentTransactions);
      }

      // 2. Fetch Customer Notifications
      const notifRes = await api.get('/dashboard/notifications');
      if (notifRes.data.success) {
        setNotifications(notifRes.data.notifications);
        setUnreadCount(notifRes.data.unreadCount);
      }
    } catch (error) {
      showToast('Error syncing dashboard ledger details.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomerDashboardData();
  }, []);

  const handleClearNotifications = async () => {
    if (unreadCount === 0) return;
    try {
      const response = await api.put('/dashboard/notifications/read');
      if (response.data.success) {
        setUnreadCount(0);
        // Refresh notifications list to mark as read
        const notifRes = await api.get('/dashboard/notifications');
        if (notifRes.data.success) {
          setNotifications(notifRes.data.notifications);
        }
      }
    } catch (error) {
      console.error(error);
    }
  };

  if (loading && !stats) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const cards = [
    { name: 'Gold Saved', value: `${(stats?.totalGold24k || 0).toFixed(4)} g`, icon: Coins, color: 'text-gold-500 bg-gold-500/10 border-gold-500/20' },
    // { name: '22K Gold Saved', value: `${(stats?.totalGold22k || 0).toFixed(4)} g`, icon: Coins, color: 'text-gold-400 bg-gold-400/10 border-gold-400/20' },
    { name: 'Total Gold Saved', value: `${(stats?.totalGold || 0).toFixed(4)} g`, icon: Coins, color: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20' },
    { name: 'Total Money Invested', value: `₹${(stats?.totalMoneyInvested || 0).toLocaleString('en-IN')}`, icon: ArrowUpRight, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
    { name: 'Estimated Value', value: `₹${(stats?.estimatedCurrentValue || 0).toLocaleString('en-IN')}`, icon: Coins, color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' },
    { name: 'Pending Approval', value: `₹${(stats?.pendingAmount || 0).toLocaleString('en-IN')}`, icon: Hourglass, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  ];

  return (
    <div className="space-y-6 font-sans">
      
      {/* Welcome Banner */}
      <div className="bg-slate-950 border border-slate-900 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-gold-500/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="space-y-1">
          <span className="text-[10px] font-bold text-gold-500 bg-gold-500/10 px-2.5 py-1 rounded-full uppercase tracking-wider">
            Savings Statement Dashboard
          </span>
          <h1 className="text-xl md:text-2xl font-extrabold text-slate-100 mt-3">Welcome, {stats?.name}!</h1>
          <p className="text-xs text-slate-400">Account ID: <span className="font-mono font-bold text-gold-500">{stats?.customerId}</span> &bull; Member since {new Date(stats?.joiningDate).toLocaleDateString('en-IN')}</p>
          <div className="flex flex-col gap-1.5 mt-2">
            <div className="flex gap-4 text-[10px] font-bold text-slate-300">
              <span>
                24K Today:{' '}
                <span className={!stats?.todayUpdated ? "line-through text-slate-500 decoration-rose-500 font-bold" : "text-gold-500"}>
                  ₹{(stats?.todayGoldPrice24k || 0).toLocaleString('en-IN')}
                </span>{' '}
                / g
              </span>
              <span>
                22K Today:{' '}
                <span className={!stats?.todayUpdated ? "line-through text-slate-500 decoration-rose-500 font-bold" : "text-gold-400"}>
                  ₹{(stats?.todayGoldPrice22k || 0).toLocaleString('en-IN')}
                </span>{' '}
                / g
              </span>
            </div>
            {!stats?.todayUpdated && (
              <p className="text-[9px] text-rose-400 font-semibold bg-rose-500/10 px-2.5 py-1 rounded-md inline-block max-w-max">
                ⚠️ Yesterday's Price (Admin has not updated today's price yet. Rates will update once modified by Admin).
              </p>
            )}
          </div>
        </div>

        <Link
          to="/customer/deposit"
          className="flex items-center gap-2 px-5 py-3 gold-btn-gradient text-slate-950 hover:shadow-lg hover:shadow-gold-500/10 active:scale-95 font-bold rounded-lg text-xs uppercase tracking-wider transition-all duration-300"
        >
          <Wallet className="w-4 h-4" />
          <span>Add Money Online</span>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {cards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className={`bg-slate-950 border rounded-xl p-5 hover-gold-grow flex items-center justify-between ${card.color}`}>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{card.name}</p>
                <h3 className="text-xl font-black text-slate-100">{card.value}</h3>
              </div>
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-slate-900 border border-slate-800">
                <Icon className="w-5 h-5" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Grid: Notifications and Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Recent Transactions */}
        <div className="lg:col-span-2 bg-slate-950 border border-slate-900 rounded-xl overflow-hidden flex flex-col">
          <div className="px-6 py-5 border-b border-slate-900 flex justify-between items-center bg-slate-950/60">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <History className="w-4 h-4 text-gold-500" />
              <span>Recent Activity</span>
            </h3>
            <Link to="/customer/history" className="text-xs text-gold-500 hover:underline font-semibold">
              View All
            </Link>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900/60 text-slate-400 font-semibold uppercase border-b border-slate-900">
                  <th className="p-4">Txn Number</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Karat</th>
                  <th className="p-4">Gold Purchased</th>
                  <th className="p-4">Gold Price</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Method</th>
                  <th className="p-4">Created By</th>
                  <th className="p-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900 text-slate-300">
                {recentTransactions.length > 0 ? (
                  recentTransactions.map((t) => (
                    <tr key={t._id} className="hover:bg-slate-900/30 transition-colors">
                      <td className="p-4 font-mono font-bold text-gold-500">{t.transactionNumber}</td>
                      <td className="p-4 font-bold text-slate-100">₹{t.amount.toLocaleString('en-IN')}</td>
                      <td className="p-4 font-bold text-gold-400">{t.type === 'Withdrawal' ? '-' : (t.goldKarat || '24K')}</td>
                      <td className="p-4 font-semibold text-gold-500">{t.goldPurchased ? `${t.goldPurchased.toFixed(4)} g` : 'N/A'}</td>
                      <td className="p-4 text-slate-400">{t.goldPrice ? `₹${t.goldPrice.toLocaleString('en-IN')} / g` : 'N/A'}</td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          t.type === 'Deposit' ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/20' : 'bg-rose-950 text-rose-400 border border-rose-500/20'
                        }`}>
                          {t.type}
                        </span>
                      </td>
                      <td className="p-4 text-slate-400">{t.paymentMethod}</td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          t.createdBy === 'Admin' 
                            ? 'bg-blue-950 text-blue-400 border border-blue-500/20' 
                            : 'bg-purple-950 text-purple-400 border border-purple-500/20'
                        }`}>
                          {t.createdBy || 'Customer'}
                        </span>
                      </td>
                      <td className="p-4 text-slate-400 text-[10px]">{t.date}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="p-8 text-center text-slate-500 font-medium">No ledger transactions found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 1 Col: In-app Notifications */}
        <div className="lg:col-span-1 bg-slate-950 border border-slate-900 rounded-xl p-6 flex flex-col h-[350px]">
          <div className="flex justify-between items-center border-b border-slate-900 pb-3 mb-4">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Bell className="w-4 h-4 text-gold-500" />
              <span>Notifications</span>
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={handleClearNotifications}
                className="text-[10px] text-gold-500 hover:underline font-semibold bg-gold-500/10 px-2 py-0.5 rounded-full"
              >
                Mark Read ({unreadCount})
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {notifications.length > 0 ? (
              notifications.map((n) => (
                <div 
                  key={n._id} 
                  className={`p-3 rounded-lg border text-xs leading-normal transition-colors relative ${
                    n.read 
                      ? 'bg-slate-900/30 border-slate-900 text-slate-400' 
                      : 'bg-slate-900 border-gold-500/10 text-slate-200'
                  }`}
                >
                  {!n.read && (
                    <div className="absolute top-3 right-3 w-1.5 h-1.5 bg-gold-500 rounded-full"></div>
                  )}
                  <p className="font-bold text-slate-200 flex items-center gap-1">
                    {n.title}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1 leading-normal">{n.message}</p>
                  <span className="text-[9px] text-slate-600 block mt-2 font-mono">
                    {new Date(n.createdAt).toLocaleDateString('en-IN')}
                  </span>
                </div>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 italic text-xs space-y-2">
                <Bell className="w-8 h-8 text-slate-700" />
                <span>No notifications.</span>
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};

export default Dashboard;
