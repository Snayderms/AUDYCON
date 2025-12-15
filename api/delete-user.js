export const config = { runtime: "nodejs" };

import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Método no permitido" });

  try {
    const { user_id } = req.body || {};
    if (!user_id) return res.status(400).json({ error: "Falta user_id" });

    const url = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceKey) {
      return res.status(500).json({ error: "Faltan variables SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY" });
    }

    const supabase = createClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const { error } = await supabase.auth.admin.deleteUser(user_id);

    if (error) {
      console.error("ERROR deleteUser:", error);
      return res.status(400).json({ error: error.message });
    }

    return res.status(200).json({ ok: true, message: "Usuario eliminado correctamente." });
  } catch (e) {
    console.error("API crash:", e);
    return res.status(500).json({ error: String(e?.message || e) });
  }
}
