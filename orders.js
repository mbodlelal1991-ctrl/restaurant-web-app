// Same API endpoint as the customer order form
const API_URL = "https://pnpr48esc5.execute-api.us-east-1.amazonaws.com/prod/orders";

const ordersContainer = document.getElementById("ordersContainer");
const loadingMsg = document.getElementById("loadingMsg");
const errorMsg = document.getElementById("errorMsg");
const refreshBtn = document.getElementById("refreshBtn");

// The order each status can move to next - drives which buttons show on each card
const NEXT_STATUS = {
  received: "preparing",
  preparing: "ready",
  ready: "completed",
  completed: null, // no next step - order is done
};

const STATUS_LABELS = {
  received: "Mark as Preparing",
  preparing: "Mark as Ready",
  ready: "Mark as Completed",
};

// Fetch all orders from the API and render them
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

// Build and display one card per order, newest first
function renderOrders(orders) {
  if (!orders || orders.length === 0) {
    ordersContainer.innerHTML = "<p>No orders yet.</p>";
    return;
  }

  // Sort so the newest orders appear at the top
  const sorted = [...orders].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );

  ordersContainer.innerHTML = sorted.map(orderCardHTML).join("");

  // Attach click handlers to every status-update button just created
  document.querySelectorAll(".status-update-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const { orderId, newStatus } = btn.dataset;
      updateStatus(orderId, newStatus, btn);
    });
  });
}

// Build the HTML for a single order card
function orderCardHTML(order) {
  const itemsText = (order.items || [])
    .map((i) => `${i.qty}x ${i.name}`)
    .join(", ");

  const time = order.createdAt
    ? new Date(order.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "";

  const nextStatus = NEXT_STATUS[order.status];
  const buttonLabel = STATUS_LABELS[order.status];

  const actionButton = nextStatus
    ? `<button class="status-update-btn" data-order-id="${order.orderId}" data-new-status="${nextStatus}">${buttonLabel}</button>`
    : "";

  return `
    <div class="order-card status-${order.status}">
      <div class="order-top">
        <span class="order-id">${order.orderId}</span>
        <span class="order-time">${time}</span>
      </div>
      <div class="order-customer">${order.customerName}</div>
      <div class="order-phone">${order.phone}</div>
      <div class="order-items">${itemsText}</div>
      ${order.notes ? `<div class="order-notes">Note: ${order.notes}</div>` : ""}
      <div class="status-badge status-${order.status}">${order.status}</div>
      <div class="order-actions">${actionButton}</div>
    </div>
  `;
}

// Send a PATCH request to update one order's status
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

    // Reload the full list so the card reflects its new status and next button
    loadOrders();
  } catch (err) {
    errorMsg.textContent = "Could not update order: " + err.message;
    errorMsg.style.display = "block";
    buttonEl.disabled = false;
  }
}

refreshBtn.addEventListener("click", loadOrders);

// Load orders as soon as the page opens
loadOrders();

