import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import DepositRequest from '../models/DepositRequest.js';
import { getNextCustomerId, generateTempPassword, logAudit } from '../utils/helpers.js';
import { sendAdminCreatedCustomerEmail } from '../utils/emailService.js';

// @desc    Admin Creates Customer
// @route   POST /api/customers
// @access  Private (Admin Only)
export const addCustomer = async (req, res) => {
  try {
    const { name, mobile, email, address, city, state, pincode, dob, gender, nomineeName, nomineeMobile, temporaryPassword } = req.body;

    if (!name || !mobile) {
      return res.status(400).json({ success: false, message: 'Please provide at least Name and Mobile.' });
    }

    // Check duplicate email or mobile
    const conditions = [{ mobile }];
    if (email) {
      conditions.push({ email: email.toLowerCase() });
    }
    const duplicate = await User.findOne({ $or: conditions });
    if (duplicate) {
      return res.status(400).json({
        success: false,
        message: email && duplicate.email === email.toLowerCase() ? 'Email is already registered.' : 'Mobile number is already registered.',
      });
    }

    const customerId = await getNextCustomerId();
    const tempPassword = temporaryPassword || generateTempPassword();

    const customer = await User.create({
      customerId,
      name,
      mobile,
      email: email ? email.toLowerCase() : undefined,
      address,
      city,
      state,
      pincode,
      dob,
      gender,
      nomineeName,
      nomineeMobile,
      password: tempPassword,
      temporaryPassword: true, // Forces customer to update on first login
      status: 'Active',
    });

    // Send email with details and temporary password if email is provided
    if (customer.email) {
      await sendAdminCreatedCustomerEmail(customer, tempPassword);
    }

    await logAudit(
      req.user._id,
      'Admin',
      'Admin',
      req.user.name,
      'Create Customer',
      `Admin created customer account: ${customer.name} (${customerId})`,
      req
    );

    res.status(201).json({
      success: true,
      message: customer.email 
        ? `Customer ${customer.name} created successfully with ID ${customerId}. Temporary password sent via email.`
        : `Customer ${customer.name} created successfully with ID ${customerId}. Temporary Password: "${tempPassword}".`,
      customer: {
        id: customer._id,
        customerId: customer.customerId,
        name: customer.name,
        email: customer.email,
        mobile: customer.mobile,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Admin Edits Customer Profile
// @route   PUT /api/customers/:id
// @access  Private (Admin Only)
export const editCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, mobile, email, address, city, state, pincode, dob, gender, nomineeName, nomineeMobile } = req.body;

    const customer = await User.findById(id);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found.' });
    }

    // Check duplicate email/mobile on other accounts
    const conditions = [{ mobile }];
    if (email) {
      conditions.push({ email: email.toLowerCase() });
    }
    const duplicate = await User.findOne({
      $or: conditions,
      _id: { $ne: id },
    });

    if (duplicate) {
      return res.status(400).json({
        success: false,
        message: email && duplicate.email === email.toLowerCase() ? 'Email is already used by another customer.' : 'Mobile number is already used by another customer.',
      });
    }

    customer.name = name || customer.name;
    customer.mobile = mobile || customer.mobile;
    customer.email = email ? email.toLowerCase() : undefined;
    customer.address = address !== undefined ? address : customer.address;
    customer.city = city !== undefined ? city : customer.city;
    customer.state = state !== undefined ? state : customer.state;
    customer.pincode = pincode !== undefined ? pincode : customer.pincode;
    customer.dob = dob !== undefined ? dob : customer.dob;
    customer.gender = gender || customer.gender;
    customer.nomineeName = nomineeName !== undefined ? nomineeName : customer.nomineeName;
    customer.nomineeMobile = nomineeMobile !== undefined ? nomineeMobile : customer.nomineeMobile;

    await customer.save();

    await logAudit(
      req.user._id,
      'Admin',
      'Admin',
      req.user.name,
      'Edit Customer',
      `Admin updated details for customer: ${customer.name} (${customer.customerId})`,
      req
    );

    res.status(200).json({
      success: true,
      message: 'Customer details updated successfully.',
      customer,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Admin Deletes Customer
// @route   DELETE /api/customers/:id
// @access  Private (Admin Only)
export const deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;

    const customer = await User.findById(id);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found.' });
    }

    const customerName = customer.name;
    const customerId = customer.customerId;

    await User.findByIdAndDelete(id);

    // Delete associated transactions/requests if necessary, or keep them.
    // Usually in audit-heavy apps we keep transactions but mark customer as deleted, or delete clean.
    // Let's delete the customer document.
    await logAudit(
      req.user._id,
      'Admin',
      'Admin',
      req.user.name,
      'Delete Customer',
      `Admin deleted customer account: ${customerName} (${customerId})`,
      req
    );

    res.status(200).json({
      success: true,
      message: 'Customer account deleted successfully.',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Admin Blocks Customer Account
// @route   PATCH /api/customers/:id/block
// @access  Private (Admin Only)
export const blockCustomer = async (req, res) => {
  try {
    const { id } = req.params;

    const customer = await User.findById(id);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found.' });
    }

    customer.status = 'Blocked';
    await customer.save();

    await logAudit(
      req.user._id,
      'Admin',
      'Admin',
      req.user.name,
      'Block Customer',
      `Admin blocked customer account: ${customer.name} (${customer.customerId})`,
      req
    );

    res.status(200).json({
      success: true,
      message: 'Customer account successfully blocked.',
      customer,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Admin Activates Blocked Customer Account
// @route   PATCH /api/customers/:id/activate
// @access  Private (Admin Only)
export const activateCustomer = async (req, res) => {
  try {
    const { id } = req.params;

    const customer = await User.findById(id);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found.' });
    }

    customer.status = 'Active';
    await customer.save();

    await logAudit(
      req.user._id,
      'Admin',
      'Admin',
      req.user.name,
      'Activate Customer',
      `Admin activated customer account: ${customer.name} (${customer.customerId})`,
      req
    );

    res.status(200).json({
      success: true,
      message: 'Customer account successfully activated.',
      customer,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Single Customer Profile
// @route   GET /api/customers/:id
// @access  Private (Admin Only)
export const getCustomerProfile = async (req, res) => {
  try {
    const { id } = req.params;

    const customer = await User.findById(id);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found.' });
    }

    res.status(200).json({
      success: true,
      customer,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get List of Customers with Search and Pagination
// @route   GET /api/customers
// @access  Private (Admin Only)
export const getCustomers = async (req, res) => {
  try {
    const { search, status, page = 1, limit = 10 } = req.query;

    const query = {};

    if (status) {
      query.status = status;
    }

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { mobile: searchRegex },
        { customerId: searchRegex }
      ];
    }

    const skip = (page - 1) * limit;
    const total = await User.countDocuments(query);
    const customers = await User.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      customers,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Admin Resets Customer Password
// @route   POST /api/customers/:id/reset-password
// @access  Private (Admin Only)
export const resetCustomerPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body; // Custom password or auto-generated

    const customer = await User.findById(id);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found.' });
    }

    const tempPassword = password || generateTempPassword();

    customer.password = tempPassword;
    customer.temporaryPassword = true; // Customer must reset upon logging in
    await customer.save();

    // Send email with temporary password if email is provided
    if (customer.email) {
      await sendAdminCreatedCustomerEmail(customer, tempPassword);
    }

    await logAudit(
      req.user._id,
      'Admin',
      'Admin',
      req.user.name,
      'Reset Password',
      `Admin reset password for customer: ${customer.name} (${customer.customerId})`,
      req
    );

    res.status(200).json({
      success: true,
      message: customer.email
        ? `Password successfully reset. Temporary password "${tempPassword}" emailed to ${customer.email}.`
        : `Password successfully reset. Temporary Password: "${tempPassword}".`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get transactions for a specific customer
// @route   GET /api/customers/:id/transactions
// @access  Private (Admin & Customer)
export const getCustomerTransactions = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Safety check: customers can only view their own transactions
    if (req.userRole === 'customer' && req.user._id.toString() !== id) {
      return res.status(403).json({ success: false, message: 'Access denied: You can only view your own transactions.' });
    }

    const transactions = await Transaction.find({ user: id }).sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      transactions,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

