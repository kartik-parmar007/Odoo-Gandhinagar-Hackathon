import { createFileRoute } from "@tanstack/react-router";
import { AppHeader } from "@/components/AppHeader";
import { Card } from "@/components/ui/card";
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, Legend } from "recharts";
import { useStore } from "@/lib/mock";

export const Route = createFileRoute("/_app/reports")({ component: Reports });

const COLORS = ["#7C3AED", "#0EA5E9", "#F59E0B", "#10B981"];

const trend = [
  { m: "Dec", v: 180 }, { m: "Jan", v: 210 }, { m: "Feb", v: 165 },
  { m: "Mar", v: 240 }, { m: "Apr", v: 285 }, { m: "May", v: 320 },
];

function Reports() {
  const { documents, vendors, quotations } = useStore();

  // Dynamic calculations
  let totalSpend = 0;
  const categoryTotals: Record<string, number> = {};
  const vendorTotals: Record<string, { name: string; spend: number; pos: number }> = {};

  documents.forEach((d) => {
    const q = quotations.find((x) => x.id === d.quotationId);
    const subtotal = q?.lines.reduce((s, l) => s + l.qty * l.unitPrice, 0) ?? 0;
    const grand = subtotal * 1.18; // Subtotal + 18% GST

    totalSpend += grand;

    const v = vendors.find((x) => x.id === d.vendorId);
    if (v) {
      // Category aggregation
      categoryTotals[v.category] = (categoryTotals[v.category] || 0) + grand;

      // Vendor aggregation
      if (!vendorTotals[v.id]) {
        vendorTotals[v.id] = { name: v.name, spend: 0, pos: 0 };
      }
      vendorTotals[v.id].spend += grand;
      vendorTotals[v.id].pos += 1;
    }
  });

  const activeVendors = vendors.filter((v) => v.status === "Active").length;

  const spendByCategory = Object.keys(categoryTotals).map((cat) => ({
    name: cat,
    value: categoryTotals[cat],
  }));

  // Fallback if no documents loaded yet to keep UI visually appealing
  const finalSpendByCategory = spendByCategory.length > 0 ? spendByCategory : [
    { name: "Furniture", value: 217120 },
    { name: "IT Hardware", value: 320960 },
  ];

  const topVendors = Object.values(vendorTotals).sort((a, b) => b.spend - a.spend);
  const finalTopVendors = topVendors.length > 0 ? topVendors : [
    { name: "Infra Supplies Pvt Ltd", spend: 217120, pos: 1 },
  ];

  return (
    <>
      <AppHeader title="Reports & Analytics" />
      <main className="p-6 space-y-4">
        <div>
          <h2 className="text-xl font-semibold">Procurement Insights</h2>
          <p className="text-sm text-muted-foreground">Analytical reports across spend and vendors</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-5">
            <div className="text-xs text-muted-foreground">Total Spend (Calculated)</div>
            <div className="text-2xl font-bold mt-1">₹{totalSpend.toLocaleString()}</div>
          </Card>
          <Card className="p-5">
            <div className="text-xs text-muted-foreground">Active Vendors</div>
            <div className="text-2xl font-bold mt-1">{activeVendors}</div>
          </Card>
          <Card className="p-5">
            <div className="text-xs text-muted-foreground">Avg Approval Lead Time</div>
            <div className="text-2xl font-bold mt-1">2.1 days</div>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-4">
          <Card className="p-5">
            <h3 className="font-semibold mb-2">Spend by Category</h3>
            <div className="h-64">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={finalSpendByCategory} dataKey="value" nameKey="name" outerRadius={80} label>
                    {finalSpendByCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Legend />
                  <Tooltip formatter={(value) => `₹${Number(value).toLocaleString()}`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
          <Card className="p-5">
            <h3 className="font-semibold mb-2">Monthly Trend</h3>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={trend}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="m" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="v" fill="#7C3AED" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        <Card className="p-5">
          <h3 className="font-semibold mb-3">Top Vendors by Spend</h3>
          <table className="w-full text-sm">
            <thead className="text-xs text-muted-foreground border-b">
              <tr>
                <th className="text-left py-2">Vendor Name</th>
                <th className="text-left">Total Spend</th>
                <th className="text-left">Purchase Orders</th>
              </tr>
            </thead>
            <tbody>
              {finalTopVendors.map((v, i) => (
                <tr key={i} className="border-b last:border-b-0 hover:bg-muted/30">
                  <td className="py-3 font-medium">{v.name}</td>
                  <td>₹{v.spend.toLocaleString()}</td>
                  <td>{v.pos} POs</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </main>
    </>
  );
}
