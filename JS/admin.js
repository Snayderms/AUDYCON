// JS/admin.js — Panel ADMIN completo
import { supabase } from "./ConexionSB.js";

// Traer todos los usuarios
async function getUsers() {
  const { data, error } = await supabase
    .from("profiles")
    .select(`
      user_id,
      full_name,
      role,
      status,
      created_at,
      auth:auth.users(email)
    `);

  if (error) {
    console.error("Error al obtener usuarios:", error);
    return [];
  }

  return data;
}

// Listar usuarios en la tabla
async function renderUsers() {
  const table = document.getElementById("users-table");
  table.innerHTML = `<tr><td colspan="4" class="p-4 text-center">Cargando...</td></tr>`;

  const users = await getUsers();

  if (!users.length) {
    table.innerHTML = `<tr><td colspan="4" class="p-4 text-center">No hay usuarios registrados.</td></tr>`;
    return;
  }

  table.innerHTML = "";

  users.forEach((u) => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td class="py-3 px-4">${u.full_name || "(Sin nombre)"}</td>
      <td class="py-3 px-4">${u.auth?.email || ""}</td>
      <td class="py-3 px-4 font-semibold">${u.role}</td>

      <td class="py-3 px-4">
        <select class="role-select border p-1 rounded" data-id="${u.user_id}">
          <option ${u.role === "ADMIN" ? "selected" : ""}>ADMIN</option>
          <option ${u.role === "JEFE" ? "selected" : ""}>JEFE</option>
          <option ${u.role === "CONTADOR" ? "selected" : ""}>CONTADOR</option>
          <option ${u.role === "CLIENTE" ? "selected" : ""}>CLIENTE</option>
        </select>

        <button class="status-btn ml-2 px-3 py-1 rounded text-white ${
          u.status === "ACTIVE" ? "bg-red-500" : "bg-green-500"
        }" data-id="${u.user_id}">
          ${u.status === "ACTIVE" ? "Suspender" : "Activar"}
        </button>

        <button class="delete-btn ml-2 px-3 py-1 rounded bg-gray-600 text-white" data-id="${u.user_id}">
          Eliminar
        </button>
      </td>
    `;

    table.appendChild(row);
  });

  attachEvents();
}

// Cambiar rol
async function changeRole(user_id, newRole) {
  const { error } = await supabase
    .from("profiles")
    .update({ role: newRole })
    .eq("user_id", user_id);

  if (error) {
    alert("Error al cambiar rol");
    console.error(error);
  } else {
    alert("Rol actualizado");
    renderUsers();
  }
}

// Activar / Suspender
async function toggleStatus(user_id, currentStatus) {
  const newStatus = currentStatus === "ACTIVE" ? "SUSPENDED" : "ACTIVE";

  const { error } = await supabase
    .from("profiles")
    .update({ status: newStatus })
    .eq("user_id", user_id);

  if (error) {
    alert("Error al actualizar estado");
    console.error(error);
  } else {
    alert("Estado actualizado");
    renderUsers();
  }
}

// Eliminar usuario
async function deleteUser(user_id) {
  const confirmDelete = confirm("¿Seguro que deseas eliminar este usuario?");
  if (!confirmDelete) return;

  // Borrar de auth.users
  const { error } = await supabase.auth.admin.deleteUser(user_id);

  if (error) {
    alert("No tienes permisos completos para eliminar usuarios.");
    console.error(error);
    return;
  }

  alert("Usuario eliminado");
  renderUsers();
}

// Asignar eventos dinámicos a la tabla
function attachEvents() {
  // Cambiar rol
  document.querySelectorAll(".role-select").forEach((select) => {
    select.addEventListener("change", async function () {
      const id = this.getAttribute("data-id");
      const newRole = this.value;
      await changeRole(id, newRole);
    });
  });

  // Activar/suspender
  document.querySelectorAll(".status-btn").forEach((btn) => {
    btn.addEventListener("click", async function () {
      const id = this.getAttribute("data-id");

      // Saber el estado actual
      const parentRow = this.closest("tr");
      const roleCol = parentRow.children[2]?.textContent;

      let currentSt =
        this.textContent.trim() === "Suspender" ? "ACTIVE" : "SUSPENDED";

      await toggleStatus(id, currentSt);
    });
  });

  // Eliminar
  document.querySelectorAll(".delete-btn").forEach((btn) => {
    btn.addEventListener("click", async function () {
      const id = this.getAttribute("data-id");
      await deleteUser(id);
    });
  });
}

// Validar que solo ADMIN entre
async function validateAdmin() {
  const { data: sessionData } = await supabase.auth.getSession();
  const user = sessionData?.session?.user;

  if (!user) {
    window.location.href = "login.html";
    return;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (!profile || profile.role !== "ADMIN") {
    window.location.href = "dashboard.html";
  }
}

(async () => {
  await validateAdmin();
  await renderUsers();
})();
