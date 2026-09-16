// TODO: replace with your actual API Gateway Invoke URL + resource path
const API_URL = "https://pnpr48esc5.execute-api.us-east-1.amazonaws.com/prod/orders";

const orderForm = document.getElementById("orderForm");
const itemsList = document.getElementById("itemsList");
const addItemBtn = document.getElementById("addItem");
const submitBtn = document.getElementById("submitBtn");
const responseMessage = document.getElementById("responseMessage");

const statusOrderIdInput = document.getElementById("statusOrderId");
const checkStatusBtn = document.getElementById("checkStatusBtn");
const statusResult = document.getElementById("statusResult");

// Escapes text before inserting it into the page, so nothing typed into a
// form field (order ID, etc.) can be interpreted as HTML/JavaScript
function escapeHTML(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}

// Human-friendly labels for each status value
const STATUS_DISPLAY = {
  received: "Received - waiting to be prepared",
  preparing: "Being prepared",
  ready: "Ready for pickup!",
  completed: "Completed",
};

// Add a new item row
addItemBtn.addEventListener("click", () => {
  const row = document.createElement("div");
  row.className = "item-row";
  row.innerHTML = `
    <input type="text" class="itemName" placeholder="Item name" required>
    <input type="number" class="itemQty" placeholder="Qty" min="1" value="1" required>
    <button type="button" class="removeItem">✕</button>
  `;
  itemsList.appendChild(row);
});

// Remove an item row (event delegation, since rows are added dynamically)
itemsList.addEventListener("click", (e) => {
  if (e.target.classList.contains("removeItem")) {
    // Don't remove the last remaining row
    if (itemsList.children.length > 1) {
      e.target.closest(".item-row").remove();
    }
  }
});

// Handle form submission
orderForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const customerName = document.getElementById("customerName").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const notes = document.getElementById("notes").value.trim();

  // Collect all item rows into an array
  const items = [];
  document.querySelectorAll(".item-row").forEach((row) => {
    const name = row.querySelector(".itemName").value.trim();
    const qty = parseInt(row.querySelector(".itemQty").value, 10);
    if (name && qty > 0) {
      items.push({ name, qty });
    }
  });

  const orderPayload = { customerName, phone, items, notes };

  // Disable button and show a loading state
  submitBtn.disabled = true;
  submitBtn.textContent = "Placing order...";
  responseMessage.className = "";
  responseMessage.textContent = "";

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(orderPayload),
    });

    const data = await res.json();

    if (res.ok && data.success) {
      responseMessage.className = "success";
      responseMessage.textContent = `${data.message} Order ID: ${data.orderId}`;
      orderForm.reset();
      // Reset items list back to a single empty row
      itemsList.innerHTML = `
        <div class="item-row">
          <input type="text" class="itemName" placeholder="Item name (e.g. Burger)" required>
          <input type="number" class="itemQty" placeholder="Qty" min="1" value="1" required>
          <button type="button" class="removeItem">✕</button>
        </div>
      `;
    } else {
      responseMessage.className = "error";
      responseMessage.textContent = data.message || "Something went wrong. Please try again.";
    }
  } catch (err) {
    responseMessage.className = "error";
    responseMessage.textContent = "Could not reach the server. Check your connection and try again.";
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Place Order";
  }
});

// Look up a single order's status by ID
checkStatusBtn.addEventListener("click", async () => {
  const enteredId = statusOrderIdInput.value.trim();

  statusResult.className = "";
  statusResult.textContent = "";

  if (!enteredId) {
    statusResult.className = "error";
    statusResult.textContent = "Please enter an order ID.";
    return;
  }

  checkStatusBtn.disabled = true;
  checkStatusBtn.textContent = "Checking...";

  try {
    // Our GET endpoint returns ALL orders, so we fetch them all and then
    // find the one matching what the customer typed in. This is fine at
    // small scale - a bigger app would look up a single order directly
    // instead of scanning every order every time.
    const res = await fetch(API_URL, { method: "GET" });
    const data = await res.json();

    if (!res.ok || !data.success) {
      throw new Error(data.message || "Could not check order status");
    }

    const match = data.orders.find(
      (o) => o.orderId.toLowerCase() === enteredId.toLowerCase()
    );

    if (!match) {
      statusResult.className = "error";
      statusResult.textContent = `No order found with ID "${escapeHTML(enteredId)}". Double-check your order ID and try again.`;
      return;
    }

    const statusText = STATUS_DISPLAY[match.status] || match.status;
    statusResult.className = "success";
    statusResult.textContent = `Order ${match.orderId}: ${statusText}`;
  } catch (err) {
    statusResult.className = "error";
    statusResult.textContent = "Something went wrong checking your order. Please try again.";
  } finally {
    checkStatusBtn.disabled = false;
    checkStatusBtn.textContent = "Check Status";
  }
});
