const API = "http://localhost:4000/api";
let items = [], cart = [];

async function loadItems() {
  const res = await fetch(API + "/items");
  items = await res.json();
  const div = document.getElementById("items");
  div.innerHTML = "";
  items.forEach(i => {
    div.innerHTML += `
      <div>
        <b>${i.name}</b> - ₹${i.price} (GST ${i.gst_rate}%)
        <input type="number" id="qty-${i.id}" value="1" min="1">
        <button onclick="addToCart(${i.id})">Add</button>
      </div>`;
  });
}

function addToCart(id) {
  const qty = Number(document.getElementById("qty-" + id).value);
  const existing = cart.find(c => c.id === id);
  if (existing) existing.qty += qty;
  else cart.push({ id, qty });
  renderCart();
}

function renderCart() {
  const div = document.getElementById("cart");
  if (cart.length === 0) {
    div.innerHTML = "<i>No items added.</i>";
    return;
  }
  div.innerHTML = cart.map(c => {
    const i = items.find(x => x.id === c.id);
    return `${i.name} × ${c.qty}`;
  }).join("<br>");
}

async function generateBill() {
  if (cart.length === 0) return alert("Cart is empty!");

  const res = await fetch(API + "/bill", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items: cart })
  });
  const data = await res.json();
  renderInvoice(data);
}

function renderInvoice(data) {
  const div = document.getElementById("invoice");
  const date = new Date().toLocaleString();

  if (!data.items || data.items.length === 0) {
    div.innerHTML = "<i>No bill generated yet.</i>";
    return;
  }

  let html = `
    <h3>🧾 Supermarket Bill Receipt</h3>
    <p><b>Date:</b> ${date}</p>
    <table>
      <tr>
        <th>Item</th>
        <th>Price (₹)</th>
        <th>Qty</th>
        <th>GST %</th>
        <th>GST Amt (₹)</th>
        <th>Total (₹)</th>
      </tr>
  `;

  data.items.forEach(i => {
    html += `
      <tr>
        <td>${i.name}</td>
        <td>${i.price}</td>
        <td>${i.qty}</td>
        <td>${i.gst_rate}</td>
        <td>${i.gstAmount}</td>
        <td>${i.lineTotal}</td>
      </tr>`;
  });

  html += `
      <tfoot>
        <tr><td colspan="5" align="right">Subtotal:</td><td>₹${data.subtotal}</td></tr>
        <tr><td colspan="5" align="right">Total GST:</td><td>₹${data.totalGst}</td></tr>
        <tr><td colspan="5" align="right">Grand Total:</td><td><b>₹${data.grandTotal}</b></td></tr>
      </tfoot>
    </table>
    <p style="text-align:center; margin-top:10px;">Thank you for shopping with us! 🛒</p>
  `;

  div.innerHTML = html;
}

function resetCart() {
  cart = [];
  renderCart();
  document.getElementById("invoice").innerHTML = "<i>Invoice cleared.</i>";
}

function downloadPDF() {
  const element = document.getElementById("invoice-container");
  const opt = {
    margin: 0.5,
    filename: 'Supermarket_Bill.pdf',
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
  };
  html2pdf().set(opt).from(element).save();
}

loadItems();
