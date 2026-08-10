import GoldPriceHistory from '../models/GoldPriceHistory.js';

// @desc    Get latest gold rate
// @route   GET /api/gold-rates
// @access  Public
export const getLatestGoldRate = async (req, res) => {
  try {
    const todayStr = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
    const goldRate = await GoldPriceHistory.findOne().sort({ date: -1, createdAt: -1 });
    if (!goldRate) {
      return res.status(404).json({ success: false, message: 'Gold price history not found.' });
    }
    // Check if the actual database update time is today (local time)
    const lastUpdateLocal = new Date(goldRate.updatedAt || goldRate.createdAt).toLocaleDateString('en-CA');
    
    res.status(200).json({
      success: true,
      goldRate,
      todayUpdated: lastUpdateLocal === todayStr,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update gold rate
// @route   PUT /api/gold-rates
// @access  Private (Admin Only)
export const updateGoldRate = async (req, res) => {
  try {
    const { goldPrice22k, goldPrice24k } = req.body;

    if (goldPrice22k === undefined || goldPrice24k === undefined) {
      return res.status(400).json({ success: false, message: 'Please specify both 22K and 24K gold rates.' });
    }

    const num22k = parseFloat(goldPrice22k);
    const num24k = parseFloat(goldPrice24k);

    if (isNaN(num22k) || num22k <= 0 || isNaN(num24k) || num24k <= 0) {
      return res.status(400).json({ success: false, message: 'Gold rates must be positive numbers.' });
    }

    const todayStr = new Date().toLocaleDateString('en-CA');

    // Only one price should exist for each date. Update if exists, otherwise create.
    let goldRate = await GoldPriceHistory.findOne({ date: todayStr });
    if (goldRate) {
      goldRate.goldPrice22k = num22k;
      goldRate.goldPrice24k = num24k;
      goldRate.updatedBy = req.user._id;
      await goldRate.save();
    } else {
      goldRate = await GoldPriceHistory.create({
        date: todayStr,
        goldPrice22k: num22k,
        goldPrice24k: num24k,
        updatedBy: req.user._id,
      });
    }

    // Recalculate any deposits recorded today using the new rate
    const User = (await import('../models/User.js')).default;
    const Transaction = (await import('../models/Transaction.js')).default;
    const DepositRequest = (await import('../models/DepositRequest.js')).default;

    const todayTxns = await Transaction.find({ type: 'Deposit', date: todayStr });
    for (const txn of todayTxns) {
      const todayPrice = txn.goldKarat === '22K' ? num22k : num24k;
      if (txn.goldPrice !== todayPrice) {
        const oldGold = txn.goldPurchased || 0;
        const newGold = parseFloat((txn.amount / todayPrice).toFixed(4));
        const diff = newGold - oldGold;

        // Update transaction
        txn.goldPrice = todayPrice;
        txn.goldPurchased = newGold;
        await txn.save();

        // Update customer balance
        const customer = await User.findById(txn.user);
        if (customer) {
          if (txn.goldKarat === '22K') {
            customer.totalGold22k = parseFloat((customer.totalGold22k + diff).toFixed(4));
          } else {
            customer.totalGold24k = parseFloat((customer.totalGold24k + diff).toFixed(4));
          }
          customer.totalGold = parseFloat((customer.totalGold22k + customer.totalGold24k).toFixed(4));
          await customer.save();
        }

        // Also update matching DepositRequest if it exists
        await DepositRequest.findOneAndUpdate(
          { transactionNumber: txn.transactionNumber },
          { goldPrice: todayPrice, goldPurchased: newGold }
        );
      }
    }

    res.status(201).json({
      success: true,
      message: 'Gold rates updated successfully.',
      goldRate,
      todayUpdated: true,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get gold price history
// @route   GET /api/gold-rates/history
// @access  Private (Admin & Customer)
export const getGoldRateHistory = async (req, res) => {
  try {
    const { date, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const query = {};
    if (date) {
      query.date = { $regex: date };
    }

    const total = await GoldPriceHistory.countDocuments(query);
    const history = await GoldPriceHistory.find(query)
      .populate('updatedBy', 'name email')
      .sort({ date: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      history,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
