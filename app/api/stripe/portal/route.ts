import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createPortalSession, getCustomerByUserId } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get customer ID
    const customerId = await getCustomerByUserId(session.user.id);
    
    if (!customerId) {
      return NextResponse.json(
        { error: "Customer not found. Please contact support." },
        { status: 400 }
      );
    }

    const returnUrl = `${req.headers.get('origin')}/subscription`;

    const portalUrl = await createPortalSession(customerId, returnUrl);

    return NextResponse.json({ url: portalUrl });

  } catch (error) {
    console.error("Stripe portal error:", error);
    return NextResponse.json(
      { error: "Failed to create portal session" },
      { status: 500 }
    );
  }
}