let cart = [];
let total = 0;

function addToCart(name, price) {
    cart.push({ name, price });
    total += price;
    updateCartUI();
}

function updateCartUI() {
    const cartList = document.getElementById('cart-items');
    const totalDiv = document.getElementById('cart-total');
    
    cartList.innerHTML = '';
    cart.forEach(item => {
        const li = document.createElement('li');
        li.textContent = `${item.name} - $${item.price.toFixed(2)}`;
        cartList.appendChild(li);
    });
    
    totalDiv.textContent = `Total: $${total.toFixed(2)}`;
}

function submitOrder() {
    const customerName = document.getElementById('customer-name').value;
    const statusMessage = document.getElementById('status-message');

    if (!customerName || cart.length === 0) {
        statusMessage.textContent = "❌ Please add items and enter your name.";
        statusMessage.style.color = "red";
        return;
    }

    statusMessage.textContent = "⌛ Sending order to the cloud...";
    statusMessage.style.color = "orange";

    // For now, we simulate a successful order. 
    // We will connect this to AWS API Gateway in Phase 3!
    setTimeout(() => {
        statusMessage.textContent = `🎉 Order placed successfully for ${customerName}!`;
        statusMessage.style.color = "green";
        cart = [];
        total = 0;
        document.getElementById('customer-name').value = '';
        updateCartUI();
    }, 1500);
}