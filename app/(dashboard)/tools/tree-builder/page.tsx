"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  TreePine,
  Plus,
  Loader2,
  User,
  Download,
  Sparkles,
  Save,
  ArrowLeft,
  Calendar,
  MapPin,
  Info,
} from "lucide-react";
import Link from "next/link";
import type { ExpandTreeResponse, FamilyMember, NewMemberForm } from "@/types";

export default function TreeBuilderPage() {
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(
    null
  );
  const [isExpanding, setIsExpanding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [treeName, setTreeName] = useState("My Family Tree");
  const [error, setError] = useState("");

  const [formData, setFormData] = useState<NewMemberForm>({
    firstName: "",
    lastName: "",
    birthDate: "",
    deathDate: "",
    birthPlace: "",
    deathPlace: "",
  });

  const addFamilyMember = (): void => {
    const newMember: FamilyMember = {
      id: Date.now().toString(),
      firstName: formData.firstName,
      lastName: formData.lastName,
      birthDate: formData.birthDate || undefined,
      deathDate: formData.deathDate || undefined,
      birthPlace: formData.birthPlace || undefined,
      deathPlace: formData.deathPlace || undefined,
      parentIds: [],
      confidence: 1.0,
      aiGenerated: false,
    };

    setFamilyMembers((prev) => [...prev, newMember]);
    setFormData({
      firstName: "",
      lastName: "",
      birthDate: "",
      deathDate: "",
      birthPlace: "",
      deathPlace: "",
    });
  };

  const handleAIExpansion = async (): Promise<void> => {
    if (familyMembers.length === 0) return;

    setIsExpanding(true);
    setError("");

    try {
      const res = await fetch("/api/tools/tree/expand", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          members: familyMembers,
          treeName,
        }),
      });

      if (!res.ok) throw new Error("Failed to expand tree");

      const data: ExpandTreeResponse = await res.json();

      const newMembers: FamilyMember[] = data.suggestedMembers.map(
        (member: FamilyMember) => ({
          ...member,
          aiGenerated: true,
        })
      );

      setFamilyMembers((prev) => [...prev, ...newMembers]);
    } catch (error) {
      setError("Failed to expand tree with AI suggestions. Please try again.");
      console.error("Error expanding tree:", error);
    } finally {
      setIsExpanding(false);
    }
  };

  const handleSave = async (): Promise<void> => {
    setIsSaving(true);
    setError("");

    try {
      const res = await fetch("/api/tools/tree/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: treeName,
          members: familyMembers,
        }),
      });

      if (!res.ok) throw new Error("Failed to save tree");
    } catch (error) {
      setError("Failed to save tree. Please try again.");
      console.error("Error saving tree:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleExport = async (): Promise<void> => {
    try {
      const res = await fetch("/api/tools/tree/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ members: familyMembers }),
      });

      if (!res.ok) throw new Error("Export failed");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${treeName.replace(/\s+/g, "_")}.ged`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      setError("Failed to export tree. Please try again.");
      console.error("Error exporting GEDCOM:", error);
    }
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
              <TreePine className="h-3.5 w-3.5" />
              Family Trees
            </Badge>
          </div>
          <div className="flex items-center gap-4 mb-3">
            <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center">
              <TreePine className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                Family Tree Builder
              </h1>
              <p className="text-lg text-muted-foreground mt-1">
                Build and expand your family tree with AI-powered suggestions
              </p>
            </div>
          </div>
        </div>

        {error && (
          <Alert className="mb-6 animate-slide-up">
            <Info className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card variant="elevated" className="animate-slide-up">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl">Tree Overview</CardTitle>
                    <CardDescription>
                      View and manage your family tree members
                    </CardDescription>
                  </div>
                  <Badge variant="outline">{familyMembers.length} members</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-6 p-4 bg-muted/30 rounded-lg border border-border/50">
                  <div className="flex items-center justify-between mb-3">
                    <div className="space-y-1">
                      <Label htmlFor="treeName" className="text-sm font-medium">Tree Name</Label>
                      <Input
                        id="treeName"
                        value={treeName}
                        onChange={(e) => setTreeName(e.target.value)}
                        placeholder="My Family Tree"
                        className="w-64 h-8 text-sm"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleAIExpansion}
                        disabled={isExpanding || familyMembers.length === 0}
                        className="hover-lift"
                      >
                        {isExpanding ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Sparkles className="mr-2 h-4 w-4" />
                        )}
                        AI Expand
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSave}
                        disabled={isSaving || familyMembers.length === 0}
                        className="hover-lift"
                      >
                        {isSaving ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Save className="mr-2 h-4 w-4" />
                        )}
                        Save Tree
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="hover-lift"
                        onClick={handleExport}
                        disabled={familyMembers.length === 0}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Export
                      </Button>
                    </div>
                  </div>
                </div>

                {familyMembers.length > 0 ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {familyMembers.map((member) => (
                      <div
                        key={member.id}
                        className={`group border rounded-lg p-4 hover:shadow-sm cursor-pointer transition-all hover-lift ${
                          selectedMember?.id === member.id
                            ? "border-primary/50 bg-primary/5"
                            : "border-border hover:border-primary/20"
                        }`}
                        onClick={() => setSelectedMember(member)}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                              <User className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-foreground">
                                {member.firstName} {member.lastName}
                              </h4>
                              {member.aiGenerated && (
                                <Badge variant="secondary" className="text-xs mt-1">
                                  AI Generated
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="space-y-2 text-sm text-muted-foreground">
                          {member.birthDate && (
                            <div className="flex items-center gap-2">
                              <Calendar className="h-3.5 w-3.5" />
                              <span>Born: {new Date(member.birthDate).getFullYear()}</span>
                            </div>
                          )}
                          {member.birthPlace && (
                            <div className="flex items-center gap-2">
                              <MapPin className="h-3.5 w-3.5" />
                              <span className="truncate">{member.birthPlace}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                      <TreePine className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="font-medium text-foreground mb-2">No family members yet</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Add your first family member to get started
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card variant="elevated" className="animate-slide-up">
              <CardHeader>
                <CardTitle className="text-xl">Add Family Member</CardTitle>
                <CardDescription>
                  Add a new member to your family tree
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-sm font-medium">First Name</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) =>
                        setFormData({ ...formData, firstName: e.target.value })
                      }
                      placeholder="Enter first name"
                      className="transition-colors focus:border-primary/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-sm font-medium">Last Name</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) =>
                        setFormData({ ...formData, lastName: e.target.value })
                      }
                      placeholder="Enter last name"
                      className="transition-colors focus:border-primary/50"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="birthDate" className="text-sm font-medium">Birth Date</Label>
                    <Input
                      id="birthDate"
                      type="date"
                      value={formData.birthDate}
                      onChange={(e) =>
                        setFormData({ ...formData, birthDate: e.target.value })
                      }
                      className="transition-colors focus:border-primary/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="deathDate" className="text-sm font-medium">Death Date</Label>
                    <Input
                      id="deathDate"
                      type="date"
                      value={formData.deathDate}
                      onChange={(e) =>
                        setFormData({ ...formData, deathDate: e.target.value })
                      }
                      className="transition-colors focus:border-primary/50"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="birthPlace" className="text-sm font-medium">Birth Place</Label>
                    <Input
                      id="birthPlace"
                      value={formData.birthPlace}
                      onChange={(e) =>
                        setFormData({ ...formData, birthPlace: e.target.value })
                      }
                      placeholder="City, State, Country"
                      className="transition-colors focus:border-primary/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="deathPlace" className="text-sm font-medium">Death Place</Label>
                    <Input
                      id="deathPlace"
                      value={formData.deathPlace}
                      onChange={(e) =>
                        setFormData({ ...formData, deathPlace: e.target.value })
                      }
                      placeholder="City, State, Country"
                      className="transition-colors focus:border-primary/50"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t">
                  <Button
                    onClick={addFamilyMember}
                    className="w-full hover-lift"
                    disabled={!formData.firstName || !formData.lastName}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Member
                  </Button>
                </div>
              </CardContent>
            </Card>

            {selectedMember && (
              <Card variant="elevated" className="animate-slide-up">
                <CardHeader>
                  <CardTitle className="text-xl">Member Details</CardTitle>
                  <CardDescription>
                    View details for {selectedMember.firstName}{" "}
                    {selectedMember.lastName}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">
                          {selectedMember.firstName} {selectedMember.lastName}
                        </h3>
                        {selectedMember.aiGenerated && (
                          <Badge variant="secondary" className="text-xs mt-1">
                            AI Generated
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-3 text-sm">
                      {selectedMember.birthDate && (
                        <div className="flex items-center justify-between py-2 border-b border-border/50">
                          <span className="text-muted-foreground flex items-center gap-2">
                            <Calendar className="h-3.5 w-3.5" />
                            Birth Date:
                          </span>
                          <span className="font-medium">
                            {new Date(selectedMember.birthDate).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                      {selectedMember.deathDate && (
                        <div className="flex items-center justify-between py-2 border-b border-border/50">
                          <span className="text-muted-foreground flex items-center gap-2">
                            <Calendar className="h-3.5 w-3.5" />
                            Death Date:
                          </span>
                          <span className="font-medium">
                            {new Date(selectedMember.deathDate).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                      {selectedMember.birthPlace && (
                        <div className="flex items-center justify-between py-2 border-b border-border/50">
                          <span className="text-muted-foreground flex items-center gap-2">
                            <MapPin className="h-3.5 w-3.5" />
                            Birth Place:
                          </span>
                          <span className="font-medium">{selectedMember.birthPlace}</span>
                        </div>
                      )}
                      {selectedMember.deathPlace && (
                        <div className="flex items-center justify-between py-2 border-b border-border/50">
                          <span className="text-muted-foreground flex items-center gap-2">
                            <MapPin className="h-3.5 w-3.5" />
                            Death Place:
                          </span>
                          <span className="font-medium">{selectedMember.deathPlace}</span>
                        </div>
                      )}
                      {selectedMember.confidence && (
                        <div className="flex items-center justify-between py-2">
                          <span className="text-muted-foreground">Confidence:</span>
                          <Badge variant="outline">
                            {Math.round(selectedMember.confidence * 100)}%
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}