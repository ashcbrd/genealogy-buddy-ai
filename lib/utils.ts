import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { prisma } from "./prisma";
import {
  SUBSCRIPTION_FEATURES,
  ANALYSIS_TYPES,
  type SubscriptionTier,
  type AnalysisType,
} from "./constants";

// GEDCOM types
export interface GEDCOMIndividual {
  id: string;
  firstName?: string;
  lastName?: string;
  birthDate?: string;
  deathDate?: string;
  birthPlace?: string;
  deathPlace?: string;
  gender?: string;
  fatherId?: string;
  motherId?: string;
}

export interface GEDCOMFamily {
  id: string;
  husbandId?: string;
  wifeId?: string;
  childrenIds: string[];
  marriageDate?: string;
  marriagePlace?: string;
}

export interface GEDCOMMetadata {
  version: string;
  source: string;
  created: Date;
  individualCount: number;
  familyCount: number;
}

/**
 * Utility function to merge class names with tailwind-merge
 * Prevents style conflicts in Tailwind CSS
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Check if a user has available usage for a specific tool
 * based on their subscription tier and current usage
 */
export async function checkUsageLimit(
  userId: string,
  type: AnalysisType
): Promise<boolean> {
  try {
    // Get user's subscription
    const subscription = await prisma.subscription.findUnique({
      where: { userId },
      include: { user: true },
    });

    if (!subscription) {
      // No subscription means FREE tier
      const limits = SUBSCRIPTION_FEATURES.FREE.limits;
      const limitKey = type.toLowerCase() as keyof typeof limits;
      const limit = limits[limitKey as keyof typeof limits];

      if (typeof limit !== "number") return false;
      if (limit === 0) return false; // No access
      if (limit < 0) return true; // Unlimited (treating -1 and other negative numbers as unlimited)

      // Check current usage
      const currentMonth = new Date(new Date().setDate(1));
      currentMonth.setHours(0, 0, 0, 0);

      const usage = await prisma.usage.findUnique({
        where: {
          userId_type_period: {
            userId,
            type,
            period: currentMonth,
          },
        },
      });

      return !usage || usage.count < limit;
    }

    const limits = SUBSCRIPTION_FEATURES[subscription.tier as SubscriptionTier].limits;
    const limitKey = type.toLowerCase() as keyof typeof limits;
    const limit = limits[limitKey as keyof typeof limits];

    if (typeof limit !== "number") return false;
    if (limit === -1) return true; // Unlimited
    if (limit === 0) return false; // No access

    const currentMonth = new Date(new Date().setDate(1));
    currentMonth.setHours(0, 0, 0, 0);

    const usage = await prisma.usage.findUnique({
      where: {
        userId_type_period: {
          userId,
          type,
          period: currentMonth,
        },
      },
    });

    return !usage || usage.count < limit;
  } catch (error) {
    console.error("Error checking usage limit:", error);
    return false;
  }
}

/**
 * Increment usage count for a specific tool
 */
export async function incrementUsage(
  userId: string,
  type: AnalysisType
): Promise<void> {
  try {
    const currentMonth = new Date(new Date().setDate(1));
    currentMonth.setHours(0, 0, 0, 0);

    await prisma.usage.upsert({
      where: {
        userId_type_period: {
          userId,
          type,
          period: currentMonth,
        },
      },
      update: {
        count: { increment: 1 },
      },
      create: {
        userId,
        type,
        count: 1,
        period: currentMonth,
      },
    });
  } catch (error) {
    console.error("Error incrementing usage:", error);
    throw error;
  }
}

/**
 * Get remaining usage for a user
 */
export async function getRemainingUsage(
  userId: string,
  type: AnalysisType
): Promise<{ used: number; limit: number; remaining: number }> {
  try {
    const subscription = await prisma.subscription.findUnique({
      where: { userId },
    });

    const tier = subscription?.tier || "FREE";
    const limits = SUBSCRIPTION_FEATURES[tier as SubscriptionTier].limits;
    const limitKey = type.toLowerCase() as keyof typeof limits;
    const limit = limits[limitKey as keyof typeof limits];

    if (typeof limit !== "number") {
      return { used: 0, limit: 0, remaining: 0 };
    }

    if (limit < 0) {
      return { used: 0, limit: -1, remaining: -1 }; // Unlimited
    }

    const currentMonth = new Date(new Date().setDate(1));
    currentMonth.setHours(0, 0, 0, 0);

    const usage = await prisma.usage.findUnique({
      where: {
        userId_type_period: {
          userId,
          type,
          period: currentMonth,
        },
      },
    });

    const used = usage?.count || 0;
    const remaining = Math.max(0, limit - used);

    return { used, limit, remaining };
  } catch (error) {
    console.error("Error getting remaining usage:", error);
    return { used: 0, limit: 0, remaining: 0 };
  }
}

