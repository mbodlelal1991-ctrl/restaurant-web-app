// Same API endpoint as the customer order form
const API_URL = "https://amazonaws.com";

const ordersContainer = document.getElementById("ordersContainer");
const loadingMsg = document.getElementById("loadingMsg");
const errorMsg = document.getElementById("errorMsg");
const refreshBtn = document.getElementById("refreshBtn");

const NEXT_STATUS = {
  received: "preparing",
  preparing: "ready",
  ready: "completed",
  completed: null,
};

const STATUS_LABELS = {
  received: "Mark as Preparing",
  preparing: "Mark as Ready",
  ready: "Mark as Completed",
};

// --- NEW: escape any text before it goes into HTML ---
// This turns dangerous characters like < and > into harmless text equivalents,
// so something like <script>...</script> shows up as literal text on screen
// instead of actually running as code.
function escapeHTML(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}
// --- end new section ---

async function loadOrders() {
  loadingMsg.style.display = "block";
  errorMsg.style.display = "none";
  ordersContainer.innerHTML = "";

  try {
    const res = await fetch(API_URL, { method: "GET" });
    const data = await res.json();

    if (!res.ok || !data.success) {
      throw new Error(data.message || "Failed to load orders");
    }

    renderOrders(data.orders);
  } catch (err) {
    errorMsg.textContent = "Could not load orders: " + err.message;
    errorMsg.style.display = "block";
  } finally {
    loadingMsg.style.display = "none";
  }
}

function renderOrders(orders) {
  if (!orders || orders.length === 0) {
    ordersContainer.innerHTML = "<p>No orders yet.</p>";
    return;
  }

  const sorted = [...orders].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );

  ordersContainer.innerHTML = sorted.map(orderCardHTML).join("");

  document.querySelectorAll(".status-update-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const { orderId, newStatus } = btn.dataset;
      updateStatus(orderId, newStatus, btn);
    });
  });
}

function orderCardHTML(order) {
  // NEW: every piece of text that came from a customer is now escaped
  // before being inserted into the page's HTML
  const safeCustomerName = escapeHTML(order.customerName);
  const safePhone = escapeHTML(order.phone);
  const safeNotes = escapeHTML(order.notes);
  const safeOrderId = escapeHTML(order.orderId);

  const itemsText = (order.items || [])
    .map((i) => `${escapeHTML(i.qty)}x ${escapeHTML(i.name)}`)
    .join(", ");

  const time = order.createdAt
    ? new Date(order.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "";

  const nextStatus = NEXT_STATUS[order.status];
  const buttonLabel = STATUS_LABELS[order.status];

  const actionButton = nextStatus
    ? `<button class="status-update-btn" data-order-id="${safeOrderId}" data-new-status="${nextStatus}">${buttonLabel}</button>`
    : "";

  return `
    <div class="order-card status-${order.status}">
      <div class="order-top">
        <span class="order-id">${safeOrderId}</span>
        <span class="order-time">${time}</span>
      </div>
      <div class="order-customer">${safeCustomerName}</div>
      <div class="order-phone">${safePhone}</div>
      <div class="order-items">${itemsText}</div>
      ${order.notes ? `<div class="order-notes">Note: ${safeNotes}</div>` : ""}
      <div class="status-badge status-${order.status}">${order.status}</div>
      <div class="order-actions">${actionButton}</div>
    </div>
  `;
}

async function updateStatus(orderId, newStatus, buttonEl) {
  buttonEl.disabled = true;
  buttonEl.textContent = "Updating...";

  try {
    const res = await fetch(API_URL, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, status: newStatus }),
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      throw new Error(data.message || "Update failed");
    }

    loadOrders();
  } catch (err) {
    errorMsg.textContent = "Could not update order: " + err.message;
    errorMsg.style.display = "block";
    buttonEl.disabled = false;
  }
}

// Keep the manual refresh button active just in case
refreshBtn.addEventListener("click", loadOrders);

// Load orders instantly on page launch
loadOrders();

// --- AUTOMATIC REFRESH LOOP ---
// Automatically triggers loadOrders() every 5 seconds (5000ms)
setInterval(() => {
  loadOrders();
}, 5000);
