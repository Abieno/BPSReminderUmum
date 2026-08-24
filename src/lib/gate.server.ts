import { useSession } from "@tanstack/react-start/server";
import { createHash, timingSafeEqual } from "node:crypto";

type GateSession = { unlocked?: boolean };

function sessionConfig() {
  return {
    password: process.env["SESSION_SECRET"]!,
    name: "sirena-akses",
    maxAge: 60 * 60 * 24 * 7,
    cookie: { httpOnly: true, secure: true, sameSite: "lax" as const, path: "/" },
  };
}

export async function gateSession() {
  return useSession<GateSession>(sessionConfig());
}

export async function isUnlocked(): Promise<boolean> {
  const session = await gateSession();
  return session.data.unlocked === true;
}

export async function requireUnlocked() {
  if (!(await isUnlocked())) {
    throw new Error("Akses terkunci. Masukkan kata sandi aplikasi terlebih dahulu.");
  }
}

export function cocok(input: string, expected: string): boolean {
  const a = createHash("sha256").update(input, "utf8").digest();
  const b = createHash("sha256").update(expected, "utf8").digest();
  return timingSafeEqual(a, b);
}

export async function bacaSandi(): Promise<string> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("akses_app")
    .select("sandi")
    .eq("id", true)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data?.sandi ?? "";
}

export async function simpanSandi(sandi: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { error } = await supabaseAdmin
    .from("akses_app")
    .upsert({ id: true, sandi, updated_at: new Date().toISOString() });
  if (error) throw new Error(error.message);
}
