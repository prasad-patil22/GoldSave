import express from 'express';
import { getLatestGoldRate, updateGoldRate, getGoldRateHistory } from '../controllers/goldRateController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(getLatestGoldRate)
  .put(protect, adminOnly, updateGoldRate);

router.get('/history', protect, getGoldRateHistory);

export default router;
