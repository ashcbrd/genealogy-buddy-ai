import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const EMAIL_FROM = process.env.EMAIL_FROM || "noreply@genealogyai.com";

export async function sendVerificationEmail(email: string, token: string) {
  const verificationUrl = `${process.env.NEXTAUTH_URL}/verify-email?token=${token}`;

  try {
    await resend.emails.send({
      from: EMAIL_FROM,
      to: email,
      subject: "Verify your GenealogyAI account",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333; text-align: center;">Welcome to GenealogyAI!</h1>
          <p style="color: #666; font-size: 16px; line-height: 1.5;">
            Thank you for signing up! Please verify your email address by clicking the button below:
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" 
               style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
              Verify Email Address
            </a>
          </div>
          <p style="color: #999; font-size: 14px;">
            If you didn't create an account with us, you can safely ignore this email.
          </p>
          <p style="color: #999; font-size: 14px;">
            This link will expire in 24 hours for security reasons.
          </p>
        </div>
      `,
    });
  } catch (error) {
    console.error("Failed to send verification email:", error);
    throw new Error("Failed to send verification email");
  }
}

export async function sendWelcomeEmail(email: string, name: string) {
  try {
    await resend.emails.send({
      from: EMAIL_FROM,
      to: email,
      subject: "Welcome to GenealogyAI - Get Started!",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333; text-align: center;">Welcome to GenealogyAI, ${name}!</h1>
          <p style="color: #666; font-size: 16px; line-height: 1.5;">
            Your account has been ver
            ified and you're ready to start exploring your family history with AI-powered tools.
          </p>
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">Getting Started:</h3>
            <ul style="color: #666; line-height: 1.6;">
              <li>Upload family documents and photos for AI analysis</li>
              <li>Use our research tools to discover new family connections</li>
              <li>Build and expand your family tree with intelligent suggestions</li>
              <li>Access premium features with our subscription plans</li>
            </ul>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXTAUTH_URL}/dashboard" 
               style="background-color: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
              Get Started
            </a>
          </div>
          <p style="color: #999; font-size: 14px;">
            Need help? Contact our support team at ${
              process.env.SUPPORT_EMAIL || "support@genealogyai.com"
            }
          </p>
        </div>
      `,
    });
  } catch (error) {
    console.error("Failed to send welcome email:", error);
    throw new Error("Failed to send welcome email");
  }
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`;

  try {
    await resend.emails.send({
      from: EMAIL_FROM,
      to: email,
      subject: "Reset your GenealogyAI password",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333; text-align: center;">Password Reset Request</h1>
          <p style="color: #666; font-size: 16px; line-height: 1.5;">
            You requested to reset your password for your GenealogyAI account. Click the button below to set a new password:
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background-color: #dc3545; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
              Reset Password
            </a>
          </div>
          <p style="color: #999; font-size: 14px;">
            If you didn't request this password reset, you can safely ignore this email.
          </p>
          <p style="color: #999; font-size: 14px;">
            This link will expire in 1 hour for security reasons.
          </p>
        </div>
      `,
    });
  } catch (error) {
    console.error("Failed to send password reset email:", error);
    throw new Error("Failed to send password reset email");
  }
}

export async function sendCustomEmail(
  to: string,
  subject: string,
  content: string
) {
  try {
    await resend.emails.send({
      from: EMAIL_FROM,
      to,
      subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h1 style="color: #333; margin: 0;">${subject}</h1>
          </div>
          <div style="color: #666; font-size: 16px; line-height: 1.6; white-space: pre-wrap;">
            ${content}
          </div>
          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="color: #999; font-size: 14px; margin: 0;">
              This email was sent from GenealogyAI
            </p>
          </div>
        </div>
      `,
    });
  } catch (error) {
    console.error("Failed to send custom email:", error);
    throw new Error("Failed to send custom email");
  }
}

export async function sendNotificationEmail(
  email: string,
  subject: string,
  message: string
) {
  try {
    await resend.emails.send({
      from: EMAIL_FROM,
      to: email,
      subject: `[GenealogyAI] ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #e3f2fd; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: #1976d2; margin: 0;">Notification</h2>
          </div>
          <h3 style="color: #333;">${subject}</h3>
          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            ${message}
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXTAUTH_URL}/dashboard" 
               style="background-color: #1976d2; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
              View Dashboard
            </a>
          </div>
          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="color: #999; font-size: 14px; margin: 0;">
              You received this notification from GenealogyAI
            </p>
          </div>
        </div>
      `,
    });
  } catch (error) {
    console.error("Failed to send notification email:", error);
    throw new Error("Failed to send notification email");
  }
}
