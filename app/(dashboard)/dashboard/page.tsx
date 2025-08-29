"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Navigation } from "@/components/ui/navigation";
import {
  FileText,
  Dna,
  TreePine,
  MessageCircle,
  Camera,
  TrendingUp,
  ChevronRight,
  Activity as ActivityIcon,
  Sparkles,
  ArrowRight,
  PieChart,
  Download,
  Lock,
  Crown,
} from "lucide-react";
import {
  LineChart as RLineChart,
  Line,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  XAxis,
  YAxis,
  PieChart as RePieChart,
  Pie,
  Cell,
} from "recharts";

import {
  type DashboardStats,
  type RecentActivity,
  type Subscription,
  type UsageCounters,
  type UsageTrend,
} from "@/types";
import { Footer } from "@/components/footer";
import { UsageDisplay } from "@/components/ui/usage-display";
import { useUsageData } from "@/hooks/use-user-status";

const TOOL_COLORS = {
  documents: "var(--chart-1)",
  dna: "var(--chart-5)",
  translations: "var(--chart-2)",
  photos: "var(--chart-3)",
  research: "var(--chart-4)",
} as const;

export default function DashboardPage() {
  const { data: session } = useSession();
  const { data: usageData } = useUsageData();
  const [stats, setStats] = useState<DashboardStats>({
    documentsAnalyzed: 0,
    translationsCompleted: 0,
    dnaAnalyses: 0,
    photosEnhanced: 0,
    researchQuestions: 0,
    totalAnalyses: 0,
    accountAge: 0,
    lastActive: new Date().toISOString(),
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [usageTrends, setUsageTrends] = useState<UsageTrend[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    try {
      const [statsRes, activityRes, trendsRes, subRes] = await Promise.all([
        fetch("/api/dashboard/stats"),
        fetch("/api/dashboard/activity"),
        fetch("/api/dashboard/trends"),
        fetch("/api/subscription/current"),
      ]);

      const statsData = await statsRes.json();
      const activityData = await activityRes.json();
      const trendsData = await trendsRes.json();
      const subData = await subRes.json();

      setStats(statsData.stats);
      // Usage now comes from the real-time useUsageData hook
      setRecentActivity(activityData.activities || []);
      setUsageTrends(trendsData.trends || []);
      setSubscription(subData);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  }

  const pieChartData = [
    {
      name: "Documents",
      value: stats?.documentsAnalyzed ?? 0,
      color: TOOL_COLORS.documents,
    },
    { name: "DNA", value: stats?.dnaAnalyses ?? 0, color: TOOL_COLORS.dna },
    { name: "Translations", value: stats?.translationsCompleted ?? 0, color: TOOL_COLORS.translations },
    {
      name: "Photos",
      value: stats?.photosEnhanced ?? 0,
      color: TOOL_COLORS.photos,
    },
    {
      name: "Research",
      value: stats?.researchQuestions ?? 0,
      color: TOOL_COLORS.research,
    },
  ].filter((i) => i.value > 0);

  if (isLoading || !usageData) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">
            Gathering your research data…
          </p>
        </div>
      </div>
    );
  }

  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  })();

  // --- Tool hub config (driven by usage limits; limit === 0 => locked) ---
  const tools = [
    {
      key: "documents",
      href: "/tools/document-analyzer",
      title: "Document Analyzer",
      description: "Extract names, dates, places",
      icon: <FileText className="w-4 h-4" />,
      tone: TOOL_COLORS.documents,
      used: usageData?.usage?.documents?.used ?? 0,
      limit: usageData?.usage?.documents?.limit ?? 2,
    },
    {
      key: "dna",
      href: "/tools/dna-interpreter",
      title: "DNA Interpreter",
      description: "Explore matches & segments",
      icon: <Dna className="w-4 h-4" />,
      tone: TOOL_COLORS.dna,
      used: usageData?.usage?.dna?.used ?? 0,
      limit: usageData?.usage?.dna?.limit ?? 0,
    },
    {
      key: "translations",
      href: "/tools/ancient-records-translator",
      title: "Records Translator",
      description: "Translate historical documents",
      icon: <TreePine className="w-4 h-4" />,
      tone: TOOL_COLORS.translations,
      used: usageData?.usage?.translations?.used ?? 0,
      limit: usageData?.usage?.translations?.limit ?? 1,
    },
    {
      key: "research",
      href: "/tools/research-copilot",
      title: "Research Copilot",
      description: "Ask context-aware questions",
      icon: <MessageCircle className="w-4 h-4" />,
      tone: TOOL_COLORS.research,
      used: usageData?.usage?.research?.used ?? 0,
      limit: usageData?.usage?.research?.limit ?? 5,
    },
    {
      key: "photos",
      href: "/tools/photo-storyteller",
      title: "Photo Storyteller",
      description: "Identify faces & stories",
      icon: <Camera className="w-4 h-4" />,
      tone: TOOL_COLORS.photos,
      used: usageData?.usage?.photos?.used ?? 0,
      limit: usageData?.usage?.photos?.limit ?? 0,
    },
  ] as const;

  return (
    <div className="min-h-screen bg-background">
      <Navigation variant="dashboard" />
      <div className="container mx-auto px-4 py-6 md:py-8 max-w-7xl">
        {/* Welcome Header */}

        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-20">
          <div>
            <div className="flex items-center gap-4 mb-3">
              <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-primary-foreground text-2xl font-bold">
                🧬
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                {greeting}, {session?.user?.name?.split(" ")[0] ?? "Explorer"}.
              </h1>
            </div>
            <p className="text-lg text-muted-foreground">
              Continue discovering your genealogical research with AI-powered analysis
              tools.
            </p>
          </div>
          <div className="flex gap-3">
            <Button size="lg" className="hover-lift" asChild>
              <Link href="/tools">
                <Sparkles className="h-5 w-5 mr-2" />
                Explore Tools
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="hover-lift" asChild>
              <Link href="/subscription">
                <TrendingUp className="h-5 w-5 mr-2" />
                {subscription?.tier ?? "Free"} Plan
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <KpiCard
            title="Documents"
            value={stats?.documentsAnalyzed ?? 0}
            icon={<FileText className="w-4 h-4" />}
            accent="text-blue-600"
          />
          <KpiCard
            title="DNA Analyses"
            value={stats?.dnaAnalyses ?? 0}
            icon={<Dna className="w-4 h-4" />}
            accent="text-purple-600"
          />
          <KpiCard
            title="Research Trees"
            value={stats?.translationsCompleted ?? 0}
            icon={<TreePine className="w-4 h-4" />}
            accent="text-green-600"
          />
          <KpiCard
            title="Photos"
            value={stats?.photosEnhanced ?? 0}
            icon={<Camera className="w-4 h-4" />}
            accent="text-orange-600"
          />
          <KpiCard
            title="Research"
            value={stats?.researchQuestions ?? 0}
            icon={<MessageCircle className="w-4 h-4" />}
            accent="text-cyan-600"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: usage + trends + activity */}
          <div className="lg:col-span-2 space-y-8">
            {/* Usage Overview */}
            <Card variant="elevated" className="animate-slide-up">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl">Monthly Usage</CardTitle>
                    <CardDescription>
                      {subscription?.tier || "Free"} plan • Renews in{" "}
                      {Math.max(0, 30 - new Date().getDate())} days
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="hover-lift"
                    asChild
                  >
                    <Link href="/subscription">
                      <TrendingUp className="mr-2 h-4 w-4" />
                      Upgrade
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="grid gap-4">
                <UsageCapsule
                  label="Document Analyses"
                  used={usageData?.usage?.documents?.used ?? 0}
                  limit={usageData?.usage?.documents?.limit ?? 2}
                  icon={<FileText className="w-4 h-4" />}
                  barColor="bg-blue-500"
                />
                <UsageCapsule
                  label="DNA Analyses"
                  used={usageData?.usage?.dna?.used ?? 0}
                  limit={usageData?.usage?.dna?.limit ?? 0}
                  icon={<Dna className="w-4 h-4" />}
                  barColor="bg-purple-500"
                />
                <UsageCapsule
                  label="Translations"
                  used={usageData?.usage?.translations?.used ?? 0}
                  limit={usageData?.usage?.translations?.limit ?? 1}
                  icon={<TreePine className="w-4 h-4" />}
                  barColor="bg-green-500"
                />
                <UsageCapsule
                  label="Photo Analyses"
                  used={usageData?.usage?.photos?.used ?? 0}
                  limit={usageData?.usage?.photos?.limit ?? 0}
                  icon={<Camera className="w-4 h-4" />}
                  barColor="bg-orange-500"
                />
                <UsageCapsule
                  label="Research Questions"
                  used={usageData?.usage?.research?.used ?? 0}
                  limit={usageData?.usage?.research?.limit ?? 5}
                  icon={<MessageCircle className="w-4 h-4" />}
                  barColor="bg-cyan-500"
                />
              </CardContent>
            </Card>

            {/* Usage Trends */}
            <Card variant="elevated" className="animate-slide-up">
              <CardHeader>
                <CardTitle className="text-xl">Usage Trends</CardTitle>
                <CardDescription>
                  Activity across the last 6 months
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RLineChart data={usageTrends}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="color-mix(in oklab, var(--border) 90%, transparent)"
                      />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line
                        dataKey="documents"
                        stroke={TOOL_COLORS.documents}
                        strokeWidth={2}
                        name="Documents"
                        type="monotone"
                      />
                      <Line
                        dataKey="dna"
                        stroke={TOOL_COLORS.dna}
                        strokeWidth={2}
                        name="DNA"
                        type="monotone"
                      />
                      <Line
                        dataKey="translations"
                        stroke={TOOL_COLORS.translations}
                        strokeWidth={2}
                        name="Translations"
                        type="monotone"
                      />
                      <Line
                        dataKey="photos"
                        stroke={TOOL_COLORS.photos}
                        strokeWidth={2}
                        name="Photos"
                        type="monotone"
                      />
                      <Line
                        dataKey="research"
                        stroke={TOOL_COLORS.research}
                        strokeWidth={2}
                        name="Research"
                        type="monotone"
                      />
                    </RLineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card variant="elevated" className="animate-slide-up">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">Recent Activity</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    className="hover-lift"
                    asChild
                  >
                    <Link href="/activity">
                      View All
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {recentActivity.length ? (
                  <ul className="timeline">
                    {recentActivity.slice(0, 6).map((a) => (
                      <li key={a.id} className="t-item">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <p className="t-title truncate">{a.title}</p>
                            <p className="t-meta">
                              {new Date(a.timestamp).toLocaleString()}
                            </p>
                          </div>
                          <Badge
                            variant="outline"
                            className={statusCls(a.status)}
                          >
                            {a.status}
                          </Badge>
                        </div>
                        <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                          <span className={iconColor(a.type)}>
                            {iconFor(a.type)}
                          </span>
                          <span className="capitalize">{a.type}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <EmptyState
                    icon={<ActivityIcon className="w-10 h-10" />}
                    title="No recent activity"
                    description="Start by exploring our AI-powered tools."
                    ctaHref="/tools"
                    ctaLabel="Explore Tools"
                  />
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right: AI Tool Hub + distribution + account */}
          <div className="space-y-8">
            {/* AI Tool Hub */}
            <Card variant="elevated" className="animate-slide-up">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-3 text-xl">
                      AI Tool Hub
                      {subscription?.tier && subscription.tier !== "FREE" ? (
                        <Badge variant="success" className="gap-1">
                          <Crown className="h-3.5 w-3.5" />
                          {subscription?.tier ?? "Free"}
                        </Badge>
                      ) : (
                        <Badge variant="muted">Free</Badge>
                      )}
                    </CardTitle>
                    <CardDescription>
                      Quick access to your AI-powered genealogy workflows
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="hover-lift"
                    asChild
                  >
                    <Link href="/subscription">
                      <TrendingUp className="mr-2 h-4 w-4" />
                      Upgrade
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="grid gap-4">
                {tools.map((t) => {
                  const locked = t.limit === 0;
                  return (
                    <ToolTile
                      key={t.key}
                      href={t.href}
                      title={t.title}
                      description={t.description}
                      icon={t.icon}
                      tone={t.tone}
                      locked={locked}
                      used={t.used}
                      limit={t.limit}
                    />
                  );
                })}
              </CardContent>
            </Card>
            {/* Tool Usage Distribution */}
            <Card variant="elevated" className="animate-slide-up">
              <CardHeader>
                <CardTitle className="text-xl">AI Tool Usage</CardTitle>
                <CardDescription>Distribution of your analyses</CardDescription>
              </CardHeader>
              <CardContent>
                {pieChartData.length ? (
                  <div className="h-6">
                    <ResponsiveContainer width="100%" height="100%">
                      <RePieChart>
                        <Pie
                          data={pieChartData}
                          cx="50%"
                          cy="50%"
                          outerRadius={85}
                          innerRadius={48}
                          paddingAngle={2}
                          dataKey="value"
                          label={(e) => `${e.name} · ${e.value}`}
                        >
                          {pieChartData.map((e, i) => (
                            <Cell key={i} fill={e.color as string} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </RePieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <EmptyState
                    icon={<PieChart className="w-10 h-10 mx-auto" />}
                    title="No data yet"
                    description="Use any tool to populate your distribution."
                    ctaHref="/tools"
                    ctaLabel="Explore Tools"
                  />
                )}
              </CardContent>
            </Card>

            {/* Account Snapshot */}
            <Card variant="elevated" className="animate-slide-up">
              <CardHeader>
                <CardTitle className="text-xl">Account Snapshot</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Row label="Total Analyses" value={stats?.totalAnalyses ?? 0} />
                <Row
                  label="Account Age"
                  value={`${stats?.accountAge ?? 0} days`}
                />
                <Row
                  label="Last Active"
                  value={new Date(
                    stats?.lastActive ?? new Date()
                  ).toLocaleDateString()}
                />
                <div className="pt-2">
                  <Button size="sm" className="hover-lift" asChild>
                    <Link href="/exports" className="flex gap-x-2">
                      <Download className="h-4 w-4" />
                      Export Data
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Usage Display */}
            <UsageDisplay />
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

/* ---------- components ---------- */

function KpiCard({
  title,
  value,
  icon,
  accent,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  accent: string;
}) {
  return (
    <Card variant="elevated" className="hover-lift group animate-scale-in">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="p-3 rounded-xl bg-primary/10 group-hover:scale-110 transition-transform">
            <span className={accent}>{icon}</span>
          </div>
        </div>
        <div className="text-3xl font-bold text-foreground leading-none">
          {value}
        </div>
        <p className="text-sm text-muted-foreground mt-2">{title}</p>
      </CardContent>
    </Card>
  );
}

function UsageCapsule({
  label,
  used,
  limit,
  icon,
  barColor,
}: {
  label: string;
  used: number;
  limit: number;
  icon: React.ReactNode;
  barColor: string;
}) {
  const isUnlimited = limit === -1;
  const noAccess = limit === 0;
  const pct = isUnlimited
    ? 0
    : noAccess
    ? 100
    : Math.min((used / limit) * 100, 100);

  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">{icon}</span>
          <span>{label}</span>
        </div>
        <span className="font-medium">
          {isUnlimited
            ? "Unlimited"
            : noAccess
            ? "Not available"
            : `${used} / ${limit}`}
        </span>
      </div>
      <div
        className="h-2 w-full rounded-full border"
        style={{
          borderColor: "var(--border)",
          background: noAccess
            ? "color-mix(in oklab, var(--border) 80%, transparent)"
            : "color-mix(in oklab, var(--muted) 80%, transparent)",
        }}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={limit > 0 ? limit : 100}
        aria-valuenow={limit > 0 ? used : 0}
      >
        {!isUnlimited && (
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${pct}%`, background: barColor }}
          />
        )}
      </div>
    </div>
  );
}

function EmptyState({
  icon,
  title,
  description,
  ctaHref,
  ctaLabel,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  ctaHref: string;
  ctaLabel: string;
}) {
  return (
    <div className="text-center py-10">
      <div className="mx-auto mb-3 text-muted-foreground">{icon}</div>
      <p className="font-medium">{title}</p>
      <p className="text-sm text-muted-foreground">{description}</p>
      <Button className="mt-4 hover-lift" variant="outline" asChild>
        <Link href={ctaHref}>
          {ctaLabel}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </Button>
    </div>
  );
}

/**
 * Redesigned ToolTile
 * - If locked (limit === 0), it’s NOT a link and shows a lock + Pro badge.
 * - Shows a small usage chip: Unlimited / Not available / (used / limit).
 * - Maintains single “Quick Access” layout, just elevated into Tool Hub.
 */
function ToolTile({
  href,
  title,
  description,
  icon,
  tone,
  locked = false,
  used,
  limit,
}: {
  href: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  tone: string;
  locked?: boolean;
  used: number;
  limit: number;
}) {
  const isUnlimited = limit === -1;
  const Info = (
    <div
      className={[
        "group relative flex items-center justify-between p-3 rounded-lg border transition-all bg-card",
        locked
          ? "opacity-70 cursor-not-allowed"
          : "hover:shadow-sm cursor-pointer",
      ].join(" ")}
      aria-disabled={locked}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div
          className="p-2 rounded-md"
          style={{
            background: "color-mix(in oklab, var(--ring) 12%, transparent)",
          }}
        >
          <span style={{ color: tone }}>{icon}</span>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium truncate flex items-center gap-2">
            {title}
            {locked ? (
              <Badge variant="outline" className="h-5 px-1.5 gap-1">
                <Lock className="h-3.5 w-3.5" /> Pro
              </Badge>
            ) : null}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {description}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <Badge variant="outline" className="text-[11px]">
          {isUnlimited
            ? "Unlimited"
            : limit === 0
            ? "Not available"
            : `${used} / ${limit}`}
        </Badge>
        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
      </div>

      {locked && (
        <div
          className="pointer-events-none absolute inset-0 rounded-lg"
          style={{
            background:
              "linear-gradient(to bottom right, color-mix(in oklab, var(--background) 70%, transparent), transparent)",
          }}
          aria-hidden
        />
      )}
    </div>
  );

  // Only wrap with Link if not locked (free tier clickability rule)
  return locked ? (
    <div>{Info}</div>
  ) : (
    <Link href={href} aria-label={title}>
      {Info}
    </Link>
  );
}

function Row({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

/* helpers */
function statusCls(status: RecentActivity["status"]) {
  if (status === "completed") return "text-green-600 border-green-200";
  if (status === "processing") return "text-amber-600 border-amber-200";
  return "text-red-600 border-red-200";
}
function iconFor(type: RecentActivity["type"]) {
  const map = {
    document: <FileText className="w-4 h-4" />,
    dna: <Dna className="w-4 h-4" />,
    translation: <TreePine className="w-4 h-4" />,
    research: <MessageCircle className="w-4 h-4" />,
    photo: <Camera className="w-4 h-4" />,
  };
  return map[type];
}
function iconColor(type: RecentActivity["type"]) {
  const map = {
    document: "text-[var(--chart-1)]",
    dna: "text-[var(--lineage-dna)]",
    translation: "text-[var(--lineage-birth)]",
    research: "text-[var(--chart-4)]",
    photo: "text-[var(--chart-3)]",
  } as const;
  return map[type];
}
