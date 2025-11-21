// controllers/customerController.js
import User from "../models/User.js";
import asyncHandler from "express-async-handler";

//GET CUSTOMERS (Admin) OR MY PROFILE (Customer)
export const getCustomerData = asyncHandler(async (req, res) => {
  const { search, customerType, status } = req.query;

  // ADMIN: GET ALL CUSTOMERS
  if (req.user.role === "SuperAdmin" || req.user.role === "Admin") {
    let query = { role: "Customer" }; 

    // Search filter (name, email, phone)
    if (search && search.trim()) {
      query.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } }
      ];
    }

    // Customer type filter (high-value, returning, new)
    if (customerType && customerType !== "All") {
      query.customerType = customerType;
    }

    // Status filter (active/inactive) - Optional
    if (status && status !== "All Status") {
      query.isEnabled = status === "active";
    }

    const customers = await User.find(query)
      .select("firstName lastName email phone customerType totalOrders totalSpent lastOrder isEnabled createdAt")
      .sort({ createdAt: -1 });

    // Stats calculation
    const allCustomers = await User.countDocuments({ role: "Customer" });
    const activeCustomers = await User.countDocuments({ role: "Customer", isEnabled: true });
    const returningCustomers = await User.countDocuments({ 
      role: "Customer", 
      customerType: "Returning" 
    });
    const highValueCustomers = await User.countDocuments({ 
      role: "Customer", 
      customerType: "High-Value" 
    });

    const stats = {
      total: allCustomers,
      active: activeCustomers,
      inactive: allCustomers - activeCustomers,
      returning: returningCustomers,
      highValue: highValueCustomers
    };

    res.json({ 
      success: true, 
      view: "admin", 
      stats, 
      total: customers.length, 
      customers 
    });
  }

  // CUSTOMER: GET MY PROFILE
  else if (req.user.role === "Customer") {
    const customer = await User.findById(req.user._id)
      .select("-password")
      .populate("cart.product");

    if (!customer) {
      res.status(404);
      throw new Error("Customer not found");
    }

    res.json({ success: true, view: "customer", customer });
  }

  else {
    res.status(403);
    throw new Error("Access denied");
  }
});

// TOGGLE ENABLE/DISABLE (Admin only)
export const toggleCustomer = asyncHandler(async (req, res) => {
  if (!["SuperAdmin", "Admin"].includes(req.user.role)) {
    res.status(403);
    throw new Error("Access denied");
  }

  const customer = await User.findById(req.params.id);
  
  if (!customer) {
    res.status(404);
    throw new Error("Customer not found");
  }

  if (customer.role !== "Customer") {
    res.status(400);
    throw new Error("User is not a customer");
  }

  // Toggle isEnabled status
  customer.isEnabled = !customer.isEnabled;
  await customer.save();

  res.json({ 
    success: true, 
    message: `Customer ${customer.isEnabled ? 'enabled' : 'disabled'} successfully`,
    isEnabled: customer.isEnabled,
    status: customer.isEnabled ? 'active' : 'inactive'
  });
});


// UPDATE CUSTOMER (Customer = Self, Admin = Any)
export const updateCustomer = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, phone } = req.body;

 
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

  // Check if customer role is correct
  if (customer.role !== "Customer") {
    res.status(400);
    throw new Error("User is not a customer");
  }

  // Email uniqueness check
  if (email && email !== customer.email) {
    const exists = await User.findOne({ email, _id: { $ne: targetId } });
    if (exists) {
      res.status(400);
      throw new Error("Email already in use");
    }
  }

  // Phone uniqueness check
  if (phone && phone !== customer.phone) {
    const exists = await User.findOne({ phone, _id: { $ne: targetId } });
    if (exists) {
      res.status(400);
      throw new Error("Phone number already in use");
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
      customerType: customer.customerType,
      isEnabled: customer.isEnabled,
      status: customer.isEnabled ? 'active' : 'inactive'
    }
  });
});