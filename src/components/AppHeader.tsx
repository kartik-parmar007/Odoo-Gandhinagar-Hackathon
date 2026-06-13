import { useState, useEffect } from "react";
import { useStore, type Role } from "@/lib/mock";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Bell,
  UserCircle2,
  Menu,
  LayoutDashboard,
  Users,
  FileText,
  FileCheck2,
  ShieldCheck,
  ShoppingCart,
  Receipt,
  BarChart3,
  Activity,
  GitCompareArrows,
} from "lucide-react";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const ROLES: Role[] = ["Procurement Officer", "Vendor", "Manager", "Admin"];
const ALL: Role[] = ["Procurement Officer", "Vendor", "Manager", "Admin"];

const NAV_ITEMS = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, roles: ALL },
  {
    to: "/vendors",
    label: "Vendors",
    icon: Users,
    roles: ["Procurement Officer", "Admin", "Manager"],
  },
  { to: "/rfqs", label: "RFQs", icon: FileText, roles: ALL },
  { to: "/quotations", label: "Quotations", icon: FileCheck2, roles: ALL },
  {
    to: "/quotation-comparison",
    label: "Compare Quotes",
    icon: GitCompareArrows,
    roles: ["Procurement Officer", "Manager", "Admin"],
  },
  { to: "/approvals", label: "Approvals", icon: ShieldCheck, roles: ["Manager", "Admin"] },
  {
    to: "/purchase-orders",
    label: "Purchase Orders",
    icon: ShoppingCart,
    roles: ["Procurement Officer", "Vendor", "Admin"],
  },
  {
    to: "/invoices",
    label: "Invoices",
    icon: Receipt,
    roles: ["Procurement Officer", "Vendor", "Admin"],
  },
  {
    to: "/reports",
    label: "Reports",
    icon: BarChart3,
    roles: ["Procurement Officer", "Manager", "Admin"],
  },
  { to: "/activity", label: "Activity & Logs", icon: Activity, roles: ALL },
];

export function AppHeader({ title }: { title: string }) {
  const { role, setRole, currentProfile, setCurrentProfile, logs } = useStore();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const [lastReadTime, setLastReadTime] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("vendorbridge_notifications_read_time");
      return saved ? Number(saved) : 0;
    }
    return 0;
  });

  const [clearedLogIds, setClearedLogIds] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("vendorbridge_cleared_notifications");
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  const visibleLogs = logs.filter((log) => !clearedLogIds.includes(log.id));
  const hasUnread = visibleLogs.some((log) => new Date(log.timestamp).getTime() > lastReadTime);

  const handleClearAll = () => {
    const allLogIds = logs.map((l) => l.id);
    setClearedLogIds(allLogIds);
    localStorage.setItem("vendorbridge_cleared_notifications", JSON.stringify(allLogIds));
    toast.success("Notifications cleared");
  };

  return (
    <header className="h-14 border-b bg-card flex items-center justify-between px-6 sticky top-0 z-20">
      <div className="flex items-center">
        <Sheet>
          <SheetTrigger asChild>
            <button
              className="md:hidden p-2 rounded-md hover:bg-muted mr-2 cursor-pointer"
              aria-label="Open menu"
            >
              <Menu className="size-5" />
            </button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="w-64 p-0 flex flex-col bg-sidebar border-r border-sidebar-border text-sidebar-foreground"
          >
            <div className="px-4 py-4 flex items-center gap-3 border-b border-sidebar-border">
              <img
                src="/logo.png"
                alt="VendorBridge"
                className="size-9 rounded-lg object-contain bg-white/10 p-0.5"
              />
              <div>
                <div className="font-bold text-base leading-none tracking-tight">VendorBridge</div>
                <div className="text-[10px] uppercase tracking-widest opacity-50 mt-1 font-medium">
                  Procurement ERP
                </div>
              </div>
            </div>
            <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
              {NAV_ITEMS.filter((item) => item.roles.includes(role)).map((i) => {
                const active = i.to === "/" ? pathname === "/" : pathname.startsWith(i.to);
                return (
                  <Link
                    key={i.to}
                    to={i.to}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                      active
                        ? "bg-sidebar-primary text-sidebar-primary-foreground"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent",
                    )}
                  >
                    <i.icon className="size-4" />
                    <span>{i.label}</span>
                  </Link>
                );
              })}
            </nav>
            <div className="p-3 border-t border-sidebar-border text-[10px] text-sidebar-foreground/30 px-4">
              VendorBridge v1.0 · © 2026
            </div>
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
            {ROLES.map((r) => (
              <SelectItem key={r} value={r}>
                {r}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Popover
          onOpenChange={(open) => {
            if (open) {
              const nowTime = Date.now();
              setLastReadTime(nowTime);
              localStorage.setItem("vendorbridge_notifications_read_time", String(nowTime));
            }
          }}
        >
          <PopoverTrigger asChild>
            <button
              className="size-9 grid place-items-center rounded-md hover:bg-muted relative cursor-pointer"
              aria-label="Notifications"
            >
              <Bell className="size-4" />
              {hasUnread && (
                <span className="absolute top-1.5 right-1.5 size-2 bg-destructive rounded-full animate-pulse" />
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 p-0 shadow-lg border">
            <div className="px-4 py-3 border-b flex justify-between items-center bg-muted/40">
              <span className="font-semibold text-sm">Notifications</span>
              <div className="flex items-center gap-2">
                {visibleLogs.length > 0 && (
                  <button
                    onClick={handleClearAll}
                    className="text-[10px] text-muted-foreground hover:text-foreground underline cursor-pointer"
                  >
                    Clear All
                  </button>
                )}
                <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-medium">
                  {visibleLogs.length} events
                </span>
              </div>
            </div>
            <div className="max-h-[300px] overflow-y-auto divide-y">
              {visibleLogs.length === 0 ? (
                <div className="p-8 text-center text-xs text-muted-foreground">
                  No new notifications
                </div>
              ) : (
                visibleLogs.slice(0, 10).map((log) => (
                  <div key={log.id} className="p-3 text-xs hover:bg-muted/30 transition-colors">
                    <p className="text-foreground leading-relaxed">{log.message}</p>
                    <span className="text-[10px] text-muted-foreground mt-1 block">
                      {new Date(log.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                ))
              )}
            </div>
          </PopoverContent>
        </Popover>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="size-9 grid place-items-center rounded-full bg-primary text-primary-foreground hover:opacity-90 outline-none transition-opacity cursor-pointer overflow-hidden">
              {currentProfile?.avatar ? (
                <img src={currentProfile.avatar} className="size-full object-cover" alt="Profile" />
              ) : (
                <UserCircle2 className="size-5" />
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64 p-3 space-y-2">
            <DropdownMenuLabel className="font-semibold text-sm">User Profile</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {currentProfile?.avatar && (
              <div className="flex justify-center py-2">
                <img
                  src={currentProfile.avatar}
                  className="size-16 rounded-full object-cover border animate-fade-in"
                  alt="Avatar"
                />
              </div>
            )}
            <div className="text-xs space-y-1.5 bg-muted/40 p-2.5 rounded-md">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Name:</span>
                <span className="font-semibold text-foreground">
                  {currentProfile?.firstName || "Akshat"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email:</span>
                <span className="font-mono text-[10px] text-foreground">
                  {currentProfile?.email || "akshat@vendorbridge.app"}
                </span>
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
