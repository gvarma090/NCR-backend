const API_BASE = "/api/admin"; 

function login() {
  const pass = document.getElementById("password").value;
  if (pass === "admin123") {
    document.getElementById("login").style.display = "none";
    document.getElementById("dashboard").style.display = "block";
    loadDrivers();
  } else {
    alert("Wrong Password");
  }
}

async function loadDrivers() {
  const statusFilter = document.getElementById("statusFilter").value;
  const vehicleFilter = document.getElementById("vehicleFilter").value;

  try {
    let url = `${API_BASE}/drivers?t=${Date.now()}`;
    if (statusFilter) url += `&status=${statusFilter}`;
    if (vehicleFilter) url += `&vehicle=${vehicleFilter}`;

    const res = await fetch(url);
    if (!res.ok) throw new Error("API Error");

    const drivers = await res.json();
    renderDrivers(drivers);
  } catch (err) {
    console.error(err);
  }
}

function renderDrivers(drivers) {
  const container = document.getElementById("drivers");
  container.innerHTML = "";

  if (!drivers || drivers.length === 0) {
    container.innerHTML = "<p style='padding:20px; text-align:center;'>No drivers found.</p>";
    return;
  }

  drivers.forEach(d => {
    let vIcon = "❓";
    let vClass = "badge-unknown";
    const vType = (d.vehicle_type || "").toUpperCase();
    if (vType === "BIKE") { vIcon = "🏍️"; vClass = "badge-bike"; }
    else if (vType === "AUTO") { vIcon = "🛺"; vClass = "badge-auto"; }
    else if (vType === "CAB")  { vIcon = "🚕"; vClass = "badge-cab"; }

    // Logic: If d.blocked is true, we show "Unblock"
    const isBlocked = (d.blocked === true); 
    const btnText = isBlocked ? "🔓 Unblock" : "🚫 Block";
    const btnClass = isBlocked ? "btn-unblock" : "btn-block";
    
    // Send the OPPOSITE value
    const nextState = !isBlocked;

    const card = document.createElement("div");
    card.className = "card";
    if (isBlocked) card.style.opacity = "0.6"; 

    // 🚨 CRITICAL FIX BELOW: Added single quotes around '${d.id}' 🚨
    card.innerHTML = `
      <div class="card-header">
        <span class="badge ${vClass}">${vIcon} ${vType || 'No Vehicle'}</span>
        <span class="status ${d.approval_status ? d.approval_status.toLowerCase() : 'pending'}">
          ${d.approval_status || 'PENDING'}
        </span>
      </div>
      
      <h3>${d.phone}</h3>
      <p><strong>Plate:</strong> ${d.vehicle_plate || 'N/A'}</p>
      
      <div class="actions" style="display:flex; gap:10px;">
        ${d.approval_status !== 'APPROVED' ? 
          `<button class="btn-approve" onclick="approveDriver('${d.id}')">Approve</button>` : 
          `<button class="btn-disabled" disabled>✅ Approved</button>`
        }
        
        <button class="${btnClass}" onclick="toggleBlock('${d.id}', ${nextState})">
            ${btnText}
        </button>
      </div>
    `;
    
    container.appendChild(card);
  });
}

async function approveDriver(id) {
  if (!confirm("Approve this driver?")) return;
  try {
    await fetch(`${API_BASE}/drivers/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: id })
    });
    loadDrivers(); 
  } catch (err) { alert("Approve failed"); }
}

async function toggleBlock(id, shouldBlock) {
  const action = shouldBlock ? "Block" : "Unblock";
  if (!confirm(`Are you sure you want to ${action} this driver?`)) return;

  try {
    const res = await fetch(`${API_BASE}/drivers/block`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: id, blocked: shouldBlock })
    });

    if (!res.ok) throw new Error("Server Error");
    loadDrivers(); 

  } catch (err) { 
    alert(`Failed to ${action}`); 
  }
}
