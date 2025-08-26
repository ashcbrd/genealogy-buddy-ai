import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createCheckoutSession, getCustomerByUserId, STRIPE_PRICE_IDS } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { tier } = await req.json();

    if (!tier || !STRIPE_PRICE_IDS[tier as keyof typeof STRIPE_PRICE_IDS]) {
      return NextResponse.json(
        { error: "Invalid subscription tier" },
        { status: 400 }
      );
    }

    // Get customer ID
    const customerId = await getCustomerByUserId(session.user.id);
    
    if (!customerId) {
      return NextResponse.json(
        { error: "Customer not found. Please contact support." },
        { status: 400 }
      );
    }

    const priceId = STRIPE_PRICE_IDS[tier as keyof typeof STRIPE_PRICE_IDS];
    const successUrl = `${req.headers.get('origin')}/subscription?success=true`;
    const cancelUrl = `${req.headers.get('origin')}/subscription?canceled=true`;

    const checkoutUrl = await createCheckoutSession(
      customerId,
      priceId,
      successUrl,
      cancelUrl
    );

    return NextResponse.json({ url: checkoutUrl });

  } catch (error) {
    console.error("Stripe checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}