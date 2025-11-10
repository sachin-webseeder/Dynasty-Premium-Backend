// controllers/authController.js
import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import generateToken from '../utils/generateToken.js';
import asyncHandler from 'express-async-handler';

// Register new user
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

  // VALIDATIONS
  if (!firstName || !email || !password || !confirmPassword) {
    res.status(400);
    throw new Error('Please fill all required fields');
  }

  if (password !== confirmPassword) {
    res.status(400);
    throw new Error('Passwords do not match');
  }

  if (password.length < 6) {
    res.status(400);
    throw new Error('Password must be at least 6 characters');
  }

  // Check if user exists
  const userExists = await User.findOne({
    $or: [{ email }, { username }]
  });

  if (userExists) {
    res.status(400);
    throw new Error('User already exists with this email/username');
  }

  // Hash password
  const salt = await bcrypt.genSalt(12);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Create user
  const user = await User.create({
    firstName,
    lastName,
    username,
    email: email.toLowerCase(),
    password: hashedPassword,
    phone,
    role: role || 'Customer'
  });

  if (user) {
    res.status(201).json({
      success: true,
      token: generateToken(user._id, user.role),
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } else {
    res.status(400);
    throw new Error('Invalid user data');
  }
});

//   Login user
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ 
    $or: [{ email: email.toLowerCase() }, { username: email }] 
  });

  if (user && (await bcrypt.compare(password, user.password))) {
    res.json({
      success: true,
      token: generateToken(user._id, user.role),
      user: {
        id: user._id,
        firstName: user.firstName,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } else {
    res.status(401);
    throw new Error('Invalid email/username or password');
  }
});

export { registerUser, loginUser };