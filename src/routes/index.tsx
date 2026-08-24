import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { BellRing } from "lucide-react";

import { cekAkses } from "@/lib/gate.functions";

export const Route = createFileRoute("/")({
  ssr: false,
  component: Index,
});

function Index() {
  const navigate = useNavigate();
  const cek = useServerFn(cekAkses);

  useEffect(() => {
    cek()
      .then((r) => navigate({ to: r.unlocked ? "/dashboard" : "/unlock", replace: true }))
      .catch(() => navigate({ to: "/unlock", replace: true }));
  }, [cek, navigate]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-surface-glow">
      <div className="flex size-14 animate-pulse items-center justify-center rounded-2xl bg-gradient-brand text-primary-foreground shadow-glow">
        <BellRing className="size-7" />
      </div>
      <h1 className="text-lg font-semibold">SIRENA BPS</h1>
      <p className="text-sm text-muted-foreground">Menyiapkan aplikasi...</p>
    </main>
  );
}
