"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  Loader2,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  ArrowRight,
  Shield,
  Sparkles,
  TreePine,
  FileText,
  Dna,
  Camera,
  MessageCircle,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { z } from "zod";

// Validation schema
const registerSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string(),
    acceptTerms: z.boolean(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

// Password strength calculation
const calculatePasswordStrength = (password: string): number => {
  let strength = 0;
  if (password.length >= 8) strength += 25;
  if (password.length >= 12) strength += 25;
  if (/[a-z]/.test(password)) strength += 12.5;
  if (/[A-Z]/.test(password)) strength += 12.5;
  if (/[0-9]/.test(password)) strength += 12.5;
  if (/[^A-Za-z0-9]/.test(password)) strength += 12.5;
  return Math.min(strength, 100);
};

const getPasswordStrengthLabel = (strength: number): string => {
  if (strength < 25) return "Very Weak";
  if (strength < 50) return "Weak";
  if (strength < 75) return "Good";
  return "Strong";
};


function RegisterPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const referral = searchParams.get("ref");
  const plan = searchParams.get("plan");
  const returnUrl = searchParams.get("returnUrl");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [verificationSent, setVerificationSent] = useState(false);

  // Update password strength when password changes
  useEffect(() => {
    setPasswordStrength(calculatePasswordStrength(formData.password));
  }, [formData.password]);

  // Validate field on blur
  const validateField = (field: string, value: string) => {
    const newErrors = { ...errors };

    switch (field) {
      case "name":
        if (value.length < 2) {
          newErrors.name = "Name must be at least 2 characters";
        } else {
          delete newErrors.name;
        }
        break;
      case "email":
        if (!z.string().email().safeParse(value).success) {
          newErrors.email = "Invalid email address";
        } else {
          delete newErrors.email;
        }
        break;
      case "password":
        if (value.length < 8) {
          newErrors.password = "Password must be at least 8 characters";
        } else if (!/[A-Z]/.test(value)) {
          newErrors.password = "Password must contain an uppercase letter";
        } else if (!/[a-z]/.test(value)) {
          newErrors.password = "Password must contain a lowercase letter";
        } else if (!/[0-9]/.test(value)) {
          newErrors.password = "Password must contain a number";
        } else {
          delete newErrors.password;
        }
        break;
      case "confirmPassword":
        if (value !== formData.password) {
          newErrors.confirmPassword = "Passwords do not match";
        } else {
          delete newErrors.confirmPassword;
        }
        break;
    }

    setErrors(newErrors);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all fields
    const validation = registerSchema.safeParse({ ...formData, acceptTerms });

    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.issues.forEach((error) => {
        if (error.path[0]) {
          fieldErrors[error.path[0] as string] = error.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    if (!acceptTerms) {
      toast("Terms Required", {
        description: "Please accept the terms and conditions",
      });
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          referral,
          plan,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error === "User already exists") {
          setErrors({ email: "An account with this email already exists" });
        } else {
          throw new Error(data.error || "Registration failed");
        }
      } else {
        setVerificationSent(true);
        toast("Account Created!", {
          description: "Please check your email to verify your account",
        });

        // Redirect to login after registration
        setTimeout(() => {
          let loginUrl = "/login?registered=true";
          if (returnUrl) {
            loginUrl += `&returnUrl=${encodeURIComponent(returnUrl)}`;
          } else if (plan) {
            loginUrl += `&plan=${plan}`;
          }
          router.push(loginUrl);
        }, 2000);
      }
    } catch (error) {
      console.error("Registration error:", error);
      toast("Registration Failed", {
        description:
          error instanceof Error ? error.message : "Please try again",
      });
    } finally {
      setIsLoading(false);
    }
  };



  if (verificationSent) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Check Your Email</CardTitle>
            <CardDescription>
              We&apos;ve sent a verification link to {formData.email}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Click the link in the email to verify your account and meet your 
              Genealogy Buddy AI!
            </p>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => router.push("/login")}
            >
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div
        className="flex bg-background"
        style={{ minHeight: "calc(100vh - 77px)" }}
      >
        {/* Left Side - Form */}
        <div className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-md animate-fade-in">
            {/* Logo */}
            <Link
              href="/"
              className="flex items-center justify-center mb-8 group"
            >
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-primary-foreground text-xl font-bold hover-scale">
                🧬
              </div>
              <span className="text-2xl font-bold text-foreground ml-3">
                Genealogy Buddy AI
              </span>
            </Link>

            <Card variant="elevated" className="shadow-lg animate-scale-in">
              <CardHeader>
                <CardTitle className="text-2xl text-center">
                  Meet Your Research Buddy!
                </CardTitle>
                <CardDescription className="text-center">
                  Join free and start discovering amazing family stories together
                </CardDescription>
                {plan && (
                  <Alert className="mt-3">
                    <Sparkles className="h-4 w-4" />
                    <AlertDescription>
                      You&apos;ll be subscribed to the <strong>{plan}</strong>{" "}
                      plan after registration
                    </AlertDescription>
                  </Alert>
                )}
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Name Field */}
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="name"
                        type="text"
                        placeholder="John Doe"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        onBlur={(e) => validateField("name", e.target.value)}
                        className={`pl-10 ${
                          errors.name
                            ? "border-destructive focus-visible:ring-destructive"
                            : ""
                        }`}
                        disabled={isLoading}
                        required
                      />
                    </div>
                    {errors.name && (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <XCircle className="w-3 h-3" />
                        {errors.name}
                      </p>
                    )}
                  </div>

                  {/* Email Field */}
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        onBlur={(e) => validateField("email", e.target.value)}
                        className={`pl-10 ${
                          errors.email
                            ? "border-destructive focus-visible:ring-destructive"
                            : ""
                        }`}
                        disabled={isLoading}
                        required
                      />
                    </div>
                    {errors.email && (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <XCircle className="w-3 h-3" />
                        {errors.email}
                      </p>
                    )}
                  </div>

                  {/* Password Field */}
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={(e) =>
                          setFormData({ ...formData, password: e.target.value })
                        }
                        onBlur={(e) =>
                          validateField("password", e.target.value)
                        }
                        className={`pl-10 pr-10 ${
                          errors.password
                            ? "border-destructive focus-visible:ring-destructive"
                            : ""
                        }`}
                        disabled={isLoading}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    {formData.password && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">
                            Password strength
                          </span>
                          <span
                            className={`font-medium ${
                              passwordStrength < 50
                                ? "text-red-500"
                                : passwordStrength < 75
                                ? "text-yellow-500"
                                : "text-green-500"
                            }`}
                          >
                            {getPasswordStrengthLabel(passwordStrength)}
                          </span>
                        </div>
                        <Progress value={passwordStrength} className="h-1" />
                      </div>
                    )}
                    {errors.password && (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <XCircle className="w-3 h-3" />
                        {errors.password}
                      </p>
                    )}
                  </div>

                  {/* Confirm Password Field */}
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={formData.confirmPassword}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            confirmPassword: e.target.value,
                          })
                        }
                        onBlur={(e) =>
                          validateField("confirmPassword", e.target.value)
                        }
                        className={`pl-10 pr-10 ${
                          errors.confirmPassword
                            ? "border-destructive focus-visible:ring-destructive"
                            : ""
                        }`}
                        disabled={isLoading}
                        required
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <XCircle className="w-3 h-3" />
                        {errors.confirmPassword}
                      </p>
                    )}
                  </div>

                  {/* Terms and Conditions */}
                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="terms"
                      checked={acceptTerms}
                      onCheckedChange={(checked) =>
                        setAcceptTerms(checked as boolean)
                      }
                      disabled={isLoading}
                    />
                    <label
                      htmlFor="terms"
                      className="text-sm text-muted-foreground cursor-pointer"
                    >
                      I agree to the{" "}
                      <Link
                        href="/terms"
                        className="text-primary hover:underline"
                      >
                        Terms of Service
                      </Link>{" "}
                      and{" "}
                      <Link
                        href="/privacy"
                        className="text-primary hover:underline"
                      >
                        Privacy Policy
                      </Link>
                    </label>
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    className="w-full hover-lift"
                    disabled={isLoading || !acceptTerms}
                    size="lg"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating account...
                      </>
                    ) : (
                      <>
                        Create Account
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
              <CardFooter className="text-center">
                <p className="text-sm text-muted-foreground w-full">
                  Already have an account?{" "}
                  <Link
                    href="/login"
                    className="text-primary hover:underline font-medium"
                  >
                    Sign in
                  </Link>
                </p>
              </CardFooter>
            </Card>

            {/* Security Badge */}
            <div className="mt-6 text-center">
              <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                <Shield className="w-4 h-4" />
                <span>Secured with 256-bit encryption</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Features */}
        <div className="hidden lg:flex flex-1 bg-muted/30 p-12 items-center justify-center">
          <div className="max-w-md animate-slide-up">
            <h2 className="text-3xl font-bold mb-6 text-foreground">
              Start Your Genealogy Journey
            </h2>
            <p className="text-muted-foreground mb-8">
              Join thousands of users discovering their family history with our
              AI-powered tools.
            </p>

            <div className="space-y-4">
              <FeatureItem
                icon={<FileText className="w-5 h-5" />}
                title="Document Analysis"
                description="Extract genealogical data from historical documents"
              />
              <FeatureItem
                icon={<Dna className="w-5 h-5" />}
                title="DNA Interpretation"
                description="Understand your genetic heritage with AI insights"
              />
              <FeatureItem
                icon={<TreePine className="w-5 h-5" />}
                title="Smart Family Trees"
                description="Build comprehensive family trees with AI suggestions"
              />
              <FeatureItem
                icon={<MessageCircle className="w-5 h-5" />}
                title="Research Assistant"
                description="Get expert guidance for your genealogy research"
              />
              <FeatureItem
                icon={<Camera className="w-5 h-5" />}
                title="Photo Stories"
                description="Bring old family photos to life with AI narratives"
              />
            </div>

            <Separator className="my-8" />

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">10K+</p>
                <p>Active Users</p>
              </div>
              <Separator orientation="vertical" className="h-12" />
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">50K+</p>
                <p>Documents Analyzed</p>
              </div>
              <Separator orientation="vertical" className="h-12" />
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">4.9★</p>
                <p>User Rating</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RegisterPageContent />
    </Suspense>
  );
}

function FeatureItem({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-3">
      <div className="flex-shrink-0 w-10 h-10 bg-white rounded-lg flex items-center justify-center text-primary shadow-sm">
        {icon}
      </div>
      <div>
        <h3 className="font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
