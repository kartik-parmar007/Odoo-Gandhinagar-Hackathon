import { createFileRoute } from "@tanstack/react-router";
import { AppHeader } from "@/components/AppHeader";
import { useStore } from "@/lib/mock";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Printer, Mail } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/purchase-orders")({ component: POView });

function POView() {
  const { documents, quotations, vendors, rfqs, role, updateDocument, log } = useStore();
  const [selectedId, setSelectedId] = useState(documents[0]?.id ?? "");

  const doc = documents.find(d => d.id === selectedId) || documents[0];
  const q = quotations.find((x) => x.id === doc?.quotationId);
  const v = vendors.find((x) => x.id === doc?.vendorId);
  const rfq = rfqs.find((x) => x.id === q?.rfqId);
  
  const subtotal = q?.lines.reduce((s, l) => s + l.qty * l.unitPrice, 0) ?? 0;
  const cgst = subtotal * 0.09;
  const sgst = subtotal * 0.09;
  const grand = subtotal + cgst + sgst;

  const canMarkAsPaid = role === "Procurement Officer" || role === "Admin" || role === "Manager";

  return (
    <>
      <AppHeader title="Purchase Orders & Invoices" />
      <main className="p-6 grid lg:grid-cols-3 gap-4">
        {/* Left Side: PO Queue */}
        <Card className="p-4 space-y-2 lg:h-[calc(100vh-7rem)] h-[250px] overflow-y-auto">
          <h3 className="font-semibold mb-2">Purchase Orders</h3>
          {documents.map((d) => {
            const vend = vendors.find((x) => x.id === d.vendorId);
            return (
              <button
                key={d.id}
                onClick={() => setSelectedId(d.id)}
                className={cn(
                  "w-full text-left p-3 rounded-md border text-sm transition-colors",
                  selectedId === d.id ? "border-primary bg-primary/5" : "hover:bg-muted/40"
                )}
              >
                <div className="font-semibold">{d.poNumber}</div>
                <div className="text-xs text-muted-foreground mt-1 truncate">{vend?.name}</div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded">{d.date}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${d.status === "Paid" ? "bg-success/15 text-success" : "bg-warning/15 text-warning-foreground"}`}>{d.status}</span>
                </div>
              </button>
            );
          })}
        </Card>

        {/* Right Side: PO details */}
        <div className="lg:col-span-2 space-y-4">
          {doc ? (
            <>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h2 className="text-xl font-bold">{doc.poNumber}</h2>
                  <p className="text-sm text-muted-foreground">Auto-generated after approval · {doc.date}</p>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button variant="outline" size="sm" onClick={() => toast.success(`Invoice PDF for ${doc.poNumber} downloaded successfully!`)}><Download className="size-4" /> Download PDF</Button>
                  <Button variant="outline" size="sm" onClick={() => toast.success(`Document ${doc.poNumber} sent to printer`)}><Printer className="size-4" /> Print</Button>
                  <Button size="sm" onClick={() => toast.success(`PO ${doc.poNumber} emailed to ${v?.name}`)}><Mail className="size-4" /> Send via Email</Button>
                </div>
              </div>

              <Card className="p-8 max-w-4xl space-y-6">
                {/* Invoice Header */}
                <div className="flex justify-between mb-6 flex-wrap gap-4 border-b pb-6">
                  <div>
                    <div className="text-xs uppercase tracking-wider text-muted-foreground">Bill To (Client)</div>
                    <div className="font-bold text-lg mt-1 text-primary">VendorBridge Inc.</div>
                    <div className="text-sm text-muted-foreground mt-1 leading-relaxed">
                      123 Business Park, Ahmedabad<br />
                      Gujarat, India - 380009<br />
                      <strong>GSTIN:</strong> 24XXXXX9X8XZ8
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs uppercase tracking-wider text-muted-foreground">Vendor (Supplier)</div>
                    <div className="font-bold text-lg mt-1">{v?.name}</div>
                    <div className="text-sm text-muted-foreground mt-1 leading-relaxed">
                      {v?.contact}<br />
                      Category: {v?.category}<br />
                      <strong>GSTIN:</strong> {v?.gst}
                    </div>
                  </div>
                </div>

                {/* Metadata details */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm bg-muted/20 p-4 rounded-lg">
                  <div><span className="text-muted-foreground block text-xs uppercase">PO Number</span> <span className="font-mono font-semibold">{doc.poNumber}</span></div>
                  <div><span className="text-muted-foreground block text-xs uppercase">Issue Date</span> <span className="font-semibold">{doc.date}</span></div>
                  <div><span className="text-muted-foreground block text-xs uppercase">Linked RFQ</span> <span className="font-semibold">{rfq?.title || "N/A"}</span></div>
                </div>

                {/* Line Items */}
                <div className="border rounded-lg overflow-x-auto">
                  <table className="w-full text-sm min-w-[500px]">
                    <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                      <tr>
                        <th className="text-left p-3">Item Description</th>
                        <th className="text-left p-3 w-20">Qty</th>
                        <th className="text-left p-3 w-32">Unit Price</th>
                        <th className="text-right p-3 w-32">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {q?.lines.map((l, i) => (
                        <tr key={i} className="border-b last:border-b-0 hover:bg-muted/10">
                          <td className="p-3 font-medium">{l.item}</td>
                          <td className="p-3">{l.qty}</td>
                          <td className="p-3">₹{l.unitPrice.toLocaleString()}</td>
                          <td className="p-3 text-right font-medium">₹{(l.qty * l.unitPrice).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Totals Section */}
                <div className="flex justify-end pt-4">
                  <div className="w-80 space-y-2 text-sm bg-muted/10 p-4 rounded-lg">
                    <div className="flex justify-between"><span>Subtotal</span><span>₹{subtotal.toLocaleString()}</span></div>
                    <div className="flex justify-between text-muted-foreground"><span>CGST (9%)</span><span>₹{cgst.toLocaleString()}</span></div>
                    <div className="flex justify-between text-muted-foreground"><span>SGST (9%)</span><span>₹{sgst.toLocaleString()}</span></div>
                    <div className="flex justify-between font-bold text-base pt-2 border-t border-border/80 text-primary">
                      <span>Grand Total</span>
                      <span>₹{grand.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Status and Action bar */}
                <div className="pt-4 border-t flex justify-between items-center flex-wrap gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Payment Status:</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${doc.status === "Paid" ? "bg-success/15 text-success" : "bg-warning/15 text-warning-foreground"}`}>
                      {doc.status}
                    </span>
                  </div>
                  {doc.status !== "Paid" && (
                    <>
                      {canMarkAsPaid ? (
                        <Button
                          size="sm"
                          className="bg-success text-success-foreground hover:bg-success/90"
                          onClick={() => {
                            updateDocument(doc.id, { status: "Paid" });
                            log({ type: "po", message: `PO ${doc.poNumber} marked as PAID by ${role}` });
                            toast.success(`PO ${doc.poNumber} successfully marked as PAID!`);
                          }}
                        >
                          Mark as Paid
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">Only Procurement Officers/Managers/Admins can record payments</span>
                      )}
                    </>
                  )}
                </div>
              </Card>
            </>
          ) : (
            <div className="text-center py-12 text-muted-foreground">No purchase orders available.</div>
          )}
        </div>
      </main>
    </>
  );
}
