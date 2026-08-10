import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import Withdrawal from '../models/Withdrawal.js';
import GoldPriceHistory from '../models/GoldPriceHistory.js';
import { getNextTransactionNumber, getNextWithdrawalNumber, logAudit } from '../utils/helpers.js';
import { sendWithdrawalRecordedEmail } from '../utils/emailService.js';
import Notification from '../models/Notification.js';

// @desc    Admin reduces customer balance for jewellery purchase
// @route   POST /api/withdrawals
// @access  Private (Admin Only)
export const recordWithdrawal = async (req, res) => {
  try {
    const { customerId, goldWithdrawn, remarks, invoiceNumber = '', reason = 'Jewellery Purchase' } = req.body;

    if (!customerId || !goldWithdrawn) {
      return res.status(400).json({ success: false, message: 'Please provide Customer ID and Gold Grams to withdraw.' });
    }

    const customer = await User.findById(customerId);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found.' });
    }

    const activeGoldRate = await GoldPriceHistory.findOne().sort({ date: -1, createdAt: -1 });
    if (!activeGoldRate) {
      return res.status(400).json({ success: false, message: 'Gold price history has not been initialized. Please update gold rates.' });
    }

    const numGoldWithdrawn = parseFloat(goldWithdrawn);
    if (isNaN(numGoldWithdrawn) || numGoldWithdrawn <= 0) {
      return res.status(400).json({ success: false, message: 'Gold grams to withdraw must be greater than zero.' });
    }

    // Safety: Verify customer has sufficient total gold savings balance
    if (customer.totalGold < numGoldWithdrawn) {
      return res.status(400).json({ success: false, message: `Insufficient gold savings balance. Required: ${numGoldWithdrawn.toFixed(4)} g, Available: ${customer.totalGold.toFixed(4)} g` });
    }

    // Calculate approximate Rupee value for unified ledger using 24K gold price as a reference
    const goldPrice = activeGoldRate.goldPrice24k;
    const goldKarat = 'N/A';
    const amount = 0;

    const txnNumber = await getNextTransactionNumber();
    const wthNumber = await getNextWithdrawalNumber();
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-CA');
    const timeStr = now.toTimeString().split(' ')[0];

    // 1. Create Withdrawal Record (Karat is N/A)
    const withdrawal = await Withdrawal.create({
      withdrawalNumber: wthNumber,
      user: customer._id,
      customerName: customer.name,
      amount: amount,
      goldKarat: 'N/A',
      goldPrice,
      goldWithdrawn: numGoldWithdrawn,
      invoiceNumber: invoiceNumber || '',
      reason,
      remarks: remarks || '',
      createdBy: req.user._id,
      date: dateStr,
      time: timeStr
    });

    // 2. Create corresponding Transaction Record (Karat is N/A)
    const transaction = await Transaction.create({
      transactionNumber: txnNumber,
      user: customer._id,
      customerName: customer.name,
      amount: amount,
      goldKarat: 'N/A',
      goldPrice,
      goldPurchased: numGoldWithdrawn,
      type: 'Withdrawal',
      paymentMethod: 'Online',
      remarks: remarks || 'Gold Savings Deduction',
      createdBy: 'Admin',
      date: dateStr,
      time: timeStr,
      invoiceNumber: invoiceNumber || '',
      reason,
      status: 'Approved'
    });

    // 3. Update customer balance: deduct grams from holdings (prioritizing 24K, then 22K)
    let gramsToDeduct = numGoldWithdrawn;
    if (customer.totalGold24k >= gramsToDeduct) {
      customer.totalGold24k = parseFloat((customer.totalGold24k - gramsToDeduct).toFixed(4));
      gramsToDeduct = 0;
    } else {
      gramsToDeduct = parseFloat((gramsToDeduct - customer.totalGold24k).toFixed(4));
      customer.totalGold24k = 0;
      customer.totalGold22k = parseFloat((customer.totalGold22k - gramsToDeduct).toFixed(4));
    }

    customer.totalGold = parseFloat((customer.totalGold22k + customer.totalGold24k).toFixed(4));
    
    // Accumulate withdrawals in grams
    customer.totalWithdrawals = parseFloat((customer.totalWithdrawals + numGoldWithdrawn).toFixed(4));
    await customer.save();

    // 4. Create database notification
    await Notification.create({
      user: customer._id,
      title: 'Savings Withdrawn',
      message: `Hello ${customer.name},\n\nYour purchase deduction of ${numGoldWithdrawn.toFixed(4)} g of ${goldKarat} gold has been successfully recorded.\n\nGold Price: ₹${goldPrice.toLocaleString('en-IN')} per gram\nRemaining Gold Saved: ${customer.totalGold.toFixed(4)} g (22K: ${customer.totalGold22k.toFixed(4)} g, 24K: ${customer.totalGold24k.toFixed(4)} g)`,
    });

    // 5. Send Email Notification
    await sendWithdrawalRecordedEmail(customer, transaction);

    // 6. Log audit
    await logAudit(
      req.user._id,
      'Admin',
      'Admin',
      req.user.name,
      'Record Withdrawal',
      `Admin recorded gold savings deduction of ${numGoldWithdrawn.toFixed(4)} g of ${goldKarat} gold for customer: ${customer.name}`,
      req
    );

    res.status(201).json({
      success: true,
      message: `Deduction of ${numGoldWithdrawn.toFixed(4)} g recorded successfully.`,
      withdrawal,
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

// @desc    Get withdrawal records
// @route   GET /api/withdrawals
// @access  Private (Admin & Customer)
export const getWithdrawals = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const query = {};
    if (req.userRole === 'customer') {
      query.user = req.user._id;
    }

    const total = await Withdrawal.countDocuments(query);
    const withdrawals = await Withdrawal.find(query)
      .populate('user', 'name customerId mobile email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      withdrawals,
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
