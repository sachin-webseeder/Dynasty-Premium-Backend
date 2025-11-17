// controllers/customerController.js
import User from "../models/User.js";
import asyncHandler from "express-async-handler";

// SINGLE API: GET CUSTOMERS (Admin) OR MY PROFILE (Customer)
export const getCustomerData = asyncHandler(async (req, res) => {
  const { search, customerType } = req.query;

  // ADMIN: GET ALL CUSTOMERS
  if (req.user.role === "SuperAdmin" || req.user.role === "Admin") {
    let query = { role: "Customer", isEnabled: true };

    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } }
      ];
    }
    if (customerType && customerType !== "All") query.customerType = customerType;

    const customers = await User.find(query)
      .select("firstName lastName email phone customerType totalOrders totalSpent lastOrder isEnabled")
      .sort({ createdAt: -1 });

    const stats = {
      total: await User.countDocuments({ role: "Customer", isEnabled: true }),
      active: await User.countDocuments({ role: "Customer", isEnabled: true }),
      returning: await User.countDocuments({ role: "Customer", customerType: "Returning" }),
      highValue: await User.countDocuments({ role: "Customer", customerType: "High-Value" })
    };

    res.json({ success: true, view: "admin", stats, total: customers.length, customers });
  }

  // CUSTOMER: GET MY PROFILE
  else if (req.user.role === "Customer") {
    const customer = await User.findById(req.user._id)
      .select("-password")
      .populate("cart.product");

    res.json({ success: true, view: "customer", customer });
  }

  else {
    res.status(403);
    throw new Error("Access denied");
  }
});

// TOGGLE ENABLE (Admin only)
export const toggleCustomer = asyncHandler(async (req, res) => {
  if (!["SuperAdmin", "Admin"].includes(req.user.role)) {
    res.status(403);
    throw new Error("Access denied");
  }

  const customer = await User.findById(req.params.id);
  if (!customer || customer.role !== "Customer") {
    res.status(404);
    throw new Error("Customer not found");
  }

  customer.isEnabled = !customer.isEnabled;
  await customer.save();

  res.json({ success: true, isEnabled: customer.isEnabled });
});


// UPDATE CUSTOMER (Customer = Self, Admin = Any)
export const updateCustomer = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, phone } = req.body;

  // Determine target ID
  let targetId;
  if (req.params.id) {
    // Admin updating any customer
    if (!["SuperAdmin", "Admin"].includes(req.user.role)) {
      res.status(403);
      throw new Error("Only Admin can update other customers");
    }
    targetId = req.params.id;
  } else {
    // Customer updating self
    if (req.user.role !== "Customer") {
      res.status(403);
      throw new Error("Only Customer can update self");
    }
    targetId = req.user._id;
  }

  const customer = await User.findById(targetId);
  if (!customer) {
    res.status(404);
    throw new Error("Customer not found");
  }

  // Email uniqueness check
  if (email && email !== customer.email) {
    const exists = await User.findOne({ email });
    if (exists) {
      res.status(400);
      throw new Error("Email already in use");
    }
  }

  // Update fields
  customer.firstName = firstName || customer.firstName;
  customer.lastName = lastName || customer.lastName || "";
  customer.email = email || customer.email;
  customer.phone = phone || customer.phone;

  await customer.save();

  res.json({
    success: true,
    message: "Profile updated successfully",
    customer: {
      _id: customer._id,
      firstName: customer.firstName,
      lastName: customer.lastName,
      email: customer.email,
      phone: customer.phone,
      customerType: customer.customerType
    }
  });
});