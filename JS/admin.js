// JS/admin.js — Panel ADMIN con CRUD completo
import { supabase } from "./ConexionSB.js";

// Obtener usuarios usando RPC
async function getUsers() {
  const { data, error } = await supabase.rpc("get_all_users");
  if (error) return [];
  return data;
}

// Listar usuarios
async function renderUsers() {
  const table = document.getElementById("users-table");
  table.innerHTML = `<tr><td colspan="5" class="p-4 text-center">Cargando...</td></tr>`;

  const users = await getUsers();

  if (!users.length) {
    table.innerHTML = `<tr><td colspan="5" class="p-4 text-center">No hay usuarios registrados.</td></tr>`;
    return;
  }

  table.innerHTML = "";

  users.forEach((u) => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td class="py-3 px-4">${u.full_name || "(Sin nombre)"}</td>
      <td class="py-3 px-4">${u.email}</td>
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

        <button class="edit-btn ml-2 px-3 py-1 rounded bg-blue-500 text-white" data-id="${u.user_id}">
          Editar
        </button>
      </td>
    `;
    table.appendChild(row);
  });

  attachEvents();
}

// Cambiar rol
async function changeRole(user_id, newRole) {
  await supabase.from("profiles").update({ role: newRole }).eq("user_id", user_id);
  renderUsers();
}

// Activar / Suspender
async function toggleStatus(user_id, currentStatus) {
  const newStatus = currentStatus === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
  await supabase.from("profiles").update({ status: newStatus }).eq("user_id", user_id);
  renderUsers();
}

// Eliminar usuario
async function deleteUser(user_id) {
  if (!confirm("¿Seguro?")) return;
  await supabase.auth.admin.deleteUser(user_id);
  renderUsers();
}

// —————— MODAL EDITAR USUARIO ——————
function attachEvents() {

  // Editar usuario
  document.querySelectorAll(".edit-btn").forEach((btn) => {
    btn.addEventListener("click", async function () {
      const id = this.getAttribute("data-id");

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", id)
        .single();

      document.getElementById("edit_first_name").value = data.first_name ?? "";
      document.getElementById("edit_last_name").value = data.last_name ?? "";
      document.getElementById("edit_phone").value = data.phone ?? "";
      document.getElementById("edit_company").value = data.company ?? "";

      document.getElementById("saveEdit").setAttribute("data-id", id);
      document.getElementById("editModal").classList.remove("hidden");
    });
  });

  document.getElementById("saveEdit").addEventListener("click", async function () {
    const id = this.getAttribute("data-id");

    const first_name = document.getElementById("edit_first_name").value;
    const last_name = document.getElementById("edit_last_name").value;
    const phone = document.getElementById("edit_phone").value;
    const company = document.getElementById("edit_company").value;

    await supabase
      .from("profiles")
      .update({
        first_name,
        last_name,
        phone,
        company,
        full_name: `${first_name} ${last_name}`,
      })
      .eq("user_id", id);

    document.getElementById("editModal").classList.add("hidden");
    renderUsers();
  });

  document.getElementById("closeEdit").addEventListener("click", () => {
    document.getElementById("editModal").classList.add("hidden");
  });

  // Rol
  document.querySelectorAll(".role-select").forEach((s) => {
    s.addEventListener("change", function () {
      changeRole(this.getAttribute("data-id"), this.value);
    });
  });

  // Suspender
  document.querySelectorAll(".status-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      const current = this.textContent.trim() === "Suspender" ? "ACTIVE" : "SUSPENDED";
      toggleStatus(this.getAttribute("data-id"), current);
    });
  });

  // Eliminar
  document.querySelectorAll(".delete-btn").forEach((btn) => {
    btn.addEventListener("click", () => deleteUser(btn.getAttribute("data-id")));
  });
}

// Validar ADMIN
(async () => {
  const { data: session } = await supabase.auth.getSession();
  const user = session?.session?.user;

  if (!user) return (window.location.href = "login.html");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (!profile || profile.role !== "ADMIN")
    window.location.href = "dashboard.html";

  renderUsers();
})();
