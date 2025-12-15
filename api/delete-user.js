export const config = { runtime: "nodejs" };

import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  try {
    const { user_id } = req.body || {};
    if (!user_id) return res.status(400).json({ error: "Falta user_id" });

    const url = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceKey) {
      return res.status(500).json({
        error: "Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY",
      });
    }

    const supabase = createClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Identificar quién ejecuta (si llega token)
    let performedBy = null;
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

    if (token) {
      const { data, error } = await supabase.auth.getUser(token);
      if (!error) performedBy = data?.user?.id || null;
    }

    // Check: no eliminar último ADMIN
    const { data: targetProfile, error: targetErr } = await supabase
      .from("profiles")
      .select("role")
      .eq("user_id", user_id)
      .single();

    if (targetErr || !targetProfile) {
      return res.status(400).json({ error: "No se encontró el perfil del usuario a eliminar" });
    }

    if (targetProfile.role === "ADMIN") {
      const { count, error: countErr } = await supabase
        .from("profiles")
        .select("user_id", { count: "exact", head: true })
        .eq("role", "ADMIN");

      if (countErr) return res.status(500).json({ error: "Error contando administradores" });
      if ((count || 0) <= 1) {
        return res.status(400).json({ error: "No puedes eliminar al último ADMIN" });
      }
    }

    // Eliminar en Auth
    const { error: delErr } = await supabase.auth.admin.deleteUser(user_id);
    if (delErr) return res.status(400).json({ error: delErr.message });

    // Soft delete del perfil (mantener historial)
    await supabase.from("profiles").update({ status: "DELETED" }).eq("user_id", user_id);

    // Log
    await supabase.from("logs").insert({
      action: "DELETE_USER",
      performed_by: performedBy,
      target_user: user_id,
      detail: {
        source: "admin_panel",
        description: "Usuario eliminado desde panel admin",
      },
    });

    return res.status(200).json({ ok: true, message: "Usuario eliminado correctamente" });
  } catch (e) {
    console.error("API crash:", e);
    return res.status(500).json({ error: String(e?.message || e) });
  }
}
