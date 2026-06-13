import { createFileRoute } from "@tanstack/react-router";
import { AppHeader } from "@/components/AppHeader";
import { useStore } from "@/lib/mock";
import { Card } from "@/components/ui/card";
import { FileText, ShieldCheck, Users, ShoppingCart, FileCheck2 } from "lucide-react";

export const Route = createFileRoute("/_app/activity")({ component: Activity });

const ICONS = {
  rfq: FileText,
  approval: ShieldCheck,
  vendor: Users,
  po: ShoppingCart,
  quotation: FileCheck2,
};

function Activity() {
  const { logs } = useStore();
  return (
    <>
      <AppHeader title="Activity & Logs" />
      <main className="p-6">
        <Card className="p-6">
          <h3 className="font-semibold mb-1">Procurement Audit Trail</h3>
          <p className="text-xs text-muted-foreground mb-5">Immutable timeline of system events</p>
          <ol className="relative border-l-2 border-border ml-3 space-y-5">
            {logs.map((l) => {
              const Icon = ICONS[l.type];
              return (
                <li key={l.id} className="pl-6 relative">
                  <span className="absolute -left-[13px] top-0 size-6 rounded-full bg-primary text-primary-foreground grid place-items-center">
                    <Icon className="size-3" />
                  </span>
                  <div className="text-sm">{l.message}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {new Date(l.timestamp).toLocaleString()}
                  </div>
                </li>
              );
            })}
          </ol>
        </Card>
      </main>
    </>
  );
}
