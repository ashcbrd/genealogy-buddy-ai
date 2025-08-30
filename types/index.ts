import type {
  User,
  Subscription,
  Document,
  Analysis,
  Photo,
  ResearchChat,
  SubscriptionTier,
  AnalysisType,
} from "@prisma/client";
import type { ReactNode } from "react";

export type {
  User,
  Subscription,
  Document,
  Analysis,
  Photo,
  ResearchChat,
  SubscriptionTier,
  AnalysisType,
};

// ----------------------
// Authentication
// ----------------------

export type Credentials = {
  email: string;
  password: string;
};

// ----------------------
// Subscription Limits
// ----------------------

export interface SubscriptionLimits {
  documents: number;
  dna: number;
  research: number;
  photos: number;
  gedcomExport: boolean;
  prioritySupport: boolean;
  // Translation is now bundled with document analysis for EXPLORER tier and above
  translationEnabled: boolean;
}

export const SUBSCRIPTION_LIMITS: Record<SubscriptionTier, SubscriptionLimits> =
  {
    FREE: {
      documents: 2,
      dna: 0,
      research: 5,
      photos: 0,
      gedcomExport: false,
      prioritySupport: false,
      translationEnabled: false, // Translation not available in FREE tier
    },
    EXPLORER: {
      documents: 10,
      dna: 5,
      research: -1, // unlimited
      photos: 5,
      gedcomExport: false,
      prioritySupport: false,
      translationEnabled: true, // Translation available with document analysis
    },
    RESEARCHER: {
      documents: 50,
      dna: 15,
      research: -1,
      photos: 25,
      gedcomExport: true,
      prioritySupport: false,
      translationEnabled: true, // Translation available with document analysis
    },
    PROFESSIONAL: {
      documents: 500, // 500 documents per month
      dna: -1, // unlimited (lower API cost)
      research: 200, // 200 AI research questions per month
      photos: 300, // 300 photo analyses per month
      gedcomExport: true,
      prioritySupport: true,
      translationEnabled: true, // Translation available with document analysis
    },
    ADMIN: {
      documents: -1, // unlimited admin access
      dna: -1,
      research: -1,
      photos: -1,
      gedcomExport: true,
      prioritySupport: true,
      translationEnabled: true, // Translation available with document analysis
    },
  };

// ----------------------
// AI Analysis Results
// ----------------------

export interface DocumentAnalysisResult {
  id?: string;
  names: Array<{
    text: string;
    type: "person" | "place";
    confidence: number;
    context?: string;
  }>;
  dates: Array<{
    text: string;
    type: "birth" | "death" | "marriage" | "other";
    confidence: number;
    normalizedDate?: string;
    context?: string;
  }>;
  places: Array<{
    text: string;
    confidence: number;
    modernName?: string;
    coordinates?: { lat: number; lng: number };
    context?: string;
  }>;
  relationships: Array<{
    person1: string;
    person2: string;
    type: string;
    confidence: number;
    context?: string;
  }>;
  events: Array<{
    type: string;
    date?: string;
    place?: string;
    people: string[];
    description: string;
    confidence: number;
  }>;
  suggestions: string[];
  documentType?: string;
  language?: string;
  summary?: string;
  // Translation fields (available in EXPLORER tier and above)
  translation?: {
    originalText: string;
    translatedText: string;
    sourceLanguage: string;
    targetLanguage: string;
    confidence: number;
    contextualTerms: Array<{
      term: string;
      explanation: string;
      category: "historical" | "legal" | "religious" | "cultural";
    }>;
  };
}

export interface DNAAnalysisResult {
  ethnicityBreakdown: Array<{
    region: string;
    percentage: number;
    confidence: number;
  }>;
  migrationPatterns: Array<{
    from: string;
    to: string;
    period: string;
    confidence: number;
  }>;
  matches: Array<{
    name: string;
    relationship: string;
    sharedCM: number;
    confidence: number;
  }>;
  historicalContext: string;
  suggestions: string[];
}

export interface PhotoAnalysisResult {
  dateEstimate: {
    period: string;
    confidence: number;
    explanation: string;
  };
  clothingAnalysis: string;
  backgroundAnalysis: string;
  historicalContext: string;
  story: string;
  people: Array<{
    position: string;
    ageEstimate: string;
    clothingDescription: string;
    possibleRole: string;
  }>;
  locationClues: string[];
  suggestions: string[];
}

