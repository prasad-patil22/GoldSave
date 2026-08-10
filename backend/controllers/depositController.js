import fs from 'fs';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import DepositRequest from '../models/DepositRequest.js';
import GoldPriceHistory from '../models/GoldPriceHistory.js';
import { getNextTransactionNumber, getNextDepositRequestNumber, logAudit } from '../utils/helpers.js';
import { isCloudinaryConfigured, cloudinary } from '../config/cloudinary.js';
import { sendDepositApprovedEmail, sendDepositRejectedEmail } from '../utils/emailService.js';
import Notification from '../models/Notification.js';

// Helper to handle image uploads to Cloudinary or fallback to local disk
const processScreenshot = async (file) => {
  if (!file) return '';
  
  if (isCloudinaryConfigured) {
    try {
      const result = await cloudinary.uploader.upload(file.path, {
        folder: 'savegold_payments',
      });
      // Delete temporary file from local uploads folder
      fs.unlinkSync(file.path);
      return result.secure_url;
    } catch (error) {
      console.error('Cloudinary upload failure, using local file path fallback:', error.message);
      return `/uploads/${file.filename}`;
    }
  } else {
    // Serve from the static /uploads folder
    return `/uploads/${file.filename}`;
  }
};

// @desc    Admin records cash/online shop deposit (Immediately Approved)
// @route   POST /api/deposits/shop
// @access  Private (Admin Only)
export const addShopDeposit = async (req, res) => {
  try {
    const { customerId, amount, paymentMethod, transactionId, remarks, goldKarat = '24K' } = req.body;

    if (!customerId || !amount || !paymentMethod) {
      return res.status(400).json({ success: false, message: 'Please provide Customer ID, Amount, and Payment Method.' });
    }

    if (goldKarat !== '22K' && goldKarat !== '24K') {
      return res.status(400).json({ success: false, message: 'Invalid gold Karat. Must be 22K or 24K.' });
    }

    const customer = await User.findById(customerId);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found.' });
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Amount must be greater than zero.' });
    }

    const activeGoldRate = await GoldPriceHistory.findOne().sort({ date: -1, createdAt: -1 });
    if (!activeGoldRate) {
      return res.status(400).json({ success: false, message: 'Gold price history has not been initialized. Please update gold rates.' });
    }
    
    const goldPrice = goldKarat === '22K' ? activeGoldRate.goldPrice22k : activeGoldRate.goldPrice24k;
    const goldPurchased = parseFloat((numAmount / goldPrice).toFixed(4));

    const txnNumber = await getNextTransactionNumber();
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-CA'); // YYYY-MM-DD format
    const timeStr = now.toTimeString().split(' ')[0]; // HH:MM:SS format

    // 1. Create completed transaction record
    const transaction = await Transaction.create({
      transactionNumber: txnNumber,
      user: customer._id,
      customerName: customer.name,
      amount: numAmount,
      goldKarat,
      goldPrice,
      goldPurchased,
      type: 'Deposit',
      paymentMethod,
      transactionId: transactionId || '',
      remarks: remarks || '',
      createdBy: 'Admin',
      date: dateStr,
      time: timeStr,
      status: 'Approved'
    });

    // 2. Also create an approved DepositRequest so it shows up in customer deposit history
    const reqNumber = await getNextDepositRequestNumber();
    await DepositRequest.create({
      transactionNumber: reqNumber,
      user: customer._id,
      customerName: customer.name,
      amount: numAmount,
      goldKarat,
      goldPrice,
      goldPurchased,
      paymentMethod,
      transactionId: transactionId || '',
      remarks: remarks || '',
      status: 'Approved',
      createdBy: 'Admin',
      date: dateStr,
      time: timeStr,
      approvedOrRejectedBy: req.user._id,
      actionDate: now
    });

    // 2. Add gold to customer stats instantly
    if (goldKarat === '22K') {
      customer.totalGold22k = parseFloat((customer.totalGold22k + goldPurchased).toFixed(4));
    } else {
      customer.totalGold24k = parseFloat((customer.totalGold24k + goldPurchased).toFixed(4));
    }
    customer.totalGold = parseFloat((customer.totalGold22k + customer.totalGold24k).toFixed(4));
    customer.totalMoneyInvested += numAmount;
    
    // Update balance by adding the deposit amount directly (accumulating total cash invested)
    customer.balance = parseFloat((customer.balance + numAmount).toFixed(2));
    customer.totalDeposits += numAmount;
    await customer.save();

    // 3. Create database notification
    await Notification.create({
      user: customer._id,
      title: 'Deposit Credited',
      message: `Hello ${customer.name},\n\nYour deposit has been successfully added.\n\nDeposit Amount: ₹${numAmount.toLocaleString('en-IN')}\nGold Karat: ${goldKarat}\nGold Price: ₹${goldPrice.toLocaleString('en-IN')} per gram\nGold Purchased: ${goldPurchased.toFixed(4)} g\nTotal Gold Saved: ${customer.totalGold.toFixed(4)} g (22K: ${customer.totalGold22k.toFixed(4)} g, 24K: ${customer.totalGold24k.toFixed(4)} g)\n\nThank you for saving with Ganesh Jewellers.`,
    });

    // 4. Send Email Notification
    await sendDepositApprovedEmail(customer, transaction);

    // 5. Log audit
    await logAudit(
      req.user._id,
      'Admin',
      'Admin',
      req.user.name,
      'Add Shop Deposit',
      `Admin recorded immediate shop deposit of ₹${numAmount} for customer: ${customer.name} (${customer.customerId})`,
      req
    );

    res.status(201).json({
      success: true,
      message: `Deposit of ₹${numAmount} successfully recorded. Customer balance updated.`,
      transaction,
      customerBalance: customer.balance,
      totalGold: customer.totalGold,
      totalGold22k: customer.totalGold22k,
      totalGold24k: customer.totalGold24k
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Customer submits online deposit request (Pending)
// @route   POST /api/deposits/online
// @access  Private (Customer Only)
export const submitOnlineDeposit = async (req, res) => {
  try {
    const { amount, paymentMethod, transactionId, remarks, goldKarat = '24K' } = req.body;

    if (!amount || !paymentMethod) {
      // If upload failed or was aborted, cleanup the uploaded file
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({ success: false, message: 'Please provide Amount and Payment Method.' });
    }

    if (goldKarat !== '22K' && goldKarat !== '24K') {
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({ success: false, message: 'Invalid gold Karat. Must be 22K or 24K.' });
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({ success: false, message: 'Amount must be greater than zero.' });
    }

    const screenshotUrl = await processScreenshot(req.file);

    const reqNumber = await getNextDepositRequestNumber();
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-CA');
    const timeStr = now.toTimeString().split(' ')[0];

    const customer = await User.findById(req.user._id);

    // 1. Create Deposit Request
    const depositRequest = await DepositRequest.create({
      transactionNumber: reqNumber,
      user: customer._id,
      customerName: customer.name,
      amount: numAmount,
      goldKarat,
      paymentMethod,
      transactionId: transactionId || '',
      screenshot: screenshotUrl,
      remarks: remarks || '',
      status: 'Pending',
      date: dateStr,
      time: timeStr
    });

    // 2. Increase pending balance, do NOT increase actual balance
    customer.pendingAmount += numAmount;
    await customer.save();

    // 3. Log audit
    await logAudit(
      customer._id,
      'User',
      'Customer',
      customer.name,
      'Submit Deposit Request',
      `Customer submitted online deposit request of ₹${numAmount} (${reqNumber})`,
      req
    );

    res.status(201).json({
      success: true,
      message: 'Deposit request submitted successfully. Pending Admin verification.',
      depositRequest
    });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Admin lists pending deposit requests
// @route   GET /api/deposits/pending
// @access  Private (Admin Only)
export const getPendingDeposits = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const total = await DepositRequest.countDocuments({ status: 'Pending' });
    const requests = await DepositRequest.find({ status: 'Pending' })
      .populate('user', 'customerId mobile email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      requests,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Admin approves deposit request
// @route   POST /api/deposits/requests/:id/approve
// @access  Private (Admin Only)
export const approveDeposit = async (req, res) => {
  try {
    const { id } = req.params;

    const depositRequest = await DepositRequest.findById(id);
    if (!depositRequest) {
      return res.status(404).json({ success: false, message: 'Deposit request not found.' });
    }

    if (depositRequest.status !== 'Pending') {
      return res.status(400).json({ success: false, message: 'This request is already resolved.' });
    }

    const customer = await User.findById(depositRequest.user);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer account not found.' });
    }

    const activeGoldRate = await GoldPriceHistory.findOne().sort({ date: -1, createdAt: -1 });
    if (!activeGoldRate) {
      return res.status(400).json({ success: false, message: 'Gold price history has not been initialized. Please update gold rates.' });
    }
    const goldKarat = depositRequest.goldKarat || '24K';
    const goldPrice = goldKarat === '22K' ? activeGoldRate.goldPrice22k : activeGoldRate.goldPrice24k;
    const goldPurchased = parseFloat((depositRequest.amount / goldPrice).toFixed(4));

    const txnNumber = await getNextTransactionNumber();
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-CA');
    const timeStr = now.toTimeString().split(' ')[0];

    // 1. Create Transaction record
    const transaction = await Transaction.create({
      transactionNumber: txnNumber,
      user: customer._id,
      customerName: customer.name,
      amount: depositRequest.amount,
      goldKarat,
      goldPrice,
      goldPurchased,
      type: 'Deposit',
      paymentMethod: depositRequest.paymentMethod,
      transactionId: depositRequest.transactionId,
      screenshot: depositRequest.screenshot,
      remarks: depositRequest.remarks,
      createdBy: 'Customer', // Requested by customer, approved by admin
      date: dateStr,
      time: timeStr,
      status: 'Approved'
    });

    // 2. Update Deposit Request status
    depositRequest.status = 'Approved';
    depositRequest.goldPrice = goldPrice;
    depositRequest.goldPurchased = goldPurchased;
    depositRequest.approvedOrRejectedBy = req.user._id;
    depositRequest.actionDate = now;
    await depositRequest.save();

    // 3. Adjust customer balances
    if (goldKarat === '22K') {
      customer.totalGold22k = parseFloat((customer.totalGold22k + goldPurchased).toFixed(4));
    } else {
      customer.totalGold24k = parseFloat((customer.totalGold24k + goldPurchased).toFixed(4));
    }
    customer.totalGold = parseFloat((customer.totalGold22k + customer.totalGold24k).toFixed(4));
    customer.totalMoneyInvested += depositRequest.amount;
    // Update balance by adding the deposit amount directly (accumulating total cash invested)
    customer.balance = parseFloat((customer.balance + depositRequest.amount).toFixed(2));
    customer.totalDeposits += depositRequest.amount;
    customer.pendingAmount = Math.max(0, customer.pendingAmount - depositRequest.amount);
    await customer.save();

    // 4. Notify customer via DB
    await Notification.create({
      user: customer._id,
      title: 'Online Deposit Approved',
      message: `Hello ${customer.name},\n\nYour deposit has been successfully added.\n\nDeposit Amount: ₹${depositRequest.amount.toLocaleString('en-IN')}\nGold Karat: ${goldKarat}\nGold Price: ₹${goldPrice.toLocaleString('en-IN')} per gram\nGold Purchased: ${goldPurchased.toFixed(4)} g\nTotal Gold Saved: ${customer.totalGold.toFixed(4)} g (22K: ${customer.totalGold22k.toFixed(4)} g, 24K: ${customer.totalGold24k.toFixed(4)} g)\n\nThank you for saving with Ganesh Jewellers.`,
    });

    // 5. Send email notification
    await sendDepositApprovedEmail(customer, transaction);

    // 6. Log audit
    await logAudit(
      req.user._id,
      'Admin',
      'Admin',
      req.user.name,
      'Approve Deposit Request',
      `Admin approved deposit request ${depositRequest.transactionNumber} of ₹${depositRequest.amount} for customer: ${customer.name}`,
      req
    );

    res.status(200).json({
      success: true,
      message: 'Deposit request approved. Balance updated.',
      transaction,
      customerBalance: customer.balance,
      totalGold: customer.totalGold,
      totalGold22k: customer.totalGold22k,
      totalGold24k: customer.totalGold24k
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Admin rejects deposit request
// @route   POST /api/deposits/requests/:id/reject
// @access  Private (Admin Only)
export const rejectDeposit = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ success: false, message: 'Please specify the rejection reason.' });
    }

    const depositRequest = await DepositRequest.findById(id);
    if (!depositRequest) {
      return res.status(404).json({ success: false, message: 'Deposit request not found.' });
    }

    if (depositRequest.status !== 'Pending') {
      return res.status(400).json({ success: false, message: 'This request is already resolved.' });
    }

    const customer = await User.findById(depositRequest.user);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer account not found.' });
    }

    const now = new Date();

    // 1. Update Request
    depositRequest.status = 'Rejected';
    depositRequest.rejectionReason = reason;
    depositRequest.approvedOrRejectedBy = req.user._id;
    depositRequest.actionDate = now;
    await depositRequest.save();

    // 2. Reduce customer pending amount, actual balance stays same
    customer.pendingAmount = Math.max(0, customer.pendingAmount - depositRequest.amount);
    await customer.save();

    // 3. Notify customer via DB
    await Notification.create({
      user: customer._id,
      title: 'Online Deposit Rejected',
      message: `Your deposit request of ₹${depositRequest.amount} was rejected. Reason: ${reason}`,
    });

    // 4. Send email notification
    await sendDepositRejectedEmail(customer, depositRequest);

    // 5. Log audit
    await logAudit(
      req.user._id,
      'Admin',
      'Admin',
      req.user.name,
      'Reject Deposit Request',
      `Admin rejected deposit request ${depositRequest.transactionNumber} of ₹${depositRequest.amount} for customer: ${customer.name}. Reason: ${reason}`,
      req
    );

    res.status(200).json({
      success: true,
      message: 'Deposit request rejected and customer was notified.',
      depositRequest
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get complete deposit list (Pending + Resolved)
// @route   GET /api/deposits
// @access  Private (Admin & Customer)
export const getDeposits = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const query = {};
    if (req.userRole === 'customer') {
      query.user = req.user._id;
    }
    if (status) {
      query.status = status;
    }

    const total = await DepositRequest.countDocuments(query);
    const deposits = await DepositRequest.find(query)
      .populate('user', 'name customerId mobile email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      deposits,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
