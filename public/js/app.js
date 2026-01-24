let allProducts = [];
let allPartners = [];
let cart = [];
// ====================
// ELEMENTOS
// ====================
const barcodeInput = document.getElementById('barcodeInput');

const productsDiv = document.getElementById('products');
const productList = document.getElementById('productList');
const searchInput = document.getElementById('search');
const barcodeInputPOS = document.getElementById('barcodeInputPOS');
const cartTable = document.getElementById('cartTable');
const totalSpan = document.getElementById('total');
const cobrarBtn = document.querySelector('button.mt-4');
const checkoutBtn = document.getElementById('checkoutBtn');

const cashInput = document.getElementById('cashInput');
const changeSpan = document.getElementById('changeSpan');


const btnPOS = document.getElementById('btnPOS');
const btnProducts = document.getElementById('btnProducts');
const btnReports = document.getElementById('btnReports');
const btnPartners = document.getElementById('btnPartners');

const posSection = document.getElementById('posSection');
const productsSection = document.getElementById('productsSection');
const reportsSection = document.getElementById('reportsSection');
const partnersSection = document.getElementById('partnersSection');

// ====================
// FORM PRODUCTOS (IDs CORRECTOS)
// ====================
const nameInput = document.getElementById('nameInput');
const priceInput = document.getElementById('priceInput');
const stockInput = document.getElementById('stockInput');
const tagsInput = document.getElementById('tagsInput');

// ====================
// SOCIOS
// ====================
const partnerList = document.getElementById('partnerList');
const partnerName = document.getElementById('partnerName');
const partnerTag = document.getElementById('partnerTag');
const addPartnerBtn = document.getElementById('addPartner');

// ====================
// UTILIDADES
// ====================
const formatMoney = n =>
  n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });

const hideAllSections = () => {
  posSection?.classList.add('hidden');
  productsSection?.classList.add('hidden');
  reportsSection?.classList.add('hidden');
  partnersSection?.classList.add('hidden');
};

// ====================
// CARGAR PRODUCTOS
// ====================
fetch('/api/products')
  .then(res => res.json())
  .then(data => {
    allProducts = data;
    renderProducts(data);
    renderProductAdmin(data);
  })
  .catch(console.error);

// ====================
// RENDER POS
// ====================
function renderProducts(products) {
  if (!productsDiv) return;

  productsDiv.innerHTML = '';

  products.forEach(p => {
    const card = document.createElement('div');
    card.className = 'bg-white p-4 rounded shadow';

    card.innerHTML = `
      <h3 class="font-bold text-lg">${p.name}</h3>
      <p>${formatMoney(p.price)}</p>
      <p class="text-sm text-gray-600">Stock: ${p.stock}</p>
    `;

    productsDiv.appendChild(card);
  });
}

