import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Check, X, Eye, Clock, User, Phone, Calendar, MessageSquare, AlertCircle } from 'lucide-react';

import DoubleConfirmModal from '../../components/DoubleConfirmModal';

const PendingDeposits = () => {
  const { showToast } = useToast();
  
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });

  // Lightbox State
  const [activeScreenshot, setActiveScreenshot] = useState(null);

  // Reject Modal State
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectId, setRejectId] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [actioningId, setActioningId] = useState('');

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmMessage, setConfirmMessage] = useState('');
  const [confirmActionType, setConfirmActionType] = useState('danger');
  const [confirmShowCheckbox, setConfirmShowCheckbox] = useState(false);

  const triggerWhatsApp = (mobile, message) => {
    if (!mobile) return;
    let cleanMobile = mobile.replace(/\D/g, '');
    if (cleanMobile.length === 10) {
      cleanMobile = '91' + cleanMobile;
    }
    const encodedText = encodeURIComponent(message);
    const url = `https://api.whatsapp.com/send?phone=${cleanMobile}&text=${encodedText}`;
    window.open(url, '_blank');
  };

  const fetchPendingRequests = async () => {
    setLoading(true);
    try {
      const response = await api.get('/deposits/pending', {
        params: { page, limit: 10 }
      });
      if (response.data.success) {
        setRequests(response.data.requests);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      showToast('Error loading pending deposits.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingRequests();
  }, [page]);

  const handleApprove = (id) => {
    const req = requests.find(r => r._id === id);
    if (!req) return;

    setConfirmAction(() => async (sendWhatsAppNotification) => {
      setActioningId(id);
      try {
        const response = await api.post(`/deposits/requests/${id}/approve`);
        if (response.data.success) {
          showToast(response.data.message, 'success');
          fetchPendingRequests();

          if (sendWhatsAppNotification) {
            const txn = response.data.transaction;
            const message = `Hello ${req.customerName},\n\nYour deposit has been successfully approved.\n\nDeposit Amount: ₹${txn.amount.toLocaleString('en-IN')}\nGold Karat: ${txn.goldKarat || '24K'}\nGold Price: ₹${(txn.goldPrice || 0).toLocaleString('en-IN')} per gram\nGold Purchased: ${(txn.goldPurchased || 0).toFixed(4)} g\nTotal Gold Saved: ${(response.data.totalGold || 0).toFixed(4)} g\n\nThank you for saving with Ganesh Jewellers.`;
            triggerWhatsApp(req.user?.mobile || '', message);
          }
        }
      } catch (error) {
        showToast(error.response?.data?.message || 'Approval failed.', 'error');
      } finally {
        setActioningId('');
      }
    });

    setConfirmMessage(`Are you sure you want to approve the deposit request of ₹${req.amount} from ${req.customerName}?`);
    setConfirmActionType('success');
    setConfirmShowCheckbox(true);
    setConfirmOpen(true);
  };

  const handleOpenReject = (id) => {
    setRejectId(id);
    setRejectReason('');
    setRejectModalOpen(true);
  };

  const handleRejectSubmit = (e) => {
    e.preventDefault();
    if (!rejectReason) {
      showToast('Please state a reason for rejection.', 'error');
      return;
    }

    const req = requests.find(r => r._id === rejectId);
    if (!req) return;

    setRejectModalOpen(false);

    setConfirmAction(() => async (sendWhatsAppNotification) => {
      setActioningId(rejectId);
      try {
        const response = await api.post(`/deposits/requests/${rejectId}/reject`, {
          reason: rejectReason
        });
        if (response.data.success) {
          showToast(response.data.message, 'success');
          fetchPendingRequests();

          if (sendWhatsAppNotification) {
            const message = `Hello ${req.customerName},\n\nYour deposit request of ₹${req.amount} has been rejected.\n\nReason:\n${rejectReason}\n\nThank you.`;
            triggerWhatsApp(req.user?.mobile || '', message);
          }
        }
      } catch (error) {
        showToast(error.response?.data?.message || 'Rejection failed.', 'error');
      } finally {
        setActioningId('');
      }
    });

    setConfirmMessage(`Are you sure you want to reject the deposit request of ₹${req.amount} from ${req.customerName}?`);
    setConfirmActionType('danger');
    setConfirmShowCheckbox(true);
    setConfirmOpen(true);
  };

  // Convert relative file upload URLs to absolute backend URLs for serving
  const getImageUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const backendBase = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:5000';
    return `${backendBase}${path}`;
  };

  return (
    <div className="space-y-6 font-sans">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Deposit Verification</h1>
        <p className="text-xs text-slate-400">Verify and approve online bank transfer and UPI deposit requests</p>
      </div>

      {/* Requests Table */}
      <div className="bg-slate-950 border border-slate-900 rounded-xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-900/60 text-slate-400 font-semibold uppercase border-b border-slate-900">
                <th className="p-4">Request #</th>
                <th className="p-4">Customer Details</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Karat</th>
                <th className="p-4">Payment Method</th>
                <th className="p-4">Bank Ref / ID</th>
                <th className="p-4">Attachment</th>
                <th className="p-4">Date / Time</th>
                <th className="p-4 text-center">Verification Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan="8" className="p-8 text-center">
                    <div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  </td>
                </tr>
              ) : requests.length > 0 ? (
                requests.map((r) => (
                  <tr key={r._id} className="hover:bg-slate-900/30 transition-colors">
                    <td className="p-4 font-mono font-bold text-gold-500">{r.transactionNumber}</td>
                    <td className="p-4">
                      <div className="font-semibold text-slate-200">{r.customerName}</div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">{r.user?.customerId || 'Self Registered'}</div>
                    </td>
                    <td className="p-4 font-bold text-slate-100">₹{r.amount.toLocaleString('en-IN')}</td>
                    <td className="p-4 font-bold text-gold-400">{r.goldKarat || '24K'}</td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 bg-slate-900 text-slate-300 rounded font-semibold">
                        {r.paymentMethod}
                      </span>
                    </td>
                    <td className="p-4 font-mono text-slate-400">{r.transactionId || 'N/A'}</td>
                    <td className="p-4">
                      {r.screenshot ? (
                        <button
                          onClick={() => setActiveScreenshot(getImageUrl(r.screenshot))}
                          className="flex items-center gap-1 text-[10px] font-bold text-gold-500 hover:text-gold-400 bg-gold-500/10 hover:bg-gold-500/20 px-2.5 py-1.5 rounded transition-all"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Proof</span>
                        </button>
                      ) : (
                        <span className="text-slate-500 italic">No Upload</span>
                      )}
                    </td>
                    <td className="p-4 text-slate-400">
                      <div>{r.date}</div>
                      <div className="text-[10px] text-slate-500">{r.time}</div>
                    </td>
                    <td className="p-4">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => handleApprove(r._id)}
                          disabled={actioningId === r._id}
                          className="p-2 bg-emerald-950 text-emerald-400 hover:text-emerald-300 border border-emerald-500/20 hover:border-emerald-500/40 disabled:opacity-50 rounded-lg transition-all"
                          title="Approve & Credit Balance"
                        >
                          {actioningId === r._id ? (
                            <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <Check className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => handleOpenReject(r._id)}
                          disabled={actioningId === r._id}
                          className="p-2 bg-rose-950 text-rose-400 hover:text-rose-300 border border-rose-500/20 hover:border-rose-500/40 disabled:opacity-50 rounded-lg transition-all"
                          title="Reject Request"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="p-8 text-center text-slate-500 font-medium flex items-center justify-center gap-2">
                    <Clock className="w-4 h-4 text-slate-600" />
                    <span>No pending deposit verification requests.</span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Lightbox / Screenshot Preview Modal */}
      {activeScreenshot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
          <div className="relative max-w-3xl w-full max-h-[85vh] flex flex-col items-center">
            <button
              onClick={() => setActiveScreenshot(null)}
              className="absolute -top-10 right-0 p-2 bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-100 rounded-full"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={activeScreenshot}
              alt="Payment Transaction Receipt Screenshot"
              className="max-w-full max-h-[80vh] rounded-xl object-contain border border-gold-500/20 shadow-2xl"
            />
          </div>
        </div>
      )}

      {/* Rejection Reason Modal */}
      {rejectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-slate-950 border border-gold-500/20 rounded-2xl overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-slate-900 flex justify-between items-center bg-slate-950/80">
              <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-rose-500" />
                <span>Specify Rejection Reason</span>
              </h3>
              <button onClick={() => setRejectModalOpen(false)} className="p-1 hover:bg-slate-900 rounded text-slate-400 hover:text-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleRejectSubmit} className="p-6 space-y-4">
              <p className="text-xs text-slate-400 leading-normal">
                Please provide the reason for rejecting this deposit request. The customer will see this message on their history log and will receive an email notice.
              </p>
              
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Reason for Rejection *</label>
                <textarea
                  placeholder="e.g. Transaction Reference ID mismatch or screenshot unreadable."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 focus:border-gold-500 text-slate-100 rounded-lg px-3 py-2 text-xs focus:outline-none resize-none h-24"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-900 pt-4">
                <button
                  type="button"
                  onClick={() => setRejectModalOpen(false)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-slate-950 font-bold rounded-lg text-xs uppercase tracking-wider transition-all"
                >
                  Reject Request
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

export default PendingDeposits;
