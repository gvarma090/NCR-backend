const API = "/api/admin";

async function loadDrivers(filter) {
  const res = await fetch(`${API}/drivers`);
  const drivers = await res.json();

  const tbody = document.getElementById("drivers");
  tbody.innerHTML = "";

  drivers
    .filter(d => {
      if (filter === "BLOCKED") return d.blocked;
      return d.approval_status === filter && !d.blocked;
    })
    .forEach(d => {
      const tr = document.createElement("tr");

      tr.innerHTML = `
        <td>${d.phone}</td>
        <td>${d.vehicle_type}</td>
        <td>${d.approval_status}</td>
        <td>${d.blocked}</td>
        <td>
          ${d.approval_status !== "APPROVED"
            ? `<button onclick="approve('${d.phone}')">Approve</button>`
            : ""}
          ${!d.blocked
            ? `<button onclick="block('${d.phone}')">Block</button>`
            : `<button onclick="unblock('${d.phone}')">Unblock</button>`}
        </td>
      `;

      tbody.appendChild(tr);
    });
}

async function approve(phone) {
  await fetch(`${API}/approve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone })
  });
  loadDrivers("PENDING");
}

async function block(phone) {
  await fetch(`${API}/block`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone })
  });
  loadDrivers("APPROVED");
}

async function unblock(phone) {
  await fetch(`${API}/unblock`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone })
  });
  loadDrivers("BLOCKED");
}

/* Load pending by default */
loadDrivers("PENDING");