// ====================
// RENDER ADMIN PRODUCTOS
// ====================
function renderProductAdmin(products) {
  if (!productList) return;

  productList.innerHTML = '';

  products.forEach(p => {
    const div = document.createElement('div');
    div.className =
      'bg-white p-3 rounded shadow flex justify-between items-center';

    div.innerHTML = `
      <div>
        <strong>${p.name}</strong>
        <p class="text-sm">${formatMoney(p.price)} | Stock: ${p.stock}</p>
      </div>
      <div class="flex gap-2">
        <button class="edit bg-yellow-500 text-white px-2 py-1 rounded">Editar</button>
        <button class="delete bg-red-600 text-white px-2 py-1 rounded">Eliminar</button>
      </div>
    `;

    // ELIMINAR
    div.querySelector('.delete').onclick = async () => {
      if (!confirm(`Eliminar ${p.name}?`)) return;

      const res = await fetch(`/api/products/${p._id}`, { method: 'DELETE' });
      if (res.ok) {
        allProducts = allProducts.filter(x => x._id !== p._id);
        renderProducts(allProducts);
        renderProductAdmin(allProducts);
      }
    };

    // EDITAR
    div.querySelector('.edit').onclick = async () => {
      const name = prompt('Nombre', p.name);
      const price = prompt('Precio', p.price);
      const stock = prompt('Stock', p.stock);

      if (!name || !price || !stock) return;

      const res = await fetch(`/api/products/${p._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          price: Number(price),
          stock: Number(stock)
        })
      });

      if (res.ok) {
        const updated = await res.json();
        allProducts = allProducts.map(x =>
          x._id === updated._id ? updated : x
        );
        renderProducts(allProducts);
        renderProductAdmin(allProducts);
      }
    };

    productList.appendChild(div);
  });
}


function renderCart() {
  cartTable.innerHTML = '';

  if (cart.length === 0) {
    cartTable.innerHTML = `
      <tr class="text-center text-gray-400">
        <td colspan="4" class="py-6">Sin productos</td>
      </tr>
    `;
    totalSpan.textContent = formatMoney(0);
    return;
  }

  let total = 0;

  cart.forEach((item, index) => {
    const subtotal = item.price * item.qty;
    total += subtotal;

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${item.name}</td>
      <td class="text-right">${formatMoney(item.price)}</td>
      <td class="text-center">${item.qty}</td>
      <td class="text-right flex justify-end gap-2">
        ${formatMoney(subtotal)}
        <button 
          onclick="removeFromCart(${index})"
          class="text-red-600 font-bold px-2">
          ✖
        </button>
      </td>
    `;
    cartTable.appendChild(tr);
  });

  // 🔥 AQUÍ ESTABA EL PROBLEMA
  totalSpan.textContent = formatMoney(total);
  // Recalcular cambio si ya escribió efectivo
if (cashInput.value) {
  const cash = Number(cashInput.value);
  const total = getTotal();

  changeSpan.textContent =
    cash >= total ? formatMoney(cash - total) : formatMoney(0);
}

}


// ====================
// BUSCADOR
// ====================
searchInput?.addEventListener('input', e => {
  const value = e.target.value.trim().toLowerCase();

  if (!value) {
    renderProducts(allProducts);
    return;
  }

  if (value.startsWith('#')) {
    const tag = value.slice(1);
    renderProducts(allProducts.filter(p => p.tags?.includes(tag)));
  } else {
    renderProducts(
      allProducts.filter(p =>
        p.name.toLowerCase().includes(value)
      )
    );
  }
});

// ====================
// AGREGAR PRODUCTO
// ====================
document.getElementById('addProduct')?.addEventListener('click', async () => {
  const barcode = barcodeInput.value.trim();
  const name = nameInput.value.trim();
  const price = Number(priceInput.value);
  const stock = Number(stockInput.value);
  const tags = tagsInput.value
    .split(',')
    .map(t => t.trim().toLowerCase())
    .filter(Boolean);

  if (!barcode || !name || !price || !stock) {
    alert('Completa todos los campos');
    return;
  }

  const res = await fetch('/api/products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      barcode,   // 👈 CLAVE
      name,
      price,
      stock,
      tags
    })
  });

  if (res.ok) {
    const newProduct = await res.json();
    allProducts.push(newProduct);
    renderProducts(allProducts);
    renderProductAdmin(allProducts);

    barcodeInput.value = '';
    nameInput.value = '';
    priceInput.value = '';
    stockInput.value = '';
    tagsInput.value = '';
  }
});

// ====================
// SOCIOS
// ====================
const loadPartners = async () => {
  if (!partnerList) return;
  const res = await fetch('/api/partners');
  allPartners = await res.json();
  renderPartners(allPartners);
};

function renderPartners(partners) {
  partnerList.innerHTML = '';

  partners.forEach(p => {
    const div = document.createElement('div');
    div.className = 'bg-white p-3 rounded shadow flex justify-between';

    div.innerHTML = `
      <div>
        <strong>${p.name}</strong>
        <span class="text-gray-500">#${p.tag}</span>
      </div>
      <button class="bg-red-600 text-white px-2 py-1 rounded">Eliminar</button>
    `;

    div.querySelector('button').onclick = async () => {
      if (!confirm(`Eliminar socio ${p.name}?`)) return;
      await fetch(`/api/partners/${p._id}`, { method: 'DELETE' });
      loadPartners();
    };

    partnerList.appendChild(div);
  });
}

addPartnerBtn?.addEventListener('click', async () => {
  const name = partnerName.value.trim();
  const tag = partnerTag.value.trim().toLowerCase();

  if (!name || !tag) {
    alert('Completa los campos');
    return;
  }

  await fetch('/api/partners', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, tag })
  });

  partnerName.value = '';
  partnerTag.value = '';
  loadPartners();
});

// ====================
// MENU
// ====================
btnPOS.onclick = () => {
  hideAllSections();
  posSection.classList.remove('hidden');
};

btnProducts.onclick = () => {
  hideAllSections();
  productsSection.classList.remove('hidden');
};

