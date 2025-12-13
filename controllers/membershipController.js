// controllers/membershipController.js
import asyncHandler from "express-async-handler";
import MembershipPlan from "../models/MembershipPlan.js";
import UserSubscription from "../models/UserSubscription.js";
import Wallet from "../models/Wallet.js";
import Razorpay from "razorpay";
import crypto from "crypto"; // Required for Razorpay webhook signature verification

// --- Razorpay Setup ---
if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    console.error("RAZORPAY KEYS NOT FOUND IN .env");
    process.exit(1);
}
// Ensure RAZORPAY_WEBHOOK_SECRET is also set in .env for verification.

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// GET ALL PLANS (Mobile UI)
export const getAllPlans = asyncHandler(async (req, res) => {
    const plans = await MembershipPlan.find({ isActive: true }).sort({ durationDays: -1 });

    res.json({
        success: true,
        banner: "PREMIUM RENEWAL",
        subtitle: "Your exclusive benefits are about to end. Don't miss out!",
        exclusiveOffer: "KEEP UP TO 80% OFF",
        benefits: [
            "Milk & Coconut: Up to 40% OFF",
            "Other Items: Up to 80% OFF",
            "Ad-Free Experience"
        ],
        plans: plans.map(p => ({
            id: p._id,
            name: p.name,
            duration: `${p.durationDays} Days Plan`,
            originalPrice: p.originalPrice,
            discountPrice: p.discountPrice,
            discountPercent: p.discountPercent || Math.round((1 - p.discountPrice/p.originalPrice) * 100),
            savings: p.savingsText || `You Save ₹${p.originalPrice - p.discountPrice}`,
            isBestValue: p.isBestValue
        }))
    });
});

// GET SINGLE PLAN DETAIL
export const getPlanDetails = asyncHandler(async (req, res) => {
    const plan = await MembershipPlan.findById(req.params.id);
    if (!plan) return res.status(404).json({ success: false, message: "Plan not found" });

    const gst = Math.round(plan.discountPrice * 0.18);
    const total = plan.discountPrice + gst;

    res.json({
        success: true,
        plan: {
            name: plan.name,
            validity: `${plan.durationDays} Days`,
            benefits: plan.benefits
        },
        pricing: {
            planPrice: plan.discountPrice,
            couponSavings: plan.originalPrice - plan.discountPrice,
            gst,
            totalPayable: total
        }
    });
});

// PURCHASE PLAN (Razorpay / Wallet / COD)
export const purchasePlan = asyncHandler(async (req, res) => {
    const { planId, paymentMethod } = req.body;
    const plan = await MembershipPlan.findById(planId);
    if (!plan) return res.status(404).json({ success: false, message: "Plan not found" });

    const totalAmount = plan.discountPrice + Math.round(plan.discountPrice * 0.18);

    const subscription = await UserSubscription.create({
        user: req.user._id,
        plan: planId,
        endDate: new Date(Date.now() + plan.durationDays * 24 * 60 * 60 * 1000),
        amountPaid: totalAmount,
        paymentMethod,
        status: paymentMethod === "COD" ? "Pending" : "Processing"
    });

    if (paymentMethod === "Razorpay") {
        const order = await razorpay.orders.create({
            amount: totalAmount * 100, // Amount in paise
            currency: "INR",
            receipt: subscription._id.toString() // Use subscription ID as receipt
        });

        res.json({
            success: true,
            paymentType: "razorpay",
            orderId: order.id,
            amount: order.amount,
            key_id: process.env.RAZORPAY_KEY_ID
        });
    }
    else if (paymentMethod === "Wallet") {
        const wallet = await Wallet.findOneAndUpdate(
            { user: req.user._id, balance: { $gte: totalAmount } }, // Check balance atomically
            { 
                $inc: { balance: -totalAmount },
                $push: { 
                    transactions: { 
                        type: "debit", 
                        amount: totalAmount, 
                        description: "Premium Membership" 
                    }
                }
            },
            { new: true }
        );

        if (!wallet) return res.status(400).json({ success: false, message: "Insufficient wallet balance" });

        subscription.status = "Active";
        await subscription.save();

        res.json({ success: true, message: "Membership activated via wallet!" });
    }
    else if (paymentMethod === "COD") {
        res.json({ success: true, message: "Order placed! Pay on delivery." });
    }
});

