/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import Image from "next/image";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Camera,
  Upload,
  Loader2,
  Calendar,
  MapPin,
  Users,
  AlertCircle,
  Download,
  Sparkles,
  Clock,
  BookOpen,
  ArrowLeft,
  Image as ImageIcon,
  Info,
  Eye,
  Crown,
  History,
  Trash2,
  Search,
  CheckCircle,
} from "lucide-react";
import Link from "next/link";
import { Footer } from "@/components/footer";
import { UsageInfo } from "@/components/ui/usage-info";
import { ToolUsageIndicator } from "@/components/ui/usage-display";
import { useSimpleAnalysisRefresh } from "@/hooks/use-analysis-with-refresh";
import {
  getToolErrorMessage,
  getFileRejectionMessage,
} from "@/lib/error-handler";
import { useToolAccess } from "@/hooks/use-user-status";
import { usePhotoHistory, type SavedPhoto } from "@/hooks/use-photo-history";

interface PhotoAnalysis {
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

export default function PhotoStorytellerPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<PhotoAnalysis | null>(null);
  const [error, setError] = useState("");
  const [description, setDescription] = useState("");
  const [activeTab, setActiveTab] = useState("story");
  const [currentTab, setCurrentTab] = useState("upload");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [selectedPhoto, setSelectedPhoto] = useState<SavedPhoto | null>(null);

  const { refreshUsageAfterAnalysis } = useSimpleAnalysisRefresh();
  const { usage, canUse } = useToolAccess("photos");
  const isAtUsageLimit = usage && !usage.unlimited && usage.used >= usage.limit;
  const hasNoAccess = !canUse;
  const shouldUpgrade = isAtUsageLimit || hasNoAccess;

