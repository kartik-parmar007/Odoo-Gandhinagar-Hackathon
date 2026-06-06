import { useStore, type Role } from "@/lib/mock";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bell, UserCircle2 } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

const ROLES: Role[] = ["Procurement Officer", "Vendor", "Manager", "Admin"];

export function AppHeader({ title }: { title: string }) {
  const { role, setRole, currentProfile } = useStore();
  const navigate = useNavigate();

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

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="size-9 grid place-items-center rounded-full bg-primary text-primary-foreground hover:opacity-90 outline-none transition-opacity cursor-pointer">
              <UserCircle2 className="size-5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64 p-3 space-y-2">
            <DropdownMenuLabel className="font-semibold text-sm">User Profile</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="text-xs space-y-1.5 bg-muted/40 p-2.5 rounded-md">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Name:</span>
                <span className="font-semibold text-foreground">{currentProfile?.firstName || "Akshat"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email:</span>
                <span className="font-mono text-[10px] text-foreground">{currentProfile?.email || "akshat@vendorbridge.app"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Active Role:</span>
                <span className="font-semibold text-primary">{role}</span>
              </div>
              {currentProfile?.phone && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Phone:</span>
                  <span className="text-foreground">{currentProfile.phone}</span>
                </div>
              )}
              {currentProfile?.country && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Country:</span>
                  <span className="text-foreground">{currentProfile.country}</span>
                </div>
              )}
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <button 
                onClick={() => {
                  toast.success("Signed out successfully");
                  navigate({ to: "/auth" });
                }} 
                className="w-full text-left text-destructive font-medium cursor-pointer"
              >
                Sign Out / Switch Profile
              </button>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
