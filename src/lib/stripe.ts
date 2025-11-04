import Stripe from "stripe";

// Make Stripe optional - only initialize if STRIPE_SECRET_KEY is provided
export const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2024-06-20",
      typescript: true,
    })
  : null;
