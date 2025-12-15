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
        error: "Faltan variables SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY",
      });
    }

    // 🔐 Cliente admin
    const supabase = createClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    /* ================================
       BLOQUEAR AUTO-ELIMINACIÓN
    ================================= */
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

    if (token) {
      const { data, error } = await supabase.auth.getUser(token);
      const currentUserId = data?.user?.id;

      if (error) {
        return res.status(401).json({ error: "Token inválido" });
      }

      if (currentUserId === user_id) {
        return res.status(400).json({
          error: "No puedes eliminar tu propio usuario",
        });
      }
    }

    /* ================================
       CHECK: NO ELIMINAR ÚLTIMO ADMIN
    ================================= */
    const { data: targetProfile, error: targetErr } = await supabase
      .from("profiles")
      .select("role")
      .eq("user_id", user_id)
      .single();

    if (targetErr || !targetProfile) {
      return res.status(400).json({
        error: "No se encontró el perfil del usuario a eliminar",
      });
    }

    if (targetProfile.role === "ADMIN") {
      const { count, error: countErr } = await supabase
        .from("profiles")
        .select("user_id", { count: "exact", head: true })
        .eq("role", "ADMIN");

      if (countErr) {
        return res.status(500).json({
          error: "Error contando administradores",
        });
      }

      if ((count || 0) <= 1) {
        return res.status(400).json({
          error: "No puedes eliminar al último ADMIN del sistema",
        });
      }
    }

    /* ================================
       ELIMINAR USUARIO
    ================================= */
    const { error } = await supabase.auth.admin.deleteUser(user_id);

    if (error) {
      console.error("ERROR deleteUser:", error);
      return res.status(400).json({ error: error.message });
    }

    // Opcional: limpiar perfil si no hay cascade
    await supabase.from("profiles").delete().eq("user_id", user_id);

    return res.status(200).json({
      ok: true,
      message: "Usuario eliminado correctamente",
    });
  } catch (e) {
    console.error("API crash:", e);
    return res.status(500).json({ error: String(e?.message || e) });
  }
}
// === LOG DE AUDITORÍA ===
let performedBy = null;

const authHeader = req.headers.authorization || "";
const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

if (token) {
  const { data } = await supabase.auth.getUser(token);
  performedBy = data?.user?.id || null;
}

await supabase.from("logs").insert({
  action: "DELETE_USER",
  performed_by: performedBy,
  target_user: user_id,
  detail: {
    source: "admin_panel",
    description: "Usuario eliminado desde panel admin"
  }
});
