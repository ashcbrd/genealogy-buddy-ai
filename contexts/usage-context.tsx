"use client";

import React, { createContext, useContext, type ReactNode } from 'react';
import { useUsageData } from '@/hooks/use-user-status';
import type { UsageData } from '@/hooks/use-user-status';

interface UsageContextType {
  usageData: UsageData | null;
  refreshUsage: () => Promise<void>;
}

const UsageContext = createContext<UsageContextType | undefined>(undefined);

interface UsageProviderProps {
  children: ReactNode;
}

export function UsageProvider({ children }: UsageProviderProps) {
  const { data: usageData, refresh: refreshUsage } = useUsageData();

  return (
    <UsageContext.Provider value={{ usageData, refreshUsage }}>
      {children}
    </UsageContext.Provider>
  );
}

export function useUsageContext() {
  const context = useContext(UsageContext);
  if (context === undefined) {
    throw new Error('useUsageContext must be used within a UsageProvider');
  }
  return context;
}