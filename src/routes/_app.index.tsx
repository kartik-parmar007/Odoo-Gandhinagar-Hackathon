import { createFileRoute, Link } from "@tanstack/react-router";
import { AppHeader } from "@/components/AppHeader";
import { useStore } from "@/lib/mock";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Clock,
  DollarSign,
  ReceiptText,
  Plus,
  UserPlus,
  GitCompareArrows,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

export const Route = createFileRoute("/_app/")({ component: Dashboard });

function KPI({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof FileText;
  label: string;
  value: string;
  tone: string;
}) {
  return (
    <Card className="p-5 flex items-start gap-4 hover:shadow-md transition-shadow">
      <div className={`size-11 rounded-xl grid place-items-center shrink-0 ${tone}`}>
        <Icon className="size-5" />
      </div>
      <div>
        <div className="text-2xl font-bold tracking-tight">{value}</div>
        <div className="text-xs text-muted-foreground mt-1 font-medium">{label}</div>
      </div>
    </Card>
  );
}

const trend = [
  { m: "Jan", spend: 180 },
  { m: "Feb", spend: 210 },
  { m: "Mar", spend: 165 },
  { m: "Apr", spend: 240 },
  { m: "May", spend: 285 },
  { m: "Jun", spend: 230 },
];

function Dashboard() {
  const { rfqs, approvals, documents, vendors, quotations, role, currentProfile } = useStore();

  const activeRfqs = rfqs.filter((r) => r.status === "Open" || r.status === "Active").length;
  const pendingApprovals = approvals.filter(
    (a) => a.state === "Pending" || a.state === "Under Review",
  ).length;
  const totalInvoices = documents.length;
  const activeVendors = vendors.filter((v) => v.status === "Active").length;

  return (
    <>
      <AppHeader title="Dashboard" />
      <main className="p-6 space-y-6">
        <div>
          <h2 className="text-xl font-bold">
            Welcome back, {currentProfile?.firstName || role} 👋
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Here's your procurement overview for today
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPI
            icon={FileText}
            label="Active RFQs"
            value={String(activeRfqs)}
            tone="bg-info/10 text-info"
          />
          <KPI
            icon={Clock}
            label="Pending Approvals"
            value={String(pendingApprovals)}
            tone="bg-warning/10 text-warning-foreground"
          />
          <KPI
            icon={ReceiptText}
            label="Total Purchase Orders"
            value={String(totalInvoices)}
            tone="bg-primary/10 text-primary"
          />
          <KPI
            icon={UserPlus}
            label="Active Vendors"
            value={String(activeVendors)}
            tone="bg-success/10 text-success"
          />
        </div>

        <div className="grid lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2 p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold">Monthly Spend Trend</h3>
                <p className="text-xs text-muted-foreground">Last 6 months · in ₹K</p>
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer>
                <AreaChart data={trend}>
                  <defs>
                    <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="m" fontSize={12} />
                  <YAxis fontSize={12} tickFormatter={(v) => `₹${v}K`} />
                  <Tooltip formatter={(v) => [`₹${v}K`, "Spend"]} />
                  <Area
                    type="monotone"
                    dataKey="spend"
                    stroke="var(--color-primary)"
                    fill="url(#g)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
          <Card className="p-5 space-y-2">
            <h3 className="font-semibold mb-3">Quick Actions</h3>
            <Button asChild className="w-full justify-start">
              <Link to="/rfqs">
                <Plus className="size-4" /> Create New RFQ
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link to="/vendors">
                <UserPlus className="size-4" /> Add Vendor
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link to="/quotation-comparison">
                <GitCompareArrows className="size-4" /> Compare Quotations
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link to="/reports">
                <DollarSign className="size-4" /> View Reports
              </Link>
            </Button>
          </Card>
        </div>

        <Card className="p-5">
          <h3 className="font-semibold mb-3">Recent Purchase Orders</h3>
          <div className="overflow-x-auto -mx-5 px-5">
            <table className="w-full text-sm min-w-[500px]">
              <thead className="text-xs text-muted-foreground border-b">
                <tr>
                  <th className="text-left py-2 font-medium">PO #</th>
                  <th className="text-left font-medium">Vendor</th>
                  <th className="text-left font-medium">Amount (incl. GST)</th>
                  <th className="text-left font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {documents.slice(0, 5).map((d) => {
                  const q = quotations.find((x) => x.id === d.quotationId);
                  const v =
                    vendors.find((x) => x.id === d.vendorId) ||
                    vendors.find((x) => x.id === q?.vendorId);
                  const subtotal = q?.lines.reduce((s, l) => s + l.qty * l.unitPrice, 0) ?? 0;
                  const total = subtotal * 1.18;
                  return (
                    <tr
                      key={d.id}
                      className="border-b last:border-b-0 hover:bg-muted/20 transition-colors"
                    >
                      <td className="py-2.5 font-mono text-xs font-semibold text-primary">
                        {d.poNumber}
                      </td>
                      <td className="font-medium">{v?.name || "—"}</td>
                      <td className="font-semibold">
                        {total > 0
                          ? `₹${total.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`
                          : "—"}
                      </td>
                      <td>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${d.status === "Paid" ? "bg-success/15 text-success" : "bg-warning/15 text-warning-foreground"}`}
                        >
                          {d.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </main>
    </>
  );
}
