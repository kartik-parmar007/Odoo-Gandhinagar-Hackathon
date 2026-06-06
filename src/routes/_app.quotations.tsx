import { createFileRoute } from "@tanstack/react-router";
import { AppHeader } from "@/components/AppHeader";
import { useStore } from "@/lib/mock";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Star, Send, Trophy } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/quotations")({ component: Quotations });

function Quotations() {
  const { role } = useStore();
  const isVendor = role === "Vendor";

  return (
    <>
      <AppHeader title="Quotations" />
      <main className="p-6 space-y-4">
        <Tabs defaultValue={isVendor ? "submit" : "compare"}>
          <TabsList>
            {!isVendor && <TabsTrigger value="compare">Comparison Matrix</TabsTrigger>}
            <TabsTrigger value="submit">{isVendor ? "Submit Bid" : "Submit Quotation (Demo)"}</TabsTrigger>
          </TabsList>
          {!isVendor && <TabsContent value="compare" className="mt-4"><CompareView /></TabsContent>}
          <TabsContent value="submit" className="mt-4"><SubmitView /></TabsContent>
        </Tabs>
      </main>
    </>
  );
}

function SubmitView() {
  const { rfqs, addQuotation, log, vendors, role } = useStore();
  const [rfqId, setRfqId] = useState(rfqs[0]?.id ?? "");
  const [vendorId, setVendorId] = useState(vendors[0]?.id ?? "v1");
  const rfq = rfqs.find(r => r.id === rfqId);
  const [lines, setLines] = useState(rfq?.items.map(i => ({ item: i.name, qty: i.qty, unitPrice: 0 })) ?? []);
  const [days, setDays] = useState(7);
  const [notes, setNotes] = useState("");

  const total = lines.reduce((s, l) => s + l.qty * l.unitPrice, 0);
  const gst = total * 0.18;

  const onRfqChange = (id: string) => {
    setRfqId(id);
    const r = rfqs.find(x => x.id === id);
    setLines(r?.items.map(i => ({ item: i.name, qty: i.qty, unitPrice: 0 })) ?? []);
  };

  const submit = () => {
    if (!rfqId) return toast.error("Please select an RFQ");
    if (lines.some(l => l.unitPrice <= 0)) return toast.error("Please enter a unit price for all items");
    
    addQuotation({ rfqId, vendorId, lines, deliveryDays: days, notes });
    const activeVendor = vendors.find(v => v.id === vendorId);
    log({ type: "quotation", message: `Quotation submitted by ${activeVendor?.name || "Vendor"} for ${rfq?.title}` });
    toast.success("Quotation submitted successfully");
    setNotes("");
  };

  return (
    <Card className="p-6 space-y-4">
      <h3 className="font-semibold">Submit Quotation</h3>
      
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <Label>Active RFQ</Label>
          <select className="w-full h-9 rounded-md border bg-background px-3 text-sm" value={rfqId} onChange={(e) => onRfqChange(e.target.value)}>
            {rfqs.map(r => <option key={r.id} value={r.id}>{r.title} · deadline {r.deadline}</option>)}
          </select>
        </div>

        <div>
          <Label>Submit As (Simulated Vendor)</Label>
          <select className="w-full h-9 rounded-md border bg-background px-3 text-sm" value={vendorId} onChange={(e) => setVendorId(e.target.value)}>
            {vendors.map(v => <option key={v.id} value={v.id}>{v.name} ({v.category})</option>)}
          </select>
        </div>
      </div>

      {rfq && (
        <div className="bg-muted/40 p-3 rounded-md text-sm">
          <div className="font-medium">RFQ Summary</div>
          <div className="text-muted-foreground text-xs mt-1">{rfq.items.map(i => `${i.name} ×${i.qty}`).join(" · ")} — {rfq.category}</div>
        </div>
      )}

      <div>
        <Label>Your Quotation Lines</Label>
        <div className="border rounded-md overflow-x-auto mt-2">
          <table className="w-full text-sm min-w-[500px]">
            <thead className="bg-muted/40 text-xs"><tr><th className="text-left p-2">Item</th><th className="text-left p-2">Qty</th><th className="text-left p-2">Unit Price</th><th className="text-left p-2">Total</th></tr></thead>
            <tbody>
              {lines.map((l, i) => (
                <tr key={i} className="border-t">
                  <td className="p-2">{l.item}</td>
                  <td className="p-2">{l.qty}</td>
                  <td className="p-2">
                    <Input type="number" value={l.unitPrice || ""} onChange={(e) => { const c=[...lines]; c[i].unitPrice=Number(e.target.value); setLines(c); }} className="h-8 w-28" placeholder="₹0" />
                  </td>
                  <td className="p-2 font-medium">₹{(l.qty * l.unitPrice).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div><Label>Delivery Time (days)</Label><Input type="number" value={days} onChange={(e) => setDays(Number(e.target.value))} /></div>
        <div className="bg-muted/30 p-3 rounded-md space-y-1 text-sm">
          <div className="flex justify-between"><span>Subtotal</span><span>₹{total.toLocaleString()}</span></div>
          <div className="flex justify-between"><span>GST (18%)</span><span>₹{gst.toLocaleString()}</span></div>
          <div className="flex justify-between font-bold pt-1 border-t"><span>Grand Total</span><span>₹{(total + gst).toLocaleString()}</span></div>
        </div>
      </div>

      <div><Label>Notes / Terms</Label><Textarea placeholder="Payment terms: 30 days net" value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
      <div className="flex gap-2 justify-end">
        <Button onClick={submit} className="bg-primary text-primary-foreground"><Send className="size-4" /> Submit Quotation</Button>
      </div>
    </Card>
  );
}

function CompareView() {
  const { rfqs, quotations, vendors, log } = useStore();
  const [rfqId, setRfqId] = useState(rfqs[0]?.id ?? "");
  const rfq = rfqs.find(r => r.id === rfqId);
  const quotes = quotations.filter(q => q.rfqId === rfqId);
  const totals = quotes.map(q => q.lines.reduce((s, l) => s + l.qty * l.unitPrice, 0));
  const lowestIdx = totals.length ? totals.indexOf(Math.min(...totals)) : -1;

  const sendApproval = () => {
    if (lowestIdx < 0) return;
    const selectedQuote = quotes[lowestIdx];
    const v = vendors.find(x => x.id === selectedQuote.vendorId);
    log({ type: "approval", message: `Quotation sent to manager approval for ${rfq?.title} (Lowest Bidder: ${v?.name || "Vendor"})` });
    toast.success(`Lowest bid from ${v?.name} sent for manager approval!`);
  };

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold">Quotation Comparison</h3>
          <p className="text-xs text-muted-foreground">{quotes.length} quotations received</p>
        </div>
        <select className="h-9 rounded-md border bg-background px-3 text-sm" value={rfqId} onChange={(e) => setRfqId(e.target.value)}>
          {rfqs.map(r => <option key={r.id} value={r.id}>{r.title}</option>)}
        </select>
      </div>

      {quotes.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">No quotations received yet</p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border rounded-md min-w-[700px]">
              <thead>
                <tr className="bg-muted/40 text-xs">
                  <th className="text-left p-3">Criteria</th>
                  {quotes.map((q, i) => {
                    const v = vendors.find(x => x.id === q.vendorId);
                    const winner = i === lowestIdx;
                    return (
                      <th key={q.id} className={`text-left p-3 transition-colors ${winner ? "bg-emerald-50/80 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-300 border-l-2 border-r-2 border-t-2 border-emerald-500" : ""}`}>
                        <div className="flex items-center gap-2">
                          <span>{v?.name ?? "Vendor"}</span> 
                          {winner && <Trophy className="size-3.5 text-emerald-600 dark:text-emerald-400" />}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                <tr className="border-t">
                  <td className="p-3 font-medium">Grand Total</td>
                  {quotes.map((q, i) => (
                    <td key={q.id} className={`p-3 font-bold ${i === lowestIdx ? "bg-emerald-50/80 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-300 border-l-2 border-r-2 border-emerald-500" : ""}`}>
                      ₹{(q.lines.reduce((s, l) => s + l.qty * l.unitPrice, 0)).toLocaleString()}
                    </td>
                  ))}
                </tr>
                <tr className="border-t">
                  <td className="p-3 font-medium">Delivery (days)</td>
                  {quotes.map((q, i) => (
                    <td key={q.id} className={`p-3 ${i === lowestIdx ? "bg-emerald-50/80 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-300 border-l-2 border-r-2 border-emerald-500" : ""}`}>
                      {q.deliveryDays} days
                    </td>
                  ))}
                </tr>
                <tr className="border-t">
                  <td className="p-3 font-medium">Vendor Rating</td>
                  {quotes.map((q, i) => {
                    const v = vendors.find(x => x.id === q.vendorId);
                    return (
                      <td key={q.id} className={`p-3 ${i === lowestIdx ? "bg-emerald-50/80 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-300 border-l-2 border-r-2 border-emerald-500" : ""}`}>
                        <div className="flex items-center gap-1">
                          <Star className="size-3.5 fill-warning text-warning" />
                          <span>{v?.rating.toFixed(1)}</span>
                        </div>
                      </td>
                    );
                  })}
                </tr>
                <tr className="border-t">
                  <td className="p-3 font-medium">GST Number</td>
                  {quotes.map((q, i) => {
                    const v = vendors.find(x => x.id === q.vendorId);
                    return (
                      <td key={q.id} className={`p-3 font-mono text-xs ${i === lowestIdx ? "bg-emerald-50/80 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-300 border-l-2 border-r-2 border-b-2 border-emerald-500" : ""}`}>
                        {v?.gst}
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <span className="inline-block w-2.5 h-2.5 rounded-sm bg-emerald-500"></span>
            <span>Lowest budget column automatically highlighted in emerald with a trophy icon.</span>
          </p>
          <div className="flex justify-end"><Button onClick={sendApproval} className="bg-emerald-600 hover:bg-emerald-700 text-white">Send to Manager Approval</Button></div>
        </>
      )}
    </Card>
  );
}
