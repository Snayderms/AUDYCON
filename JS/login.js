// JS/login.js — FASE 1 (seguridad + roles + estado)
import { supabase } from "./ConexionSB.js";

const btn = document.getElementById("loginBtn");
const msg = document.getElementById("msg");

if (btn) {
  btn.addEventListener("click", async () => {
    msg.textContent = "";
    msg.style.color = "";
    btn.disabled = true;
    const originalText = btn.textContent;
    btn.textContent = "Ingresando...";

    try {
      const emailInput = document.getElementById("email");
      const passwordInput = document.getElementById("password");

      const email = emailInput.value.trim();
      const password = passwordInput.value;

      if (!email || !password) {
        msg.textContent = "Ingresa tu correo y contraseña.";
        msg.style.color = "red";
        return;
      }

      // 1. Iniciar sesión con Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("Error al iniciar sesión:", error);
        msg.textContent = "Error: " + (error.message || "No se pudo iniciar sesión.");
        msg.style.color = "red";
        return;
      }

      const session = data.session;
      const user = session?.user;

      if (!user) {
        msg.textContent = "No se pudo obtener la sesión del usuario.";
        msg.style.color = "red";
        return;
      }

      // 2. Verificar correo confirmado
      if (!user.email_confirmed_at) {
        msg.textContent = "Debes confirmar tu correo antes de ingresar.";
        msg.style.color = "red";
        // Cerrar sesión por seguridad
        await supabase.auth.signOut();
        return;
      }

      // 3. Cargar perfil (rol + estado)
      const { data: profile, error: pError } = await supabase
        .from("profiles")
        .select("role, status, full_name")
        .eq("user_id", user.id)
        .single();

      if (pError) {
        console.error("Error al cargar perfil:", pError);
        msg.textContent = "No se pudo cargar el perfil del usuario.";
        msg.style.color = "red";
        return;
      }

      // 4. Verificar estado (activo / suspendido)
      if (profile.status && profile.status !== "ACTIVE") {
        msg.textContent = "Tu cuenta está suspendida. Contacta con el administrador.";
        msg.style.color = "red";
        await supabase.auth.signOut();
        return;
      }

      msg.textContent = "Inicio de sesión exitoso. Redirigiendo...";
      msg.style.color = "green";

      // 5. Redirección según rol
      const role = profile.role || "CLIENTE";
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
          window.location.href = "profile.html";
          break;
      }
    } catch (e) {
      console.error(e);
      msg.textContent = "Ocurrió un error inesperado al iniciar sesión.";
      msg.style.color = "red";
    } finally {
      btn.disabled = false;
      btn.textContent = originalText || "Ingresar";
    }
  });
}
