// JS/admin.js — Panel ADMIN con búsqueda, filtro, modal y toast
import { supabase } from "./ConexionSB.js";

let allUsers = []; // todos los usuarios en memoria

// =========================
// OBTENER USUARIOS (RPC)
// =========================
async function getUsers() {
  const { data, error } = await supabase.rpc("get_all_users");
  if (error) {
    console.error("Error al obtener usuarios:", error);
    return [];
  }
  return (data || []).filter(u => u.status !== "DELETED");  
}

// =========================
// CARGAR Y APLICAR FILTROS
// =========================
async function loadAndRenderUsers() {
  allUsers = await getUsers();
  applyFilters();
}

// =========================
// APLICAR BUSCADOR + FILTRO
// =========================
function applyFilters() {
  const searchInput = document.getElementById("searchUser");
  const filterRole = document.getElementById("filterRole");

  const text = (searchInput?.value || "").toLowerCase();
  const role = filterRole?.value || "ALL";

  let filtered = allUsers;

  // Filtro por texto (nombre o correo)
  if (text) {
    filtered = filtered.filter((u) => {
      const name = (u.full_name || "").toLowerCase();
      const email = (u.email || "").toLowerCase();
      return name.includes(text) || email.includes(text);
    });
  }

  // Filtro por rol
  if (role !== "ALL") {
    filtered = filtered.filter((u) => u.role === role);
  }

  renderTable(filtered);
}

