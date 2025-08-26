"use client";

import { useSession } from 'next-auth/react';

export interface UserStatusResult {
  isAnonymous: boolean;
  isAuthenticated: boolean;
  isFreeTier: boolean;
  user: any;
  tier: string;
}

/**
 * Unified hook to get user status information
 * Replaces the old use-guest-mode hook with a more comprehensive approach
 */
export function useUserStatus(): UserStatusResult {
  const { data: session, status } = useSession();
  
  const isAuthenticated = !!session?.user;
  const isAnonymous = !isAuthenticated;
  
  // Determine tier - anonymous users are always free tier
  let tier = 'FREE';
  let isFreeTier = true;
  
  // TODO: Add subscription tier logic when user schema is extended
  // For now, all users are treated as free tier
  
  return {
    isAnonymous,
    isAuthenticated,
    isFreeTier,
    user: session?.user || null,
    tier,
  };
}

/**
 * Simple predicate function to check if current user is free tier
 * Can be used in components that need quick access to tier status
 */
export function useIsFreeTier(): boolean {
  const { isFreeTier } = useUserStatus();
  return isFreeTier;
}