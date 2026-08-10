import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  let token;
  
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'savegold_super_secret_key_12345');
      
      if (decoded.role === 'admin') {
        req.user = await Admin.findById(decoded.id).select('-password');
        req.userRole = 'admin';
      } else if (decoded.role === 'customer') {
        req.user = await User.findById(decoded.id).select('-password');
        req.userRole = 'customer';
        
        // Prevent access if customer is blocked
        if (req.user && req.user.status === 'Blocked') {
          return res.status(403).json({
            success: false,
            message: 'Your account has been blocked by the administrator.',
          });
        }
      }
      
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Not authorized: User profile not found.',
        });
      }
      
      next();
    } catch (error) {
      console.error('Token validation error:', error.message);
      return res.status(401).json({
        success: false,
        message: 'Not authorized: Session expired or invalid token.',
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized: Login required.',
    });
  }
};

// Route protection for Admin only
export const adminOnly = (req, res, next) => {
  if (req.user && req.userRole === 'admin') {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: 'Access denied: Admin role required.',
    });
  }
};

// Route protection for Customer only
export const customerOnly = (req, res, next) => {
  if (req.user && req.userRole === 'customer') {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: 'Access denied: Customer role required.',
    });
  }
};
