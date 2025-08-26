import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/email";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Always return success for security (don't reveal if email exists)
    if (!user) {
      return NextResponse.json({ success: true });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

    // Delete any existing reset tokens for this email
    await prisma.passwordResetToken.deleteMany({
      where: { identifier: email },
    });

    // Save reset token to database
    await prisma.passwordResetToken.create({
      data: {
        identifier: email,
        token: resetToken,
        expires: resetTokenExpiry,
      },
    });

    // Send reset email
    await sendPasswordResetEmail(email, resetToken);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
