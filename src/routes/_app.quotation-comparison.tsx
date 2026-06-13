import { createFileRoute } from "@tanstack/react-router";
import { AppHeader } from "@/components/AppHeader";
import { useStore } from "@/lib/mock";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { Trophy, Clock, DollarSign, Star, TrendingDown, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/quotation-comparison")({
  component: QuotationComparison,
});

function QuotationComparison() {
  const { rfqs, quotations, vendors, approvals, updateApproval, log, role } = useStore();
  const [selectedRfqId, setSelectedRfqId] = useState(rfqs[0]?.id ?? "");

  const rfqQuotations = quotations.filter((q) => q.rfqId === selectedRfqId);
  const selectedRfq = rfqs.find((r) => r.id === selectedRfqId);

  // Calculate totals for comparison
  const quoteData = rfqQuotations.map((q) => {
    const v = vendors.find((x) => x.id === q.vendorId);
    const subtotal = q.lines.reduce((s, l) => s + l.qty * l.unitPrice, 0);
    const gst = subtotal * 0.18;
    const total = subtotal + gst;
    return { quotation: q, vendor: v, subtotal, gst, total };
  });

  const lowestTotal = Math.min(...quoteData.map((d) => d.total));
  const fastestDelivery = Math.min(...quoteData.map((d) => d.quotation.deliveryDays));

  const canSelect = role === "Manager" || role === "Admin" || role === "Procurement Officer";

  const handleSelectQuotation = (quotationId: string) => {
    if (!canSelect) {
      toast.error("You don't have permission to select a quotation.");
      return;
    }
    const existing = approvals.find((a) => a.quotationId === quotationId);
    if (existing) {
      updateApproval(existing.id, {
        state: "Approved",
        remarks: "Selected via Quotation Comparison",
      });
    }
    log({
      type: "approval",
      message: `Quotation selected via comparison for RFQ: ${selectedRfq?.title}`,
    });
    toast.success("Quotation marked as Selected and sent for approval!");
  };

  return (
    <>
      <AppHeader title="Quotation Comparison" />
      <main className="p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-end gap-4">
          <div className="flex-1">
            <h2 className="text-xl font-semibold">Compare Quotations</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Side-by-side vendor analysis for a selected RFQ
            </p>
          </div>
          <div className="flex items-center gap-2 min-w-[300px]">
            <label className="text-sm text-muted-foreground whitespace-nowrap">Select RFQ:</label>
            <Select value={selectedRfqId} onValueChange={setSelectedRfqId}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Choose RFQ..." />
              </SelectTrigger>
              <SelectContent>
                {rfqs.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {selectedRfq && (
          <Card className="p-4 bg-primary/5 border-primary/20">
            <div className="flex flex-wrap gap-4 text-sm">
              <div>
                <span className="text-muted-foreground text-xs uppercase tracking-wide block">
                  RFQ
                </span>
                <span className="font-semibold">{selectedRfq.title}</span>
              </div>
              <div>
                <span className="text-muted-foreground text-xs uppercase tracking-wide block">
                  Category
                </span>
                <span className="font-semibold">{selectedRfq.category}</span>
              </div>
              <div>
                <span className="text-muted-foreground text-xs uppercase tracking-wide block">
                  Deadline
                </span>
                <span className="font-semibold">{selectedRfq.deadline}</span>
              </div>
              <div>
                <span className="text-muted-foreground text-xs uppercase tracking-wide block">
                  Quotations Received
                </span>
                <span className="font-semibold">{rfqQuotations.length}</span>
              </div>
            </div>
          </Card>
        )}

        {quoteData.length === 0 ? (
          <Card className="p-12 text-center text-muted-foreground">
            <DollarSign className="size-10 mx-auto mb-3 opacity-20" />
            <p className="font-medium">No quotations received for this RFQ yet.</p>
            <p className="text-xs mt-1">Quotations submitted by vendors will appear here.</p>
          </Card>
        ) : (
          <>
            {/* Summary badges */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Card className="p-4 flex items-center gap-3 border-success/30 bg-success/5">
                <TrendingDown className="size-8 text-success shrink-0" />
                <div>
                  <div className="text-xs text-muted-foreground">Lowest Bid (incl. 18% GST)</div>
                  <div className="font-bold text-success text-lg">
                    ₹{lowestTotal.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                  </div>
                </div>
              </Card>
              <Card className="p-4 flex items-center gap-3 border-info/30 bg-info/5">
                <Clock className="size-8 text-info shrink-0" />
                <div>
                  <div className="text-xs text-muted-foreground">Fastest Delivery</div>
                  <div className="font-bold text-info text-lg">{fastestDelivery} days</div>
                </div>
              </Card>
              <Card className="p-4 flex items-center gap-3 border-warning/30 bg-warning/5">
                <Star className="size-8 text-warning-foreground shrink-0" />
                <div>
                  <div className="text-xs text-muted-foreground">Top Rated Vendor</div>
                  <div className="font-bold text-warning-foreground text-lg">
                    {quoteData
                      .sort((a, b) => (b.vendor?.rating ?? 0) - (a.vendor?.rating ?? 0))[0]
                      ?.vendor?.name?.split(" ")
                      .slice(0, 2)
                      .join(" ") ?? "—"}
                  </div>
                </div>
              </Card>
            </div>

            {/* Comparison cards */}
            <div
              className={cn(
                "grid gap-4",
                quoteData.length === 1
                  ? "grid-cols-1 max-w-sm"
                  : quoteData.length === 2
                    ? "grid-cols-1 md:grid-cols-2"
                    : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
              )}
            >
              {quoteData.map(({ quotation, vendor, subtotal, gst, total }) => {
                const isLowest = total === lowestTotal;
                const isFastest = quotation.deliveryDays === fastestDelivery;
                const isSelected = quotation.status === "Selected";

                return (
                  <Card
                    key={quotation.id}
                    className={cn(
                      "p-5 space-y-4 relative transition-shadow",
                      isLowest && "border-success/50 shadow-success/10 shadow-md",
                      isSelected && "ring-2 ring-primary",
                    )}
                  >
                    {isLowest && (
                      <div className="absolute -top-3 left-4">
                        <span className="bg-success text-success-foreground text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Trophy className="size-2.5" /> BEST PRICE
                        </span>
                      </div>
                    )}
                    {isSelected && (
                      <div className="absolute -top-3 right-4">
                        <span className="bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle2 className="size-2.5" /> SELECTED
                        </span>
                      </div>
                    )}

                    {/* Vendor info */}
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-semibold">{vendor?.name ?? "Unknown Vendor"}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {vendor?.category}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-warning-foreground text-xs font-semibold bg-warning/10 px-2 py-1 rounded-md">
                        <Star className="size-3 fill-current" />
                        {vendor?.rating?.toFixed(1)}
                      </div>
                    </div>

                    {/* Line items */}
                    <div className="border rounded-md overflow-hidden">
                      <table className="w-full text-xs">
                        <thead className="bg-muted/50">
                          <tr>
                            <th className="text-left p-2 text-muted-foreground">Item</th>
                            <th className="text-right p-2 text-muted-foreground">Qty</th>
                            <th className="text-right p-2 text-muted-foreground">Unit ₹</th>
                            <th className="text-right p-2 text-muted-foreground">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {quotation.lines.map((l, i) => (
                            <tr key={i} className="hover:bg-muted/10">
                              <td className="p-2 font-medium">{l.item}</td>
                              <td className="p-2 text-right">{l.qty}</td>
                              <td className="p-2 text-right">
                                ₹{l.unitPrice.toLocaleString("en-IN")}
                              </td>
                              <td className="p-2 text-right font-semibold">
                                ₹{(l.qty * l.unitPrice).toLocaleString("en-IN")}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Totals */}
                    <div className="space-y-1 text-xs bg-muted/20 p-3 rounded-md">
                      <div className="flex justify-between text-muted-foreground">
                        <span>Subtotal</span>
                        <span>₹{subtotal.toLocaleString("en-IN")}</span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>GST (18%)</span>
                        <span>₹{gst.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</span>
                      </div>
                      <div className="flex justify-between font-bold text-sm pt-1 border-t border-border/50 text-primary">
                        <span>Grand Total</span>
                        <span>₹{total.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</span>
                      </div>
                    </div>

                    {/* Delivery & badges */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Clock className="size-3.5 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          Delivery in{" "}
                          <strong className={cn(isFastest && "text-info")}>
                            {quotation.deliveryDays} days
                          </strong>
                        </span>
                        {isFastest && (
                          <Badge
                            variant="outline"
                            className="text-[9px] border-info/30 text-info bg-info/5 px-1 py-0"
                          >
                            Fastest
                          </Badge>
                        )}
                      </div>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px]",
                          quotation.status === "Selected"
                            ? "border-primary/30 text-primary bg-primary/5"
                            : quotation.status === "Rejected"
                              ? "border-destructive/30 text-destructive"
                              : "border-muted text-muted-foreground",
                        )}
                      >
                        {quotation.status}
                      </Badge>
                    </div>

                    {quotation.notes && (
                      <p className="text-[11px] text-muted-foreground italic border-l-2 border-border pl-2">
                        "{quotation.notes}"
                      </p>
                    )}

                    {canSelect && quotation.status !== "Selected" && (
                      <Button
                        size="sm"
                        className="w-full"
                        onClick={() => handleSelectQuotation(quotation.id)}
                      >
                        Select This Quotation
                      </Button>
                    )}
                  </Card>
                );
              })}
            </div>
          </>
        )}
      </main>
    </>
  );
}
