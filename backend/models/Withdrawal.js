import mongoose from 'mongoose';

const WithdrawalSchema = new mongoose.Schema({
  withdrawalNumber: {
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
  goldWithdrawn: {
    type: Number,
  },
  invoiceNumber: {
    type: String,
    required: false,
    trim: true,
  },
  reason: {
    type: String,
    required: true,
    trim: true,
  },
  remarks: {
    type: String,
    trim: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true,
  },
  date: {
    type: String, // YYYY-MM-DD
    required: true,
  },
  time: {
    type: String, // HH:mm:ss
    required: true,
  }
}, {
  timestamps: true,
});

const Withdrawal = mongoose.model('Withdrawal', WithdrawalSchema, 'withdrawals');
export default Withdrawal;
