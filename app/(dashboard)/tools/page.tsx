"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
// import { useSession } from "next-auth/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Navigation } from "@/components/ui/navigation";
import {
  FileText,
  Dna,
  TreePine,
  MessageCircle,
  Camera,
  ArrowRight,
  Star,
  Clock,
  CheckCircle,
  Sparkles,
  TrendingUp,
  Info,
  Users,
} from "lucide-react";
import { SUBSCRIPTION_LIMITS } from "@/types";
import { useUserStatus } from "@/hooks/use-user-status";
import { Footer } from "@/components/footer";

/** Types coming from /api/dashboard (shape assumed) */
type Tier = "FREE" | "EXPLORER" | "RESEARCHER" | "PROFESSIONAL";

type DashboardUsageItem = {
  used: number;
  limit?: number | null; // may be provided by API, but we will still source limits from SUBSCRIPTION_LIMITS
  lastUsed?: string | null;
};

type DashboardResponse = {
  subscription: { tier: Tier } | null;
  usage: {
    documents: DashboardUsageItem;
    dna: DashboardUsageItem;
    trees: DashboardUsageItem;
    research: DashboardUsageItem;
    photos: DashboardUsageItem;
  };
};

interface ToolStats {
  documentAnalyzer: { used: number; lastUsed: string };
  dnaInterpreter: { used: number; lastUsed: string };
  treeBuilder: { used: number; lastUsed: string };
  researchCopilot: { used: number; lastUsed: string };
  photoStoryteller: { used: number; lastUsed: string };
}

type ToolId =
  | "document-analyzer"
  | "dna-interpreter"
  | "tree-builder"
  | "research-copilot"
  | "photo-storyteller";

interface Tool {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  tone: string;
  features: string[];
  href: string;
  popular?: boolean;
  new?: boolean;
}

/** Tools config */
const TOOLS: Tool[] = [
  {
    id: "document-analyzer",
    name: "Document Analyzer",
    description:
      "Extract names, dates, places, and relationships from historical documents using AI-powered OCR and analysis",
    icon: FileText,
    tone: "docs" as const,
    features: [
      "OCR text extraction",
      "Name and date recognition",
      "Relationship mapping",
      "Confidence scoring",
      "Research suggestions",
    ],
    href: "/tools/document-analyzer",
    popular: true,
  },
  {
    id: "dna-interpreter",
    name: "DNA & Heritage Interpreter",
    description:
      "Understand your genetic heritage with plain-language explanations and historical migration patterns",
    icon: Dna,
    tone: "dna" as const,
    features: [
      "Ethnicity breakdown",
      "Migration patterns",
      "Haplogroup analysis",
      "DNA match interpretation",
      "Historical context",
    ],
    href: "/tools/dna-interpreter",
  },
  {
    id: "tree-builder",
    name: "Smart Family Tree Builder",
    description:
      "Build comprehensive family trees with AI suggestions for probable connections and missing links",
    icon: TreePine,
    tone: "trees" as const,
    features: [
      "AI-powered suggestions",
      "Relationship validation",
      "GEDCOM export",
      "Visual tree builder",
      "Probability scoring",
    ],
    href: "/tools/tree-builder",
    popular: true,
  },
  {
    id: "research-copilot",
    name: "AI Research Copilot",
    description:
      "Get expert genealogy guidance and research strategies from your AI assistant",
    icon: MessageCircle,
    tone: "research" as const,
    features: [
      "Research strategies",
      "Record interpretation",
      "Historical context",
      "Next steps guidance",
      "Methodology education",
    ],
    href: "/tools/research-copilot",
  },
  {
    id: "photo-storyteller",
    name: "Photo Enhancer & Storyteller",
    description:
      "Analyze historical photos for time periods, contexts, and create engaging family narratives",
    icon: Camera,
    tone: "photos" as const,
    features: [
      "Date estimation",
      "Clothing analysis",
      "Historical context",
      "Story generation",
      "Location clues",
    ],
    href: "/tools/photo-storyteller",
    new: true,
  },
] as const;

/** map tool tone → CSS tokens (no dynamic Tailwind classes) */
const TONE = {
  docs: {
    ring: "var(--chart-1)",
    wash: "color-mix(in oklab, var(--chart-1) 16%, transparent)",
  },
  dna: {
    ring: "var(--lineage-dna)",
    wash: "color-mix(in oklab, var(--lineage-dna) 16%, transparent)",
  },
  trees: {
    ring: "var(--lineage-birth)",
    wash: "color-mix(in oklab, var(--lineage-birth) 16%, transparent)",
  },
  photos: {
    ring: "var(--chart-3)",
    wash: "color-mix(in oklab, var(--chart-3) 16%, transparent)",
  },
  research: {
    ring: "var(--chart-4)",
    wash: "color-mix(in oklab, var(--chart-4) 16%, transparent)",
  },
} as const;

/** tool.id → SUBSCRIPTION_LIMITS key */
const TOOL_LIMIT_KEY: Record<
  ToolId,
  keyof (typeof SUBSCRIPTION_LIMITS)["FREE"]
