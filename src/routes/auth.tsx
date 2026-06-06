import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useStore, type Role } from "@/lib/mock";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Camera } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({ component: Auth });

import { supabase } from "@/lib/supabase";

function Auth() {
  const navigate = useNavigate();
  const { addProfile, setRole, setCurrentProfile, profiles, isDbConnected } = useStore();
  const [email, setEmail] = useState("akshat@vendorbridge.app");
  const [password, setPassword] = useState("demo1234");
  const [signup, setSignup] = useState({ firstName: "", email: "", phone: "", role: "Procurement Officer" as Role, country: "India", notes: "" });

  const handleLogin = async () => {
    if (email === "kartikparmar.dev@gmail.com" && password === "Kartik12345") {
      const adminProfile = {
        id: "admin-kartik",
        firstName: "Kartik Parmar",
        email: "kartikparmar.dev@gmail.com",
        phone: "+91 99999 88888",
        role: "Admin" as Role,
        country: "India",
      };

      setCurrentProfile(adminProfile);
      setRole("Admin");

      if (supabase) {
        try {
          await supabase.from("profiles").upsert({
            id: "00000000-0000-0000-0000-000000000000",
            first_name: "Kartik Parmar",
            email: "kartikparmar.dev@gmail.com",
            role: "Admin",
            phone_number: "+91 99999 88888",
            country: "India"
          });
        } catch (err) {
          console.warn("Could not upsert admin profile to Supabase:", err);
        }
      }

      toast.success("Welcome back, Admin!");
      navigate({ to: "/" });
    } else {
      const matched = profiles.find((p) => p.email.toLowerCase() === email.toLowerCase());
      if (matched) {
        setCurrentProfile(matched);
        setRole(matched.role);
      } else {
        const mockProfile = {
          id: "p-mock-" + Math.random().toString(36).slice(2, 6),
          firstName: email.split("@")[0],
          email: email,
          phone: "+91 00000 00000",
          role: "Procurement Officer" as Role,
          country: "India",
        };
        setCurrentProfile(mockProfile);
        setRole("Procurement Officer");
      }
      toast.success("Welcome back!");
      navigate({ to: "/" });
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:flex bg-sidebar text-sidebar-foreground p-12 flex-col justify-between">
        <div className="flex items-center gap-2">
          <div className="size-10 rounded-md bg-sidebar-primary grid place-items-center font-bold text-xl">V</div>
          <div className="font-bold text-xl">VendorBridge</div>
        </div>
        <div>
          <h1 className="text-4xl font-bold leading-tight">Smarter procurement.<br />Stronger vendors.</h1>
          <p className="mt-4 opacity-80 max-w-md">End-to-end RFQ, vendor management, approvals, and invoicing in one elegant workspace.</p>
        </div>
        <div className="text-xs opacity-60">© 2026 VendorBridge ERP</div>
      </div>
      <div className="flex items-center justify-center p-6">
        <Card className="p-8 w-full max-w-md">
          <Tabs defaultValue="login">
            <TabsList className="grid grid-cols-2 w-full"><TabsTrigger value="login">Login</TabsTrigger><TabsTrigger value="signup">Sign up</TabsTrigger></TabsList>
            <TabsContent value="login" className="space-y-3 mt-5">
              <div><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
              <div><Label>Password</Label><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
              <Button className="w-full" onClick={handleLogin}>Sign In</Button>
              <p className="text-xs text-muted-foreground text-center">Admin credentials: kartikparmar.dev@gmail.com / Kartik12345</p>
            </TabsContent>
            <TabsContent value="signup" className="space-y-3 mt-5">
              <div className="flex justify-center">
                <div className="size-20 rounded-full bg-muted border-2 border-dashed grid place-items-center text-muted-foreground"><Camera className="size-6" /></div>
              </div>
              <div><Label>First Name</Label><Input value={signup.firstName} onChange={(e) => setSignup({ ...signup, firstName: e.target.value })} /></div>
              <div><Label>Email Address</Label><Input type="email" value={signup.email} onChange={(e) => setSignup({ ...signup, email: e.target.value })} /></div>
              <div><Label>Phone Number</Label><Input value={signup.phone} onChange={(e) => setSignup({ ...signup, phone: e.target.value })} /></div>
              <div>
                <Label>Role</Label>
                <Select value={signup.role} onValueChange={(v) => setSignup({ ...signup, role: v as Role })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Procurement Officer">Procurement Officer</SelectItem>
                    <SelectItem value="Vendor">Vendor</SelectItem>
                    <SelectItem value="Manager">Manager</SelectItem>
                    <SelectItem value="Admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Country</Label><Input value={signup.country} onChange={(e) => setSignup({ ...signup, country: e.target.value })} /></div>
              <div><Label>Additional Information</Label><Textarea value={signup.notes} onChange={(e) => setSignup({ ...signup, notes: e.target.value })} /></div>
              <Button className="w-full" onClick={() => {
                if (!signup.firstName || !signup.email) return toast.error("Please fill required fields");
                addProfile(signup);
                setRole(signup.role);
                toast.success("Account created");
                navigate({ to: "/" });
              }}>Register</Button>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
