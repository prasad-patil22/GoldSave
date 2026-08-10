import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { 
  ArrowLeft, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  Coins, 
  PlusCircle, 
  MinusCircle, 
  Key, 
  ShieldAlert,
  X,
  FileText,
  BadgeIndianRupee,
  ChevronDown
} from 'lucide-react';

import DoubleConfirmModal from '../../components/DoubleConfirmModal';

const CustomerProfile = () => {
  const { id } = useParams();
  const { showToast } = useToast();

  const [customer, setCustomer] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter and Sorting States
  const [filterType, setFilterType] = useState('All');
  const [sortOrder, setSortOrder] = useState('desc');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);

  // Modal States
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);

  // Form States
  const [depositForm, setDepositForm] = useState({ amount: '', paymentMethod: 'Cash', transactionId: '', remarks: '', goldKarat: '24K' });
  const [withdrawForm, setWithdrawForm] = useState({ goldWithdrawn: '', remarks: '' });
  const [resetForm, setResetForm] = useState({ password: '' });

  const [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmMessage, setConfirmMessage] = useState('');
  const [confirmActionType, setConfirmActionType] = useState('danger');
  const [confirmShowCheckbox, setConfirmShowCheckbox] = useState(false);

  const triggerWhatsApp = (mobile, message) => {
    let cleanMobile = mobile.replace(/\D/g, '');
    if (cleanMobile.length === 10) {
      cleanMobile = '91' + cleanMobile;
    }
    const encodedText = encodeURIComponent(message);
    const url = `https://api.whatsapp.com/send?phone=${cleanMobile}&text=${encodedText}`;
    window.open(url, '_blank');
  };

  const fetchProfileData = async () => {
    setLoading(true);
    try {
      const profileRes = await api.get(`/customers/${id}`);
      if (profileRes.data.success) {
        setCustomer(profileRes.data.customer);
      }
      
      const response = await api.get(`/customers/${id}/transactions`);
      if (response.data.success) {
        setTransactions(response.data.transactions);
      }
    } catch (error) {
      showToast('Error fetching customer details or ledger.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, [id]);

  const getFilteredTransactions = () => {
    let filtered = [...transactions];

    // Filter by type
    if (filterType !== 'All') {
      filtered = filtered.filter(t => t.type === filterType);
    }

    // Filter by dates
    if (startDate) {
      filtered = filtered.filter(t => t.date >= startDate);
    }
    if (endDate) {
      filtered = filtered.filter(t => t.date <= endDate);
    }

    // Sort order
    filtered.sort((a, b) => {
      const aDate = new Date(`${a.date}T${a.time}`);
      const bDate = new Date(`${b.date}T${b.time}`);
      return sortOrder === 'desc' ? bDate - aDate : aDate - bDate;
    });

    return filtered;
  };

  const handleExport = (format) => {
    const items = getFilteredTransactions();
    if (items.length === 0) {
      showToast('No transactions to export.', 'error');
      return;
    }

    const dateRangeText = startDate || endDate 
      ? `${startDate || 'Start'}_to_${endDate || 'End'}`
      : 'All_Dates';

    if (format === 'CSV') {
      const csvRows = [
        ['Transaction Number', 'Amount (INR)', 'Karat', 'Gold Purchased', 'Gold Price (INR/g)', 'Type', 'Method', 'Reference/Invoice', 'Created By', 'Remarks/Reason', 'Date', 'Time'],
        ...items.map(t => [
          t.transactionNumber,
          t.amount,
          t.type === 'Withdrawal' ? '-' : (t.goldKarat || '24K'),
          t.goldPurchased ? t.goldPurchased.toFixed(4) : 'N/A',
          t.goldPrice ? t.goldPrice : 'N/A',
          t.type,
          t.paymentMethod,
          t.type === 'Withdrawal' ? (t.invoiceNumber || 'N/A') : (t.transactionId || 'N/A'),
          t.createdBy || 'Customer',
          t.type === 'Withdrawal' ? (t.reason + (t.remarks ? ` - ${t.remarks}` : '')) : (t.remarks || '-'),
          t.date,
          t.time
        ])
      ];
      const csvContent = "data:text/csv;charset=utf-8," 
        + csvRows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(",")).join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `${customer.name}_ledger_${dateRangeText}.csv`);
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
                <th>Karat</th>
                <th>Gold Purchased</th>
                <th>Gold Price (INR/g)</th>
                <th>Type</th>
                <th>Method</th>
                <th>Reference / Invoice</th>
                <th>Created By</th>
                <th>Remarks / Reason</th>
                <th>Date</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              ${items.map(t => `
                <tr>
                  <td>${t.transactionNumber}</td>
                  <td>${t.amount}</td>
                  <td>${t.type === 'Withdrawal' ? '-' : (t.goldKarat || '24K')}</td>
                  <td>${t.goldPurchased ? t.goldPurchased.toFixed(4) : 'N/A'}</td>
                  <td>${t.goldPrice ? t.goldPrice : 'N/A'}</td>
                  <td>${t.type}</td>
                  <td>${t.paymentMethod}</td>
                  <td>${t.type === 'Withdrawal' ? (t.invoiceNumber || 'N/A') : (t.transactionId || 'N/A')}</td>
                  <td>${t.createdBy || 'Customer'}</td>
                  <td>${t.type === 'Withdrawal' ? (t.reason + (t.remarks ? ` - ${t.remarks}` : '')) : (t.remarks || '-')}</td>
                  <td>${t.date}</td>
                  <td>${t.time}</td>
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
      link.setAttribute("download", `${customer.name}_ledger_${dateRangeText}.xls`);
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
            <title>Ledger Statement - ${customer.name}</title>
            <style>
              body { font-family: sans-serif; padding: 20px; color: #333; }
              h1 { margin-bottom: 5px; color: #b45309; }
              h3 { margin-top: 0; color: #666; font-weight: normal; }
              .info { margin: 15px 0; font-size: 12px; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #ddd; padding: 8px 6px; text-align: left; font-size: 10px; }
              th { background-color: #f9fafb; font-weight: bold; }
              .mono { font-family: monospace; }
              .amount { font-weight: bold; }
              .footer { margin-top: 40px; font-size: 10px; color: #999; text-align: center; }
            </style>
          </head>
          <body>
            <h1>GANESH JEWELLERS</h1>
            <h3>Customer Account Ledger Statement</h3>
            <div class="info">
              <p><strong>Customer Name:</strong> ${customer.name}</p>
              <p><strong>Account ID:</strong> ${customer.customerId}</p>
              <p><strong>Mobile:</strong> ${customer.mobile}</p>
              <p><strong>Date Range:</strong> ${startDate || 'All'} to ${endDate || 'All'}</p>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Txn Number</th>
                  <th>Amount</th>
                  <th>Karat</th>
                  <th>Gold Purchased</th>
                  <th>Gold Price</th>
                  <th>Type</th>
                  <th>Method</th>
                  <th>Ref ID / Invoice</th>
                  <th>Created By</th>
                  <th>Remarks / Reason</th>
                  <th>Date / Time</th>
                </tr>
              </thead>
              <tbody>
                ${items.map(t => `
                  <tr>
                    <td class="mono">${t.transactionNumber}</td>
                    <td class="amount">₹${t.amount.toLocaleString('en-IN')}</td>
                    <td>${t.type === 'Withdrawal' ? '-' : (t.goldKarat || '24K')}</td>
                    <td>${t.goldPurchased ? `${t.goldPurchased.toFixed(4)} g` : 'N/A'}</td>
                    <td>${t.goldPrice ? `₹${t.goldPrice.toLocaleString('en-IN')}` : 'N/A'}</td>
                    <td>${t.type}</td>
                    <td>${t.paymentMethod}</td>
                    <td class="mono">${t.type === 'Withdrawal' ? (t.invoiceNumber || 'N/A') : (t.transactionId || 'N/A')}</td>
                    <td>${t.createdBy || 'Customer'}</td>
                    <td>${t.type === 'Withdrawal' ? (t.reason + (t.remarks ? ` - ${t.remarks}` : '')) : (t.remarks || '-')}</td>
                    <td>${t.date} ${t.time}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            <div class="footer">
              Generated automatically from Ganesh Jewellers Save Gold Scheme Admin Panel on ${new Date().toLocaleDateString('en-IN')}
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

  const handleDepositSubmit = (e) => {
    e.preventDefault();
    if (!depositForm.amount) {
      showToast('Please specify the deposit amount.', 'error');
      return;
    }
    setConfirmAction(() => async (sendWhatsAppNotification) => {
      setSubmitting(true);
      try {
        const response = await api.post('/deposits/shop', {
          customerId: id,
          ...depositForm
        });
        if (response.data.success) {
          showToast(response.data.message, 'success');
          setDepositModalOpen(false);
          setDepositForm({ amount: '', paymentMethod: 'Cash', transactionId: '', remarks: '', goldKarat: '24K' });
          fetchProfileData();
          
          if (sendWhatsAppNotification) {
            const txn = response.data.transaction;
            const message = `Hello ${customer.name},\n\nYour deposit has been successfully added.\n\nDeposit Amount: ₹${txn.amount.toLocaleString('en-IN')}\nGold Price: ₹${(txn.goldPrice || 0).toLocaleString('en-IN')} per gram\nGold Purchased: ${(txn.goldPurchased || 0).toFixed(4)} g\nTotal Gold Saved: ${(response.data.totalGold || customer.totalGold || 0).toFixed(4)} g\n\nThank you for saving with Ganesh Jewellers.`;
            triggerWhatsApp(customer.mobile, message);
          }
        }
      } catch (error) {
        showToast(error.response?.data?.message || 'Failed to record deposit.', 'error');
      } finally {
        setSubmitting(false);
      }
    });
    setConfirmMessage(`Are you sure you want to add a deposit of ₹${depositForm.amount} for ${customer.name}?`);
    setConfirmActionType('success');
    setConfirmShowCheckbox(true);
    setConfirmOpen(true);
  };

  const handleWithdrawSubmit = (e) => {
    e.preventDefault();
    if (!withdrawForm.goldWithdrawn) {
      showToast('Please specify the gold grams to deduct.', 'error');
      return;
    }
    setConfirmAction(() => async (sendWhatsAppNotification) => {
      setSubmitting(true);
      try {
        const response = await api.post('/withdrawals', {
          customerId: id,
          ...withdrawForm
        });
        if (response.data.success) {
          showToast(response.data.message, 'success');
          setWithdrawModalOpen(false);
          setWithdrawForm({ goldWithdrawn: '', remarks: '' });
          fetchProfileData();

          if (sendWhatsAppNotification) {
            const txn = response.data.transaction;
            const message = `Hello ${customer.name},\n\nYour gold savings deduction has been successfully recorded.\n\nGold Deducted: ${(txn.goldPurchased || 0).toFixed(4)} g\nTotal Gold Saved: ${(response.data.totalGold || 0).toFixed(4)} g\n\nThank you,\nGanesh Jewellers`;
            triggerWhatsApp(customer.mobile, message);
          }
        }
      } catch (error) {
        showToast(error.response?.data?.message || 'Failed to record gold deduction.', 'error');
      } finally {
        setSubmitting(false);
      }
    });
    setConfirmMessage(`Are you sure you want to deduct ${withdrawForm.goldWithdrawn} grams of gold from ${customer.name}'s savings?`);
    setConfirmActionType('danger');
    setConfirmShowCheckbox(true);
    setConfirmOpen(true);
  };

  const handleResetPassword = (e) => {
    e.preventDefault();
    setConfirmAction(() => async () => {
      setSubmitting(true);
      try {
        const response = await api.post(`/customers/${id}/reset-password`, {
          password: resetForm.password
        });
        if (response.data.success) {
          showToast(response.data.message, 'success');
          setResetModalOpen(false);
          setResetForm({ password: '' });
        }
      } catch (error) {
        showToast(error.response?.data?.message || 'Failed to reset password.', 'error');
      } finally {
        setSubmitting(false);
      }
    });
    setConfirmMessage(`Are you sure you want to reset the password for ${customer.name}?`);
    setConfirmActionType('danger');
    setConfirmShowCheckbox(false);
    setConfirmOpen(true);
  };

  if (loading && !customer) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="space-y-4">
        <Link to="/admin/customers" className="text-slate-400 hover:text-gold-400 flex items-center gap-1.5 text-xs font-semibold uppercase">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Customers</span>
        </Link>
        <div className="bg-slate-950 border border-slate-900 rounded-xl p-8 text-center text-slate-500">
          Customer profile not found.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 font-sans">
      
      {/* Navigation Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <Link to="/admin/customers" className="text-slate-400 hover:text-gold-400 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Customers</span>
        </Link>
        
        {/* Quick Ledger Action buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => setDepositModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 hover:text-emerald-300 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-300"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Record Deposit</span>
          </button>
          <button
            onClick={() => setWithdrawModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-rose-950/80 border border-rose-500/30 text-rose-400 hover:text-rose-300 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-300"
          >
            <MinusCircle className="w-4 h-4" />
            <span>Deduct Balance</span>
          </button>
          <button
            onClick={() => setResetModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 border border-slate-800 hover:border-gold-500 text-slate-300 hover:text-gold-500 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-300"
          >
            <Key className="w-4 h-4" />
            <span>Reset Password</span>
          </button>
        </div>
      </div>

      {/* Grid: Profile Info & Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Ledger Balance Card */}
        <div className="lg:col-span-1 bg-slate-950 border border-slate-900 rounded-xl p-6 flex flex-col justify-between relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gold-500/5 rounded-full blur-2xl pointer-events-none"></div>
          <div>
            <span className="text-[10px] font-bold text-gold-500 bg-gold-500/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
              Customer Ledger Summary
            </span>
            <div className="space-y-4 mt-5">
              {/* <div>
                <p className="text-[10px] text-slate-500 uppercase font-semibold"> Gold Saved</p>
                <p className="text-xl font-bold text-slate-100 mt-0.5">{(customer.totalGold24k || 0).toFixed(4)} g</p>
              </div> */}
              
             
              <div className="border-t border-slate-900 pt-3">
                <p className="text-[10px] text-slate-500 uppercase font-semibold">Total Gold Saved</p>
                <p className="text-2xl font-black text-gold-500 mt-0.5">{(customer.totalGold || 0).toFixed(4)} g</p>
              </div>

              <div className="border-t border-slate-900 pt-3">
                <p className="text-[10px] text-slate-500 uppercase font-semibold">Total Gold Withdrawn</p>
                <p className="text-2xl font-black text-gold-500 mt-0.5">{(customer.totalWithdrawals || 0).toFixed(4)} g</p>
              </div>

              
              
            </div>
            
            <div className="border-t border-slate-900 pt-3 mt-4">
              <h3 className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Estimated Value</h3>
              <p className="text-xl font-bold text-yellow-500 mt-0.5">₹{customer.balance.toLocaleString('en-IN')}</p>
            </div>

            {customer.pendingAmount > 0 && (
              <div className="bg-amber-950/50 border border-amber-500/20 rounded-lg p-3 mt-4 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-amber-500 uppercase">Pending Approval</p>
                  <p className="text-sm font-bold text-slate-200">₹{customer.pendingAmount.toLocaleString('en-IN')}</p>
                </div>
                <div className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 border-t border-slate-900 pt-6 mt-6">
            <div>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Total Invested</p>
              <p className="text-sm font-bold text-slate-300">₹{(customer.totalMoneyInvested || 0).toLocaleString('en-IN')}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Total Withdrawals</p>
              <p className="text-sm font-bold text-slate-300">{(customer.totalWithdrawals || 0).toFixed(4)} g</p>
            </div>
          </div>
        </div>

        {/* Detailed Customer profile info */}
        <div className="lg:col-span-2 bg-slate-950 border border-slate-900 rounded-xl p-6 space-y-6">
          <div className="border-b border-slate-900 pb-3 flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <User className="w-4 h-4 text-gold-500" />
              <span>Customer Demographics</span>
            </h3>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              customer.status === 'Active' ? 'bg-emerald-950 text-emerald-400' : 'bg-rose-950 text-rose-400'
            }`}>
              {customer.status}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs text-slate-300">
            <div className="space-y-3.5">
              <div className="flex items-center gap-3">
                <FileText className="w-4 h-4 text-slate-500" />
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-semibold">Customer ID</p>
                  <p className="font-mono font-bold text-slate-200">{customer.customerId}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-slate-500" />
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-semibold">Full Name</p>
                  <p className="font-bold text-slate-200">{customer.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-slate-500" />
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-semibold">Mobile Number</p>
                  <p className="font-mono text-slate-200">{customer.mobile}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-slate-500" />
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-semibold">Email Address</p>
                  <p className="text-slate-200">{customer.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-slate-500" />
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-semibold">Date of Birth / Gender</p>
                  <p className="text-slate-200">
                    {customer.dob ? new Date(customer.dob).toLocaleDateString('en-IN') : 'N/A'} ({customer.gender})
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3.5">
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-slate-500 mt-0.5" />
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-semibold">Residential Address</p>
                  <p className="text-slate-200 leading-normal">
                    {customer.address || 'N/A'}<br />
                    {customer.city && `${customer.city}, `}
                    {customer.state && `${customer.state} `}
                    {customer.pincode && `- ${customer.pincode}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 border-t border-slate-900 pt-3">
                <User className="w-4 h-4 text-slate-500" />
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-semibold">Nominee Name</p>
                  <p className="font-bold text-slate-200">{customer.nomineeName || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-slate-500" />
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-semibold">Nominee Mobile</p>
                  <p className="font-mono text-slate-200">{customer.nomineeMobile || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 border-t border-slate-900 pt-3">
                <Calendar className="w-4 h-4 text-slate-500" />
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-semibold">Scheme Joining Date</p>
                  <p className="text-slate-200">{new Date(customer.joiningDate || customer.createdAt).toLocaleDateString('en-IN')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Unified Transaction History for this Customer */}
      <div className="bg-slate-950 border border-slate-900 rounded-xl overflow-hidden shadow-xl">
        <div className="px-6 py-5 border-b border-slate-900 bg-slate-950/60 flex flex-col md:flex-row gap-4 items-center justify-between">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Statement Ledger History</h3>
          
          <div className="relative w-full md:w-auto">
            <button
              onClick={() => setExportDropdownOpen(!exportDropdownOpen)}
              className="w-full md:w-auto px-4 py-1.5 gold-btn-gradient hover:shadow-lg text-slate-950 font-bold rounded-lg text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5"
            >
              <span>Export Ledger</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
            
            {exportDropdownOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setExportDropdownOpen(false)} />
                <div className="absolute right-0 mt-2 w-40 rounded-xl bg-slate-950 border border-slate-800 shadow-2xl z-20 py-1.5 overflow-hidden">
                  <button
                    onClick={() => { handleExport('PDF'); setExportDropdownOpen(false); }}
                    className="w-full text-left px-4 py-2.5 text-xs text-slate-300 hover:bg-slate-900 hover:text-slate-100 font-semibold transition-colors"
                  >
                    📄 Export as PDF
                  </button>
                  <button
                    onClick={() => { handleExport('CSV'); setExportDropdownOpen(false); }}
                    className="w-full text-left px-4 py-2.5 text-xs text-slate-300 hover:bg-slate-900 hover:text-slate-100 font-semibold transition-colors"
                  >
                    📊 Export as CSV
                  </button>
                  <button
                    onClick={() => { handleExport('Excel'); setExportDropdownOpen(false); }}
                    className="w-full text-left px-4 py-2.5 text-xs text-slate-300 hover:bg-slate-900 hover:text-slate-100 font-semibold transition-colors"
                  >
                    📈 Export as Excel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Filters Toolbar */}
        <div className="p-4 border-b border-slate-900 flex flex-wrap gap-3 items-center bg-slate-950">
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
        
        <div className="overflow-x-auto">
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
                <th className="p-4">Ref ID / Invoice</th>
                <th className="p-4">Created By</th>
                <th className="p-4">Remarks / Reason</th>
                <th className="p-4">Date / Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900 text-slate-300">
              {getFilteredTransactions().length > 0 ? (
                getFilteredTransactions().map((t) => (
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
                      {t.type === 'Withdrawal' ? (
                        <div className="flex flex-col">
                          <span className="font-semibold text-rose-400">Inv: {t.invoiceNumber || 'N/A'}</span>
                        </div>
                      ) : (
                        <span className="font-mono text-slate-500">{t.transactionId || 'N/A'}</span>
                      )}
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        t.createdBy === 'Admin' 
                          ? 'bg-blue-950 text-blue-400 border border-blue-500/20' 
                          : 'bg-purple-950 text-purple-400 border border-purple-500/20'
                      }`}>
                        {t.createdBy || 'Customer'}
                      </span>
                    </td>
                    <td className="p-4">
                      {t.type === 'Withdrawal' ? (
                        <div>
                          <p className="font-medium text-slate-200">{t.reason}</p>
                          {t.remarks && <p className="text-[10px] text-slate-500">{t.remarks}</p>}
                        </div>
                      ) : (
                        <p className="text-slate-400">{t.remarks || '-'}</p>
                      )}
                    </td>
                    <td className="p-4 text-slate-400 text-[10px] leading-tight">
                      <div>{t.date}</div>
                      <div className="text-[9px] text-slate-500 mt-0.5">{t.time}</div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="11" className="p-8 text-center text-slate-500 font-medium">No transaction history found for this account.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Record Shop Deposit (Method 1) */}
      {depositModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-slate-950 border border-gold-500/20 rounded-2xl overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-slate-900 flex justify-between items-center bg-slate-950/80">
              <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
                <PlusCircle className="w-4 h-4 text-emerald-400" />
                <span>Record Shop Deposit</span>
              </h3>
              <button onClick={() => setDepositModalOpen(false)} className="p-1 hover:bg-slate-900 rounded text-slate-400 hover:text-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleDepositSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Deposit Amount (₹) *</label>
                <input
                  type="number"
                  placeholder="Enter Cash or Online Amount"
                  value={depositForm.amount}
                  onChange={(e) => setDepositForm(prev => ({ ...prev, amount: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-800 focus:border-gold-500 text-slate-100 rounded-lg px-3 py-2 text-xs focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Gold Karat *</label>
                <select
                  value={depositForm.goldKarat}
                  onChange={(e) => setDepositForm(prev => ({ ...prev, goldKarat: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-800 focus:border-gold-500 text-slate-100 rounded-lg px-3 py-2 text-xs focus:outline-none"
                >
                  <option value="24K">24 Karat (99.9% Pure)</option>
                  <option value="22K">22 Karat (91.6% Pure)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Payment Method *</label>
                <select
                  value={depositForm.paymentMethod}
                  onChange={(e) => setDepositForm(prev => ({ ...prev, paymentMethod: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-800 focus:border-gold-500 text-slate-100 rounded-lg px-3 py-2 text-xs focus:outline-none"
                >
                  <option value="Cash">Cash</option>
                  <option value="Online">Online Transfer</option>
                </select>
              </div>

              {depositForm.paymentMethod === 'Online' && (
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Bank Transaction ID (Optional)</label>
                  <input
                    type="text"
                    placeholder="Enter UPI / Bank Txn Ref"
                    value={depositForm.transactionId}
                    onChange={(e) => setDepositForm(prev => ({ ...prev, transactionId: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-800 focus:border-gold-500 text-slate-100 rounded-lg px-3 py-2 text-xs focus:outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Internal Remarks (Optional)</label>
                <textarea
                  placeholder="Payment receipt remarks"
                  value={depositForm.remarks}
                  onChange={(e) => setDepositForm(prev => ({ ...prev, remarks: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-800 focus:border-gold-500 text-slate-100 rounded-lg px-3 py-2 text-xs focus:outline-none resize-none h-20"
                />
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-900 pt-4">
                <button
                  type="button"
                  onClick={() => setDepositModalOpen(false)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded-lg text-xs uppercase tracking-wider transition-all hover:shadow-lg hover:shadow-emerald-600/10 flex items-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                      <span>Saving...</span>
                    </>
                  ) : (
                    'Record Deposit'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Reduce Balance / Jewelry Purchase (Withdrawal) */}
      {withdrawModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-slate-950 border border-gold-500/20 rounded-2xl overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-slate-900 flex justify-between items-center bg-slate-950/80">
              <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
                <MinusCircle className="w-4 h-4 text-rose-400" />
                <span>Deduct Savings Balance</span>
              </h3>
              <button onClick={() => setWithdrawModalOpen(false)} className="p-1 hover:bg-slate-900 rounded text-slate-400 hover:text-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleWithdrawSubmit} className="p-6 space-y-4">
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 text-[11px] text-slate-400 space-y-1">
                <div className="flex justify-between">
                  <span>Available 24K Gold:</span>
                  <span className="font-bold text-gold-500">{(customer.totalGold24k || 0).toFixed(4)} g</span>
                </div>
                <div className="flex justify-between">
                  <span>Available 22K Gold:</span>
                  <span className="font-bold text-gold-400">{(customer.totalGold22k || 0).toFixed(4)} g</span>
                </div>
                <div className="flex justify-between border-t border-slate-800 pt-1.5 mt-1.5">
                  <span>Estimated Total Value:</span>
                  <span className="font-bold text-yellow-500">₹{customer.balance.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Grams of Gold to Deduct *</label>
                <input
                  type="number"
                  step="any"
                  placeholder="e.g. 1.25"
                  value={withdrawForm.goldWithdrawn}
                  onChange={(e) => setWithdrawForm(prev => ({ ...prev, goldWithdrawn: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-800 focus:border-gold-500 text-slate-100 rounded-lg px-3 py-2 text-xs focus:outline-none"
                  max={customer.totalGold}
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Remarks (Optional)</label>
                <textarea
                  placeholder="Transaction comments"
                  value={withdrawForm.remarks}
                  onChange={(e) => setWithdrawForm(prev => ({ ...prev, remarks: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-800 focus:border-gold-500 text-slate-100 rounded-lg px-3 py-2 text-xs focus:outline-none resize-none h-20"
                />
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-900 pt-4">
                <button
                  type="button"
                  onClick={() => setWithdrawModalOpen(false)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-slate-950 font-bold rounded-lg text-xs uppercase tracking-wider transition-all hover:shadow-lg flex items-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                      <span>Saving...</span>
                    </>
                  ) : (
                    'Deduct Balance'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Override Customer Password */}
      {resetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-slate-950 border border-gold-500/20 rounded-2xl overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-slate-900 flex justify-between items-center bg-slate-950/80">
              <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-gold-500" />
                <span>Override Account Password</span>
              </h3>
              <button onClick={() => setResetModalOpen(false)} className="p-1 hover:bg-slate-900 rounded text-slate-400 hover:text-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleResetPassword} className="p-6 space-y-4">
              <p className="text-xs text-slate-400 leading-normal">
                Set a new temporary password for the customer. They will receive the password via email and will be forced to change it on their next login attempt.
              </p>
              
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Temporary Password</label>
                <input
                  type="text"
                  placeholder="Leave blank to auto-generate"
                  value={resetForm.password}
                  onChange={(e) => setResetForm({ password: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 focus:border-gold-500 text-slate-100 rounded-lg px-3 py-2 text-xs focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-900 pt-4">
                <button
                  type="button"
                  onClick={() => setResetModalOpen(false)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 gold-btn-gradient text-slate-950 font-bold rounded-lg text-xs uppercase tracking-wider transition-all flex items-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                      <span>Updating...</span>
                    </>
                  ) : (
                    'Update & Email'
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
        showCheckbox={confirmShowCheckbox}
        checkboxLabel="Send WhatsApp Notification"
        checkboxDefaultChecked={true}
      />
    </div>
  );
};

export default CustomerProfile;