btnReports.onclick = () => {
  hideAllSections();
  reportsSection.classList.remove('hidden');
};

btnPartners.onclick = () => {
  hideAllSections();
  partnersSection.classList.remove('hidden');
  loadPartners();
};

// ====================
// EXPORTAR A EXCEL
// ====================
function exportarExcel() {
  const ventas = JSON.parse(localStorage.getItem('ventas')) || [];

  if (ventas.length === 0) {
    alert('No hay ventas para exportar');
    return;
  }

  const totales = {};

  ventas.forEach(v => {
    totales[v.socio] = (totales[v.socio] || 0) + v.total;
  });

  let csv = 'Socio,Total\n';
  let totalGeneral = 0;

  for (let socio in totales) {
    csv += `${socio},${totales[socio]}\n`;
    totalGeneral += totales[socio];
  }

  csv += `TOTAL,${totalGeneral}\n`;

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = 'reporte_ventas.csv';
  link.click();

  URL.revokeObjectURL(url);
}

barcodeInput?.addEventListener('keydown', e => {
  if (e.key !== 'Enter') return;

  e.preventDefault();

  const codigo = barcodeInput.value.trim();
  if (!codigo) return;

  // 🔍 Buscar producto por código de barras
  const producto = allProducts.find(p => p.barcode === codigo);

  if (producto) {
    // ✅ AUTORELLENAR CAMPOS
    nameInput.value = producto.name;
    priceInput.value = producto.price;
    stockInput.value = producto.stock;
    tagsInput.value = (producto.tags || []).join(',');

    alert(`✅ Producto encontrado: ${producto.name}`);
  } else {
    // 🆕 PRODUCTO NUEVO
    alert('🆕 Producto nuevo, completa los datos');
    nameInput.value = '';
    priceInput.value = '';
    stockInput.value = '';
    tagsInput.value = '';
    nameInput.focus();
  }
});

barcodeInputPOS?.addEventListener('keydown', e => {
  if (e.key !== 'Enter') return;

  e.preventDefault();

  const codigo = barcodeInputPOS.value.trim();
  if (!codigo) return;

  const producto = allProducts.find(p => p.barcode === codigo);

  if (!producto) {
    alert('❌ Producto no encontrado');
    barcodeInputPOS.value = '';
    return;
  }

  

  const item = cart.find(i => i._id === producto._id);

  if (item) {
    item.qty++;
  } else {
    cart.push({
      _id: producto._id,
      name: producto.name,
      price: Number(producto.price),


      qty: 1
    });
  }

  renderCart();
  barcodeInputPOS.value = '';
});

function removeFromCart(index) {
  if (!cart[index]) return;

  if (cart[index].qty > 1) {

    cart[index].qty--;
  } else {
    cart.splice(index, 1);
  }

  renderCart();
}


function addToCart(producto) {
  const item = cart.find(p => p._id === producto._id);

  if (item) {
    item.qty++;
  } else {
    cart.push({
      _id: producto._id,
      name: producto.name,
      price: producto.price,
      qty: 1
    });
  }

  renderCart();
}



checkoutBtn.addEventListener('click', async () => {
  if (cart.length === 0) {
    alert('❌ No hay productos');
    return;
  }

  const total = getTotal();
  const cash = Number(cashInput.value);

  if (cash < total) {
    alert('❌ El pago es insuficiente');
    return;
  }

  const products = cart.map(item => ({
    product: item._id,
    quantity: item.qty
  }));

  const paymentMethod = 'efectivo';

  try {
    const res = await fetch('/api/sales', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ products, paymentMethod })
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.message || 'Error al guardar venta');
      return;
    }

    alert(`✅ Venta realizada\nCambio: ${formatMoney(cash - total)}`);

    // 🔄 LIMPIAR TODO
    cart = [];
    cashInput.value = '';
    changeSpan.textContent = formatMoney(0);
    renderCart();

  } catch (error) {
    console.error(error);
    alert('❌ Error de servidor');
  }
});



function getTotal() {
  return cart.reduce((sum, item) => sum + item.price * item.qty, 0);
}


cashInput.addEventListener('input', () => {
  const total = getTotal();
  const cash = Number(cashInput.value);

  if (isNaN(cash) || cash < total) {
    changeSpan.textContent = formatMoney(0);
    return;
  }

  const change = cash - total;
  changeSpan.textContent = formatMoney(change);
});

