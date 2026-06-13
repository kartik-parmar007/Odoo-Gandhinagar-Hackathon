import { Link, useRouterState } from "@tanstack/react-router";
import {
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
import type { Role } from "@/lib/mock";
import { useStore } from "@/lib/mock";
import { cn } from "@/lib/utils";

type Item = { to: string; label: string; icon: typeof LayoutDashboard; roles: Role[] };

const ALL: Role[] = ["Procurement Officer", "Vendor", "Manager", "Admin"];

const ITEMS: Item[] = [
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

export function AppSidebar() {
  const { role } = useStore();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const items = ITEMS.filter((i) => i.roles.includes(role));

  return (
    <aside className="hidden md:flex w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
      {/* Logo */}
      <div className="px-4 py-4 flex items-center gap-3 border-b border-sidebar-border">
        <img
          src="/logo.png"
          alt="VendorBridge Logo"
          className="size-9 rounded-lg object-contain bg-white/10 p-0.5"
        />
        <div>
          <div className="font-bold text-base leading-none tracking-tight">VendorBridge</div>
          <div className="text-[10px] uppercase tracking-widest opacity-50 mt-1 font-medium">
            Procurement ERP
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] uppercase tracking-widest text-sidebar-foreground/40 font-semibold">
          Navigation
        </div>
        {items.map((i) => {
          const active = i.to === "/" ? pathname === "/" : pathname.startsWith(i.to);
          return (
            <Link
              key={i.to}
              to={i.to}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                active
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )}
            >
              <i.icon className="size-4 shrink-0" />
              <span>{i.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-sidebar-border">
        <div className="text-[10px] text-sidebar-foreground/30 px-2">
          VendorBridge v1.0 · © 2026
        </div>
      </div>
    </aside>
  );
}
