import { useStore, type Role } from "@/lib/mock";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bell, UserCircle2 } from "lucide-react";

const ROLES: Role[] = ["Procurement Officer", "Vendor", "Manager", "Admin"];

export function AppHeader({ title }: { title: string }) {
  const { role, setRole } = useStore();
  return (
    <header className="h-14 border-b bg-card flex items-center justify-between px-6 sticky top-0 z-20">
      <h1 className="text-lg font-semibold">{title}</h1>
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
          <span>View as</span>
        </div>
        <Select value={role} onValueChange={(v) => setRole(v as Role)}>
          <SelectTrigger className="w-[200px] h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
          </SelectContent>
        </Select>
        <button className="size-9 grid place-items-center rounded-md hover:bg-muted" aria-label="Notifications">
          <Bell className="size-4" />
        </button>
        <div className="size-9 grid place-items-center rounded-full bg-primary text-primary-foreground">
          <UserCircle2 className="size-5" />
        </div>
      </div>
    </header>
  );
}
