import mongoose from 'mongoose';

const TransactionSchema = new mongoose.Schema({
  transactionNumber: {
    type: String,
    unique: true,
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  customerName: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  goldKarat: {
    type: String,
    default: '24K',
  },
  goldPrice: {
    type: Number,
  },
  goldPurchased: {
    type: Number,
  },
  type: {
    type: String,
    enum: ['Deposit', 'Withdrawal'],
    required: true,
  },
  paymentMethod: {
    type: String,
    enum: ['Cash', 'Online', 'UPI', 'Google Pay', 'PhonePe', 'Bank Transfer'],
    required: true,
  },
  transactionId: {
    type: String,
    trim: true,
  },
  status: {
    type: String,
    enum: ['Approved'],
    default: 'Approved',
  },
  remarks: {
    type: String,
    trim: true,
  },
  createdBy: {
    type: String,
    enum: ['Admin', 'Customer'],
    required: true,
  },
  date: {
    type: String, // Format: YYYY-MM-DD
    required: true,
  },
  time: {
    type: String, // Format: HH:mm:ss
    required: true,
  },
  invoiceNumber: {
    type: String,
    trim: true,
  },
  reason: {
    type: String, // Reason for withdrawal/purchase
    trim: true,
  },
  screenshot: {
    type: String, // Image URL
  }
}, {
  timestamps: true,
});

const Transaction = mongoose.model('Transaction', TransactionSchema, 'transactions');
export default Transaction;