/**
 * Format a date in a human-readable format
 */
export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

/**
 * Format a date with time
 */
export function formatDateTime(date: Date | string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(date));
}

/**
 * Format a relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: Date | string): string {
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  const now = new Date();
  const then = new Date(date);
  const seconds = Math.floor((then.getTime() - now.getTime()) / 1000);

  const intervals = [
    { label: "year", seconds: 31536000 },
    { label: "month", seconds: 2592000 },
    { label: "week", seconds: 604800 },
    { label: "day", seconds: 86400 },
    { label: "hour", seconds: 3600 },
    { label: "minute", seconds: 60 },
    { label: "second", seconds: 1 },
  ];

  for (const interval of intervals) {
    const count = Math.floor(Math.abs(seconds) / interval.seconds);
    if (count >= 1) {
      return rtf.format(
        seconds < 0 ? -count : count,
        interval.label as Intl.RelativeTimeFormatUnit
      );
    }
  }

  return "just now";
}

/**
 * Format currency in USD
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount / 100); // Assuming amount is in cents
}

/**
 * Generate a random secure token
 */
export function generateToken(length: number = 32): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let token = "";

  if (typeof window !== "undefined" && window.crypto) {
    const array = new Uint8Array(length);
    window.crypto.getRandomValues(array);
    for (let i = 0; i < length; i++) {
      token += chars[array[i] % chars.length];
    }
  } else {
    // Fallback for server-side
    for (let i = 0; i < length; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
  }

  return token;
}

/**
 * Generate a unique ID
 */
export function generateId(prefix?: string): string {
  const timestamp = Date.now().toString(36);
  const randomStr = generateToken(8);
  return prefix
    ? `${prefix}_${timestamp}${randomStr}`
    : `${timestamp}${randomStr}`;
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Sanitize filename for safe storage
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, "_")
    .replace(/_{2,}/g, "_")
    .toLowerCase();
}

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
  return filename.slice(((filename.lastIndexOf(".") - 1) >>> 0) + 2);
}

/**
 * Format file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

// Helper functions to convert parsed records to proper types
function convertToGEDCOMIndividual(record: { id?: string; type: string; data: Record<string, unknown> }): GEDCOMIndividual {
  const data = record.data;
  return {
    id: record.id || "",
    firstName: data.firstName as string | undefined,
    lastName: data.lastName as string | undefined,
    birthDate: data.birthDate as string | undefined,
    deathDate: data.deathDate as string | undefined,
    birthPlace: data.birthPlace as string | undefined,
    deathPlace: data.deathPlace as string | undefined,
    gender: data.gender as string | undefined,
    fatherId: data.fatherId as string | undefined,
    motherId: data.motherId as string | undefined,
  };
}

function convertToGEDCOMFamily(record: { id?: string; type: string; data: Record<string, unknown> }): GEDCOMFamily {
  const data = record.data;
  return {
    id: record.id || "",
    husbandId: data.husbandId as string | undefined,
    wifeId: data.wifeId as string | undefined,
    childrenIds: (data.childrenIds as string[]) || [],
    marriageDate: data.marriageDate as string | undefined,
    marriagePlace: data.marriagePlace as string | undefined,
  };
}

/**
 * Parse GEDCOM file content for family tree import
 */
