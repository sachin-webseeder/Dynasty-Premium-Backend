// controllers/userController.js
import User from "../models/User.js";
import asyncHandler from "express-async-handler";
import bcrypt from "bcryptjs";

export const PANEL_PERMISSIONS = [
  "dashboard", "inventory", "orders", "delivery", "customers", "reports", "products", "settings" ,"userManagement","profile",
 "membership", "analytics", "auditLogs", "userManagement", "billing","content", "wallet", "helpSupport", "apiAccess"
];

// GET ALL USERS
export const getAllPanelUsers = asyncHandler(async (req, res) => {
  const users = await User.find({ role: "PanelUser" })
    .select("firstName lastName fullName email phone role panelAccess permissions isEnabled createdAt")
    .sort({ createdAt: -1 });

  const stats = {
    totalUsers: await User.countDocuments(),
    admins: await User.countDocuments({ role: "Admin" }),
    panelUsers: await User.countDocuments({ role: "PanelUser" }),
    customers: await User.countDocuments({ role: "Customer" })
  };

  res.json({
    success: true,
    stats,
    permissionsList: PANEL_PERMISSIONS,
    users: users.map(u => ({
      id: u._id,
      name: u.fullName,
      firstName: u.firstName,
      lastName: u.lastName,
      email: u.email,
      phone: u.phone,
      role: u.role,
      permissions: u.permissions,
      isEnabled: u.isEnabled,
      createdAt: u.createdAt
    }))
  });
});


// CREATE MULTIPLE PANEL USERS (Admin Only)
export const createPanelUser = asyncHandler(async (req, res) => {
  const { firstName, lastName = "", email, phone, password, permissions = ["dashboard", "orders"] } = req.body;

  // Compulsory fields check
  if (!firstName || !email || !phone || !password) {
    return res.status(400).json({
      success: false,
      message: "firstName, email, phone and password are required"
    });
  }

  // Clean data
  const cleanEmail = email.toLowerCase().trim();
  const cleanPhone = phone.trim();

  // Check if already exists
  const exists = await User.findOne({
    $or: [{ email: cleanEmail }, { phone: cleanPhone }]
  });

  if (exists) {
    return res.status(400).json({
      success: false,
     message: "Panel User already exists",
    });
  }

  // Hash password
  const salt = await bcrypt.genSalt(12);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Create PanelUser
  const user = await User.create({
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    email: cleanEmail,
    phone: cleanPhone,
    password: hashedPassword,
    role: "PanelUser",
    panelAccess: true,
    permissions: permissions
  });

  res.status(201).json({
    success: true,
    message: "Panel User created successfully",
    user: {
      id: user._id,
      name: user.fullName,
      email: user.email,
      phone: user.phone,
      role: "PanelUser",
      permissions: user.permissions,
      panelAccess: true
    }
  });
});

// UPDATE PANEL USER
export const updatePanelUser = asyncHandler(async (req, res) => {
  const { permissions, isEnabled } = req.body;
  const user = await User.findById(req.params.id);

  if (!user) return res.status(404).json({ success: false, message: "User not found" });
  if (user.role === "Admin") return res.status(403).json({ success: false, message: "Cannot modify Admin" });

  if (permissions) user.permissions = permissions;
  if (isEnabled !== undefined) user.isEnabled = isEnabled;

  await user.save();
  res.json({ success: true, message: "Panel User updated" });
});

// DELETE PANEL USER
export const deletePanelUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ success: false, message: "User not found" });
  if (user.role === "Admin") return res.status(403).json({ success: false, message: "Cannot delete Admin" });

  await User.deleteOne({ _id: req.params.id });
  res.json({ success: true, message: "Panel User deleted" });
});