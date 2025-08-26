"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Loader2,
  Mail,
  Lock,
  Eye,
  EyeOff,
  XCircle,
  ArrowRight,
  Shield,
  Sparkles,
  TreePine,
  FileText,
  Dna,
  User,
  LogIn,
  Info,
  ChevronRight,
  Users,
} from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { z } from "zod";

// Validation schema
const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

// Login form component wrapped in Suspense
function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();

  // URL parameters
  const registered = searchParams.get("registered") === "true";
  const verified = searchParams.get("verified") === "true";
  const resetSuccess = searchParams.get("reset") === "true";
  const sessionExpired = searchParams.get("expired") === "true";
  const unauthorized = searchParams.get("unauthorized") === "true";
  const from = searchParams.get("from") || "/dashboard";
  const error = searchParams.get("error");

  // Form state
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [forgotPasswordMode, setForgotPasswordMode] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (status === "authenticated" && session) {
      router.push(from);
    }
  }, [session, status, router, from]);

  // Show notification toasts based on URL parameters
  useEffect(() => {
    if (registered) {
      toast.success("Account created successfully!", {
        description: "Please check your email to verify your account.",
      });
    }
    if (verified) {
      toast.success("Email verified!", {
        description: "Your email has been verified. You can now log in.",
      });
    }
    if (resetSuccess) {
      toast.success("Password reset successful!", {
        description: "You can now log in with your new password.",
      });
    }
    if (sessionExpired) {
      toast.error("Session expired", {
        description: "Please log in again to continue.",
      });
    }
    if (unauthorized) {
      toast.error("Access denied", {
        description: "Please log in to access this page.",
      });
    }
    if (error === "OAuthAccountNotLinked") {
      toast.error("Account already exists", {
        description:
          "Please sign in with the same provider you used to create your account.",
      });
    }
  }, [registered, verified, resetSuccess, sessionExpired, unauthorized, error]);

  // Load saved email from localStorage
  useEffect(() => {
    const savedEmail = localStorage.getItem("rememberedEmail");
    if (savedEmail) {
      setFormData((prev) => ({ ...prev, email: savedEmail }));
      setRememberMe(true);
    }
  }, []);

  // Validate field on blur
  const validateField = (field: string, value: string) => {
    const newErrors = { ...errors };

    if (field === "email") {
      if (!z.string().email().safeParse(value).success) {
        newErrors.email = "Please enter a valid email address";
      } else {
        delete newErrors.email;
      }
    }

    if (field === "password" && !forgotPasswordMode) {
      if (!value) {
        newErrors.password = "Password is required";
      } else {
        delete newErrors.password;
      }
    }

    setErrors(newErrors);
  };

  // Handle login
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (forgotPasswordMode) {
      handleForgotPassword();
      return;
    }

    // Validate form
    const validation = loginSchema.safeParse(formData);

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

    setIsLoading(true);
    setErrors({});

    try {
      // Save email if remember me is checked
      if (rememberMe) {
        localStorage.setItem("rememberedEmail", formData.email);
      } else {
        localStorage.removeItem("rememberedEmail");
      }

      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
        callbackUrl: from,
      });

      if (result?.error) {
        if (result.error === "CredentialsSignin") {
          setErrors({ password: "Invalid email or password" });
          toast.error("Login failed", {
            description: "Please check your email and password.",
          });
        } else {
          toast.error("Login failed", {
            description: result.error,
          });
        }
      } else if (result?.ok) {
        toast.success("Welcome back!", {
          description: "Redirecting to your dashboard...",
        });
        router.push(from);
        router.refresh();
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Something went wrong", {
        description: "Please try again later.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Google sign in
  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      await signIn("google", {
        callbackUrl: from,
      });
    } catch (error) {
      console.error("Google sign in error:", error);
      toast.error("Google sign in failed", {
        description: "Please try again or use email/password.",
      });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  // Handle forgot password
  const handleForgotPassword = async () => {
    if (!formData.email) {
      setErrors({ email: "Please enter your email address" });
      return;
    }

    if (!z.string().email().safeParse(formData.email).success) {
      setErrors({ email: "Please enter a valid email address" });
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email }),
      });

      if (res.ok) {
        setResetEmailSent(true);
        toast.success("Reset email sent!", {
          description: "Check your email for password reset instructions.",
        });
      } else {
        const data = await res.json();
        toast.error("Failed to send reset email", {
          description: data.error || "Please try again.",
        });
      }
    } catch (error) {
      toast.error("Something went wrong", {
        description: "Please try again later.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state while checking session
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Reset email sent confirmation
  if (resetEmailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-blue-600" />
            </div>
            <CardTitle className="text-2xl">Check Your Email</CardTitle>
            <CardDescription>
              We&apos;ve sent password reset instructions to {formData.email}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                The reset link will expire in 1 hour. If you don&apos;t see the
                email, check your spam folder.
              </AlertDescription>
            </Alert>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setResetEmailSent(false);
                setForgotPasswordMode(false);
              }}
            >
              Back to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-background">
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
                {forgotPasswordMode ? "Reset Password" : "Welcome Back"}
              </CardTitle>
              <CardDescription className="text-center">
                {forgotPasswordMode
                  ? "Enter your email to receive reset instructions"
                  : "Sign in to continue your genealogy research"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
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
                        errors.email ? "border-destructive focus-visible:ring-destructive" : ""
                      }`}
                      disabled={isLoading}
                      required
                      autoComplete="email"
                    />
                  </div>
                  {errors.email && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <XCircle className="w-3 h-3" />
                      {errors.email}
                    </p>
                  )}
                </div>

                {/* Password Field - Hidden in forgot password mode */}
                {!forgotPasswordMode && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">Password</Label>
                      <button
                        type="button"
                        onClick={() => setForgotPasswordMode(true)}
                        className="text-sm text-primary hover:underline"
                      >
                        Forgot password?
                      </button>
                    </div>
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
                          errors.password ? "border-destructive focus-visible:ring-destructive" : ""
                        }`}
                        disabled={isLoading}
                        required
                        autoComplete="current-password"
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
                    {errors.password && (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <XCircle className="w-3 h-3" />
                        {errors.password}
                      </p>
                    )}
                  </div>
                )}

                {/* Remember Me - Hidden in forgot password mode */}
                {!forgotPasswordMode && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="remember"
                        checked={rememberMe}
                        onCheckedChange={(checked) =>
                          setRememberMe(checked as boolean)
                        }
                        disabled={isLoading}
                      />
                      <label
                        htmlFor="remember"
                        className="text-sm text-muted-foreground cursor-pointer"
                      >
                        Remember me
                      </label>
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full hover-lift"
                  disabled={isLoading}
                  size="lg"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {forgotPasswordMode ? "Sending..." : "Signing in..."}
                    </>
                  ) : (
                    <>
                      {forgotPasswordMode ? (
                        <>
                          Send Reset Email
                          <Mail className="ml-2 h-4 w-4" />
                        </>
                      ) : (
                        <>
                          Sign In
                          <LogIn className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </>
                  )}
                </Button>

                {/* Back to login link for forgot password mode */}
                {forgotPasswordMode && (
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full"
                    onClick={() => {
                      setForgotPasswordMode(false);
                      setErrors({});
                    }}
                  >
                    <ArrowRight className="mr-2 h-4 w-4 rotate-180" />
                    Back to login
                  </Button>
                )}
              </form>

              {/* Social Login - Hidden in forgot password mode */}
              {!forgotPasswordMode && (
                <>
                  {/* Divider */}
                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <Separator />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">
                        Or continue with
                      </span>
                    </div>
                  </div>

                  {/* Google Sign In */}
                  <Button
                    variant="outline"
                    className="w-full hover-lift"
                    onClick={handleGoogleSignIn}
                    disabled={isGoogleLoading}
                    size="lg"
                  >
                    {isGoogleLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <FcGoogle className="mr-2 h-5 w-5" />
                    )}
                    Sign in with Google
                  </Button>
                </>
              )}
            </CardContent>
            {!forgotPasswordMode && (
              <CardFooter className="text-center">
                <p className="text-sm text-muted-foreground w-full">
                  Don&apos;t have an account?{" "}
                  <Link
                    href="/register"
                    className="text-primary hover:underline font-medium"
                  >
                    Create account
                  </Link>
                </p>
              </CardFooter>
            )}
          </Card>

          {/* Security Badge */}
          <div className="mt-6 text-center">
            <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
              <Shield className="w-4 h-4" />
              <span>Secured with 256-bit encryption</span>
            </div>
          </div>

          {/* Demo Account Info */}
          {process.env.NODE_ENV === "development" && (
            <Alert className="mt-4">
              <Info className="h-4 w-4" />
              <AlertTitle>Demo Account</AlertTitle>
              <AlertDescription>
                Email: demo@genealogyai.com | Password: Demo123!
              </AlertDescription>
            </Alert>
          )}
        </div>
      </div>

      {/* Right Side - Features */}
      <div className="hidden lg:flex flex-1 bg-muted/30 items-center justify-center p-12">
        <div className="max-w-md animate-slide-up">
          <h2 className="text-3xl font-bold mb-6 text-foreground">
            Continue Your Journey
          </h2>
          <p className="text-muted-foreground text-lg mb-8">
            Access your genealogy research and discover more about your family
            history with our AI-powered tools.
          </p>

          {/* Recent Updates */}
          <Card variant="clean" className="p-6 mb-8">
            <h3 className="font-semibold mb-4 flex items-center gap-2 text-foreground">
              <Sparkles className="w-5 h-5 text-primary" />
              What&apos;s New
            </h3>
            <div className="space-y-3">
              <UpdateItem
                title="Enhanced Document Analysis"
                description="Improved accuracy for handwritten text"
                isNew
              />
              <UpdateItem
                title="DNA Match Finder"
                description="Connect with genetic relatives"
              />
              <UpdateItem
                title="Photo Timeline"
                description="Create visual family histories"
              />
            </div>
          </Card>

          {/* Features Grid */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <FeatureCard
              icon={<FileText className="w-5 h-5" />}
              count="50K+"
              label="Documents Analyzed"
            />
            <FeatureCard
              icon={<Dna className="w-5 h-5" />}
              count="15K+"
              label="DNA Profiles"
            />
            <FeatureCard
              icon={<TreePine className="w-5 h-5" />}
              count="25K+"
              label="Family Trees"
            />
            <FeatureCard
              icon={<Users className="w-5 h-5" />}
              count="10K+"
              label="Active Users"
            />
          </div>

          {/* Testimonial */}
          <Card variant="clean" className="p-4">
            <p className="text-sm italic mb-3 text-muted-foreground">
              &quot;My research buddy helped me discover relatives I never knew existed.
              It&apos;s like having an expert genealogist working with me 24/7!&quot;
            </p>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-primary-foreground" />
              </div>
              <div>
                <p className="text-sm font-semibold">Sarah Johnson</p>
                <p className="text-xs text-muted-foreground">Researcher Plan</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Feature card component
function FeatureCard({
  icon,
  count,
  label,
}: {
  icon: React.ReactNode;
  count: string;
  label: string;
}) {
  return (
    <Card variant="clean" className="p-4 text-center hover-lift group">
      <div className="inline-flex items-center justify-center w-10 h-10 bg-primary/10 rounded-lg mb-2 text-primary group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <p className="text-xl font-bold text-primary">{count}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </Card>
  );
}

// Update item component
function UpdateItem({
  title,
  description,
  isNew = false,
}: {
  title: string;
  description: string;
  isNew?: boolean;
}) {
  return (
    <div className="flex items-start gap-2">
      <ChevronRight className="w-4 h-4 text-primary mt-0.5" />
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium">{title}</p>
          {isNew && (
            <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
              NEW
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

// Main component with Suspense wrapper
export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
