// JS/confirm.js
import { supabase } from "./ConexionSB.js";

async function confirmEmail() {
  const msg = document.getElementById("msg");
  msg.textContent = "Confirmando tu correo...";

  try {
    const { error } = await supabase.auth.exchangeCodeForSession(window.location.href);

    if (error) {
      msg.textContent = "Error al confirmar tu correo.";
      msg.style.color = "red";
      return;
    }

    msg.textContent = "Correo confirmado. Redirigiendo al login...";
    msg.style.color = "green";

    setTimeout(() => {
      window.location.href = "login.html";
    }, 2000);
  } catch (err) {
    console.error(err);
    msg.textContent = "Error inesperado.";
    msg.style.color = "red";
  }
}

confirmEmail();
