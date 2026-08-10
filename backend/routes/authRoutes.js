import express from 'express';
import {
  adminLogin,
  customerLogin,
  customerRegister,
  changeTempPassword,
  forgotPassword,
  resetPassword,
} from '../controllers/authController.js';
import { protect, customerOnly, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/admin/login', adminLogin);
router.post('/customer/login', customerLogin);
router.post('/customer/register', customerRegister);
router.post('/customer/change-temp-password', protect, customerOnly, changeTempPassword);
router.post('/admin/change-temp-password', protect, adminOnly, changeTempPassword);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);

export default router;