// INITIALIZE WALLET TOP-UP (Razorpay Order Creation)
export const initializeWalletTopUp = asyncHandler(async (req, res) => {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
        return res.status(400).json({ success: false, message: "Invalid amount for top-up." });
    }

    const totalAmountInPaise = Math.round(amount * 100);

    const order = await razorpay.orders.create({
        amount: totalAmountInPaise, 
        currency: "INR",
        receipt: req.user._id.toString(), 
        notes: {
            type: "Wallet_TopUp", 
            userId: req.user._id.toString(),
        }
    });

    res.json({
        success: true,
        message: "Wallet top-up initiated.",
        paymentType: "razorpay",
        orderId: order.id,
        amount: order.amount,
        key_id: process.env.RAZORPAY_KEY_ID
    });
});

// ADMIN: CREATE NEW PLAN
export const createPlan = asyncHandler(async (req, res) => {
    const plan = await MembershipPlan.create(req.body);
    res.status(201).json({ success: true, message: "Plan created", plan });
});

// ADMIN: UPDATE PLAN
export const updatePlan = asyncHandler(async (req, res) => {
    const plan = await MembershipPlan.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
    );
    if (!plan) return res.status(404).json({ success: false, message: "Plan not found" });
    res.json({ success: true, message: "Plan updated", plan });
});

// RAZORPAY WEBHOOK (Handles both Purchase and Top-Up)
export const razorpayWebhook = asyncHandler(async (req, res) => { // Made it async
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

    // 1. Signature Verification
    const shasum = crypto.createHmac("sha256", secret);
    shasum.update(JSON.stringify(req.body));
    const digest = shasum.digest("hex");

    if (digest !== req.headers["x-razorpay-signature"]) {
        console.error("Razorpay Webhook Signature Mismatch!");
        return res.status(403).json({ success: false, message: "Signature verification failed" });
    }
    
    // 2. Process Event
    const event = req.body.event;
    const payload = req.body.payload;
    const payment = payload.payment.entity;

    if (event === "payment.captured") {
        const transactionType = payment.notes ? payment.notes.type : null;
        
        if (transactionType === "Wallet_TopUp") {
            // Logic for Wallet Top-Up
            const userId = payment.notes.userId;
            const amountPaid = payment.amount / 100; // Convert paise to rupees
            
            const wallet = await Wallet.findOneAndUpdate(
                { user: userId },
                { 
                    $inc: { balance: amountPaid },
                    $push: { 
                        transactions: { 
                            type: "credit", 
                            amount: amountPaid, 
                            description: "Wallet Top-up via Razorpay" 
                        }
                    }
                },
                { upsert: true, new: true } // Create Wallet if it doesn't exist
            );

            console.log(`Wallet Top-up successful for User ${userId}. New Balance: ${wallet.balance}`);

        } else {
            // Logic for Membership Purchase (Default)
            const receiptId = payment.receipt; // Contains UserSubscription ID
            const subscription = await UserSubscription.findById(receiptId);
            
            if (subscription) {
                subscription.status = "Active";
                subscription.razorpayOrderId = payment.order_id;
                subscription.razorpayPaymentId = payment.id;
                await subscription.save();
                console.log(`Subscription ${receiptId} activated successfully.`);
            } else {
                console.error(`Subscription ID not found for receipt: ${receiptId}`);
            }
        }
    }

    res.json({ status: "ok" });
});

// GET CUSTOMER WALLET BALANCE AND HISTORY
export const getWalletBalance = asyncHandler(async (req, res) => {
    // User ID 'req.user._id' se aayegi kyunki yeh route 'protect' hai
    const wallet = await Wallet.findOne({ user: req.user._id });

    // Agar Wallet object nahi mila, toh matlab balance 0 hai (ya abhi tak top-up/purchase nahi hua)
    if (!wallet) {
        return res.json({
            success: true,
            balance: 0,
            transactions: [],
            message: "Wallet not initialized. Balance is zero."
        });
    }

    // Agar wallet mila toh balance aur transactions return karein
    res.json({
        success: true,
        balance: wallet.balance || 0, // Ensure balance is 0 if field is missing/null
        transactions: wallet.transactions || [] // Transaction history bhejna
    });
});