"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Navigation } from "@/components/ui/navigation";
import { User, Mail, Calendar, Crown, Globe, Phone, MapPin, Shield } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { Footer } from "@/components/footer";
import { toast } from "sonner";

interface UserProfile {
  firstName?: string;
  lastName?: string;
  bio?: string;
  location?: string;
  dateOfBirth?: string;
  phoneNumber?: string;
  website?: string;
  researchInterests: string[];
  familyOrigins: string[];
  languages: string[];
  profilePublic: boolean;
  allowContact: boolean;
}

export default function ProfilePage() {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [profileData, setProfileData] = useState<UserProfile>({
    firstName: "",
    lastName: "",
    bio: "",
    location: "",
    dateOfBirth: "",
    phoneNumber: "",
    website: "",
    researchInterests: [],
    familyOrigins: [],
    languages: [],
    profilePublic: false,
    allowContact: true,
  });

  useEffect(() => {
    // Load existing profile data
    fetchProfileData();
  }, [session]);

  const fetchProfileData = async () => {
    try {
      const response = await fetch("/api/profile");
      if (response.ok) {
        const data = await response.json();
        setProfileData(data);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(profileData),
      });

      if (response.ok) {
        toast.success("Profile updated successfully!");
      } else {
        toast.error("Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-between">
      <div>
        <Navigation variant="dashboard" />
        <div className="container mx-auto px-4 py-6 md:py-8 max-w-4xl">
          <div className="mb-8 animate-fade-in">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
              Profile Settings
            </h1>
            <p className="text-lg text-muted-foreground">
              Manage your account information and preferences
            </p>
          </div>

          <div className="space-y-8">
            {/* Account Information */}
            <Card variant="elevated" className="animate-slide-up">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-3">
                      <User className="h-5 w-5" />
                      Account Information
                    </CardTitle>
                    <CardDescription>
                      Your account details and authentication provider
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="gap-1">
                      <Shield className="h-3.5 w-3.5" />
                      Account
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={profileData.firstName || ""}
                      onChange={(e) =>
                        setProfileData({ ...profileData, firstName: e.target.value })
                      }
                      placeholder="Enter your first name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={profileData.lastName || ""}
                      onChange={(e) =>
                        setProfileData({ ...profileData, lastName: e.target.value })
                      }
                      placeholder="Enter your last name"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={session?.user?.email || ""}
                    disabled
                    className="opacity-50"
                  />
                  <p className="text-xs text-muted-foreground">
                    Email cannot be changed. Contact support if needed.
                  </p>
                </div>

                <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg border border-border/50">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Crown className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">Subscription Status</h3>
                    <p className="text-sm text-muted-foreground">
                      You are currently on the Free plan
                    </p>
                  </div>
                  <Badge variant="outline">Free</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Personal Information */}
            <Card variant="elevated" className="animate-slide-up">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <MapPin className="h-5 w-5" />
                  Personal Information
                </CardTitle>
                <CardDescription>
                  Additional details for your genealogy research profile
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={profileData.bio || ""}
                    onChange={(e) =>
                      setProfileData({ ...profileData, bio: e.target.value })
                    }
                    placeholder="Tell us about yourself and your genealogy interests..."
                    rows={3}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={profileData.location || ""}
                      onChange={(e) =>
                        setProfileData({ ...profileData, location: e.target.value })
                      }
                      placeholder="City, State, Country"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth">Date of Birth</Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={profileData.dateOfBirth || ""}
                      onChange={(e) =>
                        setProfileData({ ...profileData, dateOfBirth: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber">Phone Number</Label>
                    <Input
                      id="phoneNumber"
                      type="tel"
                      value={profileData.phoneNumber || ""}
                      onChange={(e) =>
                        setProfileData({ ...profileData, phoneNumber: e.target.value })
                      }
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      type="url"
                      value={profileData.website || ""}
                      onChange={(e) =>
                        setProfileData({ ...profileData, website: e.target.value })
                      }
                      placeholder="https://yourwebsite.com"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Genealogy Interests */}
            <Card variant="elevated" className="animate-slide-up">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Globe className="h-5 w-5" />
                  Genealogy Research Profile
                </CardTitle>
                <CardDescription>
                  Help others find connections and collaboration opportunities
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="researchInterests">Research Interests</Label>
                  <Input
                    id="researchInterests"
                    value={profileData.researchInterests.join(", ")}
                    onChange={(e) =>
                      setProfileData({
                        ...profileData,
                        researchInterests: e.target.value.split(",").map(s => s.trim()),
                      })
                    }
                    placeholder="Military records, Immigration, Census data..."
                  />
                  <p className="text-xs text-muted-foreground">
                    Separate interests with commas
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="familyOrigins">Family Origins</Label>
                  <Input
                    id="familyOrigins"
                    value={profileData.familyOrigins.join(", ")}
                    onChange={(e) =>
                      setProfileData({
                        ...profileData,
                        familyOrigins: e.target.value.split(",").map(s => s.trim()),
                      })
                    }
                    placeholder="Ireland, Germany, Italy..."
                  />
                  <p className="text-xs text-muted-foreground">
                    Countries or regions your family comes from
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="languages">Languages</Label>
                  <Input
                    id="languages"
                    value={profileData.languages.join(", ")}
                    onChange={(e) =>
                      setProfileData({
                        ...profileData,
                        languages: e.target.value.split(",").map(s => s.trim()),
                      })
                    }
                    placeholder="English, Spanish, German..."
                  />
                  <p className="text-xs text-muted-foreground">
                    Languages you speak or research in
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Save/Cancel Actions */}
            <Card variant="elevated" className="animate-slide-up">
              <CardContent className="pt-6">
                <div className="flex gap-3">
                  <Button 
                    onClick={handleSave} 
                    disabled={isLoading} 
                    className="hover-lift"
                  >
                    {isLoading ? "Saving..." : "Save Changes"}
                  </Button>
                  <Button 
                    variant="outline" 
                    className="hover-lift"
                    onClick={() => fetchProfileData()}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
