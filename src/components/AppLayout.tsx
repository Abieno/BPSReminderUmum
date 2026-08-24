import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, type ReactNode } from "react";
import {
  LayoutDashboard,
  Users,
  BellRing,
  History,
  Settings,
  LogOut,
  Menu,
  X,
  Loader2,
} from "lucide-react";

import { kunciAkses } from "@/lib/gate.functions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const MENU = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/pegawai", label: "Data Pegawai", icon: Users },
  { to: "/reminder", label: "Pengingat", icon: BellRing },
  { to: "/riwayat", label: "Riwayat", icon: History },
  { to: "/pengaturan", label: "Pengaturan", icon: Settings },
] as const;

export function AppLayout({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const kunci = useServerFn(kunciAkses);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  const [dialogKeluar, setDialogKeluar] = useState(false);
  const [loadingKeluar, setLoadingKeluar] = useState(false);

  async function handleKeluar() {
    setLoadingKeluar(true);

    try {
      await queryClient.cancelQueries();
      queryClient.clear();
      await kunci();

      setDialogKeluar(false);
      setOpen(false);

      navigate({ to: "/unlock", replace: true });
    } finally {
      setLoadingKeluar(false);
    }
  }

  const nav = (
    <nav className="flex flex-col gap-1">
      {MENU.map((item) => {
        const active = pathname.startsWith(item.to);
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={() => setOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-medium transition-all",
              active
                ? "bg-gradient-brand text-primary-foreground shadow-glow"
                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            )}
          >
            <item.icon className="size-5 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-surface-glow">
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-gradient-brand px-4 py-3 text-primary-foreground shadow-glow md:hidden">
        <div className="flex items-center gap-2 font-bold">
          <BellRing className="size-5" /> SIRENA BPS
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="text-primary-foreground hover:bg-primary-foreground/15"
          onClick={() => setOpen((v) => !v)}
          aria-label="Buka menu"
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </Button>
      </header>

      <div className="mx-auto flex w-full max-w-[1400px]">
        <aside
          className={cn(
            "fixed inset-x-0 top-[57px] z-20 border-b border-sidebar-border bg-sidebar/95 p-4 backdrop-blur md:static md:top-0 md:block md:w-64 md:shrink-0 md:border-b-0 md:border-r md:p-5",
            open ? "block" : "hidden",
          )}
        >
          <div className="mb-6 hidden items-center gap-3 md:flex">
            <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-brand text-primary-foreground shadow-glow">
              <BellRing className="size-5" />
            </div>
            <div>
              <p className="bg-gradient-brand bg-clip-text text-base font-bold leading-tight text-transparent">
                SIRENA BPS
              </p>
              <p className="text-xs text-muted-foreground">BPS Kabupaten Probolinggo</p>
            </div>
          </div>
          {nav}
          <Button
            variant="ghost"
            className="mt-6 w-full justify-start gap-3 text-muted-foreground"
            onClick={() => setDialogKeluar(true)}
          >
            <LogOut className="size-5" /> Kunci Aplikasi
          </Button>
        </aside>

        <main className="min-h-screen flex-1 p-4 md:p-8">{children}</main>

        <Dialog open={dialogKeluar} onOpenChange={setDialogKeluar}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <LogOut className="size-5 text-primary" />
                Kunci Aplikasi?
              </DialogTitle>

              <DialogDescription>
                Apakah Anda yakin ingin mengunci aplikasi SIRENA BPS?
                Anda akan diarahkan kembali ke halaman masuk dan perlu
                memasukkan kata sandi untuk membuka aplikasi kembali.
              </DialogDescription>
            </DialogHeader>

            <DialogFooter className="gap-2 sm:gap-2">
              <Button
                variant="outline"
                onClick={() => setDialogKeluar(false)}
                disabled={loadingKeluar}
              >
                Batal
              </Button>

              <Button
                variant="default"
                onClick={handleKeluar}
                disabled={loadingKeluar}
              >
                {loadingKeluar && (
                  <span className="mr-2">
                    <Loader2 className="size-4 animate-spin" />
                  </span>
                )}

                {loadingKeluar ? "Mengunci..." : "Ya, Kunci Aplikasi"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
