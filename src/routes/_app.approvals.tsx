import { createFileRoute } from "@tanstack/react-router";
import { AppHeader } from "@/components/AppHeader";
import { useStore } from "@/lib/mock";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Check, X, Clock } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/approvals")({ component: Approvals });

const STEPS = ["Pending", "Under Review", "Approved"] as const;

function Approvals() {
  const { approvals, quotations, vendors, rfqs, updateApproval, log, role } = useStore();
  const [selected, setSelected] = useState(approvals[0]?.id ?? "");
  const [remarks, setRemarks] = useState("");

  const isApprover = role === "Manager" || role === "Admin";

  const a = approvals.find((x) => x.id === selected);
  const q = quotations.find((x) => x.id === a?.quotationId);
  const v = vendors.find((x) => x.id === q?.vendorId);
  const rfq = rfqs.find((x) => x.id === q?.rfqId);
  const total = q?.lines.reduce((s, l) => s + l.qty * l.unitPrice, 0) ?? 0;

  const act = (state: "Approved" | "Rejected") => {
    if (!a) return;
    updateApproval(a.id, { state, remarks });
    log({ type: "approval", message: `${state} — ${rfq?.title} by Manager` });
    toast.success(`Quotation ${state}`);
    setSelected("");
    setRemarks("");
  };

  const currentStep = a?.state === "Approved" ? 2 : a?.state === "Under Review" ? 1 : 0;

  if (!isApprover) {
    return (
      <>
        <AppHeader title="Approvals" />
        <main className="p-6 flex items-center justify-center min-h-[70vh]">
          <Card className="max-w-md p-6 text-center space-y-4">
            <h3 className="text-lg font-bold text-destructive">Access Restricted</h3>
            <p className="text-sm text-muted-foreground">
              You are currently viewing as a <strong className="text-foreground">{role}</strong>.
              Only users with the <strong className="text-foreground">Manager</strong> or{" "}
              <strong className="text-foreground">Admin</strong> role are authorized to review and
              approve quotations in this workflow.
            </p>
            <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
              Use the "View as" dropdown in the header to simulate the Manager or Admin role.
            </div>
          </Card>
        </main>
      </>
    );
  }

  return (
    <>
      <AppHeader title="Approvals" />
      <main className="p-6 grid lg:grid-cols-3 gap-4">
        <Card className="p-4 space-y-2">
          <h3 className="font-semibold mb-2">Pending Queue</h3>
          {approvals.map((ap) => {
            const qq = quotations.find((x) => x.id === ap.quotationId);
            const rr = rfqs.find((x) => x.id === qq?.rfqId);
            return (
              <button
                key={ap.id}
                onClick={() => setSelected(ap.id)}
                className={cn(
                  "w-full text-left p-3 rounded-md border text-sm",
                  selected === ap.id && "border-primary bg-primary/5",
                )}
              >
                <div className="font-medium truncate">{rr?.title}</div>
                <div className="text-xs text-muted-foreground mt-1">{ap.state}</div>
              </button>
            );
          })}
        </Card>

        <Card className="lg:col-span-2 p-6 space-y-5">
          <div>
            <h3 className="font-semibold">Approval Workflow</h3>
            <p className="text-xs text-muted-foreground">
              {rfq?.title} · Vendor: {v?.name}
            </p>
          </div>

          <div className="flex items-center">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center flex-1 last:flex-none">
                <div
                  className={cn(
                    "size-9 rounded-full grid place-items-center font-semibold text-sm",
                    i < currentStep
                      ? "bg-success text-success-foreground"
                      : i === currentStep
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground",
                  )}
                >
                  {i < currentStep ? (
                    <Check className="size-4" />
                  ) : i === currentStep ? (
                    <Clock className="size-4" />
                  ) : (
                    i + 1
                  )}
                </div>
                <div className="ml-2 text-xs">
                  <div className="font-medium">{s}</div>
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className={cn("flex-1 h-0.5 mx-3", i < currentStep ? "bg-success" : "bg-muted")}
                  />
                )}
              </div>
            ))}
          </div>

          <div className="grid sm:grid-cols-2 gap-3 text-sm bg-muted/30 p-4 rounded-md">
            <div>
              <div className="text-xs text-muted-foreground">Vendor</div>
              <div className="font-medium">{v?.name}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Quote Total</div>
              <div className="font-bold">₹{total.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Delivery</div>
              <div>{q?.deliveryDays} days</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Rating</div>
              <div>{v?.rating.toFixed(1)} / 5</div>
            </div>
          </div>

          <div>
            <Label>Approval Remarks</Label>
            <Textarea
              placeholder="Add your comments or conditions…"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
            />
          </div>

          <div className="flex gap-2 justify-end pt-3 border-t">
            <Button variant="destructive" onClick={() => act("Rejected")}>
              <X className="size-4" /> Reject
            </Button>
            <Button
              onClick={() => act("Approved")}
              className="bg-success text-success-foreground hover:bg-success/90"
            >
              <Check className="size-4" /> Approve
            </Button>
          </div>
        </Card>
      </main>
    </>
  );
}
