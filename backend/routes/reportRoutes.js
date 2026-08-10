import express from 'express';
import { exportCustomersReport, exportTransactionsReport } from '../controllers/reportController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect, adminOnly);

router.get('/customers/export', exportCustomersReport);
router.get('/transactions/export', exportTransactionsReport);

export default router;
