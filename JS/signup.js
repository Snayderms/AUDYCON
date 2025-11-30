// JS/signup.js
import { supabase } from "./ConexionSB.js";

document.getElementById("signupBtn").addEventListener("click", async () => {
  const msg = document.getElementById("msg");
  msg.textContent = "";
  msg.style.color = "";

  const full_name = document.getElementById("full_name").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  if (!full_name || !email || !password) {
    msg.textContent = "Rellena todos los campos.";
    msg.style.color = "red";
    return;
  }

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name },
      }
    });

    if (error) {
      msg.textContent = error.message;
      msg.style.color = "red";
      return;
    }

    msg.textContent = "Registro exitoso. Revisa tu correo.";
    msg.style.color = "green";
  } catch (e) {
    console.error(e);
    msg.textContent = "Ocurrió un error inesperado.";
    msg.style.color = "red";
  }
});
