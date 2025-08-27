/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Users,
  Activity,
  DollarSign,
  TrendingUp,
  Search,
  Download,
  MoreVertical,
  Shield,
  CheckCircle,
  Clock,
  BarChart3,
  Mail,
  Ban,
  Trash2,
  Eye,
  Send,
  RefreshCw,
  Database,
  Server,
  HardDrive,
  Info,
  FileText,
  Loader2,
  Calendar,
  UserCheck,
  Globe,
  Lock,
  Copy,
  MessageCircle,
  User,
  TreePine,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RePieChart,
  Pie,
  Cell,
  Legend,
  Area,
  AreaChart,
} from "recharts";
import { format, formatDistanceToNow } from "date-fns";
import type {
  UserType,
  AdminLog,
  AdminStats,
  RevenueData,
  SupportTicket,
  SystemHealth,
  ToolUsageData,
} from "@/types";

// Constants
const SUBSCRIPTION_COLORS = {
  FREE: "#6B7280",
  EXPLORER: "#3B82F6",
  RESEARCHER: "#8B5CF6",
  PROFESSIONAL: "#F59E0B",
};

const ADMIN_EMAILS = ["admin@genealogyai.com", "support@genealogyai.com"];

export default function AdminPage() {
  const { data: session } = useSession();
  const router = useRouter();

  // State management
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [refreshing, setRefreshing] = useState(false);

  // Data states
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    activeUsers: 0,
    newUsersToday: 0,
    newUsersThisWeek: 0,
    newUsersThisMonth: 0,
    totalRevenue: 0,
    mrr: 0,
    arr: 0,
    churnRate: 0,
    conversionRate: 0,
    avgRevenuePerUser: 0,
    lifetimeValue: 0,
    totalAnalyses: 0,
    analysesToday: 0,
    apiCallsToday: 0,
    storageUsed: 0,
    storageLimit: 500,
  });

  const [users, setUsers] = useState<UserType[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserType[]>([]);
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [toolUsageData, setToolUsageData] = useState<ToolUsageData[]>([]);
  const [subscriptionDistribution, setSubscriptionDistribution] = useState([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealth[]>([]);
  const [adminLogs, setAdminLogs] = useState<AdminLog[]>([]);
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);

  // UI states
  const [searchQuery, setSearchQuery] = useState("");
  const [userFilter, setUserFilter] = useState("all");
  const [dateRange, setDateRange] = useState("30d");
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailContent, setEmailContent] = useState("");
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(
    null
  );

  // Check admin access
  useEffect(() => {
    // if (!session?.user?.email || !ADMIN_EMAILS.includes(session.user.email)) {
    //   router.push("/dashboard");
    //   return;
    // }

    fetchAllData();

    // Set up auto-refresh
    const interval = setInterval(() => {
      fetchAllData(true);
    }, 60000); // Refresh every minute

    return () => clearInterval(interval);
  }, [session, router]);

  // Data fetching
  const fetchAllData = async (silent = false) => {
    if (!silent) setIsLoading(true);
    setRefreshing(true);

    try {
      const [
        statsRes,
        usersRes,
        revenueRes,
        usageRes,
        healthRes,
        logsRes,
        ticketsRes,
      ] = await Promise.all([
        fetch("/api/admin/stats"),
        fetch("/api/admin/users"),
        fetch("/api/admin/revenue"),
        fetch("/api/admin/usage"),
        fetch("/api/admin/health"),
        fetch("/api/admin/logs"),
        fetch("/api/admin/tickets"),
      ]);

      const [
        statsData,
        usersData,
        revenueData,
        usageData,
        healthData,
        logsData,
        ticketsData,
      ] = await Promise.all([
        statsRes.json(),
        usersRes.json(),
        revenueRes.json(),
        usageRes.json(),
        healthRes.json(),
        logsRes.json(),
        ticketsRes.json(),
      ]);

      setStats(statsData);
      setUsers(usersData.users || []);
      setFilteredUsers(usersData.users || []);
      setRevenueData(revenueData.data || []);
      setToolUsageData(usageData.tools || []);
      setSubscriptionDistribution(usageData.subscriptions || []);
      setSystemHealth(healthData.services || []);
      setAdminLogs(logsData.logs || []);
      setSupportTickets(ticketsData.tickets || []);
    } catch (error) {
      console.error("Error fetching admin data:", error);
      toast("Error", {
        description: "Failed to fetch admin data",
      });
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  // User filtering
  useEffect(() => {
    let filtered = users;

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (user) =>
          user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply status filter
    if (userFilter !== "all") {
      filtered = filtered.filter((user) => {
        switch (userFilter) {
          case "active":
            return user.status === "active";
          case "inactive":
            return user.status === "inactive";
          case "suspended":
            return user.status === "suspended" || user.status === "banned";
          case "paid":
            return user.subscription !== "FREE";
          case "free":
            return user.subscription === "FREE";
          default:
            return true;
        }
      });
    }

    setFilteredUsers(filtered);
  }, [searchQuery, userFilter, users]);

  // User actions
  const handleUserAction = async (userId: string, action: string) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      if (!res.ok) throw new Error("Action failed");

      toast("Success", {
        description: `User ${action} completed`,
      });

      fetchAllData(true);
    } catch (error) {
      toast("Error", {
        description: `Failed to ${action} user`,
      });
    }
  };

  const handleSendEmail = async () => {
    if (!selectedUser || !emailSubject || !emailContent) return;

    try {
      const res = await fetch("/api/admin/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: selectedUser.email,
          subject: emailSubject,
          content: emailContent,
        }),
      });

      if (!res.ok) throw new Error("Failed to send email");

      toast("Email sent", {
        description: `Email sent to ${selectedUser.email}`,
      });

      setEmailModalOpen(false);
      setEmailSubject("");
      setEmailContent("");
    } catch (error) {
      toast("Error", {
        description: "Failed to send email",
      });
    }
  };

  const exportData = async (type: string) => {
    try {
      const res = await fetch(`/api/admin/export?type=${type}`);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${type}-export-${format(new Date(), "yyyy-MM-dd")}.csv`;
      a.click();
    } catch (error) {
      toast("Export failed", {
        description: "Failed to export data",
      });
    }
  };

  // Calculate additional metrics
  const calculateGrowthRate = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return (((current - previous) / previous) * 100).toFixed(1);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
      case "operational":
        return "text-green-500";
      case "inactive":
      case "degraded":
        return "text-yellow-500";
      case "suspended":
      case "banned":
      case "down":
        return "text-red-500";
      default:
        return "text-gray-500";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "destructive";
      case "high":
        return "destructive";
      case "medium":
        return "secondary";
      case "low":
        return "outline";
      default:
        return "default";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Shield className="w-12 h-12 mx-auto mb-4 text-primary animate-pulse" />
          <p className="text-lg font-semibold">Loading Admin Dashboard...</p>
          <p className="text-sm text-muted-foreground mt-2">
            Verifying admin access
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-[1600px]">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Shield className="w-8 h-8 text-primary" />
              <h1 className="text-3xl font-bold">Admin Dashboard</h1>
              {refreshing && (
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              )}
            </div>
            <p className="text-muted-foreground">
              System overview and management controls
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="py-1">
              <Clock className="w-3 h-3 mr-1" />
              Last updated:{" "}
              {formatDistanceToNow(new Date(), { addSuffix: true })}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchAllData()}
              disabled={refreshing}
            >
              <RefreshCw
                className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
          <TabsTrigger value="support">Support</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6 mt-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Total Users"
              value={stats.totalUsers.toLocaleString()}
              change={stats.newUsersThisMonth}
              changeLabel="this month"
              icon={<Users className="w-5 h-5" />}
              color="blue"
            />
            <MetricCard
              title="Monthly Revenue"
              value={`$${stats.mrr.toLocaleString()}`}
              change={12.5}
              changeLabel="vs last month"
              icon={<DollarSign className="w-5 h-5" />}
              color="green"
            />
            <MetricCard
              title="Active Users"
              value={stats.activeUsers.toLocaleString()}
              change={-3.2}
              changeLabel="vs last week"
              icon={<Activity className="w-5 h-5" />}
              color="purple"
            />
            <MetricCard
              title="Total Analyses"
              value={stats.totalAnalyses.toLocaleString()}
              change={stats.analysesToday}
              changeLabel="today"
              icon={<BarChart3 className="w-5 h-5" />}
              color="orange"
            />
          </div>

          {/* Growth Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">
                  Conversion Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.conversionRate.toFixed(1)}%
                </div>
                <Progress value={stats.conversionRate} className="mt-2" />
                <p className="text-xs text-muted-foreground mt-2">
                  Free to paid conversion
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">
                  Churn Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.churnRate.toFixed(1)}%
                </div>
                <Progress value={stats.churnRate} className="mt-2" />
                <p className="text-xs text-muted-foreground mt-2">
                  Monthly churn
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">ARPU</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${stats.avgRevenuePerUser.toFixed(2)}
                </div>
                <Progress
                  value={(stats.avgRevenuePerUser / 79) * 100}
                  className="mt-2"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Average revenue per user
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue Trend</CardTitle>
                <CardDescription>
                  Monthly recurring revenue and growth
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={revenueData}>
                      <defs>
                        <linearGradient
                          id="colorRevenue"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#3B82F6"
                            stopOpacity={0.8}
                          />
                          <stop
                            offset="95%"
                            stopColor="#3B82F6"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip formatter={(value) => `$${value}`} />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="#3B82F6"
                        fillOpacity={1}
                        fill="url(#colorRevenue)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Subscription Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Subscription Distribution</CardTitle>
                <CardDescription>Users by subscription tier</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RePieChart>
                      <Pie
                        data={subscriptionDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry) => `${entry.name}: ${entry.value}`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {subscriptionDistribution.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={
                              SUBSCRIPTION_COLORS[
                                // @ts-ignore
                                entry.name as keyof typeof SUBSCRIPTION_COLORS
                              ]
                            }
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </RePieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Admin Activity</CardTitle>
              <CardDescription>
                Latest actions performed by administrators
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[200px]">
                <div className="space-y-3">
                  {adminLogs.slice(0, 10).map((log) => (
                    <div
                      key={log.id}
                      className="flex items-center justify-between text-sm"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-primary rounded-full" />
                        <span className="font-medium">{log.action}</span>
                        <span className="text-muted-foreground">
                          by {log.user}
                        </span>
                        {log.target && (
                          <span className="text-muted-foreground">
                            on {log.target}
                          </span>
                        )}
                      </div>
                      <span className="text-muted-foreground">
                        {formatDistanceToNow(new Date(log.timestamp), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>User Management</CardTitle>
                  <CardDescription>
                    {filteredUsers.length} of {users.length} users shown
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search users..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 w-64"
                    />
                  </div>
                  <Select value={userFilter} onValueChange={setUserFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Users</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="free">Free</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" onClick={() => exportData("users")}>
                    <Download className="mr-2 h-4 w-4" />
                    Export
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Subscription</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Provider</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Last Active</TableHead>
                      <TableHead>Usage</TableHead>
                      <TableHead>Revenue</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {user.image ? (
                              <img
                                src={user.image}
                                alt={user.name}
                                className="w-8 h-8 rounded-full"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                                <User className="w-4 h-4 text-gray-500" />
                              </div>
                            )}
                            <div>
                              <p className="font-medium">{user.name}</p>
                              <div className="flex items-center gap-2">
                                <p className="text-sm text-muted-foreground">
                                  {user.email}
                                </p>
                                {user.emailVerified && (
                                  <CheckCircle className="w-3 h-3 text-green-500" />
                                )}
                                {user.twoFactorEnabled && (
                                  <Lock className="w-3 h-3 text-blue-500" />
                                )}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            style={{
                              backgroundColor: `${
                                SUBSCRIPTION_COLORS[user.subscription]
                              }20`,
                              color: SUBSCRIPTION_COLORS[user.subscription],
                            }}
                          >
                            {user.subscription}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              user.status === "active"
                                ? "default"
                                : user.status === "suspended" ||
                                  user.status === "banned"
                                ? "destructive"
                                : "secondary"
                            }
                          >
                            <div
                              className={`w-2 h-2 rounded-full mr-1 ${
                                user.status === "active"
                                  ? "bg-green-500"
                                  : user.status === "inactive"
                                  ? "bg-gray-500"
                                  : "bg-red-500"
                              }`}
                            />
                            {user.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {user.provider === "google" ? (
                              <>
                                <Globe className="w-3 h-3" /> Google
                              </>
                            ) : (
                              <>
                                <Mail className="w-3 h-3" /> Email
                              </>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {format(new Date(user.createdAt), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {formatDistanceToNow(new Date(user.lastActive), {
                              addSuffix: true,
                            })}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm space-y-1">
                            <div className="flex items-center gap-1">
                              <FileText className="w-3 h-3" />
                              {user.documentsAnalyzed} docs
                            </div>
                            <div className="flex items-center gap-1">
                              <TreePine className="w-3 h-3" />
                              {user.treesCreated} trees
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">
                            ${user.totalSpent.toFixed(2)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedUser(user);
                                  // View user details
                                }}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedUser(user);
                                  setEmailModalOpen(true);
                                }}
                              >
                                <Mail className="mr-2 h-4 w-4" />
                                Send Email
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  navigator.clipboard.writeText(user.email);
                                  toast("Copied", {
                                    description: "Email copied to clipboard",
                                  });
                                }}
                              >
                                <Copy className="mr-2 h-4 w-4" />
                                Copy Email
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {user.status === "active" ? (
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleUserAction(user.id, "suspend")
                                  }
                                  className="text-yellow-600"
                                >
                                  <Ban className="mr-2 h-4 w-4" />
                                  Suspend User
                                </DropdownMenuItem>
                              ) : user.status === "suspended" ? (
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleUserAction(user.id, "activate")
                                  }
                                  className="text-green-600"
                                >
                                  <UserCheck className="mr-2 h-4 w-4" />
                                  Activate User
                                </DropdownMenuItem>
                              ) : null}
                              <DropdownMenuItem
                                onClick={() =>
                                  handleUserAction(user.id, "reset-password")
                                }
                              >
                                <Lock className="mr-2 h-4 w-4" />
                                Reset Password
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => {
                                  if (
                                    confirm(
                                      "Are you sure you want to delete this user? This action cannot be undone."
                                    )
                                  ) {
                                    handleUserAction(user.id, "delete");
                                  }
                                }}
                                className="text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete User
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Revenue Tab */}
        <TabsContent value="revenue" className="space-y-6 mt-6">
          {/* Revenue Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">
                    Total Revenue
                  </span>
                  <DollarSign className="w-4 h-4 text-muted-foreground" />
                </div>
                <p className="text-2xl font-bold">
                  ${stats.totalRevenue.toLocaleString()}
                </p>
                <p className="text-xs text-green-500 mt-1">All time</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">MRR</span>
                  <TrendingUp className="w-4 h-4 text-muted-foreground" />
                </div>
                <p className="text-2xl font-bold">
                  ${stats.mrr.toLocaleString()}
                </p>
                <p className="text-xs text-green-500 mt-1">
                  +12.5% from last month
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">ARR</span>
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                </div>
                <p className="text-2xl font-bold">
                  ${stats.arr.toLocaleString()}
                </p>
                <p className="text-xs text-green-500 mt-1">Projected annual</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">LTV</span>
                  <Users className="w-4 h-4 text-muted-foreground" />
                </div>
                <p className="text-2xl font-bold">
                  ${stats.lifetimeValue.toFixed(0)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Avg lifetime value
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Revenue Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue & Churn Chart */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Revenue & Churn Analysis</CardTitle>
                    <CardDescription>
                      Monthly revenue, new subscriptions, and churn
                    </CardDescription>
                  </div>
                  <Select value={dateRange} onValueChange={setDateRange}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7d">Last 7 days</SelectItem>
                      <SelectItem value="30d">Last 30 days</SelectItem>
                      <SelectItem value="90d">Last 90 days</SelectItem>
                      <SelectItem value="1y">Last year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={revenueData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip />
                      <Legend />
                      <Bar
                        yAxisId="left"
                        dataKey="revenue"
                        fill="#3B82F6"
                        name="Revenue ($)"
                      />
                      <Bar
                        yAxisId="left"
                        dataKey="subscriptions"
                        fill="#10B981"
                        name="New Subscriptions"
                      />
                      <Bar
                        yAxisId="right"
                        dataKey="churn"
                        fill="#EF4444"
                        name="Churned Users"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Cohort Analysis */}
            <Card>
              <CardHeader>
                <CardTitle>Cohort Retention</CardTitle>
                <CardDescription>
                  User retention by signup month
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px] flex items-center justify-center">
                  <div className="text-center">
                    <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-muted-foreground">
                      Cohort analysis chart
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Retention rates by user cohort
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Subscription Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>Subscription Metrics</CardTitle>
              <CardDescription>Detailed breakdown by plan</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Plan</TableHead>
                    <TableHead>Users</TableHead>
                    <TableHead>MRR</TableHead>
                    <TableHead>Avg Revenue</TableHead>
                    <TableHead>Churn Rate</TableHead>
                    <TableHead>Growth</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {["FREE", "EXPLORER", "RESEARCHER", "PROFESSIONAL"].map(
                    (plan) => {
                      const planUsers = users.filter(
                        (u) => u.subscription === plan
                      ).length;
                      const planRevenue =
                        plan === "FREE"
                          ? 0
                          : plan === "EXPLORER"
                          ? planUsers * 19
                          : plan === "RESEARCHER"
                          ? planUsers * 39
                          : planUsers * 79;

                      return (
                        <TableRow key={plan}>
                          <TableCell>
                            <Badge
                              style={{
                                backgroundColor: `${
                                  SUBSCRIPTION_COLORS[
                                    plan as keyof typeof SUBSCRIPTION_COLORS
                                  ]
                                }20`,
                                color:
                                  SUBSCRIPTION_COLORS[
                                    plan as keyof typeof SUBSCRIPTION_COLORS
                                  ],
                              }}
                            >
                              {plan}
                            </Badge>
                          </TableCell>
                          <TableCell>{planUsers}</TableCell>
                          <TableCell>${planRevenue}</TableCell>
                          <TableCell>
                            ${plan === "FREE" ? 0 : planRevenue / planUsers}
                          </TableCell>
                          <TableCell>
                            <span className="text-red-500">2.5%</span>
                          </TableCell>
                          <TableCell>
                            <span className="text-green-500">+12%</span>
                          </TableCell>
                        </TableRow>
                      );
                    }
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6 mt-6">
          {/* Tool Usage */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Tool Usage Analytics</CardTitle>
                  <CardDescription>
                    Usage statistics for each genealogy tool
                  </CardDescription>
                </div>
                <Button variant="outline" onClick={() => exportData("usage")}>
                  <Download className="mr-2 h-4 w-4" />
                  Export Data
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={toolUsageData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="tool" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="usage" fill="#8884d8">
                      {toolUsageData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-6">
                {toolUsageData.map((tool) => (
                  <Card key={tool.tool}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">{tool.tool}</span>
                        <span
                          className={`text-xs ${
                            tool.change > 0 ? "text-green-500" : "text-red-500"
                          }`}
                        >
                          {tool.change > 0 ? "+" : ""}
                          {tool.change}%
                        </span>
                      </div>
                      <p className="text-2xl font-bold">
                        {tool.usage.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Total uses
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* User Behavior */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>User Engagement</CardTitle>
                <CardDescription>
                  Daily active users and session duration
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">
                        Daily Active Users
                      </span>
                      <span className="text-sm text-muted-foreground">85%</span>
                    </div>
                    <Progress value={85} />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">
                        Weekly Active Users
                      </span>
                      <span className="text-sm text-muted-foreground">92%</span>
                    </div>
                    <Progress value={92} />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">
                        Monthly Active Users
                      </span>
                      <span className="text-sm text-muted-foreground">78%</span>
                    </div>
                    <Progress value={78} />
                  </div>
                  <Separator className="my-4" />
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold">24.3</p>
                      <p className="text-xs text-muted-foreground">
                        Avg session (min)
                      </p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold">3.7</p>
                      <p className="text-xs text-muted-foreground">
                        Sessions per user
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>API Usage</CardTitle>
                <CardDescription>
                  Claude API and system resource usage
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">
                        Claude API Calls
                      </span>
                      <span className="text-sm font-bold">
                        {stats.apiCallsToday.toLocaleString()}
                      </span>
                    </div>
                    <Progress value={65} />
                    <p className="text-xs text-muted-foreground mt-1">
                      65% of daily limit
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Storage Used</span>
                      <span className="text-sm font-bold">
                        {stats.storageUsed} GB
                      </span>
                    </div>
                    <Progress
                      value={(stats.storageUsed / stats.storageLimit) * 100}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {stats.storageUsed} of {stats.storageLimit} GB
                    </p>
                  </div>
                  <Separator className="my-4" />
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      API costs this month:{" "}
                      <strong>
                        ${(stats.apiCallsToday * 0.002).toFixed(2)}
                      </strong>
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* System Tab */}
        <TabsContent value="system" className="space-y-6 mt-6">
          {/* System Health */}
          <Card>
            <CardHeader>
              <CardTitle>System Health Monitor</CardTitle>
              <CardDescription>
                Real-time system status and performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {systemHealth.map((service) => (
                  <div
                    key={service.service}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          service.status === "operational"
                            ? "bg-green-500"
                            : service.status === "degraded"
                            ? "bg-yellow-500"
                            : "bg-red-500"
                        } animate-pulse`}
                      />
                      <div>
                        <p className="font-medium">{service.service}</p>
                        <p className="text-sm text-muted-foreground">
                          Status:{" "}
                          <span className={getStatusColor(service.status)}>
                            {service.status}
                          </span>
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-8 text-right">
                      <div>
                        <p className="text-sm font-medium">{service.uptime}%</p>
                        <p className="text-xs text-muted-foreground">Uptime</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {service.responseTime}ms
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Response
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {service.errorRate}%
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Error rate
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Database Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Database className="w-4 h-4" />
                  Database
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Connections</span>
                    <span className="font-medium">42 / 100</span>
                  </div>
                  <Progress value={42} />
                  <div className="flex justify-between text-sm">
                    <span>Size</span>
                    <span className="font-medium">2.4 GB</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Queries/sec</span>
                    <span className="font-medium">127</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Server className="w-4 h-4" />
                  Server
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>CPU Usage</span>
                    <span className="font-medium">34%</span>
                  </div>
                  <Progress value={34} />
                  <div className="flex justify-between text-sm">
                    <span>Memory</span>
                    <span className="font-medium">4.2 / 8 GB</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Load Average</span>
                    <span className="font-medium">0.82</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <HardDrive className="w-4 h-4" />
                  Storage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Storage Usage</span>
                    <span className="font-medium">124 GB</span>
                  </div>
                  <Progress value={24.8} />
                  <div className="flex justify-between text-sm">
                    <span>CDN Cache</span>
                    <span className="font-medium">89%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Bandwidth</span>
                    <span className="font-medium">420 GB</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Support Tab */}
        <TabsContent value="support" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Support Tickets</CardTitle>
                  <CardDescription>
                    {supportTickets.filter((t) => t.status === "open").length}{" "}
                    open tickets
                  </CardDescription>
                </div>
                <Badge variant="outline">
                  <Clock className="w-3 h-3 mr-1" />
                  Avg response: 2.4 hours
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-3">
                  {supportTickets.map((ticket) => (
                    <div
                      key={ticket.id}
                      className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => setSelectedTicket(ticket)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant={getPriorityColor(ticket.priority)}>
                              {ticket.priority}
                            </Badge>
                            <Badge
                              variant={
                                ticket.status === "open"
                                  ? "default"
                                  : "secondary"
                              }
                            >
                              {ticket.status}
                            </Badge>
                          </div>
                          <p className="font-medium">{ticket.subject}</p>
                          <p className="text-sm text-muted-foreground">
                            {ticket.userName} •{" "}
                            {formatDistanceToNow(new Date(ticket.createdAt), {
                              addSuffix: true,
                            })}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <MessageCircle className="w-3 h-3" />
                            {ticket.messages}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Email Modal */}
      <Dialog open={emailModalOpen} onOpenChange={setEmailModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Email</DialogTitle>
            <DialogDescription>
              Send an email to {selectedUser?.name || "user"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                placeholder="Email subject..."
              />
            </div>
            <div>
              <Label htmlFor="content">Message</Label>
              <Textarea
                id="content"
                value={emailContent}
                onChange={(e) => setEmailContent(e.target.value)}
                placeholder="Email content..."
                rows={6}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEmailModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSendEmail}>
              <Send className="mr-2 h-4 w-4" />
              Send Email
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Component definitions
function MetricCard({
  title,
  value,
  change,
  changeLabel,
  icon,
  color,
}: {
  title: string;
  value: string;
  change: number;
  changeLabel: string;
  icon: React.ReactNode;
  color: string;
}) {
  const colorClasses = {
    blue: "text-blue-500 bg-blue-50",
    green: "text-green-500 bg-green-50",
    purple: "text-purple-500 bg-purple-50",
    orange: "text-orange-500 bg-orange-50",
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">{title}</span>
          <div
            className={`p-2 rounded-lg ${
              colorClasses[color as keyof typeof colorClasses]
            }`}
          >
            {icon}
          </div>
        </div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-xs mt-1">
          <span className={change > 0 ? "text-green-500" : "text-red-500"}>
            {change > 0 ? "+" : ""}
            {typeof change === "number" && change % 1 !== 0
              ? change.toFixed(1)
              : change}
          </span>
          <span className="text-muted-foreground ml-1">{changeLabel}</span>
        </p>
      </CardContent>
    </Card>
  );
}
