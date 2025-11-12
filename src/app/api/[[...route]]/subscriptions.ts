import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { verifyAuth } from "@hono/auth-js";
import crypto from "crypto";

import { checkIsActive } from "@/features/subscriptions/lib";

import { razorpay } from "@/lib/razorpay";
import { db } from "@/db/drizzle";
import { subscriptions } from "@/db/schema";

const app = new Hono()
  .post("/billing", verifyAuth(), async (c) => {
    // Return error if Razorpay is not configured
    if (!razorpay) {
      return c.json({ error: "Razorpay is not configured" }, 503);
    }

    const auth = c.get("authUser");

    if (!auth.token?.id) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, auth.token.id));

    if (!subscription) {
      return c.json({ error: "No subscription found" }, 404);
    }

    // Razorpay doesn't have a billing portal like Stripe
    // You can redirect to your custom billing management page
    const billingUrl = `${process.env.NEXT_PUBLIC_APP_URL}/billing`;

    return c.json({ data: billingUrl });
  })
  .get("/current", verifyAuth(), async (c) => {
    const auth = c.get("authUser");

    if (!auth.token?.id) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, auth.token.id));

    const active = checkIsActive(subscription);

    return c.json({
      data: {
        ...subscription,
        active: razorpay ? active : true, // If Razorpay is disabled, treat as active
      },
    });
  })
  .post("/checkout", verifyAuth(), async (c) => {
    // Return error if Razorpay is not configured
    if (!razorpay) {
      return c.json({ error: "Razorpay is not configured" }, 503);
    }

    const auth = c.get("authUser");

    if (!auth.token?.id) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    // Create Razorpay subscription
    const plan = await razorpay.plans.fetch(process.env.RAZORPAY_PLAN_ID!);

    const subscriptionData: any = await razorpay.subscriptions.create({
      plan_id: process.env.RAZORPAY_PLAN_ID!,
      customer_notify: 1,
      total_count: 12, // 12 billing cycles (1 year if monthly)
      notes: {
        userId: auth.token.id,
        email: auth.token.email || "",
      },
    } as any);

    // Return subscription details to frontend
    return c.json({
      data: {
        subscriptionId: subscriptionData.id,
        planId: subscriptionData.plan_id,
        amount: plan.item.amount,
        currency: plan.item.currency,
      },
    });
  })
  .post("/verify", verifyAuth(), async (c) => {
    // Return error if Razorpay is not configured
    if (!razorpay) {
      return c.json({ error: "Razorpay is not configured" }, 503);
    }

    const auth = c.get("authUser");

    if (!auth.token?.id) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const body = await c.req.json();
    const {
      razorpay_payment_id,
      razorpay_subscription_id,
      razorpay_signature,
    } = body;

    // Verify signature
    const text = razorpay_payment_id + "|" + razorpay_subscription_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(text)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return c.json({ error: "Invalid signature" }, 400);
    }

    // Fetch subscription details
    const subscription = await razorpay.subscriptions.fetch(
      razorpay_subscription_id
    );

    // Store subscription in database
    await db.insert(subscriptions).values({
      status: subscription.status,
      userId: auth.token.id,
      subscriptionId: subscription.id,
      customerId: subscription.customer_id || "",
      priceId: subscription.plan_id,
      currentPeriodEnd: new Date(subscription.current_end! * 1000),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return c.json({ success: true });
  })
  .post("/webhook", async (c) => {
    // Return error if Razorpay is not configured
    if (!razorpay) {
      return c.json({ error: "Razorpay is not configured" }, 503);
    }

    const body = await c.req.text();
    const signature = c.req.header("X-Razorpay-Signature") as string;

    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET!)
      .update(body)
      .digest("hex");

    if (expectedSignature !== signature) {
      return c.json({ error: "Invalid signature" }, 400);
    }

    const event = JSON.parse(body);

    // Handle subscription.charged event (successful payment)
    if (event.event === "subscription.charged") {
      const subscription = event.payload.subscription.entity;
      const payment = event.payload.payment.entity;

      // Update subscription in database
      const [existingSubscription] = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.subscriptionId, subscription.id));

      if (existingSubscription) {
        await db
          .update(subscriptions)
          .set({
            status: subscription.status,
            currentPeriodEnd: new Date(subscription.current_end * 1000),
            updatedAt: new Date(),
          })
          .where(eq(subscriptions.subscriptionId, subscription.id));
      }
    }

    // Handle subscription.activated event
    if (event.event === "subscription.activated") {
      const subscription = event.payload.subscription.entity;

      const [existingSubscription] = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.subscriptionId, subscription.id));

      if (existingSubscription) {
        await db
          .update(subscriptions)
          .set({
            status: "active",
            updatedAt: new Date(),
          })
          .where(eq(subscriptions.subscriptionId, subscription.id));
      }
    }

    // Handle subscription.cancelled event
    if (event.event === "subscription.cancelled") {
      const subscription = event.payload.subscription.entity;

      await db
        .update(subscriptions)
        .set({
          status: "cancelled",
          updatedAt: new Date(),
        })
        .where(eq(subscriptions.subscriptionId, subscription.id));
    }

    return c.json(null, 200);
  });

export default app;
