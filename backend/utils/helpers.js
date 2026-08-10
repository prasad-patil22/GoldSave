import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import DepositRequest from '../models/DepositRequest.js';
import Withdrawal from '../models/Withdrawal.js';

// Sequential Customer ID Generator (GJ-1001, GJ-1002, etc.)
export const getNextCustomerId = async () => {
  const latestUser = await User.findOne({ customerId: /^GJ-\d+$/ }).sort({ customerId: -1 });
  if (!latestUser) return 'GJ-1001';
  const lastId = latestUser.customerId;
  const numericPart = parseInt(lastId.split('-')[1], 10);
  return `GJ-${numericPart + 1}`;
};

// Sequential Transaction Number Generator (GJTXN-100001, GJTXN-100002, etc.)
export const getNextTransactionNumber = async () => {
  const latestTxn = await Transaction.findOne({ transactionNumber: /^GJTXN-\d+$/ }).sort({ transactionNumber: -1 });
  if (!latestTxn) return 'GJTXN-100001';
  const lastNum = latestTxn.transactionNumber;
  const numericPart = parseInt(lastNum.split('-')[1], 10);
  return `GJTXN-${numericPart + 1}`;
};

// Sequential Deposit Request Number Generator (GJDEP-100001, GJDEP-100002, etc.)
export const getNextDepositRequestNumber = async () => {
  const latestReq = await DepositRequest.findOne({ transactionNumber: /^GJDEP-\d+$/ }).sort({ transactionNumber: -1 });
  if (!latestReq) return 'GJDEP-100001';
  const lastNum = latestReq.transactionNumber;
  const numericPart = parseInt(lastNum.split('-')[1], 10);
  return `GJDEP-${numericPart + 1}`;
};

// Sequential Withdrawal Number Generator (GJWTH-100001, GJWTH-100002, etc.)
export const getNextWithdrawalNumber = async () => {
  const latestWth = await Withdrawal.findOne({ withdrawalNumber: /^GJWTH-\d+$/ }).sort({ withdrawalNumber: -1 });
  if (!latestWth) return 'GJWTH-100001';
  const lastNum = latestWth.withdrawalNumber;
  const numericPart = parseInt(lastNum.split('-')[1], 10);
  return `GJWTH-${numericPart + 1}`;
};

// Generate an 8-character temporary password
export const generateTempPassword = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#';
  let password = '';
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

export const logAudit = async () => {};
