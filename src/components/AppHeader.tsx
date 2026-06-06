import { useStore, type Role } from "@/lib/mock";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bell, UserCircle2, Menu, LayoutDashboard, Users, FileText, FileCheck2, ShieldCheck, ShoppingCart, Receipt, BarChart3, Activity } from "lucide-react";
import { useNavigate, useRouterState, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const ROLES: Role[] = ["Procurement Officer", "Vendor", "Manager", "Admin"];
const ALL: Role[] = ["Procurement Officer", "Vendor", "Manager", "Admin"];

const NAV_ITEMS = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, roles: ALL },
  { to: "/vendors", label: "Vendors", icon: Users, roles: ["Procurement Officer", "Admin", "Manager"] },
  { to: "/rfqs", label: "RFQs", icon: FileText, roles: ALL },
  { to: "/quotations", label: "Quotations", icon: FileCheck2, roles: ALL },
  { to: "/approvals", label: "Approvals", icon: ShieldCheck, roles: ["Manager", "Admin"] },
  { to: "/purchase-orders", label: "Purchase Orders", icon: ShoppingCart, roles: ["Procurement Officer", "Vendor", "Admin"] },
  { to: "/invoices", label: "Invoices", icon: Receipt, roles: ["Procurement Officer", "Vendor", "Admin"] },
  { to: "/reports", label: "Reports", icon: BarChart3, roles: ["Procurement Officer", "Manager", "Admin"] },
  { to: "/activity", label: "Activity", icon: Activity, roles: ALL },
];

export function AppHeader({ title }: { title: string }) {
  const { role, setRole, currentProfile, setCurrentProfile } = useStore();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <header className="h-14 border-b bg-card flex items-center justify-between px-6 sticky top-0 z-20">
      <div className="flex items-center">
        <Sheet>
          <SheetTrigger asChild>
            <button className="md:hidden p-2 rounded-md hover:bg-muted mr-2 cursor-pointer" aria-label="Open menu">
              <Menu className="size-5" />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="w-60 p-0 flex flex-col bg-sidebar border-r border-sidebar-border text-sidebar-foreground">
            <div className="px-5 py-5 flex items-center gap-2 border-b border-sidebar-border">
              <div className="size-8 rounded-md bg-sidebar-primary text-sidebar-primary-foreground grid place-items-center font-bold">V</div>
              <div>
                <div className="font-semibold leading-none">VendorBridge</div>
                <div className="text-[10px] uppercase tracking-wider opacity-60 mt-1">Procurement ERP</div>
              </div>
            </div>
            <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
              {NAV_ITEMS.filter(item => item.roles.includes(role)).map((i) => {
                const active = i.to === "/" ? pathname === "/" : pathname.startsWith(i.to);
                return (
                  <Link key={i.to} to={i.to} className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                    active ? "bg-sidebar-primary text-sidebar-primary-foreground" : "hover:bg-sidebar-accent"
                  )}>
                    <i.icon className="size-4" />
                    <span>{i.label}</span>
                  </Link>
                );
              })}
            </nav>
            <div className="p-4 text-[11px] opacity-60 border-t border-sidebar-border">v1.0 · Mock mode</div>
          </SheetContent>
        </Sheet>
        <h1 className="text-lg font-semibold">{title}</h1>
      </div>
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
          <span>View as</span>
        </div>
        <Select value={role} onValueChange={(v) => setRole(v as Role)}>
          <SelectTrigger className="w-[200px] h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
          </SelectContent>
        </Select>
        <button className="size-9 grid place-items-center rounded-md hover:bg-muted" aria-label="Notifications">
          <Bell className="size-4" />
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="size-9 grid place-items-center rounded-full bg-primary text-primary-foreground hover:opacity-90 outline-none transition-opacity cursor-pointer">
              <UserCircle2 className="size-5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64 p-3 space-y-2">
            <DropdownMenuLabel className="font-semibold text-sm">User Profile</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="text-xs space-y-1.5 bg-muted/40 p-2.5 rounded-md">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Name:</span>
                <span className="font-semibold text-foreground">{currentProfile?.firstName || "Akshat"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email:</span>
                <span className="font-mono text-[10px] text-foreground">{currentProfile?.email || "akshat@vendorbridge.app"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Active Role:</span>
                <span className="font-semibold text-primary">{role}</span>
              </div>
              {currentProfile?.phone && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Phone:</span>
                  <span className="text-foreground">{currentProfile.phone}</span>
                </div>
              )}
              {currentProfile?.country && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Country:</span>
                  <span className="text-foreground">{currentProfile.country}</span>
                </div>
              )}
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <button 
                onClick={() => {
                  setCurrentProfile(null);
                  toast.success("Signed out successfully");
                  navigate({ to: "/auth" });
                }} 
                className="w-full text-left text-destructive font-medium cursor-pointer"
              >
                Sign Out / Switch Profile
              </button>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
