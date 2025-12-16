// JS/admin.js — Panel ADMIN con búsqueda, filtro, modal, toast y LOGS
import { supabase } from "./ConexionSB.js";

let allUsers = [];

// =========================
// OBTENER USUARIOS (RPC)
// =========================
async function getUsers() {
  const { data, error } = await supabase.rpc("get_all_users");
  if (error) {
    console.error("Error al obtener usuarios:", error);
    return [];
  }
  // ocultar soft-deleted
  return (data || []).filter((u) => u.status !== "DELETED");
}

// =========================
// CARGAR Y APLICAR FILTROS
// =========================
async function loadAndRenderUsers() {
  allUsers = await getUsers();
  applyFilters();
}

// =========================
// FILTROS
// =========================
function applyFilters() {
  const searchInput = document.getElementById("searchUser");
  const filterRole = document.getElementById("filterRole");

  const text = (searchInput?.value || "").toLowerCase();
  const role = filterRole?.value || "ALL";

  let filtered = allUsers;

  if (text) {
    filtered = filtered.filter((u) => {
      const name = (u.full_name || "").toLowerCase();
      const email = (u.email || "").toLowerCase();
      return name.includes(text) || email.includes(text);
    });
  }

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
    table.innerHTML = `<tr><td colspan="4" class="p-4 text-center">No hay usuarios.</td></tr>`;
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
// TOAST
// =========================
function showToast(text) {
  const toast = document.getElementById("toastSuccess");
  if (!toast) return;

  toast.textContent = text;
  toast.classList.remove("hidden");
  setTimeout(() => toast.classList.add("hidden"), 2500);
}

// =========================
// LOG HELPER
// =========================
async function logAction(action, target_user, detail = {}) {
  try {
    const { data } = await supabase.auth.getSession();
    const performed_by = data?.session?.user?.id || null;

    await supabase.from("logs").insert({
      action,
      performed_by,
      target_user,
      detail,
    });
  } catch (e) {
    console.warn("No se pudo registrar log:", e);
  }
}

// =========================
// MOSTRAR MODAL (FIX)
// =========================
function openEditModal(user) {
  if (!user) return;

  document.getElementById("edit_user_id").value = user.user_id;
  document.getElementById("edit_first_name").value = user.first_name || "";
  document.getElementById("edit_last_name").value = user.last_name || "";
  document.getElementById("edit_phone").value = user.phone || "";
  document.getElementById("edit_company").value = user.company || "";
  document.getElementById("edit_role").value = user.role || "CLIENTE";
  document.getElementById("edit_status").value = user.status || "ACTIVE";
  // Botón: Ver historial del usuario
  const btnHistory = document.getElementById("viewHistory");
  if (btnHistory) {
    btnHistory.onclick = () => {
      window.location.href = `user-logs.html?user_id=${user.user_id}`;
  };
}

  document.getElementById("editModal")?.classList.remove("hidden");
}

// =========================
// CERRAR MODAL (FIX)
// =========================
document.getElementById("closeModal")?.addEventListener("click", () => {
  document.getElementById("editModal")?.classList.add("hidden");
});

// =========================
// EVENTOS
// =========================
function attachEvents() {
  document.querySelectorAll(".role-select").forEach((s) => {
    s.addEventListener("change", function () {
      changeRole(this.dataset.id, this.value);
    });
  });

  document.querySelectorAll(".status-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      const current =
        this.textContent.trim() === "Suspender" ? "ACTIVE" : "SUSPENDED";
      toggleStatus(this.dataset.id, current);
    });
  });

  document.querySelectorAll(".delete-btn").forEach((btn) => {
    btn.addEventListener("click", () => deleteUser(btn.dataset.id));
  });

  // EDITAR (FIX: control de error + openEditModal existe)
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
  await logAction("CHANGE_ROLE", user_id, {
    source: "admin_panel",
    description: `Rol cambiado a ${newRole}`,
  });

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
  await logAction("TOGGLE_STATUS", user_id, {
    source: "admin_panel",
    description: `Estado cambiado a ${newStatus}`,
  });

  await loadAndRenderUsers();
}

// =========================
// EDITAR USUARIO (SUBMIT MODAL)
// =========================
document.getElementById("editUserForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const btn = document.getElementById("saveEdit");
  if (btn) {
    btn.disabled = true;
    btn.textContent = "Guardando...";
  }

  const user_id = document.getElementById("edit_user_id").value;

  const updatedData = {
    first_name: document.getElementById("edit_first_name").value,
    last_name: document.getElementById("edit_last_name").value,
    phone: document.getElementById("edit_phone").value,
    company: document.getElementById("edit_company").value,
    role: document.getElementById("edit_role").value,
    status: document.getElementById("edit_status").value,
    full_name:
      document.getElementById("edit_first_name").value +
      " " +
      document.getElementById("edit_last_name").value,
  };

  const { error } = await supabase
    .from("profiles")
    .update(updatedData)
    .eq("user_id", user_id);

  // 🔴 ERROR
  if (error) {
    alert("Error al actualizar usuario");
    console.error(error);
    if (btn) {
      btn.disabled = false;
      btn.textContent = "Guardar cambios";
    }
    return;
  }

  // ✅ OK
  showToast("Usuario actualizado");
  await logAction("EDIT_USER", user_id, {
    source: "admin_panel",
    description: "Datos actualizados desde modal",
    fields: updatedData,
  });

  document.getElementById("editModal")?.classList.add("hidden");
  await loadAndRenderUsers();

  // 🔓 REACTIVAR BOTÓN
  if (btn) {
    btn.disabled = false;
    btn.textContent = "Guardar cambios";
  }
});

// =========================
// ELIMINAR USUARIO (API)
// =========================
async function deleteUser(user_id) {
  if (!confirm("¿Seguro que deseas eliminar este usuario?")) return;

  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token;

  const res = await fetch("/api/delete-user", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ user_id }),
  });

  const text = await res.text();
  let payload = {};
  try {
    payload = JSON.parse(text);
  } catch {
    payload = { raw: text };
  }

  if (!res.ok) {
    alert(payload.error || "Error al eliminar");
    console.error("Delete error:", payload, "status:", res.status);
    return;
  }

  showToast("Usuario eliminado");
  await loadAndRenderUsers();
}

// =========================
// VALIDAR ADMIN
// =========================
async function validateAdmin() {
  const { data } = await supabase.auth.getSession();
  const user = data?.session?.user;

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
// INIT
// =========================
(async () => {
  await validateAdmin();

  document.getElementById("searchUser")?.addEventListener("input", applyFilters);
  document.getElementById("filterRole")?.addEventListener("change", applyFilters);

  await loadAndRenderUsers();
})();
