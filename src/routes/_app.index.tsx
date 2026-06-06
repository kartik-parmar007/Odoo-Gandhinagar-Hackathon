import { createFileRoute, Link } from "@tanstack/react-router";
import { AppHeader } from "@/components/AppHeader";
import { useStore } from "@/lib/mock";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Clock, DollarSign, ReceiptText, Plus, UserPlus } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

export const Route = createFileRoute("/_app/")({ component: Dashboard });

function KPI({ icon: Icon, label, value, tone }: { icon: typeof FileText; label: string; value: string; tone: string }) {
  return (
    <Card className="p-5 flex items-start gap-4">
      <div className={`size-11 rounded-lg grid place-items-center ${tone}`}><Icon className="size-5" /></div>
      <div>
        <div className="text-2xl font-bold">{value}</div>
        <div className="text-xs text-muted-foreground mt-1">{label}</div>
      </div>
    </Card>
  );
}

const trend = [
  { m: "Jan", spend: 180 }, { m: "Feb", spend: 210 }, { m: "Mar", spend: 165 },
  { m: "Apr", spend: 240 }, { m: "May", spend: 285 }, { m: "Jun", spend: 230 },
];

function Dashboard() {
  const { rfqs, approvals, documents, vendors, role } = useStore();
  
  const activeRfqs = rfqs.filter((r) => r.status === "Open" || r.status === "Active").length;
  const pendingApprovals = approvals.filter((a) => a.state === "Pending" || a.state === "Under Review").length;
  const totalInvoices = documents.length;
  const activeVendors = vendors.filter((v) => v.status === "Active").length;

  return (
    <>
      <AppHeader title="Dashboard" />
      <main className="p-6 space-y-6">
        <div>
          <h2 className="text-xl font-semibold">Welcome back, {role}</h2>
          <p className="text-sm text-muted-foreground">Today's procurement overview</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPI icon={FileText} label="Active RFQs" value={String(activeRfqs)} tone="bg-info/10 text-info" />
          <KPI icon={Clock} label="Pending Approvals" value={String(pendingApprovals)} tone="bg-warning/10 text-warning-foreground" />
          <KPI icon={ReceiptText} label="Total System Invoices" value={String(totalInvoices)} tone="bg-primary/10 text-primary" />
          <KPI icon={UserPlus} label="Active Vendor Count" value={String(activeVendors)} tone="bg-success/10 text-success" />
        </div>

        <div className="grid lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2 p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold">Monthly Spend Trend</h3>
                <p className="text-xs text-muted-foreground">Last 6 months · in $K</p>
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
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Area type="monotone" dataKey="spend" stroke="var(--color-primary)" fill="url(#g)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
          <Card className="p-5 space-y-3">
            <h3 className="font-semibold">Quick Actions</h3>
            <Button asChild className="w-full justify-start"><Link to="/rfqs"><Plus className="size-4" /> Create New RFQ</Link></Button>
            <Button asChild variant="outline" className="w-full justify-start"><Link to="/vendors"><UserPlus className="size-4" /> Add Vendor</Link></Button>
            <Button asChild variant="outline" className="w-full justify-start"><Link to="/quotations"><FileText className="size-4" /> View Quotations</Link></Button>
            <Button asChild variant="outline" className="w-full justify-start"><Link to="/reports"><DollarSign className="size-4" /> View Reports</Link></Button>
          </Card>
        </div>

        <Card className="p-5">
          <h3 className="font-semibold mb-3">Recent Purchase Orders</h3>
          <table className="w-full text-sm">
            <thead className="text-xs text-muted-foreground border-b">
              <tr><th className="text-left py-2">PO #</th><th className="text-left">Vendor</th><th className="text-left">Amount</th><th className="text-left">Status</th></tr>
            </thead>
            <tbody>
              <tr className="border-b"><td className="py-2">PO-2026-0061</td><td>Infra Supplies Pvt Ltd</td><td>₹1,84,000</td><td><span className="px-2 py-0.5 rounded-full bg-warning/15 text-xs">Pending Payment</span></td></tr>
              <tr className="border-b"><td className="py-2">PO-2026-0060</td><td>TechCore Ltd</td><td>₹1,50,000</td><td><span className="px-2 py-0.5 rounded-full bg-success/15 text-xs">Paid</span></td></tr>
              <tr><td className="py-2">PO-2026-0059</td><td>FastLog Logistics</td><td>₹54,000</td><td><span className="px-2 py-0.5 rounded-full bg-muted text-xs">Draft</span></td></tr>
            </tbody>
          </table>
        </Card>
      </main>
    </>
  );
}
