export const config = { runtime: "nodejs" };

import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  try {
    const { user_id } = req.body || {};
    if (!user_id) {
      return res.status(400).json({ error: "Falta user_id" });
    }

    const url = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceKey) {
      return res.status(500).json({
        error: "Faltan variables SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY"
      });
    }

    // 🔐 Cliente admin (service role)
    const supabase = createClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    /* =====================================================
       ✅ CHECK: NO ELIMINAR AL ÚLTIMO ADMIN
    ===================================================== */

    // 1) Obtener el rol del usuario objetivo
    const { data: targetProfile, error: targetErr } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user_id)
      .single();

    if (targetErr || !targetProfile) {
      return res.status(400).json({
        error: "No se encontró el perfil del usuario a eliminar"
      });
    }

    // 2) Si es ADMIN, verificar cuántos admins hay
    if (targetProfile.role === "ADMIN") {
      const { count, error: countErr } = await supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("role", "ADMIN");

      if (countErr) {
        return res.status(500).json({ error: "Error contando administradores" });
      }

      if (count <= 1) {
        return res.status(400).json({
          error: "No puedes eliminar al último ADMIN del sistema"
        });
      }
    }

    /* =====================================================
       🗑️ ELIMINAR USUARIO (YA VALIDADO)
    ===================================================== */

    const { error } = await supabase.auth.admin.deleteUser(user_id);

    if (error) {
      console.error("ERROR deleteUser:", error);
      return res.status(400).json({ error: error.message });
    }

    return res.status(200).json({
      ok: true,
      message: "Usuario eliminado correctamente"
    });

  } catch (e) {
    console.error("API crash:", e);
    return res.status(500).json({ error: String(e?.message || e) });
  }
}
