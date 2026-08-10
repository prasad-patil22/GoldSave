import express from 'express';
import { recordWithdrawal, getWithdrawals } from '../controllers/withdrawalController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .post(protect, adminOnly, recordWithdrawal)
  .get(protect, getWithdrawals);

export default router;