  // Use the photo history hook
  const {
    photos: savedPhotos,
    isLoading: photosLoading,
    error: photosError,
    deletePhoto,
    refresh: refreshPhotos,
  } = usePhotoHistory();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const selectedFile = acceptedFiles[0];
      setFile(selectedFile);
      setError("");
      setAnalysis(null);

      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive, fileRejections } =
    useDropzone({
      onDrop,
      accept: {
        "image/*": [".jpg", ".jpeg", ".png", ".webp", ".bmp", ".gif"],
      },
      maxSize: 10 * 1024 * 1024, // 10MB
      multiple: false,
    });

  const handleAnalyzeAction = async () => {
    if (!file) return;

    if (shouldUpgrade) {
      window.location.href = "/subscription";
      return;
    }

    setIsAnalyzing(true);
    setError("");

    try {
      // Convert image to base64 for Claude Vision API
      const base64Image = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          // Remove data:image/jpeg;base64, prefix if present
          const base64 = result.split(",")[1] || result;
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const res = await fetch("/api/tools/photo/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageData: base64Image,
          mimeType: file.type,
          fileName: file.name,
          additionalContext: description.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        const errorMessage = getToolErrorMessage({
          toolType: "photo",
          status: res.status,
          error: data.error || new Error("Analysis failed"),
        });
        throw new Error(errorMessage);
      }

      setAnalysis(data.analysis);
      setCurrentTab("results"); // Automatically switch to results tab
      setActiveTab("story");

      // Refresh usage data immediately after successful analysis
      await refreshUsageAfterAnalysis();

      // Refresh photo history to show the new analysis
      await refreshPhotos();
    } catch (err) {
      const errorMessage = getToolErrorMessage({
        toolType: "photo",
        error: err,
      });
      setError(errorMessage);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const downloadStory = () => {
    if (!analysis) return;

    const storyText = `
Photo Story Analysis

Story:
${analysis.story}

Historical Context:
${analysis.historicalContext}

Date Estimate:
${analysis.dateEstimate.period} (${
      analysis.dateEstimate.confidence
    }% confidence)
${analysis.dateEstimate.explanation}

Clothing Analysis:
${analysis.clothingAnalysis}

Background Analysis:
${analysis.backgroundAnalysis}

People Identified:
${analysis.people
  .map(
    (person, i) => `
${i + 1}. Position: ${person.position}
   Age Estimate: ${person.ageEstimate}
   Clothing: ${person.clothingDescription}
   Possible Role: ${person.possibleRole}
`
  )
  .join("")}

Location Clues:
${analysis.locationClues.map((clue) => `- ${clue}`).join("\n")}

Research Suggestions:
${analysis.suggestions.map((suggestion) => `- ${suggestion}`).join("\n")}
    `;

    const blob = new Blob([storyText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "photo-story-analysis.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredPhotos = savedPhotos.filter((photo) => {
    const q = searchQuery.toLowerCase();
    const matches =
      photo.filename.toLowerCase().includes(q) ||
      photo.tags?.some((t) => t.toLowerCase().includes(q));
    if (filterType === "analyzed") return matches && !!photo.analysis;
    if (filterType === "pending") return matches && !photo.analysis;
    return matches;
  });

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
              <Camera className="h-3.5 w-3.5" />
              Photo Analysis
            </Badge>
          </div>
          <div className="flex items-center gap-4 mb-3">
            <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center">
              <Camera className="w-6 h-6 text-orange-600" />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                Photo Storyteller
              </h1>
              <p className="text-lg text-muted-foreground mt-1">
                Discover the stories hidden in your historical research photos
              </p>
            </div>
            <div className="hidden sm:block">
              <ToolUsageIndicator tool="photos" />
            </div>
          </div>
        </div>

        <UsageInfo tool="photos" />

        {error && (
          <Alert variant="destructive" className="mb-6 animate-slide-up">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Tabs value={currentTab} onValueChange={setCurrentTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="upload">Upload & Analyze</TabsTrigger>
            <TabsTrigger value="results" disabled={!analysis}>
              Results
            </TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          {/* Upload Tab */}
          <TabsContent value="upload" className="mt-6">
            <div className="grid gap-8 lg:grid-cols-3">
              {/* Upload Section */}
              <div className="lg:col-span-2 space-y-6">
                <Card variant="elevated" className="animate-slide-up">
                  <CardHeader>
                    <CardTitle className="text-xl">Upload Photo</CardTitle>
                    <CardDescription>
                      Upload a historical photo to discover its research context
                      and story
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div
                      {...getRootProps()}
                      className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all hover-lift ${
                        isDragActive
                          ? "border-primary bg-primary/5"
                          : preview
                          ? "border-green-500 bg-green-50/50"
                          : "border-border hover:border-primary/50 hover:bg-muted/50"
                      }`}
                    >
                      <input {...getInputProps()} />
                      <div className="flex flex-col items-center gap-4">
                        {preview ? (
                          <div className="relative w-32 h-32 rounded-lg overflow-hidden">
                            <Image
                              src={preview}
                              alt="Preview"
                              fill
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                            <Upload className="w-8 h-8 text-primary" />
                          </div>
                        )}
                        {preview ? (
                          <div>
                            <p className="font-medium text-foreground">
                              {file?.name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {file && (file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p className="font-medium text-foreground mb-1">
                              {isDragActive
                                ? "Drop your photo here"
                                : "Drag & drop a photo here"}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              or click to browse files
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {fileRejections.length > 0 && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          <div className="space-y-2">
                            <p className="font-medium">Photo Upload Error</p>
                            <p>
                              {getFileRejectionMessage(
                                "photo",
                                fileRejections[0].errors[0]
                              )}
                            </p>
                            <p className="text-sm opacity-90">
                              📸 Best results: Use clear photos with visible
                              faces and details, good lighting, and minimal
                              blur.
                            </p>
                          </div>
                        </AlertDescription>
                      </Alert>
                    )}

                    <div className="space-y-2">
                      <Label
                        htmlFor="description"
                        className="text-sm font-medium"
                      >
                        Photo Description (Optional)
                      </Label>
                      <Textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Provide any context about the photo - when it was taken, who's in it, where it was taken, etc. This helps improve the AI analysis."
                        className="min-h-[80px] transition-colors focus:border-primary/50"
                      />
                    </div>

                    <div className="pt-4 border-t">
                      <Button
                        onClick={handleAnalyzeAction}
                        disabled={!file || isAnalyzing}
                        className="w-full hover-lift"
                        size="lg"
                      >
                        {isAnalyzing ? (
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        ) : shouldUpgrade ? (
                          <Crown className="mr-2 h-5 w-5" />
                        ) : (
                          <Sparkles className="mr-2 h-5 w-5" />
                        )}
                        {isAnalyzing
                          ? "Analyzing Photo..."
                          : shouldUpgrade
                          ? "Upgrade to Analyze Photo"
                          : "Analyze Photo"}
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
                      We support most common image formats
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                        <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center">
                          <ImageIcon className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">JPEG / JPG</p>
                          <p className="text-xs text-muted-foreground">
                            Most common format
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                        <div className="w-8 h-8 bg-green-500/10 rounded-lg flex items-center justify-center">
                          <ImageIcon className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">PNG</p>
                          <p className="text-xs text-muted-foreground">
                            High quality format
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                        <div className="w-8 h-8 bg-purple-500/10 rounded-lg flex items-center justify-center">
                          <ImageIcon className="h-4 w-4 text-purple-600" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">WebP / Other</p>
                          <p className="text-xs text-muted-foreground">
                            Modern formats
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card variant="elevated" className="animate-slide-up">
                  <CardHeader>
                    <CardTitle className="text-xl flex items-center gap-2">
                      <Eye className="h-5 w-5" />
                      What We Analyze
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="flex items-start gap-2">
                      <Clock className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium mb-1">Time Period</p>
                        <p className="text-muted-foreground text-xs">
                          Dating based on clothing, technology, and style
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Users className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium mb-1">People & Roles</p>
                        <p className="text-muted-foreground text-xs">
                          Identifying individuals and their relationships
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium mb-1">Location Clues</p>
                        <p className="text-muted-foreground text-xs">
                          Geographic and environmental indicators
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <BookOpen className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium mb-1">Historical Context</p>
                        <p className="text-muted-foreground text-xs">
                          Social and cultural background information
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card variant="elevated" className="animate-slide-up">
                  <CardHeader>
                    <CardTitle className="text-xl">
                      Tips for Best Results
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                      <p className="text-muted-foreground">
                        Use high-resolution scans or photos when possible
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                      <p className="text-muted-foreground">
                        Include any known context in the description field
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                      <p className="text-muted-foreground">
                        Photos with clear details work better for analysis
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                      <p className="text-muted-foreground">
                        Group photos provide more social context
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Results Tab */}
          <TabsContent value="results" className="mt-6">
            {analysis && (
              /* Analysis Results */
              <div className="grid gap-8 lg:grid-cols-3">
                <div className="lg:col-span-2">
                  <Card variant="elevated" className="animate-slide-up">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-xl">
                            Photo Story Analysis
                          </CardTitle>
                          <CardDescription>
                            AI-powered insights about your historical photo
                          </CardDescription>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={downloadStory}
                            className="hover-lift"
                          >
                            <Download className="mr-2 h-4 w-4" />
                            Download
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setAnalysis(null);
                              setFile(null);
                              setPreview("");
                              setDescription("");
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
                        onValueChange={setActiveTab}
                        className="w-full"
                      >
                        <TabsList className="grid w-full grid-cols-4">
                          <TabsTrigger
                            value="story"
                            className="flex items-center gap-2"
                          >
                            <BookOpen className="h-4 w-4" />
                            <span className="hidden sm:inline">Story</span>
                          </TabsTrigger>
                          <TabsTrigger
                            value="people"
                            className="flex items-center gap-2"
                          >
                            <Users className="h-4 w-4" />
                            <span className="hidden sm:inline">People</span>
                          </TabsTrigger>
                          <TabsTrigger
                            value="context"
                            className="flex items-center gap-2"
                          >
                            <Clock className="h-4 w-4" />
                            <span className="hidden sm:inline">Context</span>
                          </TabsTrigger>
                          <TabsTrigger
                            value="details"
                            className="flex items-center gap-2"
                          >
                            <Eye className="h-4 w-4" />
                            <span className="hidden sm:inline">Details</span>
                          </TabsTrigger>
                        </TabsList>

                        <TabsContent value="story" className="mt-6">
                          <div className="space-y-6">
                            <Card>
                              <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                  <BookOpen className="h-5 w-5 text-primary" />
                                  Generated Story
                                </CardTitle>
                              </CardHeader>
                              <CardContent>
                                {analysis.story &&
                                analysis.story !==
                                  "Unable to generate a detailed story from the available information." ? (
                                  <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                                    {analysis.story}
                                  </p>
                                ) : (
                                  <div className="flex items-center justify-center py-8 text-center">
                                    <div className="space-y-2">
                                      <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto">
                                        <BookOpen className="h-6 w-6 text-muted-foreground" />
                                      </div>
                                      <p className="text-muted-foreground">
                                        No detailed story could be generated
                                        from the available information.
                                      </p>
                                      <p className="text-sm text-muted-foreground">
                                        Try uploading a clearer image or
                                        providing additional context.
                                      </p>
                                    </div>
                                  </div>
                                )}
                              </CardContent>
                            </Card>

                            <Card>
                              <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                  <Info className="h-5 w-5 text-primary" />
                                  Historical Context
                                </CardTitle>
                              </CardHeader>
                              <CardContent>
                                {analysis.historicalContext &&
                                analysis.historicalContext !==
                                  "No specific historical context could be determined." ? (
                                  <p className="text-muted-foreground leading-relaxed">
                                    {analysis.historicalContext}
                                  </p>
                                ) : (
                                  <div className="flex items-center justify-center py-8 text-center">
                                    <div className="space-y-2">
                                      <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto">
                                        <Info className="h-6 w-6 text-muted-foreground" />
                                      </div>
                                      <p className="text-muted-foreground">
                                        No specific historical context could be
                                        determined.
                                      </p>
                                      <p className="text-sm text-muted-foreground">
                                        Additional image details or context
                                        might help provide historical
                                        background.
                                      </p>
                                    </div>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          </div>
                        </TabsContent>

                        <TabsContent value="people" className="mt-6">
                          <div className="space-y-4">
                            {analysis.people &&
                            analysis.people.length > 0 &&
                            analysis.people[0].position !== "Not specified" ? (
                              analysis.people.map((person, index) => (
                                <Card key={index}>
                                  <CardContent className="p-4">
                                    <div className="space-y-3">
                                      <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                                          <Users className="h-5 w-5 text-primary" />
                                        </div>
                                        <div>
                                          <h3 className="font-semibold">
                                            Person {index + 1}
                                          </h3>
                                          <p className="text-sm text-muted-foreground">
                                            {person.position}
                                          </p>
                                        </div>
                                      </div>
                                      <div className="grid gap-3 text-sm">
                                        <div className="flex items-center justify-between w-max gap-x-4">
                                          <span className="text-muted-foreground">
                                            Age Estimate:
                                          </span>
                                          <Badge
                                            variant={
                                              person.ageEstimate ===
                                              "Age unknown"
                                                ? "secondary"
                                                : "outline"
                                            }
                                          >
                                            {person.ageEstimate}
                                          </Badge>
                                        </div>
                                        <div className="flex items-center justify-between w-max gap-x-4">
                                          <span className="text-muted-foreground">
                                            Possible Role:
                                          </span>
                                          <span
                                            className={`font-medium ${
                                              person.possibleRole ===
                                              "Role unknown"
                                                ? "text-muted-foreground"
                                                : ""
                                            }`}
                                          >
                                            {person.possibleRole}
                                          </span>
                                        </div>
                                        <div>
                                          <span className="text-muted-foreground">
                                            Clothing:
                                          </span>
                                          <p
                                            className={`mt-1 ${
                                              person.clothingDescription ===
                                              "No clothing details available"
                                                ? "text-muted-foreground"
                                                : "text-foreground"
                                            }`}
                                          >
                                            {person.clothingDescription}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              ))
                            ) : (
                              <div className="flex items-center justify-center py-12 text-center">
                                <div className="space-y-3">
                                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                                    <Users className="h-8 w-8 text-muted-foreground" />
                                  </div>
                                  <div>
                                    <p className="font-medium text-muted-foreground mb-1">
                                      No people identified
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                      Unable to identify specific individuals in
                                      this photograph.
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                      Try uploading a clearer image with visible
                                      faces and details.
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </TabsContent>

                        <TabsContent value="context" className="mt-6">
                          <div className="space-y-6">
                            <Card>
                              <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                  <Calendar className="h-5 w-5 text-primary" />
                                  Date Estimate
                                </CardTitle>
                              </CardHeader>
                              <CardContent>
                                {analysis.dateEstimate.period !==
                                "Unknown time period" ? (
                                  <div className="space-y-3">
                                    <div className="flex items-center justify-between w-max gap-x-4">
                                      <span className="text-muted-foreground">
                                        Period:
                                      </span>
                                      <Badge variant="secondary">
                                        {analysis.dateEstimate.period}
                                      </Badge>
                                    </div>
                                    <div className="flex items-center justify-between w-max gap-x-4">
                                      <span className="text-muted-foreground">
                                        Confidence:
                                      </span>
                                      <Badge
                                        variant={
                                          analysis.dateEstimate.confidence < 30
                                            ? "destructive"
                                            : analysis.dateEstimate.confidence <
                                              60
                                            ? "secondary"
                                            : "outline"
                                        }
                                      >
                                        {analysis.dateEstimate.confidence}%
                                      </Badge>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">
                                        Explanation:
                                      </span>
                                      <p className="mt-1 text-foreground">
                                        {analysis.dateEstimate.explanation}
                                      </p>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-center py-8 text-center">
                                    <div className="space-y-2">
                                      <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto">
                                        <Calendar className="h-6 w-6 text-muted-foreground" />
                                      </div>
                                      <p className="text-muted-foreground">
                                        Unable to determine time period
                                      </p>
                                      <p className="text-sm text-muted-foreground">
                                        Insufficient visual information to
                                        estimate the date.
                                      </p>
                                    </div>
                                  </div>
                                )}
                              </CardContent>
                            </Card>

                            <Card>
                              <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                  <MapPin className="h-5 w-5 text-primary" />
                                  Location Clues
                                </CardTitle>
                              </CardHeader>
                              <CardContent>
                                {analysis.locationClues &&
                                analysis.locationClues.length > 0 &&
                                analysis.locationClues[0] !==
                                  "No location clues available" ? (
                                  <div className="space-y-2">
                                    {analysis.locationClues.map(
                                      (clue, index) => (
                                        <div
                                          key={index}
                                          className="flex items-start gap-2"
                                        >
                                          <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                                          <p className="text-muted-foreground">
                                            {clue}
                                          </p>
                                        </div>
                                      )
                                    )}
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-center py-8 text-center">
                                    <div className="space-y-2">
                                      <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto">
                                        <MapPin className="h-6 w-6 text-muted-foreground" />
                                      </div>
                                      <p className="text-muted-foreground">
                                        No location clues available
                                      </p>
                                      <p className="text-sm text-muted-foreground">
                                        Unable to identify geographical or
                                        architectural indicators.
                                      </p>
                                    </div>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          </div>
                        </TabsContent>

                        <TabsContent value="details" className="mt-6">
                          <div className="space-y-6">
                            <Card>
                              <CardHeader>
                                <CardTitle className="text-lg">
                                  Clothing Analysis
                                </CardTitle>
                              </CardHeader>
                              <CardContent>
                                {analysis.clothingAnalysis &&
                                analysis.clothingAnalysis !==
                                  "No clothing details could be analyzed from the available information." ? (
                                  <p className="text-muted-foreground leading-relaxed">
                                    {analysis.clothingAnalysis}
                                  </p>
                                ) : (
                                  <div className="flex items-center justify-center py-8 text-center">
                                    <div className="space-y-2">
                                      <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto">
                                        <ImageIcon className="h-6 w-6 text-muted-foreground" />
                                      </div>
                                      <p className="text-muted-foreground">
                                        No clothing details available
                                      </p>
                                      <p className="text-sm text-muted-foreground">
                                        Unable to analyze clothing or uniform
                                        details from the image.
                                      </p>
                                    </div>
                                  </div>
                                )}
                              </CardContent>
                            </Card>

                            <Card>
                              <CardHeader>
                                <CardTitle className="text-lg">
                                  Background Analysis
                                </CardTitle>
                              </CardHeader>
                              <CardContent>
                                {analysis.backgroundAnalysis &&
                                analysis.backgroundAnalysis !==
                                  "No background details could be determined from the available information." ? (
                                  <p className="text-muted-foreground leading-relaxed">
                                    {analysis.backgroundAnalysis}
                                  </p>
                                ) : (
                                  <div className="flex items-center justify-center py-8 text-center">
                                    <div className="space-y-2">
                                      <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto">
                                        <Eye className="h-6 w-6 text-muted-foreground" />
                                      </div>
                                      <p className="text-muted-foreground">
                                        No background details available
                                      </p>
                                      <p className="text-sm text-muted-foreground">
                                        Unable to analyze background elements or
                                        setting details.
                                      </p>
                                    </div>
                                  </div>
                                )}
                              </CardContent>
                            </Card>

                            <Card>
                              <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                  <Sparkles className="h-5 w-5 text-primary" />
                                  Research Suggestions
                                </CardTitle>
                              </CardHeader>
                              <CardContent>
                                {analysis.suggestions &&
                                analysis.suggestions.length > 0 &&
                                analysis.suggestions[0] !==
                                  "Upload a clearer image or provide additional context for better analysis" ? (
                                  <div className="space-y-2">
                                    {analysis.suggestions.map(
                                      (suggestion, index) => (
                                        <div
                                          key={index}
                                          className="flex items-start gap-2"
                                        >
                                          <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                                          <p className="text-muted-foreground">
                                            {suggestion}
                                          </p>
                                        </div>
                                      )
                                    )}
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-center py-8 text-center">
                                    <div className="space-y-2">
                                      <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto">
                                        <Sparkles className="h-6 w-6 text-muted-foreground" />
                                      </div>
                                      <p className="text-muted-foreground">
                                        No specific research suggestions
                                        available
                                      </p>
                                      <p className="text-sm text-muted-foreground">
                                        Upload a clearer image or provide
                                        additional context for targeted
                                        genealogy recommendations.
                                      </p>
                                    </div>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          </div>
                        </TabsContent>
                      </Tabs>
                    </CardContent>
                  </Card>
                </div>

                {/* Photo Preview */}
                <div className="space-y-6">
                  <Card variant="elevated" className="animate-slide-up">
                    <CardHeader>
                      <CardTitle className="text-xl">Original Photo</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {preview ||
                      (selectedPhoto &&
                        selectedPhoto.viewUrl &&
                        !selectedPhoto.viewUrl.startsWith("placeholder://")) ? (
                        <div className="relative w-full aspect-square rounded-lg overflow-hidden">
                          <Image
                            src={selectedPhoto?.viewUrl || preview || ""}
                            alt="Analyzed photo"
                            fill
                            className="object-cover"
                            onError={(e) => {
                              // Fall back to placeholder if image fails to load
                              const target = e.target as HTMLImageElement;
                              target.style.display = "none";
                              const parent = target.parentElement;
                              if (
                                parent &&
                                !parent.querySelector(".fallback-photo-icon")
                              ) {
                                const fallbackDiv =
                                  document.createElement("div");
                                fallbackDiv.className =
                                  "w-full h-full flex items-center justify-center bg-gray-50 fallback-photo-icon";
                                fallbackDiv.innerHTML =
                                  '<svg class="w-12 h-12 text-gray-400" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd"></path></svg>';
                                parent.appendChild(fallbackDiv);
                              }
                            }}
                          />
                        </div>
                      ) : (
                        <div className="w-full aspect-square rounded-lg border border-dashed border-gray-300 flex items-center justify-center">
                          <div className="text-center text-gray-500">
                            <ImageIcon className="w-12 h-12 mx-auto mb-2" />
                            <p className="text-sm">
                              No photo preview available
                            </p>
                          </div>
                        </div>
                      )}
                      {(file || selectedPhoto) && (
                        <div className="mt-4 space-y-2 text-sm">
                          <div className="flex items-center justify-between w-max gap-x-4">
                            <span className="text-muted-foreground">
                              File name:
                            </span>
                            <span className="font-medium truncate max-w-32">
                              {selectedPhoto?.filename ||
                                file?.name ||
                                "Unknown"}
                            </span>
                          </div>
                          <div className="flex items-center justify-between w-max gap-x-4">
                            <span className="text-muted-foreground">Size:</span>
                            <span className="font-medium">
                              {file
                                ? `${(file.size / 1024 / 1024).toFixed(2)} MB`
                                : selectedPhoto?.size
                                ? `${(selectedPhoto.size / 1024 / 1024).toFixed(
                                    2
                                  )} MB`
                                : "Unknown"}
                            </span>
                          </div>
                          {selectedPhoto?.viewUrl?.startsWith(
                            "placeholder://"
                          ) && (
                            <div className="flex items-center gap-2 text-xs text-amber-600">
                              <div className="w-2 h-2 bg-amber-500 rounded-full" />
                              Photo preview unavailable
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <CardTitle>Photo Analysis History</CardTitle>
                    <CardDescription>
                      View and manage previous photo analyses
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Search photos…"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 w-64"
                      />
                    </div>
                    <Select value={filterType} onValueChange={setFilterType}>
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Filter" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="analyzed">Analyzed</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                {photosError && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{photosError}</AlertDescription>
                  </Alert>
                )}

                {photosLoading ? (
                  <div className="text-center py-12">
                    <Loader2 className="w-8 h-8 mx-auto animate-spin text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      Loading photo history...
                    </p>
                  </div>
                ) : filteredPhotos.length ? (
                  <ScrollArea className="h-[600px]">
                    <div className="space-y-4">
                      {filteredPhotos.map((photo) => (
                        <div
                          key={photo.id}
                          className="p-4 border rounded-lg hover:bg-muted/40 cursor-pointer transition-colors"
                          onClick={() => {
                            setSelectedPhoto(photo);
                            if (photo.analysis) {
                              setAnalysis(photo.analysis);
                              setCurrentTab("results");
                            }
                          }}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3">
                              <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                                {photo.viewUrl &&
                                !photo.viewUrl.startsWith("placeholder://") ? (
                                  <img
                                    src={photo.viewUrl}
                                    alt={photo.filename}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      // Replace with fallback icon if image fails to load
                                      const target =
                                        e.target as HTMLImageElement;
                                      target.style.display = "none";
                                      const parent = target.parentElement;
                                      if (
                                        parent &&
                                        !parent.querySelector(".fallback-icon")
                                      ) {
                                        const fallbackDiv =
                                          document.createElement("div");
                                        fallbackDiv.className =
                                          "w-full h-full flex items-center justify-center fallback-icon";
                                        fallbackDiv.innerHTML =
                                          '<svg class="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd"></path></svg>';
                                        parent.appendChild(fallbackDiv);
                                      }
                                    }}
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <Camera className="w-6 h-6 text-gray-400" />
                                    {photo.viewUrl?.startsWith(
                                      "placeholder://"
                                    ) && (
                                      <div
                                        className="absolute -bottom-1 -right-1 w-3 h-3 bg-yellow-500 rounded-full"
                                        title="Image not available"
                                      />
                                    )}
                                  </div>
                                )}
                              </div>
                              <div>
                                <p className="font-medium">{photo.filename}</p>
                                <p className="text-sm text-muted-foreground">
                                  Uploaded{" "}
                                  {new Date(
                                    photo.uploadedAt
                                  ).toLocaleDateString()}
                                </p>

                                {photo.analysis && (
                                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      {photo.analysis.dateEstimate?.period ||
                                        "Unknown period"}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <BookOpen className="w-3 h-3" />
                                      Story generated
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Users className="w-3 h-3" />
                                      {photo.analysis.people?.length || 0}{" "}
                                      people
                                    </span>
                                  </div>
                                )}

                                {photo.tags?.length ? (
                                  <div className="flex flex-wrap gap-1 mt-2">
                                    {photo.tags.map((t) => (
                                      <Badge
                                        key={t}
                                        variant="outline"
                                        className="text-xs"
                                      >
                                        {t}
                                      </Badge>
                                    ))}
                                  </div>
                                ) : null}
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {photo.analysis ? (
                                <Badge>
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Analyzed
                                </Badge>
                              ) : (
                                <Badge variant="secondary">
                                  <Clock className="w-3 h-3 mr-1" />
                                  Pending
                                </Badge>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  const success = await deletePhoto(photo.id);
                                  if (success) {
                                    // toast("Photo removed", {
                                    //   description: "Removed from history",
                                    // });
                                  } else {
                                    // toast("Failed to remove photo", {
                                    //   description: "Please try again",
                                    // });
                                  }
                                }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="text-center py-12">
                    <History className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-muted-foreground">No photos found</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Upload and analyze photos to see them here
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      <Footer />
    </div>
  );
}
