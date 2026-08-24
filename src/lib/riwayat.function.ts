import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const schema = z.object({
  id: z.string().uuid(),
});

/**
 * Menghapus satu riwayat pengiriman.
 * Proses dilakukan di server menggunakan Supabase service role.
 */
export const hapusRiwayat = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => schema.parse(data))
  .handler(async ({ data }) => {
    // Pastikan aplikasi sudah dibuka
    await (await import("@/lib/gate.server")).requireUnlocked();

    // Client Supabase server-side
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );

    // Pastikan record memang ada
    const { data: existing, error: findError } = await supabaseAdmin
      .from("reminder_logs")
      .select("id")
      .eq("id", data.id)
      .maybeSingle();

    if (findError) {
      throw new Error(findError.message);
    }

    if (!existing) {
      throw new Error("Riwayat tidak ditemukan atau sudah dihapus.");
    }

    // Hapus record
    const { data: deleted, error: deleteError } = await supabaseAdmin
      .from("reminder_logs")
      .delete()
      .eq("id", data.id)
      .select("id");

    if (deleteError) {
      throw new Error(deleteError.message);
    }

    // Pastikan benar-benar ada record yang terhapus
    if (!deleted || deleted.length === 0) {
      throw new Error("Riwayat gagal dihapus dari database.");
    }

    return {
      ok: true as const,
      id: data.id,
    };
  });