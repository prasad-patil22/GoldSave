import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { History as HistoryIcon, Clock, CheckCircle, XCircle, ChevronDown, ChevronUp, AlertCircle, HelpCircle } from 'lucide-react';

const History = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [requests, setRequests] = useState([]); // DepositRequests (includes pending/rejected/approved)
  const [withdrawals, setWithdrawals] = useState([]); // Completed Withdrawals
  const [loading, setLoading] = useState(true);

  // Filter States
  const [filterType, setFilterType] = useState('All'); // 'All', 'Deposit', 'Withdrawal'
  const [filterStatus, setFilterStatus] = useState('All'); // 'All', 'Pending', 'Approved', 'Rejected'
  const [sortOrder, setSortOrder] = useState('desc'); // 'desc', 'asc'
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);

  // Accordion / Expanded item for rejection reason
  const [expandedId, setExpandedId] = useState(null);

  const fetchLedgerHistory = async () => {
    setLoading(true);
    try {
      // 1. Fetch deposit requests (which includes approved, pending, rejected)
      const depRes = await api.get('/deposits');
      const deps = depRes.data.success ? depRes.data.deposits : [];

      // 2. Fetch withdrawals
      const wthRes = await api.get('/withdrawals');
      const wths = wthRes.data.success ? wthRes.data.withdrawals : [];

      setRequests(deps);
      setWithdrawals(wths);
    } catch (error) {
      showToast('Failed to load ledger history.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLedgerHistory();
  }, []);

  // Merge deposits and withdrawals into a single unified ledger timeline
  const getUnifiedLedger = () => {
    const ledger = [];

    // Add Deposits
    requests.forEach(r => {
      ledger.push({
        id: r._id,
        number: r.transactionNumber,
        amount: r.amount,
        type: 'Deposit',
        method: r.paymentMethod,
        ref: r.transactionId || 'N/A',
        status: r.status,
        remarks: r.remarks || '',
        rejectionReason: r.rejectionReason || '',
        createdBy: r.createdBy || 'Customer',
        date: r.date,
        time: r.time,
        createdAt: new Date(r.createdAt)
      });
    });

    // Add Withdrawals
    withdrawals.forEach(w => {
      ledger.push({
        id: w._id,
        number: w.withdrawalNumber,
        amount: w.amount,
        type: 'Withdrawal',
        method: 'Deduction',
        ref: `Invoice: ${w.invoiceNumber}`,
        status: 'Approved', // Withdrawals are always instantly approved
        remarks: w.reason,
        rejectionReason: '',
        createdBy: 'Admin',
        date: w.date,
        time: w.time,
        createdAt: new Date(w.createdAt)
      });
    });

    // Apply Filters
    let filtered = ledger.filter(item => {
      // Type filter
      if (filterType !== 'All' && item.type !== filterType) return false;
      
      // Status filter
      if (filterStatus !== 'All' && item.status !== filterStatus) return false;

      // Date filters
      if (startDate && item.date < startDate) return false;
      if (endDate && item.date > endDate) return false;

      return true;
    });

    // Apply Sorting
    filtered.sort((a, b) => {
      return sortOrder === 'desc' 
        ? b.createdAt - a.createdAt 
        : a.createdAt - b.createdAt;
    });

    return filtered;
  };

  const toggleExpand = (id) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  const handleExport = (format) => {
    const items = getUnifiedLedger();
    if (items.length === 0) {
      showToast('No transactions to export.', 'error');
      return;
    }

    const dateRangeText = startDate || endDate 
      ? `${startDate || 'Start'}_to_${endDate || 'End'}`
      : 'All_Dates';

    if (format === 'CSV') {
      const csvRows = [
        ['Transaction Number', 'Amount (INR)', 'Type', 'Method', 'Reference/Invoice', 'Created By', 'Status', 'Date', 'Time'],
        ...items.map(item => [
          item.number,
          item.amount,
          item.type,
          item.method,
          item.ref,
          item.createdBy,
          item.status,
          item.date,
          item.time
        ])
      ];
      const csvContent = "data:text/csv;charset=utf-8," 
        + csvRows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(",")).join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `ledger_statement_${dateRangeText}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('Statement exported as CSV.', 'success');
    } else if (format === 'Excel') {
      const excelContent = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <!--[if gte mso 9]>
          <xml>
            <x:ExcelWorkbook>
              <x:ExcelWorksheets>
                <x:ExcelWorksheet>
                  <x:Name>Ledger Statement</x:Name>
                  <x:WorksheetOptions>
                    <x:DisplayGridlines/>
                  </x:WorksheetOptions>
                </x:ExcelWorksheet>
              </x:ExcelWorksheets>
            </x:ExcelWorkbook>
          </xml>
          <![endif]-->
        </head>
        <body>
          <table border="1">
            <thead>
              <tr style="background-color: #f2f2f2; font-weight: bold;">
                <th>Transaction Number</th>
                <th>Amount (INR)</th>
                <th>Type</th>
                <th>Method</th>
                <th>Reference / Invoice</th>
                <th>Created By</th>
                <th>Status</th>
                <th>Date</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              ${items.map(item => `
                <tr>
                  <td>${item.number}</td>
                  <td>${item.amount}</td>
                  <td>${item.type}</td>
                  <td>${item.method}</td>
                  <td>${item.ref}</td>
                  <td>${item.createdBy}</td>
                  <td>${item.status}</td>
                  <td>${item.date}</td>
                  <td>${item.time}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
        </html>
      `;
      const blob = new Blob([excelContent], { type: "application/vnd.ms-excel;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `ledger_statement_${dateRangeText}.xls`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast('Statement exported as Excel.', 'success');
    } else if (format === 'PDF') {
      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <html>
          <head>
            <title>Ledger Statement - Ganesh Jewellers</title>
            <style>
              body { font-family: sans-serif; padding: 20px; color: #333; }
              h1 { margin-bottom: 5px; color: #b45309; }
              h3 { margin-top: 0; color: #666; font-weight: normal; }
              .info { margin: 15px 0; font-size: 12px; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #ddd; padding: 10px 8px; text-align: left; font-size: 11px; }
              th { background-color: #f9fafb; font-weight: bold; }
              .mono { font-family: monospace; }
              .amount { font-weight: bold; }
              .footer { margin-top: 40px; font-size: 10px; color: #999; text-align: center; }
            </style>
          </head>
          <body>
            <h1>GANESH JEWELLERS</h1>
            <h3>Gold Savings Ledger Statement</h3>
            <div class="info">
              <p><strong>Customer Name:</strong> ${user?.name || 'Customer'}</p>
              <p><strong>Account ID:</strong> ${user?.customerId || 'N/A'}</p>
              <p><strong>Date Range:</strong> ${startDate || 'All'} to ${endDate || 'All'}</p>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Txn Number</th>
                  <th>Amount</th>
                  <th>Type</th>
                  <th>Method</th>
                  <th>Reference / Invoice</th>
                  <th>Created By</th>
                  <th>Status</th>
                  <th>Date / Time</th>
                </tr>
              </thead>
              <tbody>
                ${items.map(item => `
                  <tr>
                    <td class="mono">${item.number}</td>
                    <td class="amount">₹${item.amount.toLocaleString('en-IN')}</td>
                    <td>${item.type}</td>
                    <td>${item.method}</td>
                    <td class="mono">${item.ref}</td>
                    <td>${item.createdBy}</td>
                    <td>${item.status}</td>
                    <td>${item.date} ${item.time}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            <div class="footer">
              Generated automatically from Ganesh Jewellers Save Gold Scheme Portal on ${new Date().toLocaleDateString('en-IN')}
            </div>
            <script>
              window.onload = function() {
                window.print();
                window.close();
              }
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
      showToast('Statement ready to print/save.', 'success');
    }
  };

  const ledgerItems = getUnifiedLedger();

  return (
    <div className="space-y-6 font-sans">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Savings Ledger Statement</h1>
        <p className="text-xs text-slate-400">Complete transaction ledger, deposits log, and jewelry purchases statement</p>
      </div>

      {/* Filter and sorting Options */}
      <div className="bg-slate-950 border border-slate-900 rounded-xl p-4 flex flex-col xl:flex-row gap-4 items-center justify-between">
        <div className="flex flex-wrap gap-3 w-full xl:w-auto">
          <div>
            <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Transaction Type</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-slate-900 border border-slate-800 text-slate-300 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-gold-500 w-full md:w-auto"
            >
              <option value="All">All Types</option>
              <option value="Deposit">Deposits Only</option>
              <option value="Withdrawal">Withdrawals Only</option>
            </select>
          </div>

          <div>
            <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-slate-900 border border-slate-800 text-slate-300 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-gold-500 w-full md:w-auto"
            >
              <option value="All">All Statuses</option>
              <option value="Approved">Approved / Credited</option>
              <option value="Pending">Pending Verification</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

          <div>
            <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Sort Order</label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="bg-slate-900 border border-slate-800 text-slate-300 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-gold-500 w-full md:w-auto"
            >
              <option value="desc">Newest First</option>
              <option value="asc">Oldest First</option>
            </select>
          </div>

          <div>
            <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">From Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-slate-900 border border-slate-800 text-slate-300 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-gold-500 w-full md:w-auto"
            />
          </div>

          <div>
            <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">To Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-slate-900 border border-slate-800 text-slate-300 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-gold-500 w-full md:w-auto"
            />
          </div>
        </div>

        <div className="flex gap-3 w-full xl:w-auto justify-end">
          <button
            onClick={fetchLedgerHistory}
            className="w-full md:w-auto px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-gold-500 text-slate-300 hover:text-gold-500 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors"
          >
            Reload
          </button>

          <div className="relative w-full md:w-auto">
            <button
              onClick={() => setExportDropdownOpen(!exportDropdownOpen)}
              className="w-full md:w-auto px-4 py-2 gold-btn-gradient hover:shadow-lg text-slate-950 font-bold rounded-lg text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5"
            >
              <span>Export</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
            
            {exportDropdownOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setExportDropdownOpen(false)} />
                <div className="absolute right-0 mt-2 w-40 rounded-xl bg-slate-950 border border-slate-800 shadow-2xl z-20 py-1.5 overflow-hidden">
                  <button
                    onClick={() => { handleExport('PDF'); setExportDropdownOpen(false); }}
                    className="w-full text-left px-4 py-2.5 text-xs text-slate-300 hover:bg-slate-900 hover:text-slate-100 font-semibold transition-colors flex items-center gap-2"
                  >
                    <span>📄 Export as PDF</span>
                  </button>
                  <button
                    onClick={() => { handleExport('CSV'); setExportDropdownOpen(false); }}
                    className="w-full text-left px-4 py-2.5 text-xs text-slate-300 hover:bg-slate-900 hover:text-slate-100 font-semibold transition-colors flex items-center gap-2"
                  >
                    <span>📊 Export as CSV</span>
                  </button>
                  <button
                    onClick={() => { handleExport('Excel'); setExportDropdownOpen(false); }}
                    className="w-full text-left px-4 py-2.5 text-xs text-slate-300 hover:bg-slate-900 hover:text-slate-100 font-semibold transition-colors flex items-center gap-2"
                  >
                    <span>📈 Export as Excel</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Ledger Log */}
      <div className="bg-slate-950 border border-slate-900 rounded-xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-900/60 text-slate-400 font-semibold uppercase border-b border-slate-900">
                <th className="p-4">Txn Number</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Type</th>
                <th className="p-4">Method</th>
                <th className="p-4">Reference / Invoice</th>
                <th className="p-4">Created By</th>
                <th className="p-4">Status</th>
                <th className="p-4">Date / Time</th>
                <th className="p-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan="9" className="p-8 text-center">
                    <div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  </td>
                </tr>
              ) : ledgerItems.length > 0 ? (
                ledgerItems.map((item) => (
                  <React.Fragment key={item.number}>
                    <tr 
                      className={`hover:bg-slate-900/20 transition-colors ${
                        item.status === 'Rejected' ? 'bg-rose-950/5' : ''
                      }`}
                    >
                      <td className="p-4 font-mono font-bold text-gold-500">{item.number}</td>
                      <td className="p-4 font-bold text-slate-100">₹{item.amount.toLocaleString('en-IN')}</td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          item.type === 'Deposit' ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/20' : 'bg-rose-950 text-rose-400 border border-rose-500/20'
                        }`}>
                          {item.type}
                        </span>
                      </td>
                      <td className="p-4 text-slate-400">{item.method}</td>
                      <td className="p-4 font-mono text-slate-500">{item.ref}</td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          item.createdBy === 'Admin' 
                            ? 'bg-blue-950 text-blue-400 border border-blue-500/20' 
                            : 'bg-purple-950 text-purple-400 border border-purple-500/20'
                        }`}>
                          {item.createdBy}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 w-fit ${
                          item.status === 'Approved' 
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/20' 
                            : item.status === 'Pending'
                            ? 'bg-amber-950 text-amber-400 border border-amber-500/20'
                            : 'bg-rose-950 text-rose-400 border border-rose-500/20'
                        }`}>
                          {item.status === 'Approved' && <CheckCircle className="w-3 h-3" />}
                          {item.status === 'Pending' && <Clock className="w-3 h-3" />}
                          {item.status === 'Rejected' && <XCircle className="w-3 h-3" />}
                          <span>{item.status}</span>
                        </span>
                      </td>
                      <td className="p-4 text-slate-400">
                        <div>{item.date}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">{item.time}</div>
                      </td>
                      <td className="p-4 text-right">
                        {(item.rejectionReason || item.remarks) && (
                          <button
                            onClick={() => toggleExpand(item.id)}
                            className="p-1 hover:bg-slate-900 rounded text-slate-400 hover:text-slate-100"
                          >
                            {expandedId === item.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        )}
                      </td>
                    </tr>
                    
                    {/* Expanded details (Remarks / Rejection Reason) */}
                    {expandedId === item.id && (
                      <tr>
                        <td colSpan="9" className="bg-slate-900/40 p-4 border-t border-slate-900">
                          <div className="space-y-2 text-xs">
                            {item.status === 'Rejected' && item.rejectionReason && (
                              <div className="bg-rose-950/30 border border-rose-500/20 text-rose-300 rounded-lg p-3 flex items-start gap-2.5">
                                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                                <div>
                                  <p className="font-bold">Rejection Notice</p>
                                  <p className="text-[11px] mt-0.5 leading-relaxed">{item.rejectionReason}</p>
                                </div>
                              </div>
                            )}

                            {item.remarks && (
                              <div className="bg-slate-950 border border-slate-900 text-slate-400 rounded-lg p-3 flex items-start gap-2.5">
                                <HelpCircle className="w-4 h-4 text-gold-500 flex-shrink-0 mt-0.5" />
                                <div>
                                  <p className="font-bold text-slate-300">Transaction Notes</p>
                                  <p className="text-[11px] mt-0.5 leading-relaxed">"{item.remarks}"</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              ) : (
                <tr>
                  <td colSpan="9" className="p-8 text-center text-slate-500 font-medium">No transactions found in this statement.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default History;
