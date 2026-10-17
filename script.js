
const $ = (id) => document.getElementById(id);

const today = new Date();
const dateAfter = (days) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

let assets = [
  { id: "AST-001", name: "Dell Latitude 5450", serial: "DL-98231", employee: "Priya Sharma", department: "Finance", type: "Laptop", status: "Allocated" },
  { id: "AST-002", name: "HP EliteDesk 800", serial: "HP-77542", employee: "Rahul Mehta", department: "IT", type: "Desktop", status: "Allocated" },
  { id: "AST-003", name: "Lenovo ThinkPad T14", serial: "LN-61290", employee: "Unassigned", department: "IT", type: "Laptop", status: "Available" },
  { id: "AST-004", name: "MacBook Pro 14", serial: "AP-45218", employee: "Ananya Rao", department: "Design", type: "Laptop", status: "Allocated" },
  { id: "AST-005", name: "Dell OptiPlex 7010", serial: "DL-30081", employee: "Unassigned", department: "Operations", type: "Desktop", status: "In Maintenance" }
];

let licenses = [
  { id: "LIC-001", software: "Microsoft 365", key: "M365-REF-101", total: 100, used: 82, expiry: dateAfter(20) },
  { id: "LIC-002", software: "Adobe Creative Cloud", key: "ADB-REF-202", total: 25, used: 22, expiry: dateAfter(90) },
  { id: "LIC-003", software: "AutoCAD", key: "CAD-REF-303", total: 15, used: 10, expiry: dateAfter(180) }
];

let maintenance = [
  { id: "MNT-001", assetId: "AST-005", issue: "System overheating", date: dateAfter(0), technician: "Amit Verma", status: "In Progress" },
  { id: "MNT-002", assetId: "AST-001", issue: "Annual preventive check", date: dateAfter(2), technician: "IT Support", status: "Open" },
  { id: "MNT-003", assetId: "AST-002", issue: "Keyboard replacement", date: dateAfter(-2), technician: "Neha Patel", status: "Completed" }
];

let assetSequence = 6;
let licenseSequence = 4;
let maintenanceSequence = 4;

function nextId(prefix, sequence) {
  return prefix + "-" + String(sequence).padStart(3, "0");
}

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;",
    '"': "&quot;", "'": "&#39;"
  })[char]);
}

function badge(status) {
  let color = "blue";
  if (["Available", "Allocated", "Completed", "Active"].includes(status)) color = "green";
  if (["Expired", "Retired"].includes(status)) color = "red";
  if (["In Maintenance", "In Progress"].includes(status)) color = "orange";

  return `<span class="badge ${color}">${escapeHTML(status)}</span>`;
}

function licenseStatus(license) {
  if (license.expiry < dateAfter(0)) return "Expired";
  if (license.expiry <= dateAfter(30)) return "Expiring Soon";
  if (license.used > license.total) return "Overallocated";
  return "Active";
}

function showToast(message) {
  const toast = $("toast");
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2600);
}

// Navigation between all four dashboard pages.
function navigate(page) {
  document.querySelectorAll(".page").forEach(section => {
    section.classList.toggle("hidden", section.id !== page);
  });

  document.querySelectorAll(".nav").forEach(button => {
    button.classList.toggle("active", button.dataset.page === page);
  });

  const titles = {
    dashboard: "Dashboard",
    assets: "Computer Assets",
    licenses: "Software Licenses",
    maintenance: "Maintenance Center"
  };

  $("page-title").textContent = titles[page] || "Dashboard";
  $("header-add").textContent = {
    dashboard: "+ Add Asset",
    assets: "+ Add Asset",
    licenses: "+ Add License",
    maintenance: "+ New Request"
  }[page];

  $("header-add").onclick = () => {
    if (page === "licenses") openModal("license-modal");
    else if (page === "maintenance") openModal("maintenance-modal");
    else openModal("asset-modal");
  };

  if (page === "maintenance") populateMaintenanceAssets();
}

document.querySelectorAll(".nav").forEach(button => {
  button.addEventListener("click", () => navigate(button.dataset.page));
});

document.querySelectorAll("[data-go]").forEach(button => {
  button.addEventListener("click", () => navigate(button.dataset.go));
});

function openModal(id) {
  if (id === "maintenance-modal") populateMaintenanceAssets();
  $(id).showModal();
}

document.querySelectorAll("[data-modal]").forEach(button => {
  button.addEventListener("click", () => openModal(button.dataset.modal));
});

document.querySelectorAll("[data-close]").forEach(button => {
  button.addEventListener("click", () => button.closest("dialog").close());
});

