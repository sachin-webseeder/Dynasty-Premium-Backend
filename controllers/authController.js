// controllers/authController.js
import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import generateToken from '../utils/generateToken.js';
import asyncHandler from 'express-async-handler';

// REGISTER USER
const registerUser = asyncHandler(async (req, res) => {
  const {
    firstName,
    lastName,
    username,
    email,
    password,
    confirmPassword,
    phone,
    role
  } = req.body;

  // Required fields
  if (!firstName || !email || !password || !confirmPassword) {
    return res.status(400).json({ success: false, message: "All fields are required" });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ success: false, message: "Passwords do not match" });
  }

  if (password.length < 6) {
    return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });
  }

  // Check if user already exists
  const userExists = await User.findOne({
    $or: [
      { email: email.toLowerCase() },
      { username: username }
    ]
  });

  if (userExists) {
    return res.status(400).json({ success: false, message: "User already exists" });
  }

  // Hash password
  const salt = await bcrypt.genSalt(12);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Create user
  const user = await User.create({
    firstName,
    lastName: lastName || "",
    username,
    email: email.toLowerCase(),
    password: hashedPassword,
    phone,
    role: role || "Customer"
  });

  res.status(201).json({
    success: true,
    message: "Registration successful",
    token: generateToken(user._id, user.role),
    user: {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      email: user.email,
      phone: user.phone,
      role: user.role
    }
  });
});

// LOGIN USER – YE WALA SABSE ZAROORI FIX
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Email/username empty check
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: "Email/Username and password are required"
    });
  }

  // Find user by email OR username + MUST include password field
  const user = await User.findOne({
    $or: [
      { email: email.toLowerCase() },
      { username: email }
    ]
  }).select("+password");   // ← YE LINE SABSE BADI FIX HAI!

  if (!user) {
    return res.status(401).json({
      success: false,
      message: "Invalid credentials"
    });
  }

  
  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    return res.status(401).json({
      success: false,
      message: "Invalid credentials"
    });
  }


  if (!user.isEnabled) {
    return res.status(403).json({
      success: false,
      message: "Account disabled. Contact admin."
    });
  }

  // SUCCESS – Send token
  res.json({
    success: true,
    message: "Login successful",
    token: generateToken(user._id, user.role),
    user: {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      email: user.email,
      phone: user.phone,
      role: user.role,
      permissions: user.permissions || []
    }
  });
});

export { registerUser, loginUser };