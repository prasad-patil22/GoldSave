import mongoose from 'mongoose';

const GoldPriceHistorySchema = new mongoose.Schema({
  date: {
    type: String, // Format: YYYY-MM-DD
    required: true,
    unique: true, // Only one price should exist for each date
  },
  goldPrice22k: {
    type: Number,
    required: true,
    min: 0,
  },
  goldPrice24k: {
    type: Number,
    required: true,
    min: 0,
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true,
  }
}, {
  timestamps: true, // Stores Created Time (createdAt)
});

const GoldPriceHistory = mongoose.model('GoldPriceHistory', GoldPriceHistorySchema, 'goldpricehistories');
export default GoldPriceHistory;
