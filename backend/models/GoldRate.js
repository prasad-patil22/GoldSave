import mongoose from 'mongoose';

const GoldRateSchema = new mongoose.Schema({
  rate22k: {
    type: Number,
    required: true,
    min: 0,
  },
  rate24k: {
    type: Number,
    required: true,
    min: 0,
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
  }
}, {
  timestamps: true,
});

const GoldRate = mongoose.model('GoldRate', GoldRateSchema);
export default GoldRate;
