// middleware/auth.js
import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';
import User from '../models/User.js';

// PROTECT ROUTE - Verify Token & Attach User
const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Attach full user (with permissions & panelAccess)
      req.user = await User.findById(decoded.id).select('-password');
      
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'User not found' });
      }

      // Block disabled users (except SuperAdmin)
      if (!req.user.isEnabled && req.user.role !== "SuperAdmin") {
        return res.status(403).json({
          success: false,
          message: "Your account is disabled. Contact admin."
        });
      }

      next();
    } catch (error) {
      return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }
  } else {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }
});

// AUTHORIZE BY ROLE (SuperAdmin, Admin, PanelUser, Customer)
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. ${req.user.role} not allowed here.`
      });
    }

    next();
  };
};

// AUTHORIZE BY PERMISSION (Only for Panel Users & Admin)
const authorizePermission = (...requiredPermissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    // SuperAdmin bypass all permission checks
    if (req.user.role === "SuperAdmin") {
      return next();
    }

    // Customer & non-panel users blocked
    if (!req.user.panelAccess) {
      return res.status(403).json({
        success: false,
        message: "You don't have panel access"
      });
    }

    // Check if user has at least one required permission
    const hasPermission = requiredPermissions.some(perm => 
      req.user.permissions.includes(perm)
    );

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: "Insufficient permissions"
      });
    }

    next();
  };
};

// OPTIONAL: Block Disabled Customers on Mobile Routes
const checkCustomerEnabled = (req, res, next) => {
  if (req.user?.role === "Customer" && !req.user.isEnabled) {
    return res.status(403).json({
      success: false,
      message: "Your account is disabled. Contact support."
    });
  }
  next();
};

export { 
  protect, 
  authorize, 
  authorizePermission, 
  checkCustomerEnabled 
};