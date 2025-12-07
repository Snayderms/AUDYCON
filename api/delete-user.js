import { createClient } from "@supabase/supabase-js";

export const config = {
  runtime: "edge"
};

export default async function handler(req) {
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Método no permitido" }),
      { status: 405, headers: { "Content-Type": "application/json" } }
    );
  }

  const { user_id } = await req.json();

  if (!user_id) {
    return new Response(
      JSON.stringify({ error: "Falta user_id" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
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
    console.error("Delete error:", error);
    return new Response(
      JSON.stringify({ error: "No se pudo eliminar el usuario" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  return new Response(
    JSON.stringify({ message: "Usuario eliminado correctamente" }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}