// ----------------------
// Chat + Research
// ----------------------

export interface ResearchMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface ResearchChatRequest {
  messages: ChatMessage[];
}

// ----------------------
// Translation API Results
// ----------------------

export interface TranslationRequest {
  imageData?: string;
  textInput?: string;
  sourceLanguage?: string;
  targetLanguage: string;
  extractFacts: boolean;
  contextualHelp: boolean;
}

// ----------------------
// Usage Tracking
// ----------------------

export type UsageType = "DOCUMENT" | "DNA" | "PHOTO" | "RESEARCH";

// ----------------------
// Claude SDK helpers
// ----------------------

export type TextBlock = { type: "text"; text: string };
export type OtherBlock = { type: string };
export interface ClaudeResponse {
  content: Array<TextBlock | OtherBlock>;
  usage?: { input_tokens?: number };
}

// ----------------------
// Local JSON Types (for Prisma JSON fields)
// ----------------------

type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonObject | JsonArray;
export interface JsonObject {
  [key: string]: JsonValue;
}
export type JsonArray = JsonValue[];

// ----------------------
// Subscription Page types
// ----------------------

export type UsageCounterKey = "documents" | "dna" | "research" | "photos";

export type SubscriptionUsage = Record<UsageCounterKey, number>;

export interface SubscriptionData {
  tier: SubscriptionTier; // "FREE" | "EXPLORER" | "RESEARCHER" | "PROFESSIONAL"
  currentPeriodEnd?: string; // ISO date string
  canceledAt?: string; // ISO date string
  usage: SubscriptionUsage; // current month usage totals
}

// If your /api/subscription/current returns the object directly:
export type CurrentSubscriptionResponse = SubscriptionData;

// Stripe endpoints responses
export interface CheckoutSessionResponse {
  url: string;
}
export interface BillingPortalResponse {
  url: string;
}

// Optional: plan metadata for UI (icon is handled in component)
export type PlanColor = "gray" | "blue" | "purple" | "gold";

export interface PricingPlan {
  name: string;
  tier: SubscriptionTier;
  price: number; // monthly USD amount
  description: string;
  color: PlanColor;
  popular?: boolean;
}

// ----------------------
// DNA Interpreter (UI) types
// ----------------------

export type DNATabKey = "ethnicity" | "migration" | "matches" | "insights";

export interface DNAEthnicitySlice {
  region: string;
  percentage: number;
  confidence: number;
  subregions?: string[];
}

export interface DNAMigrationPattern {
  from: string;
  to: string;
  period: string;
  confidence: number;
  description: string;
}

export interface DNAMatch {
  name: string;
  relationship: string;
  sharedCM: number;
  sharedPercentage: number;
  confidence: number;
}

export interface DNAHaplogroups {
  maternal?: string;
  paternal?: string;
  description: string;
}

export interface DNAHealthInsights {
  disclaimer: string;
  generalTraits: string[];
}

export interface DNAAnalysisUI {
  ethnicityBreakdown: DNAEthnicitySlice[];
  migrationPatterns: DNAMigrationPattern[];
  matches: DNAMatch[];
  haplogroups: DNAHaplogroups;
  historicalContext: string;
  suggestions: string[];
  healthInsights?: DNAHealthInsights;
}

// API response contract for /api/tools/dna/analyze
export interface AnalyzeDNAResponse {
  analysis: DNAAnalysisUI;
  analysisId?: string;
}

// Optional error shape for API responses
export interface ApiErrorResponse {
  error: string;
}

export interface DashboardStats {
  documentsAnalyzed: number;
  dnaAnalyses: number;
  photosEnhanced: number;
  researchQuestions: number;
  totalAnalyses: number;
  accountAge: number; // days
  lastActive: string; // ISO timestamp
}

/** Per-tool usage counters (used/limit) for the current month */
export interface UsageCounters {
  documents: { used: number; limit: number };
  dna: { used: number; limit: number };
  photos: { used: number; limit: number };
  research: { used: number; limit: number };
}

/** Activity list item */
export type RecentActivityType = "document" | "dna" | "research" | "photo";
export type ActivityStatus = "completed" | "processing" | "failed";

