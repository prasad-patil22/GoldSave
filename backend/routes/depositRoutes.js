import express from 'express';
import {
  addShopDeposit,
  submitOnlineDeposit,
  getPendingDeposits,
  approveDeposit,
  rejectDeposit,
  getDeposits,
} from '../controllers/depositController.js';
import { protect, adminOnly, customerOnly } from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

// General deposits route (filtered by roles within controllers)
router.get('/', protect, getDeposits);

// Admin only: Record direct shop deposit
router.post('/shop', protect, adminOnly, addShopDeposit);

// Customer only: Submit online deposit request with screenshot attachment
router.post('/online', protect, customerOnly, upload.single('screenshot'), submitOnlineDeposit);

// Admin only: Pending deposit list and resolution
router.get('/pending', protect, adminOnly, getPendingDeposits);
router.post('/requests/:id/approve', protect, adminOnly, approveDeposit);
router.post('/requests/:id/reject', protect, adminOnly, rejectDeposit);

export default router;