export function parseGEDCOM(content: string): {
  individuals: GEDCOMIndividual[];
  families: GEDCOMFamily[];
  metadata: GEDCOMMetadata;
} {
  const lines = content.split("\n").map((line) => line.trim());
  const individuals: GEDCOMIndividual[] = [];
  const families: GEDCOMFamily[] = [];
  const metadata: GEDCOMMetadata = {
    version: "5.5",
    source: "Unknown",
    created: new Date(),
    individualCount: 0,
    familyCount: 0,
  };

  let currentRecord: {
    id?: string;
    type: string;
    data: Record<string, unknown>;
  } | null = null;
  let currentTag = "";

  for (const line of lines) {
    if (!line) continue;

    const match = line.match(/^(\d+)\s+(@\w+@\s+)?(\w+)(?:\s+(.*))?$/);
    if (!match) continue;

    const level = parseInt(match[1]);
    const id = match[2]?.trim();
    const tag = match[3];
    const value = match[4] || "";

    if (level === 0) {
      // Save previous record
      if (currentRecord && currentRecord.id) {
        if (currentRecord.type === "INDI") {
          individuals.push(convertToGEDCOMIndividual(currentRecord));
        } else if (currentRecord.type === "FAM") {
          families.push(convertToGEDCOMFamily(currentRecord));
        }
      }

      // Start new record
      if (tag === "HEAD") {
        currentRecord = null;
      } else if (id && tag === "INDI") {
        currentRecord = { id, type: "INDI", data: {} };
      } else if (id && tag === "FAM") {
        currentRecord = { id, type: "FAM", data: {} };
      } else if (tag === "TRLR") {
        currentRecord = null;
      }
    } else if (currentRecord && level === 1) {
      currentTag = tag;
      switch (tag) {
        case "NAME":
          currentRecord.data.name = value;
          break;
        case "SEX":
          currentRecord.data.sex = value;
          break;
        case "BIRT":
          currentRecord.data.birth = {} as Record<string, string>;
          break;
        case "DEAT":
          currentRecord.data.death = {} as Record<string, string>;
          break;
        case "FAMC":
          currentRecord.data.familyChild = value;
          break;
        case "FAMS":
          if (!currentRecord.data.familySpouse) {
            currentRecord.data.familySpouse = [] as string[];
          }
          (currentRecord.data.familySpouse as string[]).push(value);
          break;
        case "HUSB":
          currentRecord.data.husband = value;
          break;
        case "WIFE":
          currentRecord.data.wife = value;
          break;
        case "CHIL":
          if (!currentRecord.data.children) {
            currentRecord.data.children = [] as string[];
          }
          (currentRecord.data.children as string[]).push(value);
          break;
        case "MARR":
          currentRecord.data.marriage = {} as Record<string, string>;
          break;
      }
    } else if (currentRecord && level === 2) {
      if (tag === "DATE") {
        if (currentTag === "BIRT" && currentRecord.data.birth) {
          (currentRecord.data.birth as Record<string, string>).date = value;
        } else if (currentTag === "DEAT" && currentRecord.data.death) {
          (currentRecord.data.death as Record<string, string>).date = value;
        } else if (currentTag === "MARR" && currentRecord.data.marriage) {
          (currentRecord.data.marriage as Record<string, string>).date = value;
        }
      } else if (tag === "PLAC") {
        if (currentTag === "BIRT" && currentRecord.data.birth) {
          (currentRecord.data.birth as Record<string, string>).place = value;
        } else if (currentTag === "DEAT" && currentRecord.data.death) {
          (currentRecord.data.death as Record<string, string>).place = value;
        } else if (currentTag === "MARR" && currentRecord.data.marriage) {
          (currentRecord.data.marriage as Record<string, string>).place = value;
        }
      }
    }
  }

  // Save last record
  if (currentRecord && currentRecord.id) {
    if (currentRecord.type === "INDI") {
      individuals.push(convertToGEDCOMIndividual(currentRecord));
    } else if (currentRecord.type === "FAM") {
      families.push(convertToGEDCOMFamily(currentRecord));
    }
  }

  return { individuals, families, metadata };
}

/**
 * Export family tree data to GEDCOM format
 */
