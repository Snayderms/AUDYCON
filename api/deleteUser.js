import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  const { user_id, admin_token } = req.body;

  // Validar que viene el admin_token
  if (!admin_token || admin_token !== process.env.ADMIN_PANEL_SECRET) {
    return res.status(401).json({ error: "No autorizado" });
  }

  if (!user_id) {
    return res.status(400).json({ error: "Falta user_id" });
  }

  // Cliente con service_role
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY // clave secreta SOLO en servidor
  );

  const { error } = await supabase.auth.admin.deleteUser(user_id);

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  return res.status(200).json({ success: true });
}
