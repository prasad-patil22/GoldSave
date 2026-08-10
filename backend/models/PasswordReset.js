import mongoose from 'mongoose';

const PasswordResetSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'onModel',
  },
  onModel: {
    type: String,
    required: true,
    enum: ['Admin', 'User'],
  },
  token: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 3600, // Token expires in 1 hour
  }
}, {
  timestamps: true,
});

const PasswordReset = mongoose.model('PasswordReset', PasswordResetSchema, 'passwordresettokens');
export default PasswordReset;
