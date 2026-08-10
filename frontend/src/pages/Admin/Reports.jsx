import React, { useState } from 'react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { FileSpreadsheet, FileText, Download, Filter, FileSpreadsheet as CSVIcon, RefreshCw } from 'lucide-react';

const Reports = () => {
  const { showToast } = useToast();

  const [format, setFormat] = useState('pdf'); // 'pdf', 'excel', 'csv'
  const [loading, setLoading] = useState(false);

  // Transaction specific filters
  const [txnType, setTxnType] = useState('');
  const [txnStatus, setTxnStatus] = useState('');
  const [txnMethod, setTxnMethod] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const triggerBlobDownload = async (endpoint, filename, params = {}) => {
    setLoading(true);
    try {
      const response = await api.get(endpoint, {
        params: { ...params, format },
        responseType: 'blob'
      });

      // Create a local blob URL
      const blob = new Blob([response.data], { type: response.headers['content-type'] });
      const downloadUrl = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      
      showToast('Report downloaded successfully.', 'success');
    } catch (error) {
      console.error('Download error:', error);
      showToast('Failed to export report. Verify you have connection.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCustomers = () => {
    const ext = format === 'excel' ? 'xlsx' : format;
    triggerBlobDownload('/reports/customers/export', `customers_report_${Date.now()}.${ext}`);
  };

  const handleExportTransactions = () => {
    const ext = format === 'excel' ? 'xlsx' : format;
    const params = {};
    if (txnType) params.type = txnType;
    if (txnStatus) params.status = txnStatus;
    if (txnMethod) params.paymentMethod = txnMethod;
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;

    triggerBlobDownload('/reports/transactions/export', `transactions_report_${Date.now()}.${ext}`, params);
  };

  return (
    <div className="space-y-8 font-sans">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Ledger Statement Exports</h1>
        <p className="text-xs text-slate-400">Generate and export customer registers and transaction ledger sheets</p>
      </div>

      {/* Grid: Global Format & Report Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Step 1: Export Settings */}
        <div className="lg:col-span-1 bg-slate-950 border border-slate-900 rounded-xl p-6 space-y-6">
          <h3 className="text-xs font-bold text-gold-500 uppercase tracking-widest border-b border-slate-900 pb-2 flex items-center gap-2">
            <Filter className="w-4 h-4" />
            <span>1. Select Export Format</span>
          </h3>

          <div className="space-y-3">
            {[
              { id: 'pdf', label: 'Adobe PDF Document (.pdf)', desc: 'Best for printing and signed document statements', icon: FileText, color: 'text-rose-400 border-rose-500/20 bg-rose-500/5' },
              { id: 'excel', label: 'Microsoft Excel Spreadsheet (.xlsx)', desc: 'Best for calculations and detailed account audits', icon: FileSpreadsheet, color: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5' },
              { id: 'csv', label: 'Comma Separated Values (.csv)', desc: 'Best for exporting into accounting software systems', icon: CSVIcon, color: 'text-blue-400 border-blue-500/20 bg-blue-500/5' },
            ].map((f) => {
              const Icon = f.icon;
              const isSelected = format === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => setFormat(f.id)}
                  className={`
                    w-full text-left p-4 rounded-xl border flex gap-4 transition-all duration-300
                    ${isSelected 
                      ? 'bg-slate-900 border-gold-500/50 shadow-md shadow-gold-500/5' 
                      : 'bg-slate-950 border-slate-900 hover:border-slate-800'
                    }
                  `}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${f.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className={`text-xs font-bold ${isSelected ? 'text-gold-500' : 'text-slate-300'}`}>{f.label}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5 leading-normal">{f.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 2 & 3: Reports Generation Panels */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Customer Register Export */}
          <div className="bg-slate-950 border border-slate-900 rounded-xl p-6 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Customer Register Database</h3>
              <p className="text-xs text-slate-500">Exports all customers along with their current balances, nominees, and status.</p>
            </div>
            
            <button
              onClick={handleExportCustomers}
              disabled={loading}
              className="flex items-center justify-center gap-2 px-5 py-2.5 gold-btn-gradient text-slate-950 font-bold rounded-lg text-xs uppercase tracking-wider transition-all duration-200 hover:shadow-lg disabled:opacity-50"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span>Export Customer Registry</span>
            </button>
          </div>

          {/* Transactions Statement Export */}
          <div className="bg-slate-950 border border-slate-900 rounded-xl p-6 space-y-5">
            <div>
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Transaction Ledger Sheet</h3>
              <p className="text-xs text-slate-500">Exports transaction histories matching specific filters (deposits, purchases, online payments).</p>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 border-t border-b border-slate-900 py-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Transaction Type</label>
                <select
                  value={txnType}
                  onChange={(e) => setTxnType(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 text-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-gold-500"
                >
                  <option value="">All Types (Deposit/Withdrawal)</option>
                  <option value="Deposit">Deposits Only</option>
                  <option value="Withdrawal">Withdrawals Only</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Payment Channel</label>
                <select
                  value={txnMethod}
                  onChange={(e) => setTxnMethod(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 text-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-gold-500"
                >
                  <option value="">All Channels</option>
                  <option value="Cash">Cash at Shop</option>
                  <option value="Online">Online Transfer</option>
                  <option value="UPI">UPI Payment</option>
                  <option value="Google Pay">Google Pay</option>
                  <option value="PhonePe">PhonePe</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Verification Status</label>
                <select
                  value={txnStatus}
                  disabled // All finalized transactions are inherently Approved, requests are Pending in separate collection
                  className="w-full bg-slate-900/50 border border-slate-900 text-slate-500 rounded-lg px-3 py-2 text-xs cursor-not-allowed"
                >
                  <option value="">Approved Only</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">From Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 text-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-gold-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">To Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 text-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-gold-500"
                />
              </div>
            </div>

            <button
              onClick={handleExportTransactions}
              disabled={loading}
              className="flex items-center justify-center gap-2 px-5 py-2.5 gold-btn-gradient text-slate-950 font-bold rounded-lg text-xs uppercase tracking-wider transition-all duration-200 hover:shadow-lg disabled:opacity-50"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span>Export Ledger Sheet</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};

export default Reports;