// Computer inventory.
function renderAssets() {
  const query = $("asset-search").value.toLowerCase();

  const filtered = assets.filter(asset =>
    [asset.id, asset.name, asset.serial, asset.employee, asset.department]
      .some(value => value.toLowerCase().includes(query))
  );

  $("asset-table").innerHTML = filtered.map(asset => `
    <tr>
      <td>${escapeHTML(asset.id)}</td>
      <td><strong>${escapeHTML(asset.name)}</strong><br>
        <span class="muted">${escapeHTML(asset.type)}</span></td>
      <td>${escapeHTML(asset.serial)}</td>
      <td>${escapeHTML(asset.employee)}</td>
      <td>${escapeHTML(asset.department)}</td>
      <td>${badge(asset.status)}</td>
      <td>
        ${asset.status !== "Retired" ? `
          <button class="action-btn" data-allocate="${escapeHTML(asset.id)}">
            ${asset.status === "Allocated" ? "Return" : "Assign"}
          </button>
          <button class="action-btn" data-retire="${escapeHTML(asset.id)}">Retire</button>
        ` : "—"}
      </td>
    </tr>
  `).join("") || `<tr><td colspan="7">No matching assets found.</td></tr>`;

  $("dashboard-assets").innerHTML = assets.slice(-4).reverse().map(asset => `
    <tr>
      <td><strong>${escapeHTML(asset.name)}</strong><br>
        <span class="muted">${escapeHTML(asset.id)}</span></td>
      <td>${escapeHTML(asset.employee)}</td>
      <td>${badge(asset.status)}</td>
    </tr>
  `).join("");

  $("total-assets").textContent = assets.length;
  $("allocated-assets").textContent =
    assets.filter(a => a.status === "Allocated").length;

  populateMaintenanceAssets();
}

// Delegate table actions so rerendering does not break buttons.
$("asset-table").addEventListener("click", event => {
  const assignButton = event.target.closest("[data-allocate]");
  const retireButton = event.target.closest("[data-retire]");

  if (assignButton) {
    const asset = assets.find(a => a.id === assignButton.dataset.allocate);
    if (!asset) return;

    if (asset.status === "Allocated") {
      asset.employee = "Unassigned";
      asset.status = "Available";
      showToast("Asset returned to inventory.");
    } else {
      const employee = prompt("Enter the employee's name:");
      if (!employee?.trim()) return;
      asset.employee = employee.trim();
      asset.status = "Allocated";
      showToast("Asset assigned successfully.");
    }
    renderAll();
  }

  if (retireButton) {
    const asset = assets.find(a => a.id === retireButton.dataset.retire);
    if (!asset) return;

    if (confirm(`Retire ${asset.name}?`)) {
      asset.status = "Retired";
      asset.employee = "Unassigned";
      renderAll();
      showToast("Asset retired.");
    }
  }
});

$("asset-search").addEventListener("input", renderAssets);

$("asset-form").addEventListener("submit", event => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);

  const serial = form.get("serial").trim();
  if (assets.some(a => a.serial.toLowerCase() === serial.toLowerCase())) {
    showToast("That serial number already exists.");
    return;
  }

  const status = form.get("status");
  const employee = form.get("employee").trim() || "Unassigned";

  assets.push({
    id: nextId("AST", assetSequence++),
    name: form.get("name").trim(),
    serial,
    employee: status === "Allocated" ? employee : "Unassigned",
    department: form.get("department").trim() || "Unassigned",
    type: form.get("type"),
    status
  });

  event.currentTarget.reset();
  $("asset-modal").close();
  renderAll();
  navigate("assets");
  showToast("Computer registered successfully.");
});

// Software license inventory.
function renderLicenses() {
  $("license-table").innerHTML = licenses.map(license => {
    const status = licenseStatus(license);

    return `
      <tr>
        <td><strong>${escapeHTML(license.software)}</strong><br>
          <span class="muted">${escapeHTML(license.id)}</span></td>
        <td>${escapeHTML(license.key)}</td>
        <td>${license.total}</td>
        <td>${license.used}</td>
        <td>${escapeHTML(license.expiry)}</td>
        <td>${badge(status)}</td>
      </tr>
    `;
  }).join("") || `<tr><td colspan="6">No licenses registered.</td></tr>`;

  $("total-licenses").textContent = licenses.length;
  $("license-products").textContent = licenses.length;
  $("license-seats").textContent = licenses.reduce((sum, l) => sum + l.total, 0);
  $("license-available").textContent =
    licenses.reduce((sum, l) => sum + Math.max(0, l.total - l.used), 0);
}

