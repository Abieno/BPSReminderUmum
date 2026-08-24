import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { cekAkses } from "@/lib/gate.functions";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { unlocked } = await cekAkses();
    if (!unlocked) throw redirect({ to: "/unlock" });
  },
  component: () => (
    <AppLayout>
      <Outlet />
    </AppLayout>
  ),
});
