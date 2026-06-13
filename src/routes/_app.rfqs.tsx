import { createFileRoute } from "@tanstack/react-router";
import { AppHeader } from "@/components/AppHeader";
import { useStore } from "@/lib/mock";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, Upload } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/rfqs")({ component: RFQs });

function RFQs() {
  const { rfqs, vendors, addRFQ, log, role } = useStore();
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [deadline, setDeadline] = useState("");
  const [items, setItems] = useState([{ name: "", qty: 1, description: "" }]);
  const [assigned, setAssigned] = useState<string[]>([]);

  const canCreate = role === "Procurement Officer" || role === "Admin";

  const submit = (status: "Open" | "Draft") => {
    if (!title) return toast.error("Title required");
    addRFQ({ title, category, deadline, items, assignedVendorIds: assigned });
    log({
      type: "rfq",
      message: `RFQ ${status === "Open" ? "published" : "saved as draft"} — ${title}`,
    });
    toast.success(status === "Open" ? "RFQ published to vendors" : "Saved as draft");
    setCreating(false);
    setTitle("");
    setCategory("");
    setDeadline("");
    setItems([{ name: "", qty: 1, description: "" }]);
    setAssigned([]);
  };

  return (
    <>
      <AppHeader title="Request for Quotation" />
      <main className="p-6 space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold">RFQs</h2>
            <p className="text-sm text-muted-foreground">
              Create and manage requests for quotation
            </p>
          </div>
          {canCreate && !creating && (
            <Button onClick={() => setCreating(true)}>
              <Plus className="size-4" /> New RFQ
            </Button>
          )}
        </div>

        {creating ? (
          <Card className="p-6 space-y-5">
            <div className="flex items-center gap-2 text-sm">
              <span className="size-7 rounded-full bg-primary text-primary-foreground grid place-items-center text-xs">
                1
              </span>
              <span className="font-medium">RFQ Details</span>
              <div className="flex-1 h-px bg-border mx-2" />
              <span className="size-7 rounded-full bg-muted grid place-items-center text-xs">
                2
              </span>
              <span className="text-muted-foreground">Items</span>
              <div className="flex-1 h-px bg-border mx-2" />
              <span className="size-7 rounded-full bg-muted grid place-items-center text-xs">
                3
              </span>
              <span className="text-muted-foreground">Vendors</span>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>RFQ Title</Label>
                <Input
                  placeholder="Office Furniture Q3"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div>
                <Label>Category</Label>
                <Input
                  placeholder="Furniture"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                />
              </div>
              <div>
                <Label>Deadline</Label>
                <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Items / Services</Label>
              <div className="space-y-2">
                {items.map((it, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2">
                    <Input
                      className="col-span-4"
                      placeholder="Item name"
                      value={it.name}
                      onChange={(e) => {
                        const c = [...items];
                        c[idx].name = e.target.value;
                        setItems(c);
                      }}
                    />
                    <Input
                      className="col-span-2"
                      type="number"
                      placeholder="Qty"
                      value={it.qty}
                      onChange={(e) => {
                        const c = [...items];
                        c[idx].qty = Number(e.target.value);
                        setItems(c);
                      }}
                    />
                    <Input
                      className="col-span-5"
                      placeholder="Description"
                      value={it.description}
                      onChange={(e) => {
                        const c = [...items];
                        c[idx].description = e.target.value;
                        setItems(c);
                      }}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="col-span-1"
                      onClick={() => setItems(items.filter((_, i) => i !== idx))}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setItems([...items, { name: "", qty: 1, description: "" }])}
              >
                <Plus className="size-3" /> Add Item
              </Button>
            </div>

            <div>
              <Label>Description / Notes</Label>
              <Textarea placeholder="Additional details for vendors…" />
            </div>

            <div className="border-2 border-dashed rounded-md p-6 text-center text-sm text-muted-foreground">
              <Upload className="size-5 mx-auto mb-2" /> Drag & drop files to upload (placeholder)
            </div>

            <div>
              <Label>Assign Vendors</Label>
              <div className="grid sm:grid-cols-2 gap-2 mt-2">
                {vendors.map((v) => (
                  <label
                    key={v.id}
                    className="flex items-center gap-2 p-2 border rounded-md text-sm"
                  >
                    <Checkbox
                      checked={assigned.includes(v.id)}
                      onCheckedChange={(c) =>
                        setAssigned(c ? [...assigned, v.id] : assigned.filter((x) => x !== v.id))
                      }
                    />
                    {v.name} <span className="text-muted-foreground text-xs">· {v.category}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2 border-t">
              <Button variant="outline" onClick={() => setCreating(false)}>
                Cancel
              </Button>
              <Button variant="outline" onClick={() => submit("Draft")}>
                Save as Draft
              </Button>
              <Button onClick={() => submit("Open")}>Save & Send to Vendors</Button>
            </div>
          </Card>
        ) : (
          <Card className="p-5">
            <div className="overflow-x-auto -mx-5 px-5">
              <table className="w-full text-sm min-w-[600px]">
                <thead className="text-xs text-muted-foreground border-b">
                  <tr>
                    <th className="text-left py-2 px-2">RFQ #</th>
                    <th className="text-left">Title</th>
                    <th className="text-left">Category</th>
                    <th className="text-left">Deadline</th>
                    <th className="text-left">Vendors</th>
                    <th className="text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rfqs.map((r) => (
                    <tr key={r.id} className="border-b hover:bg-muted/30">
                      <td className="py-3 px-2 font-mono text-xs">{r.id.toUpperCase()}</td>
                      <td className="font-medium">{r.title}</td>
                      <td>{r.category}</td>
                      <td>{r.deadline}</td>
                      <td>{r.assignedVendorIds.length}</td>
                      <td>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs ${r.status === "Open" ? "bg-info/15 text-info" : "bg-muted"}`}
                        >
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </main>
    </>
  );
}
