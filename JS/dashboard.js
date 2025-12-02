// JS/dashboard.js — FASE 1 (seguridad + roles básicos)
import { supabase } from "./ConexionSB.js";

// Función auxiliar para obtener sesión + perfil
async function getSessionAndProfile() {
  const { data: sessionData, error: sError } = await supabase.auth.getSession();

  if (sError) {
    console.error("Error al obtener sesión:", sError);
    return { session: null, user: null, profile: null };
  }

  const session = sessionData?.session;
  const user = session?.user || null;

  if (!session || !user) {
    return { session: null, user: null, profile: null };
  }

  const { data: profile, error: pError } = await supabase
    .from("profiles")
    .select("full_name, role, status, created_at")
    .eq("user_id", user.id)
    .single();

  if (pError) {
    console.error("Error al obtener perfil:", pError);
    return { session, user, profile: null };
  }

  return { session, user, profile };
}

function formatDate(dateString) {
  if (!dateString) return "";
  const d = new Date(dateString);
  return d.toLocaleString();
}

(async () => {
  const { session, user, profile } = await getSessionAndProfile();

  if (!session || !user) {
    // No hay sesión -> volver al login
    window.location.href = "login.html";
    return;
  }

  // Si no hay perfil, por ahora cerramos sesión
  if (!profile) {
    alert("No se pudo cargar tu perfil. Contacta con el administrador.");
    await supabase.auth.signOut();
    window.location.href = "login.html";
    return;
  }

  // Verificar estado
  if (profile.status && profile.status !== "ACTIVE") {
    alert("Tu cuenta está suspendida. Contacta con el administrador.");
    await supabase.auth.signOut();
    window.location.href = "login.html";
    return;
  }

  const role = profile.role || "CLIENTE";
  const fullName = profile.full_name || user.email;
  const createdAt = profile.created_at || user.created_at;

  const path = window.location.pathname;

  // =======================
  // DASHBOARD GENERAL
  // =======================
  if (path.endsWith("dashboard.html")) {
    const titleEl = document.getElementById("title");
    const subEl = document.getElementById("sub");
    const welcomeEl = document.getElementById("welcome");
    const infoEl = document.getElementById("info");
    const roleContentEl = document.getElementById("roleContent");

    if (titleEl) titleEl.textContent = "Panel principal";
    if (subEl) subEl.textContent = `Sesión iniciada como ${user.email}`;
    if (welcomeEl) welcomeEl.textContent = `Hola, ${fullName}`;
    if (infoEl) infoEl.textContent = `Tu rol actual es: ${role}`;

    if (roleContentEl) {
      if (role === "ADMIN") {
        roleContentEl.innerHTML = `
          <p>Tienes acceso completo al sistema.</p>
          <ul>
            <li>• Gestionar usuarios</li>
            <li>• Cambiar roles</li>
            <li>• Revisar logs del sistema</li>
          </ul>
        `;
      } else if (role === "JEFE") {
        roleContentEl.innerHTML = `
          <p>Acceso de Jefe contable.</p>
          <p>Puedes supervisar contadores y revisar reportes generales.</p>
        `;
      } else if (role === "CONTADOR") {
        roleContentEl.innerHTML = `
          <p>Acceso de Contador.</p>
          <p>Puedes gestionar clientes, documentos y reportes asignados.</p>
        `;
      } else {
        roleContentEl.innerHTML = `
          <p>Acceso de Cliente.</p>
          <p>Aquí verás tu información contable y documentos cuando estén disponibles.</p>
        `;
      }
    }

    // Enlaces dinámicos de navegación
    const navlinks = document.getElementById("navlinks");
    if (navlinks) {
      let linksHtml = `<a href="profile.html">Mi perfil</a>`;
      if (role === "ADMIN" || role === "JEFE") {
        linksHtml += `<a href="admin.html">Administración</a>`;
        linksHtml += `<a href="logs.html">Logs</a>`;
      }
      navlinks.innerHTML = linksHtml;
    }
  }

  // =======================
  // ADMIN (solo ADMIN)
  // =======================
  if (path.endsWith("admin.html")) {
    if (role !== "ADMIN") {
      alert("No tienes permisos para acceder al panel de administrador.");
      window.location.href = "dashboard.html";
      return;
    }
    // El HTML de admin.html ya tiene la tabla.
    // En la siguiente fase traeremos aquí la lista de usuarios real desde Supabase.
  }

  // =======================
  // PERFIL
  // =======================
  if (path.endsWith("profile.html")) {
    const nameEl = document.getElementById("profile-name");
    const emailEl = document.getElementById("profile-email");
    const roleEl = document.getElementById("profile-role");
    const createdEl = document.getElementById("created-at");

    if (nameEl) nameEl.textContent = fullName;
    if (emailEl) emailEl.textContent = user.email;
    if (roleEl) roleEl.textContent = role;
    if (createdEl) createdEl.textContent = formatDate(createdAt);
  }

  // =======================
  // SETTINGS (solo protegida)
  // =======================
  if (path.endsWith("settings.html")) {
    // En próxima fase conectaremos los botones para cambiar nombre y contraseña.
  }

  // =======================
  // LOGS (solo ADMIN / JEFE)
  // =======================
  if (path.endsWith("logs.html")) {
    if (role !== "ADMIN" && role !== "JEFE") {
      alert("No tienes permisos para ver los logs.");
      window.location.href = "dashboard.html";
      return;
    }

    const logsContainer = document.getElementById("logs-container");
    if (logsContainer) {
      logsContainer.innerHTML = `
        <p class="text-gray-700">
          En la siguiente fase se mostrarán aquí los logs del sistema
          (inicio de sesión, cambios de rol, etc.).
        </p>
      `;
    }
  }

  // =======================
  // LOGOUT (distintos IDs)
  // =======================
  const logoutBtn =
    document.getElementById("logoutBtn") || document.getElementById("logout");

  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      await supabase.auth.signOut();
      window.location.href = "login.html";
    });
  }
})();
