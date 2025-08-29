"use client";

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import type { SubscriptionTier } from '@prisma/client';

export interface UserStatusResult {
  isAnonymous: boolean;
  isAuthenticated: boolean;
  isFreeTier: boolean;
  user: any;
  tier: SubscriptionTier;
  isLoading: boolean;
  subscription: any;
  securityValidated: boolean;
}

export interface UsageData {
  tier: SubscriptionTier;
  usage: {
    documents: { used: number; limit: number; unlimited: boolean };
    dna: { used: number; limit: number; unlimited: boolean };
    photos: { used: number; limit: number; unlimited: boolean };
    research: { used: number; limit: number; unlimited: boolean };
    translations: { used: number; limit: number; unlimited: boolean };
  };
  totalUsagePercentage: number;
  periodStart: string;
  periodEnd: string;
}

/**
 * Hook to get user authentication status and subscription data
 * All users must be authenticated to use the application
 */
export function useUserStatus(): UserStatusResult {
  const { data: session, status } = useSession();
  const [subscription, setSubscription] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const isAuthenticated = !!session?.user;
  const isAnonymous = !isAuthenticated;
  
  useEffect(() => {
    async function fetchSubscription() {
      if (!isAuthenticated || status === 'loading') {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/subscription/current');
        if (response.ok) {
          const data = await response.json();
          setSubscription(data);
        } else {
          setSubscription({ tier: 'FREE' });
        }
      } catch (error) {
        console.error('Failed to fetch subscription:', error);
        setSubscription({ tier: 'FREE' });
      } finally {
        setIsLoading(false);
      }
    }

    fetchSubscription();
  }, [isAuthenticated, status]);
  
  const tier = subscription?.tier || 'FREE';
  const isFreeTier = tier === 'FREE';
  
  return {
    isAnonymous,
    isAuthenticated,
    isFreeTier,
    user: session?.user || null,
    tier,
    isLoading: status === 'loading' || (isAuthenticated && isLoading),
    subscription,
    securityValidated: isAuthenticated && !isLoading,
  };
}

/**
 * Hook to get current usage data for authenticated users
 * Enhanced with security validation and error handling
 */
export function useUsageData(): { 
  data: UsageData | null; 
  refresh: () => Promise<void>;
  error: string | null;
  isLoading: boolean;
} {
  const { isAuthenticated } = useUserStatus();
  const [usageData, setUsageData] = useState<UsageData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchUsage = async () => {
    if (!isAuthenticated) {
      setUsageData(null);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/usage/current', {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUsageData(data);
        setError(null);
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Failed to fetch usage data' }));
        
        if (response.status === 401) {
          setError('Please sign in again to view usage data');
        } else if (response.status === 429) {
          setError('Too many requests. Please wait a moment before refreshing.');
        } else {
          setError(errorData.error || 'Unable to load usage data. Please try again.');
        }
        
        setUsageData(null);
      }
    } catch (error) {
      console.error('Failed to fetch usage data:', error);
      setError('Network error. Please check your connection and try again.');
      setUsageData(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsage();
    
    // Refresh usage data every 30 seconds
    const interval = setInterval(fetchUsage, 30000);
    
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  return { 
    data: usageData, 
    refresh: fetchUsage,
    error,
    isLoading
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

/**
 * Hook to check if user can use a specific tool based on their tier
 * Now includes security validation and better error handling
 */
export function useToolAccess(tool: 'documents' | 'dna' | 'photos' | 'research' | 'translations') {
  const { data: usageData } = useUsageData();
  const { isAuthenticated, tier } = useUserStatus();

  if (!isAuthenticated || !usageData) {
    return {
      canUse: false,
      reason: isAuthenticated ? 'Loading usage data...' : 'Please sign in to use this feature',
      usage: null,
      securityCheck: false
    };
  }

  const toolUsage = usageData.usage[tool];
  
  // Feature not available in current tier
  if (toolUsage.limit === 0) {
    return {
      canUse: false,
      reason: `${tool.charAt(0).toUpperCase() + tool.slice(1)} analysis is not available in your ${tier} plan. Please upgrade to access this feature.`,
      usage: toolUsage,
      securityCheck: true,
      upgradeRequired: true
    };
  }

  // Unlimited usage
  if (toolUsage.unlimited || toolUsage.used < toolUsage.limit) {
    return {
      canUse: true,
      reason: null,
      usage: toolUsage,
      securityCheck: true,
      upgradeRequired: false
    };
  }

  // Usage limit reached
  return {
    canUse: false,
    reason: `You have reached your monthly limit of ${toolUsage.limit} ${tool} analyses. Please upgrade your plan or wait until next month.`,
    usage: toolUsage,
    securityCheck: true,
    upgradeRequired: true
  };
}