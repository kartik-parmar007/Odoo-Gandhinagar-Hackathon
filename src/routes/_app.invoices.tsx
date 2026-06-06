import { createFileRoute, Link } from "@tanstack/react-router";
import { AppHeader } from "@/components/AppHeader";
import { useStore } from "@/lib/mock";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText } from "lucide-react";

export const Route = createFileRoute("/_app/invoices")({ component: Invoices });

function Invoices() {
  const { documents, vendors, quotations } = useStore();

  return (
    <>
      <AppHeader title="Invoices" />
      <main className="p-6 space-y-4">
        <div>
          <h2 className="text-xl font-semibold">Generated Invoices</h2>
          <p className="text-sm text-muted-foreground">All purchase orders with invoice details</p>
        </div>
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr className="text-xs text-muted-foreground uppercase tracking-wide">
                  <th className="text-left px-5 py-3">Invoice / PO #</th>
                  <th className="text-left px-4 py-3">Vendor</th>
                  <th className="text-left px-4 py-3">Category</th>
                  <th className="text-right px-4 py-3">Amount (excl. GST)</th>
                  <th className="text-left px-4 py-3">Issue Date</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {documents.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-muted-foreground">
                      <FileText className="size-8 mx-auto mb-2 opacity-30" />
                      No invoices generated yet.
                    </td>
                  </tr>
                )}
                {documents.map((d) => {
                  // Look up vendor: first from vendorId on doc, then via quotation
                  const q = quotations.find((x) => x.id === d.quotationId);
                  const v = vendors.find((x) => x.id === d.vendorId) || vendors.find((x) => x.id === q?.vendorId);
                  const subtotal = q?.lines.reduce((s, l) => s + l.qty * l.unitPrice, 0) ?? 0;
                  return (
                    <tr key={d.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-5 py-3 font-mono text-xs font-semibold text-primary">{d.poNumber}</td>
                      <td className="px-4 py-3 font-medium">{v?.name || "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{v?.category || "—"}</td>
                      <td className="px-4 py-3 text-right font-semibold">
                        {subtotal > 0 ? `₹${subtotal.toLocaleString("en-IN")}` : "—"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{d.date}</td>
                      <td className="px-4 py-3">
                        <Badge
                          variant="outline"
                          className={
                            d.status === "Paid"
                              ? "bg-success/10 text-success border-success/20"
                              : "bg-warning/10 text-warning-foreground border-warning/20"
                          }
                        >
                          {d.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          to="/purchase-orders"
                          className="text-primary text-xs font-medium hover:underline"
                        >
                          View PO →
                        </Link>
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
