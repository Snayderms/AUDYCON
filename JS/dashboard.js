// JS/dashboard.js
import { supabase } from "./ConexionSB.js";

(async () => {
  // 1. Verificar sesión
  const { data: sessionData, error: sError } = await supabase.auth.getSession();
  const session = sessionData?.session;

  if (sError || !session) {
    window.location.href = "login.html";
    return;
  }

  const user = session.user;

  // 2. Cargar perfil
  const { data: profile, error: pError } = await supabase
    .from("profiles")
    .select("full_name, role, created_at")
    .eq("user_id", user.id)
    .single();

  if (pError || !profile) {
    console.error(pError);
    alert("No se pudo cargar tu perfil.");
    await supabase.auth.signOut();
    window.location.href = "login.html";
    return;
  }

  const role = (profile.role || "CLIENTE").toUpperCase();
  const fullName = profile.full_name || "Usuario";
  const createdAt = profile.created_at
    ? new Date(profile.created_at).toLocaleString()
    : "";

  const path = window.location.pathname.split("/").pop();

  // 3. Protección por página
  if ((path === "admin.html" || path === "logs.html") && role !== "ADMIN") {
    // No es admin → lo mandamos al dashboard normal
    window.location.href = "dashboard.html";
    return;
  }

  // 4. Rellenar dashboard.html
  if (path === "dashboard.html") {
    const welcome = document.getElementById("welcome");
    const info = document.getElementById("info");
    const roleContent = document.getElementById("roleContent");
    const navlinks = document.getElementById("navlinks");

    if (welcome) {
      welcome.textContent = `Hola ${fullName}, bienvenido a AUDYCON.`;
    }
    if (info) {
      info.textContent = `Tu rol actual es: ${role}.`;
    }

    if (navlinks) {
      if (role === "ADMIN") {
        navlinks.innerHTML = `
          <a href="dashboard.html">Inicio</a>
          <a href="profile.html">Mi perfil</a>
          <a href="admin.html">Admin</a>
          <a href="logs.html">Logs</a>
          <a href="settings.html">Ajustes</a>
        `;
      } else if (role === "JEFE" || role === "CONTADOR") {
        navlinks.innerHTML = `
          <a href="dashboard.html">Inicio</a>
          <a href="profile.html">Mi perfil</a>
          <a href="settings.html">Ajustes</a>
        `;
      } else {
        // CLIENTE
        navlinks.innerHTML = `
          <a href="dashboard.html">Inicio</a>
          <a href="profile.html">Mi perfil</a>
        `;
      }
    }

    if (roleContent) {
      if (role === "ADMIN") {
        roleContent.innerHTML = `
          <h3>Panel ADMIN</h3>
          <p class="muted">Control total del sistema.</p>
        `;
      } else if (role === "JEFE") {
        roleContent.innerHTML = `
          <h3>Panel JEFE</h3>
          <p class="muted">Validación de acciones críticas y visión general.</p>
        `;
      } else if (role === "CONTADOR") {
        roleContent.innerHTML = `
          <h3>Panel CONTADOR</h3>
          <p class="muted">Gestión contable operativa.</p>
        `;
      } else {
        roleContent.innerHTML = `
          <h3>Panel CLIENTE</h3>
          <p class="muted">Solo puedes ver información relacionada a tu empresa.</p>
        `;
      }
    }
  }

  // 5. Rellenar profile.html
  if (path === "profile.html") {
    const nameEl = document.getElementById("profile-name");
    const emailEl = document.getElementById("profile-email");
    const roleEl = document.getElementById("profile-role");
    const createdEl = document.getElementById("created-at");

    if (nameEl) nameEl.textContent = fullName;
    if (emailEl) emailEl.textContent = user.email;
    if (roleEl) roleEl.textContent = role;
    if (createdEl) createdEl.textContent = createdAt;
  }

  // 6. Ajustes (settings.html)
  if (path === "settings.html") {
    const nameInput = document.getElementById("new-name");
    const passInput = document.getElementById("new-password");
    const saveNameBtn = document.getElementById("save-name");
    const savePassBtn = document.getElementById("save-password");
    const logoutBtn = document.getElementById("logout");

    if (nameInput) nameInput.value = fullName;

    if (saveNameBtn) {
      saveNameBtn.addEventListener("click", async () => {
        const newName = nameInput.value.trim();
        if (!newName) return;

        const { error } = await supabase
          .from("profiles")
          .update({ full_name: newName })
          .eq("user_id", user.id);

        if (error) {
          alert("No se pudo actualizar el nombre.");
        } else {
          alert("Nombre actualizado.");
        }
      });
    }

    if (savePassBtn) {
      savePassBtn.addEventListener("click", async () => {
        const newPass = passInput.value;
        if (!newPass || newPass.length < 8) {
          alert("La contraseña debe tener al menos 8 caracteres.");
          return;
        }

        const { error } = await supabase.auth.updateUser({
          password: newPass,
        });

        if (error) {
          alert("No se pudo actualizar la contraseña.");
        } else {
          alert("Contraseña actualizada.");
        }
      });
    }

    if (logoutBtn) {
      logoutBtn.addEventListener("click", async () => {
        await supabase.auth.signOut();
        window.location.href = "login.html";
      });
    }
  }

  // 7. Admin (admin.html) — listado de usuarios (si luego creas la vista)
  if (path === "admin.html") {
    const usersTable = document.getElementById("users-table");
    if (usersTable) {
      // Aquí luego podemos cargar una vista "profiles_with_email"
      // De momento queda como placeholder
      usersTable.innerHTML = `
        <tr>
          <td class="py-2 px-4" colspan="4">
            Aquí podrás listar usuarios usando una vista en Supabase.
          </td>
        </tr>
      `;
    }
  }

  // 8. Logs (logs.html)
  if (path === "logs.html") {
    const logsContainer = document.getElementById("logs-container");
    if (logsContainer) {
      logsContainer.innerHTML = `
        <p class="text-gray-500">Aquí se mostrarán logs del sistema (pendiente implementar tabla logs).</p>
      `;
    }
  }

  // 9. Botón de logout general (si existe)
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      await supabase.auth.signOut();
      window.location.href = "login.html";
    });
  }
})();
