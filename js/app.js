// ====================
// VARIABLES GLOBALES (Cargadas desde LocalStorage)
// ====================
let allProducts = JSON.parse(localStorage.getItem('misProductos')) || [];
let allPartners = JSON.parse(localStorage.getItem('misSocios')) || [];
let cart = [];

// ====================
// ELEMENTOS DEL DOM
// ====================
const barcodeInput = document.getElementById('barcodeInput');
const productsDiv = document.getElementById('products');
const productList = document.getElementById('productList');
const searchInput = document.getElementById('search');
const barcodeInputPOS = document.getElementById('barcodeInputPOS');
const cartTable = document.getElementById('cartTable');
const totalSpan = document.getElementById('total');
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

const nameInput = document.getElementById('nameInput');
const priceInput = document.getElementById('priceInput');
const stockInput = document.getElementById('stockInput');
const tagsInput = document.getElementById('tagsInput');

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

const guardarEnStorage = () => {
    localStorage.setItem('misProductos', JSON.stringify(allProducts));
    localStorage.setItem('misSocios', JSON.stringify(allPartners));
};

// ====================
// INICIALIZACIÓN
// ====================
// Cargar datos al iniciar
document.addEventListener('DOMContentLoaded', () => {
    renderProducts(allProducts);
    renderProductAdmin(allProducts);
    renderPartners(allPartners);
});

// ====================
// RENDER POS (Vista Vendedor)
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
// RENDER ADMIN PRODUCTOS (Vista Inventario)
// ====================
function renderProductAdmin(products) {
  if (!productList) return;
  productList.innerHTML = '';

  products.forEach(p => {
    const div = document.createElement('div');
    div.className = 'bg-white p-3 rounded shadow flex justify-between items-center';
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

    // ELIMINAR (Sin fetch, directo al array)
    div.querySelector('.delete').onclick = () => {
      if (!confirm(`Eliminar ${p.name}?`)) return;
      allProducts = allProducts.filter(x => x._id !== p._id);
      guardarEnStorage(); // Guardar cambios
      renderProducts(allProducts);
      renderProductAdmin(allProducts);
    };

    // EDITAR
    div.querySelector('.edit').onclick = () => {
      const name = prompt('Nombre', p.name);
      const price = prompt('Precio', p.price);
      const stock = prompt('Stock', p.stock);

      if (!name || !price || !stock) return;

      // Actualizar en el array
      const index = allProducts.findIndex(x => x._id === p._id);
      if(index !== -1){
          allProducts[index].name = name;
          allProducts[index].price = Number(price);
          allProducts[index].stock = Number(stock);
          guardarEnStorage(); // Guardar cambios
          renderProducts(allProducts);
          renderProductAdmin(allProducts);
      }
    };
    productList.appendChild(div);
  });
}

// ====================
// CARRITO DE COMPRAS
// ====================
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
        <button onclick="removeFromCart(${index})" class="text-red-600 font-bold px-2">✖</button>
      </td>
    `;
    cartTable.appendChild(tr);
  });

  totalSpan.textContent = formatMoney(total);
  
  if (cashInput.value) {
    const cash = Number(cashInput.value);
    const totalCalc = getTotal();
    changeSpan.textContent = cash >= totalCalc ? formatMoney(cash - totalCalc) : formatMoney(0);
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
    renderProducts(allProducts.filter(p => p.name.toLowerCase().includes(value)));
  }
});

// ====================
// AGREGAR PRODUCTO (NUEVO - SIN FETCH)
// ====================
document.getElementById('addProduct')?.addEventListener('click', () => {
  const barcode = barcodeInput.value.trim();
  const name = nameInput.value.trim();
  const price = Number(priceInput.value);
  const stock = Number(stockInput.value);
  const tags = tagsInput.value.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);

  if (!barcode || !name || !price || !stock) {
    alert('Completa todos los campos');
    return;
  }

  // Crear objeto producto
  const newProduct = {
      _id: Date.now(), // ID falso generado por tiempo
      barcode,
      name,
      price,
      stock,
      tags
  };

  allProducts.push(newProduct);
  guardarEnStorage(); // GUARDAR EN LOCALSTORAGE
  
  renderProducts(allProducts);
  renderProductAdmin(allProducts);

  // Limpiar campos
  barcodeInput.value = '';
  nameInput.value = '';
  priceInput.value = '';
  stockInput.value = '';
  tagsInput.value = '';
  alert('Producto guardado correctamente');
});

// ====================
// SOCIOS (SIN FETCH)
// ====================
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
      <button class="bg-red-600 text-white px-2 py-1 rounded delete-partner">Eliminar</button>
    `;
    
    div.querySelector('.delete-partner').onclick = () => {
      if (!confirm(`Eliminar socio ${p.name}?`)) return;
      allPartners = allPartners.filter(x => x._id !== p._id);
      guardarEnStorage();
      renderPartners(allPartners);
    };
    partnerList.appendChild(div);
  });
}

