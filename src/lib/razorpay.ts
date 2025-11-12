import Razorpay from "razorpay";

// Make Razorpay optional - only initialize if RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are provided
export const razorpay =
  process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET
    ? new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
      })
    : null;
