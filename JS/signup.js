// JS/signup.js
import { supabase } from "./ConexionSB.js";

const btn = document.getElementById("signup-btn");
const msg = document.getElementById("msg");

btn.addEventListener("click", async () => {
  msg.textContent = "";
  msg.style.color = "";
  btn.disabled = true;

  const first_name = document.getElementById("first_name").value.trim();
  const last_name  = document.getElementById("last_name").value.trim();
  const phone      = document.getElementById("phone").value.trim();
  const company    = document.getElementById("company").value.trim();
  const email      = document.getElementById("email").value.trim();
  const password   = document.getElementById("password").value;

  if (!first_name || !last_name || !email || !password) {
    msg.textContent = "Completa nombre, apellido, correo y contraseña.";
    msg.style.color = "red";
    btn.disabled = false;
    return;
  }

  // 👉 Enviamos los datos de perfil como metadata
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        first_name,
        last_name,
        phone,
        company,
      },
    },
  });

  if (error) {
    console.error(error);
    msg.textContent = "Error: " + error.message;
    msg.style.color = "red";
    btn.disabled = false;
    return;
  }

  // NO hacemos insert/update a profiles desde aquí.
  // El trigger handle_new_user se encarga de crear el perfil completo.

  msg.textContent = "Cuenta creada. Revisa tu correo para confirmar.";
  msg.style.color = "green";
  btn.disabled = false;
});
