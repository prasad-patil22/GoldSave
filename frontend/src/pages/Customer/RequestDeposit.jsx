import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Wallet, Upload, ArrowRight, CheckCircle, Info, Landmark, QrCode } from 'lucide-react';

const RequestDeposit = () => {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [transactionId, setTransactionId] = useState('');
  const [remarks, setRemarks] = useState('');
  const [goldKarat, setGoldKarat] = useState('24K');
  
  // Image Upload State
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.size > 5 * 1024 * 1024) {
        showToast('File size must be under 5MB.', 'error');
        return;
      }
      setFile(selectedFile);
      setFilePreview(URL.createObjectURL(selectedFile));
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const selectedFile = e.dataTransfer.files[0];
    if (selectedFile) {
      if (selectedFile.size > 5 * 1024 * 1024) {
        showToast('File size must be under 5MB.', 'error');
        return;
      }
      setFile(selectedFile);
      setFilePreview(URL.createObjectURL(selectedFile));
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setFilePreview('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      showToast('Please enter a valid amount greater than zero.', 'error');
      return;
    }

    setSubmitting(true);
    
    // Use FormData for file uploading
    const formData = new FormData();
    formData.append('amount', amount);
    formData.append('paymentMethod', paymentMethod);
    formData.append('transactionId', transactionId);
    formData.append('remarks', remarks);
    formData.append('goldKarat', goldKarat);
    if (file) {
      formData.append('screenshot', file);
    }

    try {
      const response = await api.post('/deposits/online', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.success) {
        showToast('Deposit request submitted! Awaiting Admin verification.', 'success');
        navigate('/customer/dashboard');
      }
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to submit request.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Add Money (Online)</h1>
        <p className="text-xs text-slate-400">Transfer funds and upload transaction records for ledger updates</p>
      </div>

      {/* Centered Form */}
      <div className="max-w-2xl mx-auto bg-slate-950 border border-slate-900 rounded-xl p-6 shadow-2xl">
        <h3 className="text-xs font-bold text-gold-500 uppercase tracking-widest border-b border-slate-900 pb-2 flex items-center gap-1.5 mb-6">
          <Wallet className="w-4 h-4" />
          <span>Submit Verification Request</span>
        </h3>

          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Deposit Amount (₹) *</label>
                <input
                  type="number"
                  placeholder="Enter Transfer Amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 focus:border-gold-500 text-slate-100 rounded-lg px-3.5 py-2.5 text-xs focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Gold Karat *</label>
                <select
                  value={goldKarat}
                  onChange={(e) => setGoldKarat(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 focus:border-gold-500 text-slate-100 rounded-lg px-3.5 py-2.5 text-xs focus:outline-none"
                >
                  <option value="24K">24 Karat (99.9% Pure)</option>
                  <option value="22K">22 Karat (91.6% Pure)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Payment Method *</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => {
                    const val = e.target.value;
                    setPaymentMethod(val);
                    if (val === 'Cash') {
                      setTransactionId('');
                      setFile(null);
                      setFilePreview('');
                    }
                  }}
                  className="w-full bg-slate-900 border border-slate-800 focus:border-gold-500 text-slate-100 rounded-lg px-3.5 py-2.5 text-xs focus:outline-none"
                >
                  <option value="UPI">UPI (Google Pay/PhonePe/Paytm)</option>
                  <option value="Google Pay">Google Pay</option>
                  <option value="PhonePe">PhonePe</option>
                  <option value="Bank Transfer">Direct Bank IMPS / NEFT</option>
                  <option value="Cash">Cash (Physical Deposit at Shop)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {paymentMethod !== 'Cash' && (
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Transaction Reference ID (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="Enter Bank Txn Ref ID"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 focus:border-gold-500 text-slate-100 rounded-lg px-3.5 py-2.5 text-xs focus:outline-none font-mono"
                  />
                </div>
              )}

              <div className={paymentMethod === 'Cash' ? 'md:col-span-2' : ''}>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Remarks (Optional)</label>
                <input
                  type="text"
                  placeholder="Add deposit comments"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 focus:border-gold-500 text-slate-100 rounded-lg px-3.5 py-2.5 text-xs focus:outline-none"
                />
              </div>
            </div>

            {/* Drag & Drop Upload Screenshots or Cash Information */}
            {paymentMethod !== 'Cash' ? (
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Upload Payment Screenshot Proof (Optional)
                </label>
                
                {!filePreview ? (
                  <div
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-800 hover:border-gold-500/50 bg-slate-900/30 rounded-xl p-8 text-center cursor-pointer transition-colors duration-300 flex flex-col items-center gap-3"
                  >
                    <Upload className="w-8 h-8 text-slate-600 animate-bounce" />
                    <div>
                      <p className="text-xs font-bold text-slate-300">Drag & drop your payment receipt here</p>
                      <p className="text-[10px] text-slate-500 mt-1 leading-normal">JPEG, JPG, PNG, or WEBP (Max 5MB)</p>
                    </div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      className="hidden"
                      accept="image/*"
                    />
                  </div>
                ) : (
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-center gap-4 relative">
                    <img
                      src={filePreview}
                      alt="Receipt Screenshot Thumbnail"
                      className="w-20 h-20 rounded-lg object-cover border border-gold-500/10"
                    />
                    <div className="flex-grow text-center md:text-left">
                      <p className="text-xs font-bold text-slate-200 truncate">{file?.name}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">Size: {(file?.size / (1024 * 1024)).toFixed(2)} MB</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      className="px-3 py-1.5 bg-rose-950/50 border border-rose-500/20 text-rose-400 hover:text-rose-300 rounded text-[10px] uppercase font-bold transition-all"
                    >
                      Remove File
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-slate-900/40 border border-gold-500/10 rounded-xl p-5 flex gap-3.5 items-start">
                <Info className="w-5 h-5 text-gold-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-xs font-bold text-gold-500 uppercase tracking-wider">Physical Cash Deposit Notice</p>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Please visit our physical store location to pay your cash. After submitting this notice, visit the counter. The shop administrator will receive your cash, verify this request, and instantly credit the amount to your ledger balance.
                  </p>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full gold-btn-gradient text-slate-950 font-bold py-3.5 px-4 rounded-lg flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-gold-500/20 active:scale-95 transition-all duration-300 text-sm tracking-wider uppercase mt-4"
            >
              {submitting ? (
                <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>Submit Request</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

      </div>
    </div>
  );
};

export default RequestDeposit;
