import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import DepositRequest from '../models/DepositRequest.js';
import Notification from '../models/Notification.js';
import GoldPriceHistory from '../models/GoldPriceHistory.js';

// @desc    Get Admin Dashboard Stats & Charts
// @route   GET /api/dashboard/admin
// @access  Private (Admin Only)
export const getAdminDashboard = async (req, res) => {
  try {
    const todayStr = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
    const thisMonthStr = todayStr.substring(0, 7); // YYYY-MM

    // 1. Core Card Metrics
    const totalCustomers = await User.countDocuments({ role: 'customer' });
    
    const activeGoldRate = await GoldPriceHistory.findOne().sort({ date: -1, createdAt: -1 });
    const price22k = activeGoldRate ? activeGoldRate.goldPrice22k : 0;
    const price24k = activeGoldRate ? activeGoldRate.goldPrice24k : 0;

    // Total savings in gold currently in system, grouped by karat
    const savingsResult = await User.aggregate([
      { $match: { role: 'customer' } },
      { $group: { 
          _id: null, 
          total: { $sum: '$totalGold' },
          total22k: { $sum: '$totalGold22k' },
          total24k: { $sum: '$totalGold24k' }
        } 
      }
    ]);
    const totalGoldSaved = savingsResult[0]?.total || 0;
    const totalGold22kSaved = savingsResult[0]?.total22k || 0;
    const totalGold24kSaved = savingsResult[0]?.total24k || 0;
    const totalSavings = (totalGold22kSaved * price22k) + (totalGold24kSaved * price24k);

    // Total approved deposits of all time
    const depositsResult = await Transaction.aggregate([
      { $match: { type: 'Deposit' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalDeposits = depositsResult[0]?.total || 0;

    // Total approved withdrawals of all time
    const withdrawalsResult = await Transaction.aggregate([
      { $match: { type: 'Withdrawal' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalWithdrawals = withdrawalsResult[0]?.total || 0;

    // Count of pending deposit requests
    const pendingDeposits = await DepositRequest.countDocuments({ status: 'Pending' });

    // Collection stats (Deposits only)
    const todayCollectionResult = await Transaction.aggregate([
      { $match: { type: 'Deposit', date: todayStr } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const todayCollection = todayCollectionResult[0]?.total || 0;

    const monthlyCollectionResult = await Transaction.aggregate([
      { $match: { type: 'Deposit', date: { $regex: `^${thisMonthStr}` } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const monthlyCollection = monthlyCollectionResult[0]?.total || 0;

    // 2. Recent Transactions (last 10)
    const recentTransactions = await Transaction.find()
      .sort({ createdAt: -1 })
      .limit(10);

    // 3. Chart Aggregations (Last 6 Months)
    // A. Monthly Collection Trend
    const collectionTrend = await Transaction.aggregate([
      { $match: { type: 'Deposit' } },
      {
        $group: {
          _id: { $substr: ['$date', 0, 7] }, // group by YYYY-MM
          amount: { $sum: '$amount' }
        }
      },
      { $sort: { _id: 1 } },
      { $limit: 6 }
    ]);

    // B. Customer Registration Growth Trend
    const growthTrend = await User.aggregate([
      { $match: { role: 'customer' } },
      {
        $group: {
          _id: { $substr: [{ $dateToString: { format: '%Y-%m', date: '$createdAt' } }, 0, 7] },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } },
      { $limit: 6 }
    ]);

    // Map trends to UI friendly format
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const formatTrendData = (trend, valueKey) => {
      return trend.map(item => {
        const [year, month] = item._id.split('-');
        const monthLabel = monthNames[parseInt(month) - 1] || month;
        return {
          month: `${monthLabel} ${year.substring(2)}`,
          [valueKey]: item[valueKey]
        };
      });
    };

    res.status(200).json({
      success: true,
      stats: {
        totalCustomers,
        totalSavings,
        totalGoldSaved,
        totalGold22kSaved,
        totalGold24kSaved,
        todayGoldPrice22k: price22k,
        todayGoldPrice24k: price24k,
        todayGoldPrice: price24k, // Default/fallback
        totalDeposits,
        totalWithdrawals,
        pendingDeposits,
        todayCollection,
        monthlyCollection,
      },
      recentTransactions,
      charts: {
        collectionTrend: formatTrendData(collectionTrend, 'amount'),
        growthTrend: formatTrendData(growthTrend, 'count')
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Customer Dashboard Info
// @route   GET /api/dashboard/customer
// @access  Private (Customer Only)
export const getCustomerDashboard = async (req, res) => {
  try {
    const customer = await User.findById(req.user._id);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found.' });
    }

    const activeGoldRate = await GoldPriceHistory.findOne().sort({ date: -1, createdAt: -1 });
    const price22k = activeGoldRate ? activeGoldRate.goldPrice22k : 0;
    const price24k = activeGoldRate ? activeGoldRate.goldPrice24k : 0;
    
    // Dynamic value based on both 22K and 24K balances
    const estimatedCurrentValue = parseFloat((
      (customer.totalGold22k || 0) * price22k +
      (customer.totalGold24k || 0) * price24k
    ).toFixed(2));

    const todayStr = new Date().toLocaleDateString('en-CA');
    const lastUpdateLocal = activeGoldRate ? new Date(activeGoldRate.updatedAt || activeGoldRate.createdAt).toLocaleDateString('en-CA') : '';
    const todayUpdated = activeGoldRate ? lastUpdateLocal === todayStr : false;

    // Get recent transactions for this customer
    const recentTransactions = await Transaction.find({ user: customer._id })
      .sort({ createdAt: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      stats: {
        id: customer._id,
        customerId: customer.customerId,
        name: customer.name,
        email: customer.email,
        mobile: customer.mobile,
        address: customer.address || '',
        city: customer.city || '',
        state: customer.state || '',
        pincode: customer.pincode || '',
        dob: customer.dob || '',
        gender: customer.gender || 'Male',
        nomineeName: customer.nomineeName || '',
        nomineeMobile: customer.nomineeMobile || '',
        totalGold: customer.totalGold,
        totalGold22k: customer.totalGold22k || 0,
        totalGold24k: customer.totalGold24k || 0,
        totalMoneyInvested: customer.totalMoneyInvested,
        todayGoldPrice22k: price22k,
        todayGoldPrice24k: price24k,
        todayGoldPrice: price24k, // Default/fallback
        todayUpdated,
        estimatedCurrentValue,
        balance: customer.balance, // Return stored cash balance (total cash invested)
        pendingAmount: customer.pendingAmount,
        totalDeposits: customer.totalDeposits,
        totalWithdrawals: customer.totalWithdrawals,
        status: customer.status,
        joiningDate: customer.joiningDate,
      },
      recentTransactions,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Customer Notifications
// @route   GET /api/dashboard/notifications
// @access  Private (Customer Only)
export const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(20);

    const unreadCount = await Notification.countDocuments({ user: req.user._id, read: false });

    res.status(200).json({
      success: true,
      notifications,
      unreadCount
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Mark Notifications as Read
// @route   PUT /api/dashboard/notifications/read
// @access  Private (Customer Only)
export const markNotificationsRead = async (req, res) => {
  try {
    await Notification.updateMany({ user: req.user._id, read: false }, { read: true });
    res.status(200).json({ success: true, message: 'Notifications marked as read.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
