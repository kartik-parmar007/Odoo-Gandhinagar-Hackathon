import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useStore, type Role } from "@/lib/mock";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Camera,
  Mail,
  Lock,
  ShieldAlert,
  ArrowLeft,
  KeyRound,
  CheckCircle2,
  Send,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { sendEmailOtp } from "@/lib/api/email.functions";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

export const Route = createFileRoute("/auth")({ component: Auth });

const REDIRECT_URL = "https://odoo-gandhinagar-hackathon.vercel.app/auth";

// Local helper functions for mock credentials storage
const getCredentials = (): Record<string, string> => {
  if (typeof window === "undefined") return {};
  const saved = localStorage.getItem("vendorbridge_credentials");
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {}
  }
  // Default Seed credentials
  const defaults = {
    "kartikparmar.dev@gmail.com": "Kartik12345",
    "akshat@vendorbridge.app": "Akshat12345",
  };
  localStorage.setItem("vendorbridge_credentials", JSON.stringify(defaults));
  return defaults;
};

const saveCredential = (email: string, pass: string) => {
  const current = getCredentials();
  current[email.toLowerCase()] = pass;
  localStorage.setItem("vendorbridge_credentials", JSON.stringify(current));
};

function Auth() {
  const navigate = useNavigate();
  const { currentProfile, addProfile, setRole, setCurrentProfile, profiles } = useStore();

  const [mode, setMode] = useState<
    "login" | "signup" | "check-email" | "link-sent" | "otp" | "forgot" | "reset"
  >("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [signup, setSignup] = useState({
    firstName: "",
    email: "",
    password: "",
    phone: "",
    role: "Procurement Officer" as Role,
    country: "India",
    notes: "",
    avatar: "",
  });

  const [otpValue, setOtpValue] = useState("");
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [otpEmail, setOtpEmail] = useState("");
  const [otpFlow, setOtpFlow] = useState<"login" | "signup" | "forgot">("login");
  const [isSimulated, setIsSimulated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // New Password states for reset flow
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Redirect if logged in
  useEffect(() => {
    if (currentProfile) {
      navigate({ to: "/" });
    }
  }, [currentProfile, navigate]);

  // Set up Supabase password recovery link redirection listener
  useEffect(() => {
    if (supabase) {
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === "PASSWORD_RECOVERY") {
          setOtpEmail(session?.user?.email || "");
          setMode("reset");
          toast.info("Recovery link verified! Please enter your new password below.");
        }
      });
      return () => {
        subscription.unsubscribe();
      };
    }
  }, []);

  // Generate and send mock OTP (Fallback local testing)
  const triggerMockOtp = async (targetEmail: string, flow: "login" | "signup" | "forgot") => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(code);
    setOtpEmail(targetEmail);
    setOtpFlow(flow);
    setOtpValue("");
    setIsSimulated(true);

    try {
      const res = await sendEmailOtp({
        data: {
          email: targetEmail,
          otp: code,
          type: flow === "forgot" ? "reset" : "verification",
        },
      });

      if (res.simulated) {
        toast.info(`📨 [Local Sim] Verification OTP sent: ${code}`, {
          duration: 12000,
        });
      } else {
        toast.success(`OTP code successfully sent to ${targetEmail}`);
        setIsSimulated(false);
      }

      if (flow === "forgot") {
        setMode("reset");
      } else {
        setMode("otp");
      }
    } catch (err) {
      console.error("Failed to send mock OTP:", err);
      toast.info(`📨 [Local Fallback] Verification OTP generated: ${code}`, {
        duration: 12000,
      });
      if (flow === "forgot") {
        setMode("reset");
      } else {
        setMode("otp");
      }
    }
  };

  const handleLoginSubmit = async () => {
    if (!email || !password) {
      return toast.error("Please fill in email and password");
    }

    setIsLoading(true);
    try {
      if (supabase) {
        // Authenticate via Supabase Auth
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) {
          if (error.message.includes("Email not confirmed")) {
            setOtpEmail(email.trim());
            setMode("check-email");
            return toast.warning("Email confirmation pending. Please check your inbox.");
          }
          throw error;
        }

        // Fetch profile details
        if (email.trim() === "kartikparmar.dev@gmail.com") {
          const adminProfile = {
            id: data.user?.id || "admin-kartik",
            firstName: "Kartik Parmar",
            email: "kartikparmar.dev@gmail.com",
            phone: "+91 99999 88888",
            role: "Admin" as Role,
            country: "India",
            avatar:
              "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=256&h=256&fit=crop",
          };

          await supabase.from("profiles").upsert({
            id: data.user?.id || "00000000-0000-0000-0000-000000000000",
            first_name: "Kartik Parmar",
            email: "kartikparmar.dev@gmail.com",
            role: "Admin",
            phone_number: "+91 99999 88888",
            country: "India",
          });

          setCurrentProfile(adminProfile);
          setRole("Admin");
        } else {
          const { data: dbProfile } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", data.user?.id)
            .single();

          if (dbProfile) {
            const profile = {
              id: dbProfile.id,
              firstName: dbProfile.first_name,
              email: dbProfile.email,
              phone: dbProfile.phone_number || "",
              role: (dbProfile.role || "Procurement Officer") as Role,
              country: dbProfile.country || "",
            };
            setCurrentProfile(profile);
            setRole(profile.role);
          } else {
            const mockProfile = {
              id: data.user?.id || "p-mock-" + Math.random().toString(36).slice(2, 6),
              firstName: email.split("@")[0],
              email: email.trim(),
              phone: "+91 00000 00000",
              role: "Procurement Officer" as Role,
              country: "India",
            };
            setCurrentProfile(mockProfile);
            setRole("Procurement Officer");
          }
        }
        toast.success("Signed in successfully!");
        navigate({ to: "/" });
      } else {
        // Fallback Mock mode
        const credentials = getCredentials();
        const storedPass = credentials[email.toLowerCase().trim()];

        if (!storedPass || storedPass !== password) {
          return toast.error("Invalid email or password");
        }

        await triggerMockOtp(email.trim(), "login");
      }
    } catch (err: any) {
      console.error("Sign-in error:", err);
      toast.error(err.message || "Invalid email or password");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async () => {
    if (!signup.firstName || !signup.email || !signup.password || !signup.phone) {
      return toast.error("Please fill in all required fields (First Name, Email, Password, Phone)");
    }

    setIsLoading(true);
    try {
      if (supabase) {
        // Native Supabase Sign-Up with Confirmation Link redirect configuration
        const { data, error } = await supabase.auth.signUp({
          email: signup.email.trim(),
          password: signup.password,
          options: {
            emailRedirectTo: REDIRECT_URL,
            data: {
              first_name: signup.firstName,
              phone_number: signup.phone,
              country: signup.country,
            },
          },
        });

        if (error) {
          throw error;
        }

        // Store user profile details in public profiles table
        if (data.user) {
          await supabase.from("profiles").upsert({
            id: data.user.id,
            first_name: signup.firstName,
            email: signup.email.trim(),
            role: signup.role,
            phone_number: signup.phone,
            country: signup.country,
          });
        }

        // Check if verification is pending (requires email confirmation link)
        if (data.user && data.session === null) {
          setOtpEmail(signup.email.trim());
          setMode("check-email");
          toast.success("Account created! Verification link sent to your email.");
        } else {
          // If auto-logged in, upsert profile and redirect
          const loadedProfile = {
            id: data.user?.id || "p-mock-" + Math.random().toString(36).slice(2, 6),
            firstName: signup.firstName,
            email: signup.email.trim(),
            phone: signup.phone,
            role: signup.role,
            country: signup.country,
            notes: signup.notes,
            avatar: signup.avatar,
          };
          setCurrentProfile(loadedProfile);
          setRole(signup.role);
          toast.success("Account created successfully!");
          navigate({ to: "/" });
        }
      } else {
        // Mock fallback
        const credentials = getCredentials();
        if (credentials[signup.email.toLowerCase().trim()]) {
          return toast.error("Email address is already registered.");
        }
        await triggerMockOtp(signup.email.trim(), "signup");
      }
    } catch (err: any) {
      console.error("Signup error:", err);
      toast.error(err.message || "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendConfirmLink = async () => {
    if (!otpEmail) return;
    setIsLoading(true);
    try {
      if (supabase) {
        const { error } = await supabase.auth.resend({
          type: "signup",
          email: otpEmail,
          options: {
            emailRedirectTo: REDIRECT_URL,
          },
        });
        if (error) throw error;
        toast.success("Confirmation link resent successfully! Check your inbox.");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to resend confirmation email.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotSubmit = async () => {
    if (!email) {
      return toast.error("Please enter your email address");
    }

    setIsLoading(true);
    try {
      if (supabase) {
        // Trigger native Supabase recovery email redirecting back to our auth page
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: REDIRECT_URL,
        });

        if (error) {
          throw error;
        }

        setOtpEmail(email.trim());
        setMode("link-sent");
        toast.success("Recovery verification link has been sent to your email!");
      } else {
        const credentials = getCredentials();
        if (!credentials[email.toLowerCase().trim()]) {
          return toast.error("No account found with this email address");
        }
        await triggerMockOtp(email.trim(), "forgot");
      }
    } catch (err: any) {
      console.error("Password recovery request error:", err);
      toast.error(err.message || "Failed to request password reset code");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendRecoveryLink = async () => {
    if (!otpEmail) return;
    setIsLoading(true);
    try {
      if (supabase) {
        const { error } = await supabase.auth.resetPasswordForEmail(otpEmail, {
          redirectTo: REDIRECT_URL,
        });
        if (error) throw error;
        toast.success("Recovery link resent successfully! Check your inbox.");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to resend recovery email.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otpValue.length !== 6) {
      return toast.error("Please enter a 6-digit OTP code");
    }

    if (otpValue !== generatedOtp) {
      return toast.error("Invalid verification code. Please check and try again.");
    }

    setIsLoading(true);
    try {
      // Mock verification validation
      if (otpFlow === "login") {
        if (otpEmail === "kartikparmar.dev@gmail.com") {
          const adminProfile = {
            id: "admin-kartik",
            firstName: "Kartik Parmar",
            email: "kartikparmar.dev@gmail.com",
            phone: "+91 99999 88888",
            role: "Admin" as Role,
            country: "India",
            avatar:
              "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=256&h=256&fit=crop",
          };
          setCurrentProfile(adminProfile);
          setRole("Admin");
          toast.success("Welcome back, Admin!");
        } else {
          const matched = profiles.find((p) => p.email.toLowerCase() === otpEmail.toLowerCase());
          if (matched) {
            setCurrentProfile(matched);
            setRole(matched.role);
          } else {
            const mockProfile = {
              id: "p-mock-" + Math.random().toString(36).slice(2, 6),
              firstName: otpEmail.split("@")[0],
              email: otpEmail,
              phone: "+91 00000 00000",
              role: "Procurement Officer" as Role,
              country: "India",
            };
            setCurrentProfile(mockProfile);
            setRole("Procurement Officer");
          }
          toast.success("Welcome back!");
        }
      } else if (otpFlow === "signup") {
        const newProfile = {
          firstName: signup.firstName,
          email: signup.email,
          phone: signup.phone,
          role: signup.role,
          country: signup.country,
          notes: signup.notes,
          avatar: signup.avatar,
        };

        await addProfile(newProfile);
        saveCredential(signup.email, signup.password);
        setRole(signup.role);

        const loadedProfile = {
          id: "p-mock-" + Math.random().toString(36).slice(2, 6),
          ...newProfile,
        };
        setCurrentProfile(loadedProfile);
        toast.success("Account created successfully!");
      }
      navigate({ to: "/" });
    } catch (err: any) {
      console.error("Mock OTP validation failed:", err);
      toast.error(err.message || "Invalid verification code");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      return toast.error("Password must be at least 6 characters");
    }

    if (newPassword !== confirmPassword) {
      return toast.error("Passwords do not match");
    }

    setIsLoading(true);
    try {
      if (supabase) {
        // Recovery link redirect handles auth token internally. Simply update the user session:
        const { error: updateError } = await supabase.auth.updateUser({
          password: newPassword,
        });

        if (updateError) {
          throw updateError;
        }

        toast.success("Password reset successful. Logging you in!");

        const {
          data: { user },
        } = await supabase.auth.getUser();
        const { data: dbProfile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user?.id)
          .single();

        if (dbProfile) {
          const profile = {
            id: dbProfile.id,
            firstName: dbProfile.first_name,
            email: dbProfile.email,
            phone: dbProfile.phone_number || "",
            role: (dbProfile.role || "Procurement Officer") as Role,
            country: dbProfile.country || "",
          };
          setCurrentProfile(profile);
          setRole(profile.role);
        } else {
          const mockProfile = {
            id: user?.id || "p-mock-" + Math.random().toString(36).slice(2, 6),
            firstName: otpEmail.split("@")[0],
            email: otpEmail,
            phone: "+91 00000 00000",
            role: "Procurement Officer" as Role,
            country: "India",
          };
          setCurrentProfile(mockProfile);
          setRole("Procurement Officer");
        }
        navigate({ to: "/" });
      } else {
        // Mock fallback reset password logic using OTP code verification
        if (otpValue !== generatedOtp) {
          return toast.error("Invalid verification OTP code");
        }

        saveCredential(otpEmail, newPassword);
        toast.success("Password reset successful. Logging you in!");

        const matched = profiles.find((p) => p.email.toLowerCase() === otpEmail.toLowerCase());
        if (matched) {
          setCurrentProfile(matched);
          setRole(matched.role);
        } else {
          const mockProfile = {
            id: "p-mock-" + Math.random().toString(36).slice(2, 6),
            firstName: otpEmail.split("@")[0],
            email: otpEmail,
            phone: "+91 00000 00000",
            role: "Procurement Officer" as Role,
            country: "India",
          };
          setCurrentProfile(mockProfile);
          setRole("Procurement Officer");
        }
        navigate({ to: "/" });
      }
    } catch (err: any) {
      console.error("Password reset update error:", err);
      toast.error(err.message || "Failed to reset password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left Branding Panel */}
      <div className="hidden lg:flex bg-sidebar text-sidebar-foreground p-12 flex-col justify-between">
        <div className="flex items-center gap-2">
          <div className="size-10 rounded-md bg-sidebar-primary text-sidebar-primary-foreground grid place-items-center font-bold text-xl">
            V
          </div>
          <div className="font-bold text-xl">VendorBridge</div>
        </div>
        <div>
          <h1 className="text-4xl font-bold leading-tight">
            Smarter procurement.
            <br />
            Stronger vendors.
          </h1>
          <p className="mt-4 opacity-80 max-w-md">
            End-to-end RFQ, vendor management, approvals, and invoicing in one elegant workspace.
          </p>
        </div>
        <div className="text-xs opacity-60">© 2026 VendorBridge ERP</div>
      </div>

      {/* Right Form Panel */}
      <div className="flex items-center justify-center p-6 bg-background">
        {mode === "login" || mode === "signup" ? (
          <Card className="p-8 w-full max-w-md shadow-xl border">
            <Tabs
              defaultValue="login"
              onValueChange={() => {
                setOtpValue("");
                setGeneratedOtp("");
              }}
            >
              <TabsList className="grid grid-cols-2 w-full">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Sign up</TabsTrigger>
              </TabsList>

              {/* Login View */}
              <TabsContent value="login" className="space-y-4 mt-5">
                <div className="space-y-1">
                  <Label>Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                    <Input
                      type="email"
                      placeholder="you@example.com"
                      className="pl-9"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <Label>Password</Label>
                    <button
                      onClick={() => setMode("forgot")}
                      className="text-xs text-primary hover:underline font-medium cursor-pointer"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                    <Input
                      type="password"
                      placeholder="••••••••"
                      className="pl-9"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                </div>
                <Button className="w-full h-10" onClick={handleLoginSubmit} disabled={isLoading}>
                  {isLoading ? "Signing In..." : "Sign In"}
                </Button>
                <p className="text-[11px] text-muted-foreground text-center">
                  Admin Demo: kartikparmar.dev@gmail.com / Kartik12345
                </p>
              </TabsContent>

              {/* Signup View */}
              <TabsContent
                value="signup"
                className="space-y-4 mt-5 max-h-[70vh] overflow-y-auto pr-1"
              >
                <div className="flex flex-col items-center gap-1.5">
                  <Label className="text-xs text-muted-foreground">Profile Picture</Label>
                  <div className="relative group cursor-pointer size-20 rounded-full border-2 border-dashed bg-muted hover:border-primary flex items-center justify-center overflow-hidden transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setSignup({ ...signup, avatar: reader.result as string });
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                    />
                    {signup.avatar ? (
                      <img src={signup.avatar} className="size-full object-cover" alt="Profile" />
                    ) : (
                      <Camera className="size-6 text-muted-foreground group-hover:text-primary transition-colors" />
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <Label>
                    First Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    placeholder="John"
                    value={signup.firstName}
                    onChange={(e) => setSignup({ ...signup, firstName: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label>
                    Email Address <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    type="email"
                    placeholder="john@example.com"
                    value={signup.email}
                    onChange={(e) => setSignup({ ...signup, email: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label>
                    Password <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    type="password"
                    placeholder="At least 6 characters"
                    value={signup.password}
                    onChange={(e) => setSignup({ ...signup, password: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label>
                    Phone Number <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    placeholder="+91 XXXXX XXXXX"
                    value={signup.phone}
                    onChange={(e) => setSignup({ ...signup, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Role</Label>
                  <Select
                    value={signup.role}
                    onValueChange={(v) => setSignup({ ...signup, role: v as Role })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Procurement Officer">Procurement Officer</SelectItem>
                      <SelectItem value="Vendor">Vendor</SelectItem>
                      <SelectItem value="Manager">Manager</SelectItem>
                      <SelectItem value="Admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Country</Label>
                  <Input
                    placeholder="India"
                    value={signup.country}
                    onChange={(e) => setSignup({ ...signup, country: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Additional Information</Label>
                  <Textarea
                    placeholder="Notes, business description, etc."
                    value={signup.notes}
                    onChange={(e) => setSignup({ ...signup, notes: e.target.value })}
                  />
                </div>
                <Button
                  className="w-full h-10 mt-2"
                  onClick={handleRegisterSubmit}
                  disabled={isLoading}
                >
                  {isLoading ? "Registering..." : "Register & Confirm Email"}
                </Button>
              </TabsContent>
            </Tabs>
          </Card>
        ) : mode === "check-email" ? (
          /* Real Supabase Check Email confirmation link page */
          <Card className="p-8 w-full max-w-md shadow-xl border space-y-6 text-center">
            <div className="mx-auto size-16 rounded-full bg-emerald-500/10 grid place-items-center text-emerald-500">
              <CheckCircle2 className="size-10" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold tracking-tight text-foreground">
                Verify Your Email
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                A verification link has been dispatched to:
                <br />
                <strong className="text-foreground">{otpEmail}</strong>
              </p>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                Please check your inbox (and spam folder) and click the link to confirm your account
                and sign in.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <Button
                variant="outline"
                className="w-full h-10 gap-2 cursor-pointer"
                onClick={handleResendConfirmLink}
                disabled={isLoading}
              >
                <Send className="size-4" />
                {isLoading ? "Resending Link..." : "Resend Confirmation Link"}
              </Button>
              <button
                onClick={() => setMode("login")}
                className="w-full text-center text-xs text-muted-foreground hover:text-foreground flex items-center justify-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="size-3" /> Back to Login
              </button>
            </div>
          </Card>
        ) : mode === "link-sent" ? (
          /* Real Supabase Forgot Password recovery email page */
          <Card className="p-8 w-full max-w-md shadow-xl border space-y-6 text-center">
            <div className="mx-auto size-16 rounded-full bg-primary/10 grid place-items-center text-primary">
              <Send className="size-8" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold tracking-tight text-foreground">
                Recovery Link Sent
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                A password reset recovery link has been dispatched to:
                <br />
                <strong className="text-foreground">{otpEmail}</strong>
              </p>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                Open the link in your email to reset your account password.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <Button
                variant="outline"
                className="w-full h-10 gap-2 cursor-pointer"
                onClick={handleResendRecoveryLink}
                disabled={isLoading}
              >
                <Send className="size-4" />
                {isLoading ? "Resending..." : "Resend Recovery Link"}
              </Button>
              <button
                onClick={() => setMode("login")}
                className="w-full text-center text-xs text-muted-foreground hover:text-foreground flex items-center justify-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="size-3" /> Back to Login
              </button>
            </div>
          </Card>
        ) : mode === "otp" ? (
          /* Mock OTP Screen (Local Testing only) */
          <Card className="p-8 w-full max-w-md shadow-xl border space-y-6">
            <div className="text-center space-y-2">
              <div className="mx-auto size-12 rounded-full bg-primary/10 grid place-items-center text-primary">
                <Mail className="size-6" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-foreground">
                Security Verification
              </h2>
              <p className="text-sm text-muted-foreground">
                A 6-digit verification code has been dispatched to:
                <br />
                <strong className="text-foreground">{otpEmail}</strong>
              </p>
            </div>

            <div className="flex flex-col items-center space-y-4">
              <InputOTP maxLength={6} value={otpValue} onChange={setOtpValue}>
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>

            {isSimulated && (
              <div className="p-3.5 bg-info/10 border border-info/30 rounded-md text-xs space-y-1.5 text-info-foreground animate-pulse">
                <div className="flex items-center gap-1.5 font-semibold text-info">
                  <ShieldAlert className="size-4" />
                  <span>Local Testing Mode</span>
                </div>
                <p className="opacity-90">
                  Because no active Supabase Auth keys are reachable or configured on the server,
                  the OTP verification is simulated.
                </p>
                <p>
                  Your OTP Verification Code:{" "}
                  <code className="bg-muted px-2 py-0.5 rounded font-mono text-sm font-bold text-foreground selection:bg-primary/20">
                    {generatedOtp}
                  </code>
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Button className="w-full h-10" onClick={handleVerifyOtp} disabled={isLoading}>
                {isLoading ? "Verifying..." : "Verify & Sign In"}
              </Button>
              <div className="flex justify-between text-xs">
                <button
                  onClick={() => triggerMockOtp(otpEmail, otpFlow)}
                  className="text-primary hover:underline font-medium cursor-pointer"
                  disabled={isLoading || !isSimulated}
                >
                  {isSimulated ? "Resend Code" : ""}
                </button>
                <button
                  onClick={() => setMode("login")}
                  className="text-muted-foreground hover:text-foreground flex items-center gap-1 cursor-pointer ml-auto"
                >
                  <ArrowLeft className="size-3" /> Back to Login
                </button>
              </div>
            </div>
          </Card>
        ) : mode === "forgot" ? (
          /* Forgot Password Request Screen */
          <Card className="p-8 w-full max-w-md shadow-xl border space-y-5">
            <div className="text-center space-y-2">
              <div className="mx-auto size-12 rounded-full bg-primary/10 grid place-items-center text-primary">
                <KeyRound className="size-6" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-foreground">Forgot Password</h2>
              <p className="text-sm text-muted-foreground">
                Enter your registered email address. We will verify it and send you a password
                recovery link.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <Label>Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="name@domain.com"
                    className="pl-9"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>
              <Button className="w-full h-10" onClick={handleForgotSubmit} disabled={isLoading}>
                {isLoading ? "Sending Link..." : "Send Reset Link"}
              </Button>
              <button
                onClick={() => setMode("login")}
                className="w-full text-center text-xs text-muted-foreground hover:text-foreground flex items-center justify-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="size-3" /> Back to Login
              </button>
            </div>
          </Card>
        ) : (
          /* Reset Password Submit Screen (Fires upon Recovery Link redirect callback) */
          <Card className="p-8 w-full max-w-md shadow-xl border space-y-5">
            <div className="text-center space-y-2">
              <div className="mx-auto size-12 rounded-full bg-primary/10 grid place-items-center text-primary">
                <Lock className="size-6" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-foreground">Reset Password</h2>
              <p className="text-sm text-muted-foreground">
                Enter your new secure account password.
              </p>
            </div>

            <div className="space-y-4">
              {/* Only show OTP input for local mock mode password resets */}
              {!supabase && (
                <div className="flex flex-col items-center space-y-2">
                  <Label className="self-start">Reset OTP Code</Label>
                  <InputOTP maxLength={6} value={otpValue} onChange={setOtpValue}>
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
              )}

              <div className="space-y-1">
                <Label>New Password</Label>
                <Input
                  type="password"
                  placeholder="At least 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <Label>Confirm New Password</Label>
                <Input
                  type="password"
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>

              {!supabase && isSimulated && (
                <div className="p-3 bg-info/10 border border-info/30 rounded-md text-xs space-y-1 text-info-foreground">
                  <div className="flex items-center gap-1.5 font-semibold text-info">
                    <ShieldAlert className="size-4" />
                    <span>Local Testing Mode</span>
                  </div>
                  <p>
                    Your reset verification OTP code is:{" "}
                    <code className="bg-muted px-2 py-0.5 rounded font-mono text-sm font-bold text-foreground">
                      {generatedOtp}
                    </code>
                  </p>
                </div>
              )}

              <Button
                className="w-full h-10 mt-2"
                onClick={handleResetPassword}
                disabled={isLoading}
              >
                Reset Password & Sign In
              </Button>

              <button
                onClick={() => setMode("login")}
                className="w-full text-center text-xs text-muted-foreground hover:text-foreground flex items-center justify-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="size-3" /> Back to Login
              </button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
