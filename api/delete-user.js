// /api/delete-user.js
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  const { user_id, secret } = req.body;

  if (!user_id || !secret) {
    return res.status(400).json({ error: "Faltan datos" });
  }

  if (secret !== process.env.ADMIN_SECRET) {
    return res.status(401).json({ error: "No autorizado" });
  }

  try {
    const response = await fetch(
      `${process.env.SUPABASE_URL}/auth/v1/admin/users/${user_id}`,
      {
        method: "DELETE",
        headers: {
          apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      console.error("Supabase error:", errorData);
      return res.status(500).json({ error: "Supabase no eliminó el usuario" });
    }

    return res.status(200).json({ message: "Usuario eliminado correctamente" });
  } catch (err) {
    console.error("Error general:", err);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
}
