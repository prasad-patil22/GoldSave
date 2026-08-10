import express from 'express';
import {
  getAdminDashboard,
  getCustomerDashboard,
  getNotifications,
  markNotificationsRead,
} from '../controllers/dashboardController.js';
import { protect, adminOnly, customerOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/admin', protect, adminOnly, getAdminDashboard);
router.get('/customer', protect, customerOnly, getCustomerDashboard);
router.get('/notifications', protect, customerOnly, getNotifications);
router.put('/notifications/read', protect, customerOnly, markNotificationsRead);

export default router;
