import { supabase } from "./ConexionSB.js";

function shortId(id) {
  if (!id || typeof id !== "string") return "-";
  return id.length > 10 ? id.slice(0, 8) + "…" : id;
}

function formatDate(ts) {
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return ts;
  }
}

function getUserIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("user_id");
}

async function validateAdmin() {
  const { data: sessionData } = await supabase.auth.getSession();
  const user = sessionData?.session?.user;

  if (!user) {
    window.location.href = "login.html";
    return false;
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (error || !profile || profile.role !== "ADMIN") {
    window.location.href = "dashboard.html";
    return false;
  }

  return true;
}

async function loadUserLogs(user_id) {
  const { data, error } = await supabase
    .from("logs")
    .select(`
      id, action, detail, created_at, performed_by,
      performer:profiles!logs_performed_by_fkey(full_name, email)
    `)
    .eq("target_user", user_id)
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    console.error("Error cargando logs usuario:", error?.message, error);
    return [];
  }

  return data || [];
}

function renderTable(logs) {
  const table = document.getElementById("logs-table");
  if (!table) return;

  if (!logs.length) {
    table.innerHTML = `<tr><td colspan="4" class="p-4 text-center">No hay logs para este usuario.</td></tr>`;
    return;
  }

  table.innerHTML = "";

  logs.forEach((l) => {
    const row = document.createElement("tr");

    const performerName =
      l.performer?.full_name || l.performer?.email || shortId(l.performed_by);

    const detailText =
      l.detail?.description ||
      l.detail?.source ||
      (typeof l.detail === "string" ? l.detail : JSON.stringify(l.detail || {}));

    row.innerHTML = `
      <td class="p-2 border">${formatDate(l.created_at)}</td>
      <td class="p-2 border font-semibold">${l.action || ""}</td>
      <td class="p-2 border">${performerName}</td>
      <td class="p-2 border">${detailText}</td>
    `;

    table.appendChild(row);
  });
}

(async () => {
  const ok = await validateAdmin();
  if (!ok) return;

  const user_id = getUserIdFromUrl();
  if (!user_id) {
    alert("Falta user_id en la URL. Ejemplo: user-logs.html?user_id=UUID");
    window.location.href = "admin.html";
    return;
  }

  const logs = await loadUserLogs(user_id);
  renderTable(logs);
})();