> = {
  "document-analyzer": "documents",
  "dna-interpreter": "dna",
  "tree-builder": "trees",
  "research-copilot": "research",
  "photo-storyteller": "photos",
};

export default function ToolsPage() {
  const { isAnonymous } = useUserStatus();
  const [toolStats, setToolStats] = useState<ToolStats | null>(null);
  const [subscription, setSubscription] = useState<{ tier?: Tier } | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);

  /** Single fetch that powers subscription + usage */
  const fetchDashboardData = useCallback(async () => {
    try {
      // Skip API call for anonymous users - they'll use server-side tracking
      if (isAnonymous) {
        setSubscription({ tier: "FREE" });
        setToolStats({
          documentAnalyzer: { used: 0, lastUsed: "Never" },
          dnaInterpreter: { used: 0, lastUsed: "Never" },
          treeBuilder: { used: 0, lastUsed: "Never" },
          researchCopilot: { used: 0, lastUsed: "Never" },
          photoStoryteller: { used: 0, lastUsed: "Never" },
        });
        setIsLoading(false);
        return;
      }

      const res = await fetch("/api/dashboard");
      if (!res.ok) {
        throw new Error("Failed to fetch dashboard data");
      }
      const data: DashboardResponse = await res.json();

      setSubscription(data.subscription ?? { tier: "FREE" });

      // Map dashboard usage → local ToolStats (limits come from SUBSCRIPTION_LIMITS later)
      setToolStats({
        documentAnalyzer: {
          used: data.usage?.documents?.used ?? 0,
          lastUsed: data.usage?.documents?.lastUsed ?? "Never",
        },
        dnaInterpreter: {
          used: data.usage?.dna?.used ?? 0,
          lastUsed: data.usage?.dna?.lastUsed ?? "Never",
        },
        treeBuilder: {
          used: data.usage?.trees?.used ?? 0,
          lastUsed: data.usage?.trees?.lastUsed ?? "Never",
        },
        researchCopilot: {
          used: data.usage?.research?.used ?? 0,
          lastUsed: data.usage?.research?.lastUsed ?? "Never",
        },
        photoStoryteller: {
          used: data.usage?.photos?.used ?? 0,
          lastUsed: data.usage?.photos?.lastUsed ?? "Never",
        },
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      // fallback to safe defaults
      setSubscription({ tier: "FREE" });
      setToolStats({
        documentAnalyzer: { used: 0, lastUsed: "Never" },
        dnaInterpreter: { used: 0, lastUsed: "Never" },
        treeBuilder: { used: 0, lastUsed: "Never" },
        researchCopilot: { used: 0, lastUsed: "Never" },
        photoStoryteller: { used: 0, lastUsed: "Never" },
      });
    } finally {
      setIsLoading(false);
    }
  }, [isAnonymous]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  /** Limits for current tier (FREE has quotas too) */
  const getTierLimits = () => {
    const tier: Tier = (subscription?.tier as Tier) || "FREE";
    return SUBSCRIPTION_LIMITS[tier] ?? SUBSCRIPTION_LIMITS.FREE;
  };

  /** All tools are accessible - API will handle restrictions */
  const getToolAccess = () => {
    // All tools are accessible for both anonymous and authenticated users
    // The API will handle access control when tools are actually used
    return true;
  };

  /** Compose usage (used from dashboard, limit from plan) */
  const getUsageInfo = (toolId: ToolId) => {
    if (!toolStats || !subscription) return null;

    const tierLimits = getTierLimits();

    const statsMap = {
      "document-analyzer": toolStats.documentAnalyzer,
      "dna-interpreter": toolStats.dnaInterpreter,
      "tree-builder": toolStats.treeBuilder,
      "research-copilot": toolStats.researchCopilot,
      "photo-storyteller": toolStats.photoStoryteller,
    } as const;

    const stat = statsMap[toolId];
    const key = TOOL_LIMIT_KEY[toolId];

    return {
      used: stat.used,
      limit: tierLimits[key],
      lastUsed: stat.lastUsed,
    };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">Loading tools…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation variant="dashboard" />
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold">Your Buddy&apos;s Toolbox</h1>
            {isAnonymous && (
              <Badge variant="secondary" className="text-sm">
                <Users className="w-4 h-4 mr-1" />
                Free Trial
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground">
            Ready to explore? Your research buddy has powerful tools to help uncover your family story!
          </p>
        </div>

        {/* Anonymous Mode Alert */}
        {isAnonymous && (
          <Alert className="mb-6">
            <Info className="h-4 w-4" />
            <AlertDescription className="flex flex-wrap items-center gap-2 justify-between w-full">
              Your buddy is ready to help! Sign up for free to save your discoveries and build on your research over time.
              <Link href="/register">
                <Button size="sm" className="ml-1">
                  Sign Up Free
                  <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </Link>
            </AlertDescription>
          </Alert>
        )}

        {/* Free Plan Alert */}
        {!isAnonymous && subscription?.tier === "FREE" && (
          <Alert className="mb-6 flex  items-center">
            <Info className="h-4 w-4 my-auto" />
            <AlertDescription className="flex flex-wrap items-center gap-2 justify-between w-full">
              You&apos;re on the Free plan. Upgrade to unlock more analyses and
              advanced features.
              <Link href="/subscription">
                <Button size="sm" className="ml-1">
                  View Plans
                  <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </Link>
            </AlertDescription>
          </Alert>
        )}

        {/* Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {TOOLS.map((tool) => {
            const toolId = tool.id as ToolId;
            const hasAccess = getToolAccess();
            const usage = getUsageInfo(toolId);

            const limit = usage?.limit ?? 0;
            const used = usage?.used ?? 0;
            const unlimited = typeof limit === "number" && limit === -1;
            // Usage tracking for potential future use
            const _atLimit =
              hasAccess &&
              !unlimited &&
              typeof limit === "number" &&
              limit > 0 &&
              used >= limit;

            const tone = TONE[tool.tone as keyof typeof TONE];

            return (
              <Card key={tool.id} className="relative overflow-hidden">
                {/* ribbons */}
                {(tool.popular || tool.new) && (
                  <div className="absolute top-2 right-2 flex gap-2">
                    {tool.popular && (
                      <Badge variant="secondary">
                        <Star className="w-3 h-3 mr-1" /> Popular
                      </Badge>
                    )}
                    {tool.new && (
                      <Badge variant="secondary">
                        <Sparkles className="w-3 h-3 mr-1" /> New
                      </Badge>
                    )}
                  </div>
                )}

                <CardHeader className="pb-3">
                  <div
                    className="inline-flex p-3 rounded-lg border w-max"
                    style={{
                      borderColor: "var(--border)",
                      background: tone.wash,
                    }}
                  >
                    <tool.icon
                      className="w-6 h-6"
                      style={{ color: tone.ring }}
                    />
                  </div>

                  <div className="mt-4 flex items-center gap-2">
                    <CardTitle className="text-xl">{tool.name}</CardTitle>
                    <Badge
                      variant="outline"
                      className="text-foreground/70 min-w-max"
                    >
                      {unlimited ? "Unlimited" : 
                       typeof limit === 'number' && limit === 0 ? "Requires Upgrade" :
                       `${limit} Monthly`}
                    </Badge>
                  </div>

                  <CardDescription>{tool.description}</CardDescription>
                </CardHeader>

                <CardContent className="space-y-5">
                  {/* Key features */}
                  <ul className="space-y-1">
                    {tool.features.slice(0, 3).map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Usage */}
                  {usage && (
                    <div className="pt-3 border-t">
                      <div className="flex justify-between items-center text-sm mb-2">
                        <span className="text-muted-foreground">
                          Monthly Usage
                        </span>
                        <span className="font-medium">
                          {unlimited
                            ? "Unlimited"
                            : limit === 0
                            ? "Requires Upgrade"
                            : `${used} / ${limit}`}
                        </span>
                      </div>

                      {/* capsule bar */}
                      {!unlimited && typeof limit === "number" && limit > 0 ? (
                        <div
                          className="h-2 w-full rounded-full border"
                          style={{
                            borderColor: "var(--border)",
                            background:
                              "color-mix(in oklab, var(--muted) 80%, transparent)",
                          }}
                        >
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${Math.min(
                                (used /
                                  (typeof limit === "number" ? limit : 1)) *
                                  100,
                                100
                              )}%`,
                              background: tone.ring,
                            }}
                          />
                        </div>
                      ) : (
                        <div
                          className="h-2 w-full rounded-full border"
                          style={{
                            borderColor: "var(--border)",
                            background:
                              "color-mix(in oklab, var(--border) 70%, transparent)",
                          }}
                        />
                      )}

                      {/* last used */}
                      {usage.lastUsed && usage.lastUsed !== "Never" && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                          <Clock className="w-3 h-3" />
                          Last used:{" "}
                          {new Date(usage.lastUsed).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  )}

                  {/* CTA */}
                  <div className="pt-1">
                    <Link href={tool.href}>
                      <Button className="w-full">
                        {isAnonymous ? "Try Tool" : "Open Tool"}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>

                {/* subtle vignette */}
                <div
                  className="pointer-events-none absolute inset-0"
                  style={{
                    background:
                      "radial-gradient(700px 200px at 110% -20%, color-mix(in oklab, var(--ring) 12%, transparent), transparent 70%)",
                  }}
                />
              </Card>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <Card
          className="mt-8 border-primary/20"
          style={{
            background:
              "linear-gradient(90deg, color-mix(in oklab, var(--primary) 10%, transparent), color-mix(in oklab, var(--lineage-dna) 10%, transparent))",
          }}
        >
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <h3 className="text-2xl font-semibold mb-2">
                  Unlock All Tools
                </h3>
                <p className="text-muted-foreground">
                  Get unlimited access to every AI genealogy workflow with the
                  Professional plan.
                </p>
              </div>
              <Link href="/subscription">
                <Button size="lg" className="whitespace-nowrap">
                  <TrendingUp className="mr-2 h-5 w-5" />
                  Upgrade Now
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
}
