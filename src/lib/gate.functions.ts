import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/** Cek apakah sesi browser sudah membuka kunci aplikasi. */
export const cekAkses = createServerFn({ method: "GET" }).handler(async () => ({
  unlocked: await (await import("@/lib/gate.server")).isUnlocked(),
}));

/** Buka kunci aplikasi dengan kata sandi yang tersimpan di database. */
export const bukaAkses = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ sandi: z.string().min(1).max(200) }).parse(data))
  .handler(async ({ data }) => {
    const gate = await import("@/lib/gate.server");
    const expected = await gate.bacaSandi();
    if (!expected || !gate.cocok(data.sandi, expected)) return { ok: false as const };
    const session = await gate.gateSession();
    await session.update({ unlocked: true });
    return { ok: true as const };
  });

/** Kunci kembali aplikasi (tombol Keluar). */
export const kunciAkses = createServerFn({ method: "POST" }).handler(async () => {
  const session = await (await import("@/lib/gate.server")).gateSession();
  await session.clear();
  return { ok: true as const };
});

/** Lihat kata sandi yang berlaku — hanya bisa saat aplikasi sudah terbuka. */
export const lihatSandi = createServerFn({ method: "GET" }).handler(async () => {
  const gate = await import("@/lib/gate.server");
  await gate.requireUnlocked();
  return { sandi: await gate.bacaSandi() };
});

/** Ganti kata sandi akses aplikasi. */
export const gantiSandi = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z.object({ sandi: z.string().trim().min(6).max(100) }).parse(data),
  )
  .handler(async ({ data }) => {
    const gate = await import("@/lib/gate.server");
    await gate.requireUnlocked();
    await gate.simpanSandi(data.sandi);
    return { ok: true as const };
  });
