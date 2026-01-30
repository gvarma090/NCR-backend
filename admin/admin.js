const API = '/api';

let refreshTimer = null;

function login() {
  if (document.getElementById('password').value !== 'admin123') {
    alert('Wrong password');
    return;
  }

  document.getElementById('login').style.display = 'none';
  document.getElementById('dashboard').style.display = 'block';

  loadDrivers();
  loadRides();

  refreshTimer = setInterval(() => {
    loadDrivers();
    loadRides();
  }, 10000);
}

/* =========================
   LOAD DRIVERS
========================= */
async function loadDrivers() {
  const status = document.getElementById('statusFilter').value;
  const vehicle = document.getElementById('vehicleFilter').value;

  let url = `${API}/admin/drivers?`;
  if (status) url += `status=${status}&`;
  if (vehicle) url += `vehicle=${vehicle}`;

  const res = await fetch(url);
  const drivers = await res.json();

  const container = document.getElementById('drivers');
  container.innerHTML = '';

  drivers.forEach(d => {
    const div = document.createElement('div');
    div.className = 'card';

    const statusClass =
      d.approval_status === 'APPROVED'
        ? 'green'
        : d.approval_status === 'PENDING'
        ? 'blue'
        : 'red';

    div.innerHTML = `
      <b>📞 Phone:</b> ${d.phone}<br/>
      <b>🚗 Vehicle:</b> ${d.vehicle_type || '-'}<br/>
      <b>Status:</b>
      <span class="status ${statusClass}">
        ${d.approval_status}
      </span><br/>
      <b>Blocked:</b>
      <span class="${d.blocked ? 'red' : 'green'}">
        ${d.blocked ? 'YES' : 'NO'}
      </span><br/>

      ${
        d.approval_status === 'PENDING'
          ? `<button class="approve" onclick="approve('${d.id}')">Approve</button>`
          : ''
      }

      <button class="${d.blocked ? 'unblock' : 'block'}"
        onclick="toggleBlock('${d.id}', ${!d.blocked})">
        ${d.blocked ? 'Unblock' : 'Block'}
      </button>
    `;

    container.appendChild(div);
  });
}

/* =========================
   ACTIONS
========================= */
async function approve(userId) {
  await fetch(`${API}/admin/drivers/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  });
  loadDrivers();
}

async function toggleBlock(userId, blocked) {
  await fetch(`${API}/admin/drivers/block`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, blocked }),
  });
  loadDrivers();
}

/* =========================
   LIVE RIDES
========================= */
async function loadRides() {
  const res = await fetch(`${API}/admin/rides/live`);
  const rides = await res.json();

  const container = document.getElementById('rides');
  container.innerHTML = '';

  rides.forEach(r => {
    const div = document.createElement('div');
    div.className = 'card';
    div.innerHTML = `
      Ride #${r.id}<br/>
      ${r.source} → ${r.destination}<br/>
      Status: ${r.status}
    `;
    container.appendChild(div);
  });
}

