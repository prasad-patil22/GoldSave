import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Search, ChevronLeft, ChevronRight, CalendarDays, User, TrendingUp } from 'lucide-react';

const PriceHistory = () => {
  const { showToast } = useToast();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchDate, setSearchDate] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const response = await api.get('/gold-rates/history', {
        params: {
          date: searchDate,
          page,
          limit: 10
        }
      });
      if (response.data.success) {
        setHistory(response.data.history);
        setTotalPages(response.data.pagination.pages);
      }
    } catch (error) {
      showToast('Failed to load gold price history.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [page]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchHistory();
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const date = new Date(parts[0], parts[1] - 1, parts[2]);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    const date = new Date(timeStr);
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Header Banner */}
      <div className="bg-slate-950 border border-slate-900 rounded-xl p-5 relative overflow-hidden flex justify-between items-center">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gold-500/5 rounded-full blur-3xl pointer-events-none"></div>
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-gold-500" />
            <span>Daily Gold Price History</span>
          </h1>
          <p className="text-xs text-slate-400">Historical records of scheme gold rates updates</p>
        </div>
      </div>

      {/* Search Filter Bar */}
      <div className="bg-slate-950 border border-slate-900 rounded-xl p-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:max-w-xs">
          <input
            type="text"
            placeholder="Search by date (YYYY-MM-DD)..."
            value={searchDate}
            onChange={(e) => setSearchDate(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 focus:border-gold-500 text-slate-100 rounded-lg pl-9 pr-4 py-2 text-xs focus:outline-none placeholder:text-slate-500"
          />
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
        </form>

        <button
          type="button"
          onClick={() => { setSearchDate(''); setPage(1); fetchHistory(); }}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors"
        >
          Reset Filter
        </button>
      </div>

      {/* History Table */}
      <div className="bg-slate-950 border border-slate-900 rounded-xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-900/60 text-slate-400 font-semibold uppercase border-b border-slate-900">
                <th className="p-4 flex items-center gap-1.5"><CalendarDays className="w-3.5 h-3.5" /> Date</th>
                <th className="p-4">24K Gold Price</th>
                <th className="p-4">22K Gold Price</th>
                <th className="p-4">Updated Time</th>
                <th className="p-4"><User className="w-3.5 h-3.5" /> Updated By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-6 h-6 border-2 border-gold-500 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Retrieving Rates...</span>
                    </div>
                  </td>
                </tr>
              ) : history.length > 0 ? (
                history.map((h) => (
                  <tr key={h._id} className="hover:bg-slate-900/30 transition-colors">
                    <td className="p-4 font-mono font-bold text-gold-400">{formatDate(h.date)}</td>
                    <td className="p-4 font-black text-slate-100 text-sm">₹{(h.goldPrice24k || 0).toLocaleString('en-IN')} / gram</td>
                    <td className="p-4 font-black text-slate-200 text-sm">₹{(h.goldPrice22k || 0).toLocaleString('en-IN')} / gram</td>
                    <td className="p-4 text-slate-400">{formatTime(h.createdAt)}</td>
                    <td className="p-4 text-slate-300">
                      <div className="font-semibold">{h.updatedBy?.name || 'System Admin'}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{h.updatedBy?.email || 'admin@gmail.com'}</div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-slate-500 font-medium">No gold price history records found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-900 flex justify-between items-center bg-slate-950/60">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                className="p-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 border border-slate-800 text-slate-300 rounded transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={page === totalPages}
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                className="p-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 border border-slate-800 text-slate-300 rounded transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default PriceHistory;