export interface RecentActivity {
  id: string;
  type: RecentActivityType;
  title: string;
  timestamp: string; // ISO timestamp
  status: ActivityStatus;
}

/** Monthly usage trend point used by recharts */
export interface UsageTrend {
  month: string; // e.g., "2025-03" or "Mar"
  documents: number;
  dna: number;
  photos: number;
  research: number;
}

/** Tool usage pie data (right column) */
export type ToolKey = "documents" | "dna" | "photos" | "research";
export interface ToolUsageSlice {
  name: "Documents" | "DNA" | "Photos" | "Research";
  value: number;
  color: string;
}
export type ToolColorMap = Record<ToolKey, string>;

/** API payloads used by the dashboard page */
export interface DashboardStatsResponse {
  stats: DashboardStats;
  usage: UsageCounters;
}
export interface ActivityResponse {
  activities: RecentActivity[];
}
export interface TrendsResponse {
  trends: UsageTrend[];
}

/** Current subscription (as returned by /api/subscription/current) */
export interface SubscriptionData {
  tier: SubscriptionTier; // "FREE" | "EXPLORER" | "RESEARCHER" | "PROFESSIONAL"
  currentPeriodEnd?: string; // ISO date
  canceledAt?: string; // ISO date
  usage: Record<ToolKey, number>;
}

/** Component prop types (optional, if you want to export them) */
export interface StatCardProps {
  icon: ReactNode;
  title: string;
  value: number;
  trend?: number;
  description: string;
}
export type UsageBarColor = "blue" | "purple" | "green" | "pink" | "orange";
export interface UsageBarProps {
  label: string;
  icon: ReactNode;
  used: number;
  limit: number;
  color?: UsageBarColor;
}
export interface ActivityItemProps {
  activity: RecentActivity;
}
export interface QuickToolLinkProps {
  href: string;
  icon: ReactNode;
  title: string;
  description: string;
  color: string;
}

// ----------------------
// Admin types
// ----------------------

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  newUsersThisMonth: number;
  totalRevenue: number;
  mrr: number;
  arr: number;
  churnRate: number;
  conversionRate: number;
  avgRevenuePerUser: number;
  lifetimeValue: number;
  totalAnalyses: number;
  analysesToday: number;
  apiCallsToday: number;
  storageUsed: number;
  storageLimit: number;
}

export interface UserType {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image?: string;
  subscription: "FREE" | "EXPLORER" | "RESEARCHER" | "PROFESSIONAL";
  status: "active" | "inactive" | "suspended" | "banned";
  createdAt: string;
  lastActive: string;
  totalSpent: number;
  documentsAnalyzed: number;
  treesCreated: number;
  provider: "credentials" | "google";
  twoFactorEnabled: boolean;
  country?: string;
}

export interface RevenueData {
  date: string;
  revenue: number;
  subscriptions: number;
  churn: number;
  net: number;
}

export interface ToolUsageData {
  tool: string;
  usage: number;
  change: number;
  color: string;
}

export interface SystemHealth {
  service: string;
  status: "operational" | "degraded" | "down";
  uptime: number;
  responseTime: number;
  errorRate: number;
  lastChecked: string;
}

export interface AdminLog {
  id: string;
  action: string;
  user: string;
  target?: string;
  timestamp: string;
  ip: string;
  details?: string;
}

export interface SupportTicket {
  id: string;
  userId: string;
  userName: string;
  subject: string;
  priority: "low" | "medium" | "high" | "urgent";
  status: "open" | "in_progress" | "resolved" | "closed";
  createdAt: string;
  lastUpdated: string;
  messages: number;
}

export interface GEDCOMIndividual {
  id: string;
  type: "INDI";
  data: {
    name?: string;
    sex?: string;
    birth?: { date?: string; place?: string };
    death?: { date?: string; place?: string };
    familyChild?: string;
    familySpouse?: string[];
  };
}

export interface GEDCOMFamily {
  id: string;
  type: "FAM";
  data: {
    husband?: string;
    wife?: string;
    children?: string[];
    marriage?: { date?: string; place?: string };
  };
}

export interface GEDCOMMetadata {
  [key: string]: string | number | boolean | undefined;
}

export interface GEDCOMParseResult {
  individuals: GEDCOMIndividual[];
  families: GEDCOMFamily[];
  metadata: GEDCOMMetadata;
}
