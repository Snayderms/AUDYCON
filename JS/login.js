// JS/login.js — Supabase v2.x actual
import { supabase } from "./ConexionSB.js";

const btn = document.getElementById("loginBtn");
const msg = document.getElementById("msg");

btn.addEventListener("click", async () => {
  msg.textContent = "";
  msg.style.color = "";
  btn.disabled = true;
  btn.textContent = "Ingresando...";

  try {
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    if (!email || !password) {
      msg.textContent = "Ingresa correo y contraseña.";
      msg.style.color = "red";
      return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      msg.textContent = "Error: " + error.message;
      msg.style.color = "red";
      return;
    }

    const user = data.user;

    // Bloquear si el correo no está verificado
    if (!user.email_confirmed_at) {
      msg.textContent = "Debes confirmar tu correo antes de ingresar.";
      msg.style.color = "red";
      return;
    }

    // Cargar perfil y rol
    const { data: profile, error: pError } = await supabase
      .from("profiles")
      .select("role, full_name")
      .eq("user_id", user.id)
      .single();

    if (pError || !profile) {
      console.error(pError);
      msg.textContent = "No se pudo cargar tu perfil.";
      msg.style.color = "red";
      return;
    }

    const role = (profile.role || "CLIENTE").toUpperCase();

    switch (role) {
      case "ADMIN":
        window.location.href = "admin.html";
        break;
      case "JEFE":
      case "CONTADOR":
        window.location.href = "dashboard.html";
        break;
      case "CLIENTE":
      default:
        window.location.href = "dashboard.html";
        break;
    }
  } catch (e) {
    console.error(e);
    msg.textContent = "Ocurrió un error inesperado.";
    msg.style.color = "red";
  } finally {
    btn.disabled = false;
    btn.textContent = "Ingresar";
  }
});
