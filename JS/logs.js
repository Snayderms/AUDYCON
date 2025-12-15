import { supabase } from "./ConexionSB.js";

let allLogs = [];
let page = 1;
const pageSize = 20;

async function validateAdmin() {
  const { data: sessionData } = await supabase.auth.getSession();
  const user = sessionData?.session?.user;

  if (!user) {
    window.location.href = "login.html";
    return false;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (!profile || profile.role !== "ADMIN") {
    window.location.href = "dashboard.html";
    return false;
  }

  return true;
}

async function getLogsPaged() {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error } = await supabase
    .from("logs")
    .select(`
      id, action, detail, created_at, performed_by, target_user,
      performer:profiles!logs_performed_by_fkey(full_name, email),
      target:profiles!logs_target_user_fkey(full_name, email)
    `)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    console.error("Error cargando logs:", error);
    return [];
  }

  return data || [];
}

function formatDate(ts) {
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return ts;
  }
}

function applyFilters() {
  const q = (document.getElementById("searchLog")?.value || "").toLowerCase();
  const action = document.getElementById("filterAction")?.value || "ALL";

  let filtered = allLogs;

  if (action !== "ALL") filtered = filtered.filter((l) => l.action === action);

  if (q) {
    filtered = filtered.filter((l) => {
      const d =
        typeof l.detail === "string"
          ? l.detail
          : JSON.stringify(l.detail || {});
      return (l.action || "").toLowerCase().includes(q) || d.toLowerCase().includes(q);
    });
  }

  renderTable(filtered);
}

function renderTable(logs) {
  const table = document.getElementById("logs-table");
  if (!table) return;

  if (!logs.length) {
    table.innerHTML = `<tr><td colspan="5" class="p-4 text-center">No hay logs para mostrar.</td></tr>`;
    return;
  }

  table.innerHTML = "";

  logs.forEach((l) => {
    const row = document.createElement("tr");

    const performerName =
      l.performer?.full_name || l.performer?.email || l.performed_by || "-";

    const targetName =
      l.target?.full_name || l.target?.email || l.target_user || "-";

    const detailText =
      l.detail?.description ||
      l.detail?.source ||
      (typeof l.detail === "string" ? l.detail : JSON.stringify(l.detail || {}));

    row.innerHTML = `
      <td class="p-2 border">${formatDate(l.created_at)}</td>
      <td class="p-2 border font-semibold">${l.action || ""}</td>
      <td class="p-2 border">${performerName}</td>
      <td class="p-2 border">${targetName}</td>
      <td class="p-2 border">${detailText}</td>
    `;

    table.appendChild(row);
  });

  document.getElementById("pageInfo").textContent = `Página ${page}`;
}

async function loadLogs() {
  allLogs = await getLogsPaged();
  applyFilters();
}

function bindEvents() {
  document.getElementById("searchLog")?.addEventListener("input", applyFilters);
  document.getElementById("filterAction")?.addEventListener("change", applyFilters);

  document.getElementById("prevBtn")?.addEventListener("click", async () => {
    if (page <= 1) return;
    page--;
    await loadLogs();
  });

  document.getElementById("nextBtn")?.addEventListener("click", async () => {
    if (allLogs.length < pageSize) return;
    page++;
    await loadLogs();
  });
}

(async () => {
  const ok = await validateAdmin();
  if (!ok) return;

  bindEvents();
  await loadLogs();
})();
