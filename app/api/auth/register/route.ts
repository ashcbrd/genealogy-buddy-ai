import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { sendVerificationEmail, sendWelcomeEmail } from "@/lib/email";
import { createCustomer } from "@/lib/stripe";
import { generateToken } from "@/lib/utils";

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        provider: "credentials",
      },
    });

    // Create Stripe customer
    await createCustomer(email, user.id);

    // Send verification email
    const verificationToken = generateToken();
    
    // Store verification token in database
    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token: verificationToken,
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      },
    });
    
    await sendVerificationEmail(email, verificationToken);

    // Send welcome email
    await sendWelcomeEmail(email, name);

    return NextResponse.json({
      message: "User created successfully",
      userId: user.id,
    });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}
