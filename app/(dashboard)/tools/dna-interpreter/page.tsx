"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dna,
  Upload,
  Loader2,
  Globe,
  Users,
  AlertCircle,
  Download,
  TrendingUp,
  Map,
  Info,
  ChevronRight,
  ArrowLeft,
  FileText,
  BarChart3,
  Crown,
} from "lucide-react";
import Link from "next/link";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import type { DNAAnalysisUI, DNATabKey } from "@/types";
import { Footer } from "@/components/footer";
import { UsageInfo } from "@/components/ui/usage-info";
import { ToolUsageIndicator } from "@/components/ui/usage-display";
import { useSimpleAnalysisRefresh } from "@/hooks/use-analysis-with-refresh";
import { getToolErrorMessage, getFileRejectionMessage } from "@/lib/error-handler";
import { useToolAccess } from "@/hooks/use-user-status";

const COLOR_TOKENS = [
  "var(--chart-1)",
  "var(--chart-5)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-2)",
  "oklch(0.64 0.16 28)",
  "oklch(0.66 0.08 260)",
  "oklch(0.72 0.11 145)",
] as const;

export default function DNAInterpreterPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<DNAAnalysisUI | null>(null);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<DNATabKey>("ethnicity");

  const { refreshUsageAfterAnalysis } = useSimpleAnalysisRefresh();
  const { usage } = useToolAccess('dna');
  const isAtUsageLimit = usage && !usage.unlimited && usage.used >= usage.limit;
  const hasNoAccess = usage && usage.limit === 0;
  const shouldUpgrade = isAtUsageLimit || hasNoAccess;

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setError("");
      setAnalysis(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive, fileRejections } =
    useDropzone({
      onDrop,
      accept: {
        "text/plain": [".txt"],
        "text/csv": [".csv"],
        "application/zip": [".zip"],
      },
      maxSize: 50 * 1024 * 1024, // 50MB
      multiple: false,
    });

  const handleAnalyzeAction = async () => {
    if (!file) return;
    
    // If should upgrade, redirect to subscription
    if (shouldUpgrade) {
      window.location.href = '/subscription';
      return;
    }

    setIsAnalyzing(true);
    setError("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/tools/dna/analyze", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        const errorMessage = getToolErrorMessage({
          toolType: 'dna',
          status: res.status,
          error: data.error || new Error("Analysis failed")
        });
        throw new Error(errorMessage);
      }
      
      setAnalysis(data.analysis);
      setActiveTab("ethnicity");

      // Refresh usage data immediately after successful analysis
      await refreshUsageAfterAnalysis();
    } catch (err) {
      const errorMessage = getToolErrorMessage({
        toolType: 'dna',
        error: err
      });
      setError(errorMessage);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const downloadReport = () => {
    if (!analysis) return;

    const reportData = JSON.stringify(analysis, null, 2);
    const blob = new Blob([reportData], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "dna-analysis-report.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 md:py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="outline" size="sm" className="hover-lift" asChild>
              <Link href="/tools">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Tools
              </Link>
            </Button>
            <Badge variant="secondary" className="gap-1">
              <Dna className="h-3.5 w-3.5" />
              DNA Analysis
            </Badge>
          </div>
          <div className="flex items-center gap-4 mb-3">
            <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center">
              <Dna className="w-6 h-6 text-purple-600" />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                DNA & Heritage Interpreter
              </h1>
              <p className="text-lg text-muted-foreground mt-1">
                Upload your raw DNA data to discover your ancestry and heritage
              </p>
            </div>
            <div className="hidden sm:block">
              <ToolUsageIndicator tool="dna" />
            </div>
          </div>
        </div>

        <UsageInfo tool="dna" />

        {error && (
          <Alert variant="destructive" className="mb-6 animate-slide-up">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!analysis ? (
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Upload Section */}
            <div className="lg:col-span-2">
              <Card variant="elevated" className="animate-slide-up">
                <CardHeader>
                  <CardTitle className="text-xl">Upload DNA Data</CardTitle>
                  <CardDescription>
                    Upload your raw DNA file from 23andMe, AncestryDNA,
                    MyHeritage, or other providers
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div
                    {...getRootProps()}
                    className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all hover-lift ${
                      isDragActive
                        ? "border-primary bg-primary/5"
                        : file
                        ? "border-green-500 bg-green-50/50"
                        : "border-border hover:border-primary/50 hover:bg-muted/50"
                    }`}
                  >
                    <input {...getInputProps()} />
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                        {file ? (
                          <FileText className="w-8 h-8 text-green-600" />
                        ) : (
                          <Upload className="w-8 h-8 text-primary" />
                        )}
                      </div>
                      {file ? (
                        <div>
                          <p className="font-medium text-foreground">
                            {file.name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      ) : (
                        <div>
                          <p className="font-medium text-foreground mb-1">
                            {isDragActive
                              ? "Drop your DNA file here"
                              : "Drag & drop your DNA file here"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            or click to browse files
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {fileRejections.length > 0 && (
                    <Alert variant="destructive" className="mt-4">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <div className="space-y-2">
                          <p className="font-medium">File Upload Error</p>
                          <p>
                            {getFileRejectionMessage('dna', fileRejections[0].errors[0])}
                          </p>
                          <p className="text-sm opacity-90">
                            Need help? Check our support guide for DNA file preparation tips.
                          </p>
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}

                  {isAnalyzing && (
                    <div className="mt-4 flex items-center justify-center text-sm text-muted-foreground">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analyzing DNA data…
                    </div>
                  )}

                  <div className="mt-6 pt-4 border-t">
                    <Button
                      onClick={handleAnalyzeAction}
                      disabled={!file || isAnalyzing}
                      className={`w-full hover-lift ${shouldUpgrade ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                      size="lg"
                    >
                      {isAnalyzing ? (
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      ) : shouldUpgrade ? (
                        <Crown className="mr-2 h-5 w-5" />
                      ) : (
                        <Dna className="mr-2 h-5 w-5" />
                      )}
                      {isAnalyzing ? "Analyzing DNA..." : shouldUpgrade ? "Upgrade to Analyze DNA" : "Analyze DNA"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Info Section */}
            <div className="space-y-6">
              <Card variant="elevated" className="animate-slide-up">
                <CardHeader>
                  <CardTitle className="text-xl">Supported Formats</CardTitle>
                  <CardDescription>
                    We support raw DNA data from major providers
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                      <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center">
                        <FileText className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">23andMe</p>
                        <p className="text-xs text-muted-foreground">
                          .txt, .zip files
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                      <div className="w-8 h-8 bg-green-500/10 rounded-lg flex items-center justify-center">
                        <FileText className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">AncestryDNA</p>
                        <p className="text-xs text-muted-foreground">
                          .txt, .csv files
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                      <div className="w-8 h-8 bg-purple-500/10 rounded-lg flex items-center justify-center">
                        <FileText className="h-4 w-4 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">MyHeritage</p>
                        <p className="text-xs text-muted-foreground">
                          .csv files
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card variant="elevated" className="animate-slide-up">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Info className="h-5 w-5" />
                    What You&apos;ll Get
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Globe className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-sm">Ethnicity Breakdown</p>
                      <p className="text-xs text-muted-foreground">
                        Detailed ancestry composition
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Map className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-sm">Migration Patterns</p>
                      <p className="text-xs text-muted-foreground">
                        Historical movement of your ancestors
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Users className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-sm">DNA Matches</p>
                      <p className="text-xs text-muted-foreground">
                        Potential genetic relatives
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <TrendingUp className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-sm">Health Insights</p>
                      <p className="text-xs text-muted-foreground">
                        Genetic trait analysis
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          /* Analysis Results */
          <div className="space-y-6">
            <Card variant="elevated" className="animate-slide-up">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl">
                      DNA Analysis Results
                    </CardTitle>
                    <CardDescription>
                      Your comprehensive genetic ancestry report
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={downloadReport}
                      className="hover-lift"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download Report
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setAnalysis(null);
                        setFile(null);
                      }}
                      className="hover-lift"
                    >
                      New Analysis
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs
                  value={activeTab}
                  onValueChange={(value: string) => setActiveTab(value as DNATabKey)}
                  className="w-full"
                >
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger
                      value="ethnicity"
                      className="flex items-center gap-2"
                    >
                      <Globe className="h-4 w-4" />
                      <span className="hidden sm:inline">Ethnicity</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="regions"
                      className="flex items-center gap-2"
                    >
                      <Map className="h-4 w-4" />
                      <span className="hidden sm:inline">Regions</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="matches"
                      className="flex items-center gap-2"
                    >
                      <Users className="h-4 w-4" />
                      <span className="hidden sm:inline">Matches</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="traits"
                      className="flex items-center gap-2"
                    >
                      <BarChart3 className="h-4 w-4" />
                      <span className="hidden sm:inline">Traits</span>
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="ethnicity" className="mt-6">
                    <div className="grid gap-6 lg:grid-cols-2">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">
                            Ethnicity Breakdown
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={analysis.ethnicityBreakdown}
                                  cx="50%"
                                  cy="50%"
                                  outerRadius={80}
                                  innerRadius={40}
                                  paddingAngle={2}
                                  dataKey="percentage"
                                  label={(entry) =>
                                    `${entry.region} (${entry.percentage}%)`
                                  }
                                >
                                  {analysis.ethnicityBreakdown.map(
                                    (_, index) => (
                                      <Cell
                                        key={`cell-${index}`}
                                        fill={
                                          COLOR_TOKENS[
                                            index % COLOR_TOKENS.length
                                          ]
                                        }
                                      />
                                    )
                                  )}
                                </Pie>
                                <Tooltip />
                                <Legend />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">
                            Regional Details
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {analysis.ethnicityBreakdown.map((item, index) => (
                              <div key={index} className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="font-medium">
                                    {item.region}
                                  </span>
                                  <Badge variant="outline">
                                    {item.percentage}%
                                  </Badge>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  <TabsContent value="regions" className="mt-6">
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {analysis.migrationPatterns?.map((pattern, index) => (
                        <Card key={index}>
                          <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                              <Map className="h-5 w-5 text-primary" />
                              {pattern.from} → {pattern.to}
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">
                                  Period
                                </span>
                                <Badge variant="secondary">
                                  {pattern.period}
                                </Badge>
                              </div>
                              {pattern.description && (
                                <div>
                                  <p className="text-sm text-muted-foreground">
                                    {pattern.description}
                                  </p>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      )) || (
                        <div className="col-span-full text-center py-8 text-muted-foreground">
                          No migration data available
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="matches" className="mt-6">
                    <div className="grid gap-4">
                      {analysis.matches?.map((match, index) => (
                        <Card key={index}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                                  <Users className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                  <p className="font-medium">
                                    {match.name || "Anonymous Match"}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {match.relationship}
                                  </p>
                                </div>
                              </div>
                              <Badge variant="outline">
                                {match.confidence}% confidence
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      )) || (
                        <div className="text-center py-8 text-muted-foreground">
                          No DNA matches found
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="traits" className="mt-6">
                    <div className="grid gap-4 sm:grid-cols-2">
                      {analysis.healthInsights?.generalTraits?.map(
                        (trait, index) => (
                          <Card key={index}>
                            <CardContent className="p-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                                  <BarChart3 className="h-4 w-4 text-primary" />
                                </div>
                                <p className="text-sm text-foreground">
                                  {trait}
                                </p>
                              </div>
                            </CardContent>
                          </Card>
                        )
                      ) || (
                        <div className="col-span-full text-center py-8 text-muted-foreground">
                          No trait data available
                        </div>
                      )}
                    </div>
                    {analysis.healthInsights?.disclaimer && (
                      <Card className="mt-6">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <Info className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-muted-foreground">
                              {analysis.healthInsights.disclaimer}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
