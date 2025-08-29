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
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Navigation } from "@/components/ui/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileText,
  Dna,
  TreePine,
  Camera,
  Activity as ActivityIcon,
  Search,
  Filter,
  Calendar,
  Clock,
  ChevronRight,
  Loader2,
  AlertCircle,
  User,
  Users,
  MapPin,
  BarChart3,
  ArrowUpRight,
  RefreshCw,
  Download,
  Eye,
  Trash2,
} from "lucide-react";
import { Footer } from "@/components/footer";
import { toast } from "sonner";

interface ActivityItem {
  id: string;
  type: 'analysis' | 'document' | 'tree' | 'photo';
  title: string;
  description: string;
  timestamp: string;
  metadata: {
    analysisType?: string;
    confidence?: number;
    size?: number;
    mimeType?: string;
  };
}

interface ActivityResponse {
  activities: ActivityItem[];
}

const getActivityIcon = (type: string) => {
  switch (type) {
    case 'analysis':
      return <BarChart3 className="w-5 h-5" />;
    case 'document':
      return <FileText className="w-5 h-5" />;
    case 'tree':
      return <TreePine className="w-5 h-5" />;
    case 'photo':
      return <Camera className="w-5 h-5" />;
    default:
      return <ActivityIcon className="w-5 h-5" />;
  }
};

const getActivityColor = (type: string) => {
  switch (type) {
    case 'analysis':
      return 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/20';
    case 'document':
      return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/20';
    case 'tree':
      return 'text-purple-600 bg-purple-100 dark:text-purple-400 dark:bg-purple-900/20';
    case 'photo':
      return 'text-orange-600 bg-orange-100 dark:text-orange-400 dark:bg-orange-900/20';
    default:
      return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900/20';
  }
};

const formatRelativeTime = (timestamp: string) => {
  const now = new Date();
  const time = new Date(timestamp);
  const diffInSeconds = Math.floor((now.getTime() - time.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return time.toLocaleDateString();
};

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export default function ActivityPage() {
  const { data: session } = useSession();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [refreshing, setRefreshing] = useState(false);

  const fetchActivities = async () => {
    try {
      setError(null);
      const response = await fetch('/api/dashboard/activity?limit=50');
      if (!response.ok) {
        throw new Error('Failed to fetch activities');
      }
      const data: ActivityResponse = await response.json();
      setActivities(data.activities);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load activities');
      console.error('Activity fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchActivities();
    setRefreshing(false);
    toast.success("Activity feed refreshed");
  };

  useEffect(() => {
    if (session?.user) {
      fetchActivities();
    }
  }, [session]);

  // Filter and sort activities
  const filteredActivities = activities
    .filter(activity => {
      const matchesSearch = activity.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           activity.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = typeFilter === "all" || activity.type === typeFilter;
      return matchesSearch && matchesType;
    })
    .sort((a, b) => {
      if (sortBy === "newest") {
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      } else {
        return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      }
    });

  const getActivityTypeCount = (type: string) => {
    return activities.filter(activity => activity.type === type).length;
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation variant="dashboard" />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <ActivityIcon className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Please sign in to view your activity.</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation variant="dashboard" />
      
      <div className="container mx-auto px-4 py-6 md:py-8 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Activity</h1>
            <p className="text-muted-foreground mt-2">
              Track your genealogy research activities and progress
            </p>
          </div>
          <Button 
            onClick={handleRefresh} 
            disabled={refreshing}
            variant="outline"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Analyses</p>
                  <p className="text-2xl font-bold">{getActivityTypeCount('analysis')}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Documents</p>
                  <p className="text-2xl font-bold">{getActivityTypeCount('document')}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Photos</p>
                  <p className="text-2xl font-bold">{getActivityTypeCount('photo')}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
                  <Camera className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Family Trees</p>
                  <p className="text-2xl font-bold">{getActivityTypeCount('tree')}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                  <TreePine className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search activities..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex gap-2">
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-[140px]">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="analysis">Analyses</SelectItem>
                    <SelectItem value="document">Documents</SelectItem>
                    <SelectItem value="photo">Photos</SelectItem>
                    <SelectItem value="tree">Family Trees</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest</SelectItem>
                    <SelectItem value="oldest">Oldest</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Activity Feed */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ActivityIcon className="w-5 h-5" />
              Recent Activity
            </CardTitle>
            <CardDescription>
              Your genealogy research history and recent actions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-12">
                <Loader2 className="w-8 h-8 mx-auto animate-spin text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Loading your activity...</p>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <AlertCircle className="w-8 h-8 mx-auto text-destructive mb-4" />
                <p className="text-destructive mb-4">{error}</p>
                <Button onClick={fetchActivities} variant="outline">
                  Try Again
                </Button>
              </div>
            ) : filteredActivities.length === 0 ? (
              <div className="text-center py-12">
                <ActivityIcon className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {searchQuery || typeFilter !== "all" 
                    ? "No activities match your search criteria."
                    : "No activity yet. Start by uploading a document or photo!"
                  }
                </p>
                {(!searchQuery && typeFilter === "all") && (
                  <div className="flex gap-2 justify-center mt-4">
                    <Button asChild>
                      <Link href="/tools/document-analyzer">
                        <FileText className="w-4 h-4 mr-2" />
                        Analyze Document
                      </Link>
                    </Button>
                    <Button asChild variant="outline">
                      <Link href="/tools/photo-storyteller">
                        <Camera className="w-4 h-4 mr-2" />
                        Analyze Photo
                      </Link>
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <ScrollArea className="h-[600px]">
                <div className="space-y-4">
                  {filteredActivities.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/40 transition-colors"
                    >
                      {/* Activity Icon */}
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${getActivityColor(activity.type)}`}>
                        {getActivityIcon(activity.type)}
                      </div>

                      {/* Activity Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-sm">{activity.title}</h3>
                            <p className="text-sm text-muted-foreground truncate">
                              {activity.description}
                            </p>
                            
                            {/* Activity Metadata */}
                            <div className="flex items-center gap-4 mt-2">
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Clock className="w-3 h-3" />
                                {formatRelativeTime(activity.timestamp)}
                              </div>
                              
                              {activity.metadata.confidence && (
                                <Badge variant="outline" className="text-xs">
                                  {Math.round(activity.metadata.confidence * 100)}% confidence
                                </Badge>
                              )}
                              
                              {activity.metadata.size && (
                                <span className="text-xs text-muted-foreground">
                                  {formatFileSize(activity.metadata.size)}
                                </span>
                              )}
                              
                              {activity.metadata.analysisType && (
                                <Badge variant="secondary" className="text-xs">
                                  {activity.metadata.analysisType}
                                </Badge>
                              )}
                            </div>
                          </div>
                          
                          {/* Activity Actions */}
                          <div className="flex items-center gap-2 ml-4">
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        {/* Load More */}
        {filteredActivities.length >= 50 && (
          <div className="text-center mt-6">
            <Button variant="outline">
              Load More Activities
            </Button>
          </div>
        )}
      </div>
      
      <Footer />
    </div>
  );
}