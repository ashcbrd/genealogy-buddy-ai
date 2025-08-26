import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { handleWebhook } from "@/lib/stripe";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await req.text();

  const hdrs = await headers();
  const signature = hdrs.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing Stripe signature" },
      { status: 400 }
    );
  }

  try {
    await handleWebhook(signature, body);
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 400 }
    );
  }
}
