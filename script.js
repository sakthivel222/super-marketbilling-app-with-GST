const API = "http://localhost:8080/api";

async function fetchProducts() {
  const res = await fetch(API + "/products");
  return res.json();
}

async function fetchCart() {
  const res = await fetch(API + "/cart");
  return res.json();
}

async function fetchTotals() {
  const res = await fetch(API + "/totals");
  return res.json();
}

async function addToCart(code, qty) {
  await fetch(API + "/cart/add", {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({code, qty})
  });
  await refresh();
}

async function removeFromCart(code) {
  await fetch(API + "/cart/remove", {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({code})
  });
  await refresh();
}

async function generateBill(cashier) {
  const res = await fetch(API + "/bill", {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({cashier})
  });
  return res.json();
}

async function refresh() {
  const cart = await fetchCart();
  const totals = await fetchTotals();
  const tbody = document.querySelector("#cartTable tbody");
  tbody.innerHTML = "";
  cart.forEach(ci => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${ci.product.code}</td>
      <td>${ci.product.name}</td>
      <td>${ci.quantity}</td>
      <td>${ci.product.price.toFixed(2)}</td>
      <td>${(ci.gstAmount/2).toFixed(2)}</td>
      <td>${(ci.gstAmount/2).toFixed(2)}</td>
      <td>${ci.total.toFixed(2)}</td>
      <td><button data-code="${ci.product.code}" class="rm">Remove</button></td>
    `;
    tbody.appendChild(tr);
  });

  document.getElementById("subtotal").innerText = Number(totals.subtotal).toFixed(2);
  document.getElementById("totalGst").innerText = Number(totals.totalGst).toFixed(2);
  document.getElementById("grandTotal").innerText = Number(totals.grandTotal).toFixed(2);

  document.querySelectorAll(".rm").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const code = e.target.dataset.code;
      removeFromCart(code);
    });
  });
}

async function init() {
  const products = await fetchProducts();
  const select = document.getElementById("productSelect");
  select.innerHTML = products.map(p => `<option value="${p.code}">${p.code} - ${p.name} (₹ ${p.price.toFixed(2)}, GST ${p.gstRate}%)</option>`).join("");

  document.getElementById("addBtn").addEventListener("click", async () => {
    const code = document.getElementById("productSelect").value;
    const qty = parseInt(document.getElementById("qty").value) || 1;
    await addToCart(code, qty);
  });

  document.getElementById("clearBtn").addEventListener("click", async () => {
    // remove all items by reading the cart and calling remove per item
    const cart = await fetchCart();
    for (const ci of cart) {
      await removeFromCart(ci.product.code);
    }
    await refresh();
  });

  document.getElementById("printBtn").addEventListener("click", async () => {
    const cashier = document.getElementById("cashier").value || "Unknown";
    const result = await generateBill(cashier);
    if (result.status === "ok") {
      document.getElementById("billText").value = result.bill;
      await refresh();
    } else {
      alert("Error: " + result.message);
    }
  });

  await refresh();
}

window.addEventListener("load", init);
