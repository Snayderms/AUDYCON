import { supabase } from "./ConexionSB.js";

async function confirmEmail() {
  const msg = document.getElementById("msg");

  msg.textContent = "Confirmando tu correo...";

  try {
    const { data, error } = await supabase.auth.exchangeCodeForSession(window.location.href);

    if (error) {
      console.error(error);
      msg.textContent = "Error al confirmar tu correo.";
      msg.className = "error";
      return;
    }

    msg.textContent = "Correo confirmado. Redirigiendo...";
    msg.className = "success";

    setTimeout(() => {
      window.location.href = "/login.html";
    }, 1800);

  } catch (err) {
    console.error(err);
    msg.textContent = "Error inesperado.";
    msg.className = "error";
  }
}

confirmEmail();
