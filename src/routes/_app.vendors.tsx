import { createFileRoute } from "@tanstack/react-router";
import { AppHeader } from "@/components/AppHeader";
import { useStore } from "@/lib/mock";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Star, Plus, Search } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/vendors")({ component: Vendors });

function Rating({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(i => <Star key={i} className={`size-3.5 ${i <= Math.round(value) ? "fill-warning text-warning" : "text-muted-foreground/40"}`} />)}
      <span className="text-xs text-muted-foreground ml-1">{value.toFixed(1)}</span>
    </div>
  );
}

function Vendors() {
  const { vendors, addVendor, log } = useStore();
  const [q, setQ] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", category: "", gst: "", contact: "" });

  const categories = ["all", ...Array.from(new Set(vendors.map(v => v.category)))];

  const filtered = vendors.filter(v => {
    const matchesSearch = v.name.toLowerCase().includes(q.toLowerCase()) || v.gst.toLowerCase().includes(q.toLowerCase());
    const matchesCategory = categoryFilter === "all" || v.category.toLowerCase() === categoryFilter.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  const submit = () => {
    if (!form.name) return toast.error("Vendor name required");
    addVendor({ ...form, rating: 0, status: "Pending" });
    log({ type: "vendor", message: `Vendor added — ${form.name} registered` });
    toast.success("Vendor registered");
    setForm({ name: "", category: "", gst: "", contact: "" });
    setOpen(false);
  };

  return (
    <>
      <AppHeader title="Vendors" />
      <main className="p-6 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">Vendor Registry</h2>
            <p className="text-sm text-muted-foreground">Manage supplier profiles and registrations</p>
          </div>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild><Button><Plus className="size-4" /> Add Vendor</Button></SheetTrigger>
            <SheetContent>
              <SheetHeader><SheetTitle>Register New Vendor</SheetTitle></SheetHeader>
              <div className="p-4 space-y-3">
                <div><Label>Vendor Name</Label><Input value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} /></div>
                <div><Label>Category</Label><Input value={form.category} onChange={(e) => setForm({...form, category: e.target.value})} /></div>
                <div><Label>GST Number</Label><Input value={form.gst} onChange={(e) => setForm({...form, gst: e.target.value})} /></div>
                <div><Label>Contact</Label><Input value={form.contact} onChange={(e) => setForm({...form, contact: e.target.value})} /></div>
                <Button onClick={submit} className="w-full">Register Vendor</Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        <Card className="p-5">
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search vendors by name or GST…" className="pl-9" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px] capitalize">
                <SelectValue placeholder="Category Filter" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c} value={c} className="capitalize">{c === "all" ? "All Categories" : c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-muted-foreground border-b">
                <tr>
                  <th className="text-left py-3 px-2">Vendor</th>
                  <th className="text-left">Category</th>
                  <th className="text-left">GST</th>
                  <th className="text-left">Contact</th>
                  <th className="text-left">Rating</th>
                  <th className="text-left">Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((v) => (
                  <tr key={v.id} className="border-b hover:bg-muted/30">
                    <td className="py-3 px-2 font-medium">{v.name}</td>
                    <td>{v.category}</td>
                    <td className="font-mono text-xs">{v.gst}</td>
                    <td>{v.contact}</td>
                    <td><Rating value={v.rating} /></td>
                    <td><span className={`px-2 py-0.5 rounded-full text-xs ${v.status === "Active" ? "bg-success/15 text-success" : v.status === "Pending" ? "bg-warning/15" : "bg-destructive/15 text-destructive"}`}>{v.status}</span></td>
                    <td><Button variant="ghost" size="sm">View</Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </main>
    </>
  );
}