export function exportGEDCOM(treeData: {
  individuals: Record<string, unknown>[];
  families?: Record<string, unknown>[];
  treeName?: string;
}): string {
  let gedcom = "0 HEAD\n";
  gedcom += "1 GEDC\n";
  gedcom += "2 VERS 5.5.1\n";
  gedcom += "2 FORM LINEAGE-LINKED\n";
  gedcom += "1 CHAR UTF-8\n";
  gedcom += "1 SOUR GenealogyAI\n";
  gedcom += "2 NAME GenealogyAI Family Tree Builder\n";
  gedcom += "2 VERS 1.0\n";
  gedcom += `1 DATE ${new Date().toISOString().split("T")[0]}\n`;
  if (treeData.treeName) {
    gedcom += `1 FILE ${treeData.treeName}.ged\n`;
  }
  gedcom += "\n";

  // Export individuals
  treeData.individuals.forEach((person, index) => {
    const id = person.id || `@I${index + 1}@`;
    gedcom += `0 ${id} INDI\n`;

    if (person.firstName || person.lastName) {
      const firstName = person.firstName || "";
      const lastName = person.lastName || "";
      gedcom += `1 NAME ${firstName} /${lastName}/\n`;
      if (firstName) gedcom += `2 GIVN ${firstName}\n`;
      if (lastName) gedcom += `2 SURN ${lastName}\n`;
    }

    if (person.sex) {
      gedcom += `1 SEX ${person.sex}\n`;
    }

    if (person.birthDate || person.birthPlace) {
      gedcom += "1 BIRT\n";
      if (person.birthDate) {
        gedcom += `2 DATE ${formatGEDCOMDate(
          person.birthDate as string | Date
        )}\n`;
      }
      if (person.birthPlace) {
        gedcom += `2 PLAC ${person.birthPlace}\n`;
      }
    }

    if (person.deathDate || person.deathPlace) {
      gedcom += "1 DEAT\n";
      if (person.deathDate) {
        gedcom += `2 DATE ${formatGEDCOMDate(
          person.deathDate as string | Date
        )}\n`;
      }
      if (person.deathPlace) {
        gedcom += `2 PLAC ${person.deathPlace}\n`;
      }
    }

    if (person.familyChild) {
      gedcom += `1 FAMC ${person.familyChild}\n`;
    }

    if (person.familySpouse) {
      const spouseFamilies = Array.isArray(person.familySpouse)
        ? person.familySpouse
        : [person.familySpouse];
      spouseFamilies.forEach((fam: string) => {
        gedcom += `1 FAMS ${fam}\n`;
      });
    }

    gedcom += "\n";
  });

  // Export families
  if (treeData.families) {
    treeData.families.forEach((family, index) => {
      const id = family.id || `@F${index + 1}@`;
      gedcom += `0 ${id} FAM\n`;

      if (family.husband) {
        gedcom += `1 HUSB ${family.husband}\n`;
      }

      if (family.wife) {
        gedcom += `1 WIFE ${family.wife}\n`;
      }

      if (
        family.children &&
        Array.isArray(family.children) &&
        family.children.length > 0
      ) {
        family.children.forEach((child: string) => {
          gedcom += `1 CHIL ${child}\n`;
        });
      }

      if (family.marriageDate || family.marriagePlace) {
        gedcom += "1 MARR\n";
        if (family.marriageDate) {
          gedcom += `2 DATE ${formatGEDCOMDate(
            family.marriageDate as string | Date
          )}\n`;
        }
        if (family.marriagePlace) {
          gedcom += `2 PLAC ${family.marriagePlace}\n`;
        }
      }

      gedcom += "\n";
    });
  }

  gedcom += "0 TRLR\n";
  return gedcom;
}

/**
 * Format date for GEDCOM export
 */
function formatGEDCOMDate(date: string | Date): string {
  const d = new Date(date);
  if (isNaN(d.getTime())) return date.toString();

  const months = [
    "JAN",
    "FEB",
    "MAR",
    "APR",
    "MAY",
    "JUN",
    "JUL",
    "AUG",
    "SEP",
    "OCT",
    "NOV",
    "DEC",
  ];
  const day = d.getDate();
  const month = months[d.getMonth()];
  const year = d.getFullYear();

  return `${day} ${month} ${year}`;
}

/**
 * Debounce function for search inputs
 */
export function debounce<T extends (...args: never[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Throttle function for scroll events
 */
export function throttle<T extends (...args: never[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Sleep/delay function for async operations
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.substring(0, length - 3) + "...";
}

/**
 * Capitalize first letter of string
 */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Convert string to slug
 */
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-");
}
