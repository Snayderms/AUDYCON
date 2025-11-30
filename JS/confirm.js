// JS/confirm.js
import { supabase } from "./ConexionSB.js";

(async () => {
  const msg = document.getElementById("msg");
  msg.textContent = "Confirmando tu correo...";

  const { data, error } = await supabase.auth.exchangeCodeForSession(
    window.location.href
  );

  if (error) {
    msg.textContent = "Error al confirmar tu correo.";
    msg.style.color = "red";
    console.error(error);
    return;
  }

  msg.textContent = "Correo confirmado. Redirigiendo al login...";
  msg.style.color = "green";

  setTimeout(() => {
    window.location.href = "login.html";
  }, 1500);
})();
