import { supabase } from "./ConexionSB.js";

const btn = document.getElementById("signup-btn");
const msg = document.getElementById("msg");

btn.addEventListener("click", async () => {
  msg.textContent = "";
  btn.disabled = true;

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const first_name = document.getElementById("first_name").value.trim();
  const last_name = document.getElementById("last_name").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const company = document.getElementById("company").value.trim();

  if (!email || !password || !first_name || !last_name) {
    msg.textContent = "Completa todos los campos obligatorios.";
    msg.style.color = "red";
    btn.disabled = false;
    return;
  }

  // Crear usuario
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    msg.textContent = "Error: " + error.message;
    msg.style.color = "red";
    btn.disabled = false;
    return;
  }

  const user = data.user;

  // Crear perfil
  if (user) {
    await supabase.from("profiles").upsert({
      user_id: user.id,
      first_name,
      last_name,
      full_name: `${first_name} ${last_name}`,
      phone,
      company,
      role: "CLIENTE",
      status: "ACTIVE",
    });
  }

  msg.textContent = "Cuenta creada. Revisa tu correo para confirmar.";
  msg.style.color = "green";
  btn.disabled = false;
});