$("license-form").addEventListener("submit", event => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const total = Number(form.get("total"));
  const used = Number(form.get("used"));

  if (used > total) {
    showToast("Used seats cannot exceed total seats.");
    return;
  }

  licenses.push({
    id: nextId("LIC", licenseSequence++),
    software: form.get("software").trim(),
    key: form.get("key").trim(),
    total,
    used,
    expiry: form.get("expiry")
  });

  event.currentTarget.reset();
  $("license-modal").close();
  renderAll();
  navigate("licenses");
  showToast("Software license added.");
});

// Maintenance tracking.
function populateMaintenanceAssets() {
  const select = $("maintenance-asset");
  if (!select) return;

  const previous = select.value;

  select.innerHTML = assets.map(asset =>
    `<option value="${escapeHTML(asset.id)}">${escapeHTML(asset.id)} — ${escapeHTML(asset.name)}</option>`
  ).join("");

  if (assets.some(a => a.id === previous)) select.value = previous;
}

function renderMaintenance() {
  $("maintenance-table").innerHTML = maintenance.map(ticket => {
    const asset = assets.find(a => a.id === ticket.assetId);

    return `
      <tr>
        <td>${escapeHTML(ticket.id)}</td>
        <td>${escapeHTML(asset?.name || ticket.assetId)}</td>
        <td>${escapeHTML(ticket.issue)}</td>
        <td>${escapeHTML(ticket.date)}</td>
        <td>${escapeHTML(ticket.technician || "Unassigned")}</td>
        <td>${badge(ticket.status)}</td>
        <td>
          ${ticket.status !== "Completed" ? `
            <button class="action-btn" data-complete="${escapeHTML(ticket.id)}">
              Mark Complete
            </button>
          ` : "—"}
        </td>
      </tr>
    `;
  }).join("") || `<tr><td colspan="7">No maintenance requests.</td></tr>`;

  $("open-maintenance").textContent =
    maintenance.filter(t => t.status !== "Completed").length;
}

$("maintenance-table").addEventListener("click", event => {
  const button = event.target.closest("[data-complete]");
  if (!button) return;

  const ticket = maintenance.find(t => t.id === button.dataset.complete);
  if (!ticket) return;

  ticket.status = "Completed";

  const relatedAsset = assets.find(a => a.id === ticket.assetId);
  if (relatedAsset && relatedAsset.status === "In Maintenance") {
    relatedAsset.status = "Available";
    relatedAsset.employee = "Unassigned";
  }

  renderAll();
  showToast("Maintenance request completed.");
});

$("maintenance-form").addEventListener("submit", event => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const assetId = form.get("assetId");
  const asset = assets.find(a => a.id === assetId);

  if (!asset) {
    showToast("Please register a computer first.");
    return;
  }

  const status = form.get("status");

  maintenance.push({
    id: nextId("MNT", maintenanceSequence++),
    assetId,
    issue: form.get("issue").trim(),
    date: form.get("date"),
    technician: form.get("technician").trim() || "Unassigned",
    status
  });

  if (status !== "Completed") asset.status = "In Maintenance";

  event.currentTarget.reset();
  $("maintenance-modal").close();
  renderAll();
  navigate("maintenance");
  showToast("Maintenance request created.");
});

// Dashboard alerts.
function renderAlerts() {
  const expiring = licenses.filter(l =>
    licenseStatus(l) === "Expiring Soon" || licenseStatus(l) === "Expired"
  );

  const openTickets = maintenance.filter(t => t.status !== "Completed");

  const unassigned = assets.filter(a => a.status === "Available");

  const alerts = [
    ...expiring.map(l => ({
      title: `${l.software}: ${licenseStatus(l)}`,
      description: `License expiry: ${l.expiry}`
    })),
    ...openTickets.map(t => ({
      title: `Maintenance: ${t.id}`,
      description: `${t.issue} · ${t.status}`
    })),
    ...unassigned.map(a => ({
      title: `${a.name} is available`,
      description: `${a.id} · Ready for allocation`
    }))
  ];

  $("alerts").innerHTML = alerts.slice(0, 7).map(alert => `
    <div class="alert">
      <strong>${escapeHTML(alert.title)}</strong>
      <small>${escapeHTML(alert.description)}</small>
    </div>
  `).join("") || `<p class="muted">All clear. No urgent actions.</p>`;
}

function renderAll() {
  renderAssets();
  renderLicenses();
  renderMaintenance();
  renderAlerts();
}

renderAll();
navigate("dashboard");
