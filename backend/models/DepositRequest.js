import mongoose from 'mongoose';

const DepositRequestSchema = new mongoose.Schema({
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
    enum: ['22K', '24K'],
    default: '24K',
  },
  goldPrice: {
    type: Number,
  },
  goldPurchased: {
    type: Number,
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
  screenshot: {
    type: String, // Store Cloudinary URL or local file path
  },
  remarks: {
    type: String,
    trim: true,
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending',
  },
  rejectionReason: {
    type: String,
    trim: true,
  },
  date: {
    type: String, // YYYY-MM-DD
    required: true,
  },
  time: {
    type: String, // HH:mm:ss
    required: true,
  },
  approvedOrRejectedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
  },
  actionDate: {
    type: Date,
  },
  createdBy: {
    type: String,
    enum: ['Admin', 'Customer'],
    default: 'Customer',
  }
}, {
  timestamps: true,
});

const DepositRequest = mongoose.model('DepositRequest', DepositRequestSchema, 'depositrequests');
export default DepositRequest;
