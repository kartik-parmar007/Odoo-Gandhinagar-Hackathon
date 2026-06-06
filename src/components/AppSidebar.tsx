import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, Users, FileText, FileCheck2, ShieldCheck, ShoppingCart, Receipt, BarChart3, Activity } from "lucide-react";
import type { Role } from "@/lib/mock";
import { useStore } from "@/lib/mock";
import { cn } from "@/lib/utils";

type Item = { to: string; label: string; icon: typeof LayoutDashboard; roles: Role[] };

const ALL: Role[] = ["Procurement Officer", "Vendor", "Manager", "Admin"];

const ITEMS: Item[] = [
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

export function AppSidebar() {
  const { role } = useStore();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const items = ITEMS.filter((i) => i.roles.includes(role));
  return (
    <aside className="hidden md:flex w-60 shrink-0 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
      <div className="px-5 py-5 flex items-center gap-2 border-b border-sidebar-border">
        <div className="size-8 rounded-md bg-sidebar-primary text-sidebar-primary-foreground grid place-items-center font-bold">V</div>
        <div>
          <div className="font-semibold leading-none">VendorBridge</div>
          <div className="text-[10px] uppercase tracking-wider opacity-60 mt-1">Procurement ERP</div>
        </div>
      </div>
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {items.map((i) => {
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
    </aside>
  );
}
