// middleware/auth.js
import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';
import User from '../models/User.js';


// PROTECT - Verify JWT Token
const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith('Bearer')) {
    try {
      // Extract token
      token = req.headers.authorization.split(' ')[1];
      
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from token
      req.user = await User.findById(decoded.id).select('-password');
      
      if (!req.user) {
        res.status(401);
        throw new Error('Not authorized, user not found');
      }

      // ✅ Optional: Check if Customer account is disabled
      if (req.user.role === 'Customer' && !req.user.isEnabled) {
        res.status(403);
        throw new Error('Your account is temporarily disabled. Please contact support.');
      }

      next();
    } catch (error) {
      res.status(401);
      throw new Error(error.message || 'Not authorized, token failed');
    }
  } else {
    res.status(401);
    throw new Error('Not authorized, no token');
  }
});


// AUTHORIZE - Check User Role
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      res.status(401);
      throw new Error('Not authorized');
    }
    
    if (!roles.includes(req.user.role)) {
      res.status(403);
      throw new Error(`Forbidden: ${req.user.role} role is not authorized to access this route`);
    }
    
    next();
  };
};


// CHECK CUSTOMER ENABLED (Optional - for specific routes)
const checkCustomerEnabled = asyncHandler(async (req, res, next) => {
  // Only check for Customer role
  if (req.user && req.user.role === 'Customer') {
    if (!req.user.isEnabled) {
      res.status(403);
      throw new Error(
        'Your account is temporarily disabled. Please contact support at support@example.com or call +91-XXXXXXXXXX'
      );
    }
  }
  next();
});

export { protect, authorize, checkCustomerEnabled };