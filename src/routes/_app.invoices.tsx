import { createFileRoute, Link } from "@tanstack/react-router";
import { AppHeader } from "@/components/AppHeader";
import { useStore } from "@/lib/mock";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/_app/invoices")({ component: Invoices });

function Invoices() {
  const { documents, vendors } = useStore();
  return (
    <>
      <AppHeader title="Invoices" />
      <main className="p-6">
        <Card className="p-5">
          <h3 className="font-semibold mb-3">Generated Invoices</h3>
          <table className="w-full text-sm">
            <thead className="text-xs text-muted-foreground border-b"><tr><th className="text-left py-2">PO #</th><th className="text-left">Vendor</th><th className="text-left">Date</th><th className="text-left">Status</th><th></th></tr></thead>
            <tbody>
              {documents.map((d) => {
                const v = vendors.find((x) => x.id === d.vendorId);
                return (
                  <tr key={d.id} className="border-b">
                    <td className="py-3 font-mono text-xs">{d.poNumber}</td>
                    <td>{v?.name}</td>
                    <td>{d.date}</td>
                    <td><span className="px-2 py-0.5 rounded-full bg-warning/15 text-xs">{d.status}</span></td>
                    <td><Link to="/purchase-orders" className="text-primary text-xs">View →</Link></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      </main>
    </>
  );
}
