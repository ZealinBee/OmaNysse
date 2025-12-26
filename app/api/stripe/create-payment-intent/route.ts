import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/app/lib/supabase/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const PRICES = {
  monthly: "price_1SigG0LOQfJMZAGzacgOFO2O",
  lifetime: "price_1SigGRLOQfJMZAGz0Rzb7cVM",
} as const;

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { priceType } = await request.json();

    if (!priceType || !PRICES[priceType as keyof typeof PRICES]) {
      return NextResponse.json({ error: "Invalid price type" }, { status: 400 });
    }

    // Check if user already has active subscription
    try {
      const { data: existingSub } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "active")
        .maybeSingle();

      if (existingSub) {
        return NextResponse.json(
          { error: "Sinulla on jo aktiivinen tilaus" },
          { status: 400 }
        );
      }
    } catch (dbError) {
      // Table might not exist yet - that's OK, continue
      console.log("Subscriptions table query failed:", dbError);
    }

    // Get or create Stripe customer
    let stripeCustomerId: string | null = null;

    try {
      const { data: customerRecord } = await supabase
        .from("subscriptions")
        .select("stripe_customer_id")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();

      if (customerRecord?.stripe_customer_id) {
        stripeCustomerId = customerRecord.stripe_customer_id;
      }
    } catch {
      // Ignore - will create new customer
    }

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          supabase_user_id: user.id,
        },
      });
      stripeCustomerId = customer.id;
    }

    const priceId = PRICES[priceType as keyof typeof PRICES];
    const origin = request.headers.get("origin") || "http://localhost:3000";

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: priceType === "lifetime" ? "payment" : "subscription",
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${origin}/plus/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/plus`,
      metadata: {
        supabase_user_id: user.id,
        subscription_type: priceType,
      },
      subscription_data: priceType === "monthly" ? {
        metadata: {
          supabase_user_id: user.id,
          subscription_type: "monthly",
        },
      } : undefined,
      payment_intent_data: priceType === "lifetime" ? {
        metadata: {
          supabase_user_id: user.id,
          subscription_type: "lifetime",
          price_id: priceId,
        },
      } : undefined,
      locale: "fi",
    });

    return NextResponse.json({
      url: session.url,
    });
  } catch (error) {
    console.error("Create checkout session error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Maksun alustus epäonnistui", details: errorMessage },
      { status: 500 }
    );
  }
}
