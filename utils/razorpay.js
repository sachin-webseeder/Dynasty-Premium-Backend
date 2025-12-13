// utils/razorpay.js
export const verifySignature = (payload, signature, secret) => {
  // Use crypto to verify
  const crypto = require('crypto');
  const shasum = crypto.createHmac('sha256', secret);
  shasum.update(payload);
  const digest = shasum.digest('hex');
  return digest === signature;
};