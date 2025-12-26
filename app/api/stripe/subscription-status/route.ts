import { NextResponse } from "next/server";
import { createClient } from "@/app/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ hasPlusAccess: false, subscription: null });
    }

    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (!subscription) {
      return NextResponse.json({ hasPlusAccess: false, subscription: null });
    }

    // Check if user has Plus access
    const hasPlusAccess =
      subscription.status === "active" &&
      (subscription.subscription_type === "lifetime" ||
        (subscription.subscription_type === "monthly" &&
          new Date(subscription.current_period_end) > new Date()));

    return NextResponse.json({
      hasPlusAccess,
      subscription: {
        type: subscription.subscription_type,
        status: subscription.status,
        currentPeriodEnd: subscription.current_period_end,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      },
    });
  } catch (error) {
    console.error("Subscription status error:", error);
    return NextResponse.json({ hasPlusAccess: false, subscription: null });
  }
}
