import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';
import User from '../models/User.js';
import PasswordReset from '../models/PasswordReset.js';
import { sendAdminCreatedCustomerEmail, sendWelcomeEmail, sendForgotPasswordEmail, sendPasswordResetSuccessEmail } from '../utils/emailService.js';
import { logAudit } from '../utils/helpers.js';

const generateToken = (id, role) => {
  return jwt.sign(
    { id, role },
    process.env.JWT_SECRET || 'savegold_super_secret_key_12345',
    { expiresIn: process.env.JWT_EXPIRE || '30d' }
  );
};

// @desc    Admin Login
// @route   POST /api/auth/admin/login
// @access  Public
export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password.' });
    }

    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const isMatch = await admin.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const token = generateToken(admin._id, 'admin');

    await logAudit(admin._id, 'Admin', 'Admin', admin.name, 'Login', 'Admin logged in successfully', req);

    res.status(200).json({
      success: true,
      token,
      user: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: 'admin',
        temporaryPassword: admin.temporaryPassword,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Customer Login
// @route   POST /api/auth/customer/login
// @access  Public
export const customerLogin = async (req, res) => {
  try {
    const { identifier, password } = req.body; // identifier can be email or mobile

    if (!identifier || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email/mobile and password.' });
    }

    // Find customer by email OR mobile
    const customer = await User.findOne({
      $or: [{ email: identifier.trim().toLowerCase() }, { mobile: identifier.trim() }],
    });

    if (!customer) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    if (customer.status === 'Blocked') {
      return res.status(403).json({ success: false, message: 'Your account has been blocked by the administrator.' });
    }

    const isMatch = await customer.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const token = generateToken(customer._id, 'customer');

    await logAudit(customer._id, 'User', 'Customer', customer.name, 'Login', 'Customer logged in successfully', req);

    res.status(200).json({
      success: true,
      token,
      user: {
        id: customer._id,
        customerId: customer.customerId,
        name: customer.name,
        email: customer.email,
        mobile: customer.mobile,
        role: 'customer',
        temporaryPassword: customer.temporaryPassword,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Customer Self Registration
// @route   POST /api/auth/customer/register
// @access  Public
export const customerRegister = async (req, res) => {
  try {
    const { name, mobile, email, password, address, city, state, pincode, dob, gender, nomineeName, nomineeMobile } = req.body;

    if (!name || !mobile || !password) {
      return res.status(400).json({ success: false, message: 'Required fields: Name, Mobile, and Password.' });
    }

    // Check duplicate mobile
    const existingMobile = await User.findOne({ mobile });
    if (existingMobile) {
      return res.status(400).json({ success: false, message: 'Mobile number already registered.' });
    }

    // Check duplicate email (if provided)
    if (email) {
      const existingEmail = await User.findOne({ email: email.toLowerCase() });
      if (existingEmail) {
        return res.status(400).json({ success: false, message: 'Email already registered.' });
      }
    }

    // Generate Customer ID (GJ-XXXX)
    const { getNextCustomerId } = await import('../utils/helpers.js');
    const customerId = await getNextCustomerId();

    const customer = await User.create({
      customerId,
      name,
      mobile,
      email: email ? email.toLowerCase() : undefined,
      password,
      address,
      city,
      state,
      pincode,
      dob,
      gender,
      nomineeName,
      nomineeMobile,
      temporaryPassword: false, // Self-registered customers do not have temporary passwords
      status: 'Active',
    });

    const token = generateToken(customer._id, 'customer');

    // Send Welcome Email if email exists
    if (customer.email) {
      await sendWelcomeEmail(customer);
    }

    await logAudit(customer._id, 'User', 'Customer', customer.name, 'Register', 'Customer self-registered account', req);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: customer._id,
        customerId: customer.customerId,
        name: customer.name,
        email: customer.email,
        mobile: customer.mobile,
        role: 'customer',
        temporaryPassword: false,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Force Change Password on First Login (For Admin-created accounts / temporary passwords)
// @route   POST /api/auth/customer/change-temp-password or /api/auth/admin/change-temp-password
// @access  Private
export const changeTempPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
    }

    let account;
    if (req.userRole === 'admin') {
      account = await Admin.findById(req.user._id);
    } else {
      account = await User.findById(req.user._id);
    }

    if (!account) {
      return res.status(404).json({ success: false, message: 'Account not found.' });
    }

    account.password = newPassword;
    account.temporaryPassword = false;
    await account.save();

    await logAudit(
      account._id,
      req.userRole === 'admin' ? 'Admin' : 'User',
      req.userRole === 'admin' ? 'Admin' : 'Customer',
      account.name,
      'Password Change',
      'Temporary password changed on login',
      req
    );

    res.status(200).json({
      success: true,
      message: 'Password successfully updated. You can now access your dashboard.',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Forgot Password Request
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res) => {
  try {
    const { email, role } = req.body; // role can be admin or customer

    if (!email) {
      return res.status(400).json({ success: false, message: 'Please provide your email address.' });
    }

    let account;
    let onModel;
    if (role === 'admin') {
      account = await Admin.findOne({ email: email.toLowerCase() });
      onModel = 'Admin';
    } else {
      account = await User.findOne({ email: email.toLowerCase() });
      onModel = 'User';
    }

    if (!account) {
      // Return 200 for security, preventing account enumeration
      return res.status(200).json({ success: true, message: 'If a matching account exists, a temporary password code has been sent.' });
    }

    // Generate an 8-character uppercase temporary password code
    const tempCode = crypto.randomBytes(4).toString('hex').toUpperCase();

    // Update password and set temporaryPassword flag to true
    account.password = tempCode;
    account.temporaryPassword = true;
    await account.save();

    await sendForgotPasswordEmail(account, tempCode);

    // Audit Log
    await logAudit(
      account._id,
      onModel,
      role === 'admin' ? 'Admin' : 'Customer',
      account.name,
      'Forgot Password',
      'Temporary password code generated and sent via email',
      req
    );

    res.status(200).json({
      success: true,
      message: 'Temporary password code sent to your email.',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Reset Password
// @route   POST /api/auth/reset-password/:token
// @access  Public
export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password, role } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find valid token
    const tokenRecord = await PasswordReset.findOne({ token: hashedToken, onModel: role === 'admin' ? 'Admin' : 'User' });
    if (!tokenRecord) {
      return res.status(400).json({ success: false, message: 'Invalid or expired password reset token.' });
    }

    let account;
    if (role === 'admin') {
      account = await Admin.findById(tokenRecord.user);
    } else {
      account = await User.findById(tokenRecord.user);
    }

    if (!account) {
      return res.status(404).json({ success: false, message: 'Account not found.' });
    }

    // Update password
    account.password = password;
    if (role === 'customer') {
      account.temporaryPassword = false;
    }
    await account.save();

    // Delete token
    await PasswordReset.deleteOne({ _id: tokenRecord._id });

    // Send confirmation email
    await sendPasswordResetSuccessEmail(account);

    await logAudit(
      account._id,
      role === 'admin' ? 'Admin' : 'User',
      role === 'admin' ? 'Admin' : 'Customer',
      account.name,
      'Password Reset',
      'Password reset completed via token',
      req
    );

    res.status(200).json({
      success: true,
      message: 'Password successfully updated. You can now log in.',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
