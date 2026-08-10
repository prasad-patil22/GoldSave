import express from 'express';
import {
  getCustomers,
  addCustomer,
  getCustomerProfile,
  editCustomer,
  deleteCustomer,
  blockCustomer,
  activateCustomer,
  resetCustomerPassword,
  getCustomerTransactions,
} from '../controllers/customerController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

// Allow both Admins and corresponding Customers to view their transaction history
router.get('/:id/transactions', protect, getCustomerTransactions);

// All other customer management endpoints require Admin access
router.use(protect, adminOnly);

router.route('/')
  .get(getCustomers)
  .post(addCustomer);

router.route('/:id')
  .get(getCustomerProfile)
  .put(editCustomer)
  .delete(deleteCustomer);

router.patch('/:id/block', blockCustomer);
router.patch('/:id/activate', activateCustomer);
router.post('/:id/reset-password', resetCustomerPassword);

export default router;
