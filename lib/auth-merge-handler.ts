import { NextRequest } from "next/server";
import { prisma } from "./prisma";
import { mergeAnonymousIdentity, getOrCreateIdentity } from "./identity-manager";
// import { IdentityType } from "@prisma/client"; // TODO: Add when schema includes IdentityType

/**
 * Handle anonymous identity merging during login/signup process
 * Call this after successful authentication but before session creation
 */
export async function handleAuthMerge(
  userId: string,
  request: NextRequest
): Promise<void> {
  try {
    // TODO: Implement identity merging when identity schema is added to Prisma
    console.log(`Auth merge requested for user ${userId} - not yet implemented`);
  } catch (error) {
    console.error("Error during auth merge:", error);
    // Don't throw - auth should succeed even if merge fails
  }
}

/**
 * Middleware to set anonymous identity cookie for new visitors
 */
export function setAnonymousIdentityCookie(
  response: Response,
  identityId: string,
  anonKey: string
): void {
  const cookie = `genealogy_anon_id=${anonKey}; Path=/; Max-Age=${30 * 24 * 60 * 60}; SameSite=Lax; HttpOnly; Secure=${process.env.NODE_ENV === 'production'}`;
  
  response.headers.set('Set-Cookie', cookie);
}

/**
 * Clear anonymous identity cookie after successful merge
 */
export function clearAnonymousIdentityCookie(response: Response): void {
  const cookie = `genealogy_anon_id=; Path=/; Max-Age=0; SameSite=Lax; HttpOnly; Secure=${process.env.NODE_ENV === 'production'}`;
  
  response.headers.set('Set-Cookie', cookie);
}