addPartnerBtn?.addEventListener('click', () => {
  const name = partnerName.value.trim();
  const tag = partnerTag.value.trim().toLowerCase();

  if (!name || !tag) {
    alert('Completa los campos');
    return;
  }

  allPartners.push({ _id: Date.now(), name, tag });
  guardarEnStorage();
  
  partnerName.value = '';
  partnerTag.value = '';
  renderPartners(allPartners);
});

// ====================
// MENU DE NAVEGACIÓN
// ====================
btnPOS.onclick = () => { hideAllSections(); posSection.classList.remove('hidden'); };
btnProducts.onclick = () => { hideAllSections(); productsSection.classList.remove('hidden'); };
btnReports.onclick = () => { hideAllSections(); reportsSection.classList.remove('hidden'); };
btnPartners.onclick = () => { hideAllSections(); partnersSection.classList.remove('hidden'); renderPartners(allPartners); };

// ====================
// LÓGICA DE COBRO (POS)
// ====================
barcodeInput?.addEventListener('keydown', e => {
  if (e.key !== 'Enter') return;
  e.preventDefault();
  const codigo = barcodeInput.value.trim();
  if (!codigo) return;
  
  const producto = allProducts.find(p => p.barcode === codigo);
  if (producto) {
    nameInput.value = producto.name;
    priceInput.value = producto.price;
    stockInput.value = producto.stock;
    tagsInput.value = (producto.tags || []).join(',');
    alert(`✅ Producto encontrado: ${producto.name}`);
  } else {
    alert('🆕 Producto nuevo, completa los datos');
    nameInput.value = ''; priceInput.value = ''; stockInput.value = ''; tagsInput.value = '';
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
  
  // Verificar stock antes de agregar
  if (producto.stock <= 0) {
      alert('⚠️ Sin stock');
      return;
  }

  addToCart(producto);
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
      // Validar stock en carrito
      if(item.qty + 1 > producto.stock) {
          alert('No hay suficiente stock');
          return;
      }
    item.qty++;
  } else {
    cart.push({ _id: producto._id, name: producto.name, price: producto.price, qty: 1 });
  }
  renderCart();
}

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
  changeSpan.textContent = formatMoney(cash - total);
});

// ====================
// FINALIZAR VENTA (CHECKOUT)
// ====================
checkoutBtn.addEventListener('click', () => {
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

  // DESCONTAR STOCK REALMENTE
  cart.forEach(cartItem => {
      const productIndex = allProducts.findIndex(p => p._id === cartItem._id);
      if(productIndex !== -1) {
          allProducts[productIndex].stock -= cartItem.qty;
      }
  });

  // Guardar Venta en Historial (LocalStorage)
  const nuevaVenta = {
      id: Date.now(),
      fecha: new Date().toISOString(),
      total: total,
      productos: cart
  };
  const historialVentas = JSON.parse(localStorage.getItem('ventas')) || [];
  historialVentas.push(nuevaVenta);
  localStorage.setItem('ventas', JSON.stringify(historialVentas));

  // Guardar actualización de stock
  guardarEnStorage();

  alert(`✅ Venta realizada\nCambio: ${formatMoney(cash - total)}`);

  // Limpiar
  cart = [];
  cashInput.value = '';
  changeSpan.textContent = formatMoney(0);
  renderCart();
  renderProducts(allProducts); // Actualizar vista de stock
});

// ====================
// EXPORTAR EXCEL
// ====================
window.exportarExcel = function() {
  const ventas = JSON.parse(localStorage.getItem('ventas')) || [];
  if (ventas.length === 0) {
    alert('No hay ventas para exportar');
    return;
  }
  
  // Aquí puedes agregar tu lógica de exportación...
  // Por simplicidad, solo exportamos un log
  console.log("Ventas:", ventas);
  alert("Revisa la consola (F12) para ver los datos de ventas crudos.");
};