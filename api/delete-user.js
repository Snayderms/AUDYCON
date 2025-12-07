export const config = {
  runtime: "nodejs18.x"
};

import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  const { user_id } = req.body;

  if (!user_id) {
    return res.status(400).json({ error: "Falta user_id" });
  }

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: { autoRefreshToken: false, persistSession: false }
    }
  );

  const { error } = await supabase.auth.admin.deleteUser(user_id);

  if (error) {
    console.error("ERROR:", error);
    return res.status(500).json({ error: "No se pudo eliminar el usuario." });
  }

  return res.status(200).json({ message: "Usuario eliminado correctamente." });
}