// =========================
// RENDER TABLA
// =========================
function renderTable(users) {
  const table = document.getElementById("users-table");
  if (!table) return;

  if (!users.length) {
    table.innerHTML = `<tr><td colspan="4" class="p-4 text-center">No hay usuarios que coincidan.</td></tr>`;
    return;
  }

  table.innerHTML = "";

  users.forEach((u) => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td class="py-3 px-4">${u.full_name || "(Sin nombre)"}</td>
      <td class="py-3 px-4">${u.email || ""}</td>
      <td class="py-3 px-4 font-semibold">${u.role || ""}</td>

      <td class="py-3 px-4 flex flex-wrap gap-2">

        <select class="role-select border p-1 rounded text-sm" data-id="${u.user_id}">
          <option value="ADMIN" ${u.role === "ADMIN" ? "selected" : ""}>ADMIN</option>
          <option value="JEFE" ${u.role === "JEFE" ? "selected" : ""}>JEFE</option>
          <option value="CONTADOR" ${u.role === "CONTADOR" ? "selected" : ""}>CONTADOR</option>
          <option value="CLIENTE" ${u.role === "CLIENTE" ? "selected" : ""}>CLIENTE</option>
        </select>

        <button class="status-btn px-3 py-1 rounded text-white text-sm ${
          u.status === "ACTIVE" ? "bg-red-500" : "bg-green-500"
        }" data-id="${u.user_id}">
          ${u.status === "ACTIVE" ? "Suspender" : "Activar"}
        </button>

        <button class="delete-btn px-3 py-1 rounded bg-gray-600 text-white text-sm" data-id="${u.user_id}">
          Eliminar
        </button>

        <button class="edit-btn px-3 py-1 rounded bg-blue-600 text-white text-sm" data-id="${u.user_id}">
          Editar
        </button>

      </td>
    `;

    table.appendChild(row);
  });

  attachEvents();
}

// =========================
// MOSTRAR MODAL
// =========================
function openEditModal(user) {
  document.getElementById("edit_user_id").value = user.user_id;
  document.getElementById("edit_first_name").value = user.first_name || "";
  document.getElementById("edit_last_name").value = user.last_name || "";
  document.getElementById("edit_phone").value = user.phone || "";
  document.getElementById("edit_company").value = user.company || "";
  document.getElementById("edit_role").value = user.role || "CLIENTE";
  document.getElementById("edit_status").value = user.status || "ACTIVE";

  document.getElementById("editModal").classList.remove("hidden");
}

// =========================
// CERRAR MODAL
// =========================
document.getElementById("closeModal")?.addEventListener("click", () => {
  document.getElementById("editModal")?.classList.add("hidden");
});

// =========================
// GUARDAR CAMBIOS DEL MODAL
// =========================
document.getElementById("editUserForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const btn = document.getElementById("saveEdit");
  if (!btn) return;

  btn.disabled = true;
  btn.textContent = "Guardando...";

  const user_id = document.getElementById("edit_user_id").value;

  const first = document.getElementById("edit_first_name").value;
  const last = document.getElementById("edit_last_name").value;

  const updatedData = {
    first_name: first,
    last_name: last,
    phone: document.getElementById("edit_phone").value,
    company: document.getElementById("edit_company").value,
    role: document.getElementById("edit_role").value,
    status: document.getElementById("edit_status").value,
    full_name: `${first} ${last}`.trim(),
  };

  const { error } = await supabase
    .from("profiles")
    .update(updatedData)
    .eq("user_id", user_id);

  btn.disabled = false;
  btn.textContent = "Guardar cambios";

  if (error) {
    alert("Error al actualizar usuario.");
    console.error(error);
    return;
  }

  showToast("Usuario actualizado correctamente");
  document.getElementById("editModal")?.classList.add("hidden");
  await loadAndRenderUsers();
});

// =========================
// TOAST DE ÉXITO
// =========================
function showToast(text) {
  const toast = document.getElementById("toastSuccess");
  if (!toast) return;

  toast.textContent = text;
  toast.classList.remove("hidden");

  setTimeout(() => toast.classList.add("hidden"), 2500);
}

// =========================
// EVENTOS DINÁMICOS
// =========================
function attachEvents() {
  // Cambiar rol
  document.querySelectorAll(".role-select").forEach((s) => {
    s.addEventListener("change", function () {
      changeRole(this.dataset.id, this.value);
    });
  });

  // Cambiar estado
  document.querySelectorAll(".status-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      const current = this.textContent.trim() === "Suspender" ? "ACTIVE" : "SUSPENDED";
      toggleStatus(this.dataset.id, current);
    });
  });

  // Eliminar
  document.querySelectorAll(".delete-btn").forEach((btn) => {
    btn.addEventListener("click", () => deleteUser(btn.dataset.id));
  });

  // Editar
  document.querySelectorAll(".edit-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.id;

      const { data: user, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", id)
        .single();

      if (error || !user) {
        alert("No se pudo cargar el usuario.");
        console.error(error);
        return;
      }

      openEditModal(user);
    });
  });
}

// =========================
// CAMBIAR ROL
// =========================
async function changeRole(user_id, newRole) {
  const { error } = await supabase
    .from("profiles")
    .update({ role: newRole })
    .eq("user_id", user_id);

  if (error) {
    alert("Error al cambiar rol");
    console.error(error);
    return;
  }

  showToast("Rol actualizado");
  await loadAndRenderUsers();
}

// =========================
// CAMBIAR ESTADO
// =========================
async function toggleStatus(user_id, currentStatus) {
  const newStatus = currentStatus === "ACTIVE" ? "SUSPENDED" : "ACTIVE";

  const { error } = await supabase
    .from("profiles")
    .update({ status: newStatus })
    .eq("user_id", user_id);

  if (error) {
    alert("Error al actualizar estado");
    console.error(error);
    return;
  }

  showToast("Estado actualizado");
  await loadAndRenderUsers();
}

// =========================
// ELIMINAR USUARIO (robusto)
// =========================
async function deleteUser(user_id) {
  if (!confirm("¿Seguro que deseas eliminar este usuario?")) return;

  // Token (opcional: si tu API luego lo valida)
  const { data: sessionData } = await supabase.auth.getSession();
  const access_token = sessionData?.session?.access_token;

  const response = await fetch("/api/delete-user", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(access_token ? { Authorization: `Bearer ${access_token}` } : {}),
    },
    body: JSON.stringify({ user_id }),
  });

  const text = await response.text();
  let result = {};
  try { result = JSON.parse(text); } catch { result = { raw: text }; }

  if (!response.ok) {
    alert(result.error || "No se pudo eliminar el usuario.");
    console.error("Delete error:", result, "status:", response.status);
    return;
  }

  showToast("Usuario eliminado correctamente");
  await loadAndRenderUsers();
}

// =========================
// VALIDAR ADMIN
// =========================
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

// =========================
// INICIALIZACIÓN
// =========================
(async () => {
  await validateAdmin();

  const searchInput = document.getElementById("searchUser");
  const filterRole = document.getElementById("filterRole");

  searchInput?.addEventListener("input", applyFilters);
  filterRole?.addEventListener("change", applyFilters);

  await loadAndRenderUsers();
})();
