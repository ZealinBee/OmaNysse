import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// Lazy-loaded Supabase admin client (bypasses RLS)
function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// Extended types to handle Stripe API properties
interface SubscriptionData {
  id: string;
  customer: string;
  metadata: { supabase_user_id?: string; subscription_type?: string };
  items: { data: Array<{ price: { id: string } }> };
  status: string;
  current_period_start: number;
  current_period_end: number;
  cancel_at_period_end: boolean;
  canceled_at: number | null;
}

interface InvoiceData {
  id: string;
  subscription?: string | null;
}

interface PaymentIntentData {
  id: string;
  customer: string | null;
  metadata: {
    supabase_user_id?: string;
    price_id?: string;
    subscription_type?: string;
  };
}

interface CheckoutSessionData {
  id: string;
  customer: string;
  subscription: string | null;
  payment_intent: string | null;
  mode: "payment" | "subscription";
  metadata: {
    supabase_user_id?: string;
    subscription_type?: string;
  };
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature")!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error) {
    console.error("Webhook signature verification failed:", error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      // Checkout Session completed (main handler for Stripe Checkout)
      case "checkout.session.completed": {
        const session = event.data.object as unknown as CheckoutSessionData;
        await handleCheckoutCompleted(session);
        break;
      }

      // Subscription events
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as unknown as SubscriptionData;
        await handleSubscriptionChange(subscription);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as unknown as SubscriptionData;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      // One-time payment events (Lifetime) - backup for direct PaymentIntent
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as unknown as PaymentIntentData;
        if (paymentIntent.metadata.subscription_type === "lifetime") {
          await handleLifetimePayment(paymentIntent);
        }
        break;
      }

      // Invoice events
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as unknown as InvoiceData;
        if (invoice.subscription) {
          console.log("Subscription payment succeeded:", invoice.subscription);
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as unknown as InvoiceData;
        console.log("Invoice payment failed:", invoice.id);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook handler error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}

async function handleCheckoutCompleted(session: CheckoutSessionData) {
  const userId = session.metadata.supabase_user_id;
  const subscriptionType = session.metadata.subscription_type;

  if (!userId) {
    console.error("Missing supabase_user_id in checkout session metadata");
    return;
  }

  console.log("Checkout completed:", {
    sessionId: session.id,
    mode: session.mode,
    subscriptionType,
    userId,
  });

  // For lifetime payments, create the subscription record immediately
  if (session.mode === "payment" && subscriptionType === "lifetime") {
    const subscriptionData = {
      user_id: userId,
      stripe_customer_id: session.customer,
      stripe_subscription_id: null,
      stripe_price_id: null,
      subscription_type: "lifetime" as const,
      status: "active" as const,
      current_period_start: new Date().toISOString(),
      current_period_end: null,
      cancel_at_period_end: false,
      canceled_at: null,
    };

    const { error } = await getSupabaseAdmin()
      .from("subscriptions")
      .upsert(subscriptionData, {
        onConflict: "user_id",
      });

    if (error) {
      console.error("Failed to create lifetime subscription from checkout:", error);
      throw error;
    }

    console.log("Lifetime subscription created for user:", userId);
  }

  // For monthly subscriptions, the subscription webhook will handle it
  // But we log here for debugging
  if (session.mode === "subscription" && session.subscription) {
    console.log("Monthly subscription will be handled by subscription webhook:", session.subscription);
  }
}

async function handleSubscriptionChange(subscription: SubscriptionData) {
  const userId = subscription.metadata.supabase_user_id;
  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer;

  if (!userId) {
    console.error("Missing supabase_user_id in subscription metadata");
    return;
  }

  // Get period dates - check subscription level first, then fall back to items level
  const subscriptionItem = subscription.items?.data?.[0];
  const periodStart =
    subscription.current_period_start ??
    (subscriptionItem as unknown as { current_period_start?: number })
      ?.current_period_start;
  const periodEnd =
    subscription.current_period_end ??
    (subscriptionItem as unknown as { current_period_end?: number })
      ?.current_period_end;

  if (!periodStart || !periodEnd) {
    console.error("Missing period dates in subscription:", {
      subscriptionId: subscription.id,
      topLevelStart: subscription.current_period_start,
      topLevelEnd: subscription.current_period_end,
      itemLevelStart: (subscriptionItem as unknown as { current_period_start?: number })?.current_period_start,
      itemLevelEnd: (subscriptionItem as unknown as { current_period_end?: number })?.current_period_end,
    });
    throw new Error("Missing period dates in subscription");
  }

  const subscriptionData = {
    user_id: userId,
    stripe_customer_id: customerId,
    stripe_subscription_id: subscription.id,
    stripe_price_id: subscriptionItem?.price?.id ?? null,
    subscription_type: "monthly" as const,
    status: mapStripeStatus(subscription.status),
    current_period_start: new Date(periodStart * 1000).toISOString(),
    current_period_end: new Date(periodEnd * 1000).toISOString(),
    cancel_at_period_end: subscription.cancel_at_period_end,
    canceled_at: subscription.canceled_at
      ? new Date(subscription.canceled_at * 1000).toISOString()
      : null,
  };

  const { error } = await getSupabaseAdmin()
    .from("subscriptions")
    .upsert(subscriptionData, {
      onConflict: "user_id",
    });

  if (error) {
    console.error("Failed to upsert subscription:", error);
    throw error;
  }
}

async function handleSubscriptionDeleted(subscription: SubscriptionData) {
  const userId = subscription.metadata.supabase_user_id;

  if (!userId) return;

  const { error } = await getSupabaseAdmin()
    .from("subscriptions")
    .update({
      status: "canceled",
      canceled_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", subscription.id);

  if (error) {
    console.error("Failed to update deleted subscription:", error);
    throw error;
  }
}

async function handleLifetimePayment(paymentIntent: PaymentIntentData) {
  const userId = paymentIntent.metadata.supabase_user_id;
  const customerId = paymentIntent.customer;
  const priceId = paymentIntent.metadata.price_id;

  if (!userId || !customerId) {
    console.error("Missing supabase_user_id or customer in payment intent");
    return;
  }

  const subscriptionData = {
    user_id: userId,
    stripe_customer_id: customerId,
    stripe_subscription_id: null,
    stripe_price_id: priceId,
    subscription_type: "lifetime" as const,
    status: "active" as const,
    current_period_start: new Date().toISOString(),
    current_period_end: null,
    cancel_at_period_end: false,
    canceled_at: null,
  };

  const { error } = await getSupabaseAdmin()
    .from("subscriptions")
    .upsert(subscriptionData, {
      onConflict: "user_id",
    });

  if (error) {
    console.error("Failed to create lifetime subscription:", error);
    throw error;
  }
}

function mapStripeStatus(status: string): string {
  const statusMap: Record<string, string> = {
    active: "active",
    canceled: "canceled",
    past_due: "past_due",
    unpaid: "unpaid",
    trialing: "active",
    incomplete: "incomplete",
    incomplete_expired: "canceled",
    paused: "canceled",
  };
  return statusMap[status] || "incomplete";
}
