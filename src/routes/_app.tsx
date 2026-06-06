import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { AppSidebar } from "@/components/AppSidebar";
import { useStore } from "@/lib/mock";
import { useEffect } from "react";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

function AppLayout() {
  const { currentProfile } = useStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentProfile) {
      navigate({ to: "/auth" });
    }
  }, [currentProfile, navigate]);

  if (!currentProfile) {
    return null; // Don't render sidebar or outlet if not logged in
  }

  return (
    <div className="min-h-screen flex w-full bg-background">
      <AppSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Outlet />
      </div>
    </div>
  );
}
