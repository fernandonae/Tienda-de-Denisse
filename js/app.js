// ====================
// 🌍 CONEXIÓN AL SERVIDOR (RENDER)
// ====================
const API_URL = 'https://tienda-de-denisse.onrender.com/api'; 

// Variables Globales
let allProducts = [];
let allPartners = [];
let cart = [];

// ====================
// ELEMENTOS DEL DOM
// ====================
// Inputs y Tablas
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

// Botones Menú
const btnPOS = document.getElementById('btnPOS');
const btnProducts = document.getElementById('btnProducts');
const btnReports = document.getElementById('btnReports');
const btnPartners = document.getElementById('btnPartners');

// Secciones
const posSection = document.getElementById('posSection');
const productsSection = document.getElementById('productsSection');
const reportsSection = document.getElementById('reportsSection');
const partnersSection = document.getElementById('partnersSection');

// Formulario Productos
const nameInput = document.getElementById('nameInput');
const priceInput = document.getElementById('priceInput');
const stockInput = document.getElementById('stockInput');
const tagsInput = document.getElementById('tagsInput');

// Formulario Socios
const partnerList = document.getElementById('partnerList');
const partnerName = document.getElementById('partnerName');
const partnerTag = document.getElementById('partnerTag');
const addPartnerBtn = document.getElementById('addPartner');

// Elementos de Reportes (NUEVO)
const btnReporteDia = document.getElementById('btnReporteDia');
const resultadoDia = document.getElementById('resultadoDia');
const btnReporteRango = document.getElementById('btnReporteRango');
const resultadoRango = document.getElementById('resultadoRango');
const startDateInput = document.getElementById('startDate');
const endDateInput = document.getElementById('endDate');

// ====================
// UTILIDADES
// ====================
const formatMoney = n => n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });

const hideAllSections = () => {
  posSection?.classList.add('hidden');
  productsSection?.classList.add('hidden');
  reportsSection?.classList.add('hidden');
  partnersSection?.classList.add('hidden');
};

// ====================
// 🚀 INICIALIZACIÓN
// ====================
document.addEventListener('DOMContentLoaded', () => {
    fetchProducts();
    fetchPartners();
});

// Función para traer productos
async function fetchProducts() {
    try {
        const res = await fetch(`${API_URL}/products`);
        if (!res.ok) throw new Error('Error cargando productos');
        allProducts = await res.json();
        renderProducts(allProducts);
        renderProductAdmin(allProducts);
    } catch (error) {
        console.error(error);
        alert('Error conectando con el servidor. Revisa tu internet.');
    }
}

// Función para traer socios
async function fetchPartners() {
    try {
        const res = await fetch(`${API_URL}/partners`);
        if(res.ok) {
            allPartners = await res.json();
            renderPartners(allPartners);
        }
    } catch (error) {
        console.error(error);
    }
}

// ====================
// VISTAS DE PRODUCTOS
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
        <button class="delete bg-red-600 text-white px-2 py-1 rounded">Eliminar</button>
      </div>
    `;

    // ELIMINAR
    div.querySelector('.delete').onclick = async () => {
      if (!confirm(`Eliminar ${p.name}?`)) return;
      try {
          await fetch(`${API_URL}/products/${p._id}`, { method: 'DELETE' });
          fetchProducts();
      } catch (err) {
          alert('Error al eliminar');
      }
    };
    productList.appendChild(div);
  });
}

// ====================
// LOGICA DE CARRITO
// ====================
function renderCart() {
  cartTable.innerHTML = '';
  if (cart.length === 0) {
    cartTable.innerHTML = `<tr class="text-center text-gray-400"><td colspan="4" class="py-6">Sin productos</td></tr>`;
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

function removeFromCart(index) {
  if (!cart[index]) return;
  cart[index].qty > 1 ? cart[index].qty-- : cart.splice(index, 1);
  renderCart();
}

function addToCart(producto) {
  const item = cart.find(p => p._id === producto._id);
  if (item) {
      if(item.qty + 1 > producto.stock) { alert('Stock insuficiente'); return; }
    item.qty++;
  } else {
    cart.push({ _id: producto._id, name: producto.name, price: producto.price, qty: 1 });
  }
  renderCart();
}

function getTotal() { return cart.reduce((sum, item) => sum + item.price * item.qty, 0); }

// ====================
// GUARDAR PRODUCTO (NUEVO)
// ====================
document.getElementById('addProduct')?.addEventListener('click', async () => {
  const barcode = barcodeInput.value.trim();
  const name = nameInput.value.trim();
  const price = Number(priceInput.value);
  const stock = Number(stockInput.value);
  const tags = tagsInput.value.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);

  if (!barcode || !name || !price || !stock) {
    alert('Completa todos los campos');
    return;
  }

  try {
      const res = await fetch(`${API_URL}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ barcode, name, price, stock, tags })
      });

      if (res.ok) {
        alert('Producto guardado en la nube ☁️');
        fetchProducts();
        // Limpiar
        barcodeInput.value = ''; nameInput.value = ''; priceInput.value = ''; 
        stockInput.value = ''; tagsInput.value = '';
      } else {
          alert('Error al guardar. Código de barras duplicado.');
      }
  } catch (error) {
      console.error(error);
      alert('Error de conexión');
  }
});

// ====================
// GUARDAR SOCIO
// ====================
function renderPartners(partners) {
  partnerList.innerHTML = '';
  partners.forEach(p => {
    const div = document.createElement('div');
    div.className = 'bg-white p-3 rounded shadow flex justify-between';
    div.innerHTML = `
      <div><strong>${p.name}</strong> <span class="text-gray-500">#${p.tag}</span></div>
      <button class="bg-red-600 text-white px-2 py-1 rounded delete-partner">Eliminar</button>
    `;
    div.querySelector('.delete-partner').onclick = async () => {
      if (!confirm(`Eliminar socio ${p.name}?`)) return;
      await fetch(`${API_URL}/partners/${p._id}`, { method: 'DELETE' });
      fetchPartners();
    };
    partnerList.appendChild(div);
  });
}

addPartnerBtn?.addEventListener('click', async () => {
  const name = partnerName.value.trim();
  const tag = partnerTag.value.trim().toLowerCase();

  if (!name || !tag) { alert('Completa los campos'); return; }

  try {
    const res = await fetch(`${API_URL}/partners`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, tag })
    });
    if(res.ok) {
        partnerName.value = '';
        partnerTag.value = '';
        fetchPartners();
    } else {
        alert('Error al guardar socio');
    }
  } catch (error) {
      alert('Error de red');
  }
});

// ====================
// NAVEGACIÓN
// ====================
btnPOS.onclick = () => { hideAllSections(); posSection.classList.remove('hidden'); };
btnProducts.onclick = () => { hideAllSections(); productsSection.classList.remove('hidden'); };
btnReports.onclick = () => { hideAllSections(); reportsSection.classList.remove('hidden'); };
btnPartners.onclick = () => { hideAllSections(); partnersSection.classList.remove('hidden'); fetchPartners(); };

// ====================
// CAJA Y BÚSQUEDA
// ====================
searchInput?.addEventListener('input', e => {
  const value = e.target.value.trim().toLowerCase();
  if (!value) { renderProducts(allProducts); return; }
  if (value.startsWith('#')) {
    const tag = value.slice(1);
    renderProducts(allProducts.filter(p => p.tags?.includes(tag)));
  } else {
    renderProducts(allProducts.filter(p => p.name.toLowerCase().includes(value)));
  }
});

barcodeInputPOS?.addEventListener('keydown', e => {
  if (e.key !== 'Enter') return;
  e.preventDefault();
  const codigo = barcodeInputPOS.value.trim();
  const producto = allProducts.find(p => p.barcode === codigo);
  
  if (!producto) { alert('❌ No encontrado'); barcodeInputPOS.value = ''; return; }
  if (producto.stock <= 0) { alert('⚠️ Sin stock'); return; }

  addToCart(producto);
  barcodeInputPOS.value = '';
});

cashInput.addEventListener('input', () => {
  const total = getTotal();
  const cash = Number(cashInput.value);
  if (isNaN(cash) || cash < total) { changeSpan.textContent = formatMoney(0); return; }
  changeSpan.textContent = formatMoney(cash - total);
});

// ====================
// CHECKOUT (VENTA)
// ====================
checkoutBtn.addEventListener('click', async () => {
  if (cart.length === 0) return;
  const total = getTotal();
  const cash = Number(cashInput.value);
  if (cash < total) { alert('❌ Pago insuficiente'); return; }

  const products = cart.map(item => ({ product: item._id, quantity: item.qty }));

  try {
      const res = await fetch(`${API_URL}/sales`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ products, paymentMethod: 'efectivo' })
      });

      if(res.ok) {
          alert(`✅ Venta realizada\nCambio: ${formatMoney(cash - total)}`);
          cart = [];
          cashInput.value = '';
          changeSpan.textContent = formatMoney(0);
          renderCart();
          fetchProducts(); // Actualizar stock
      } else {
          alert('Error al guardar venta');
      }
  } catch (error) {
      alert('Error de conexión');
  }
});

// ====================
// 📊 REPORTES (LÓGICA NUEVA)
// ====================

// --- REPORTE DEL DÍA (HOY) ---
btnReporteDia?.addEventListener('click', async () => {
    resultadoDia.classList.remove('hidden');
    resultadoDia.innerHTML = '<p class="text-gray-500 animate-pulse">Cargando ventas...</p>';

    try {
        const res = await fetch(`${API_URL}/sales`);
        if (!res.ok) throw new Error('Error al obtener ventas');
        const ventas = await res.json();
        
        // Fecha de HOY (Formato YYYY-MM-DD local)
        const hoy = new Date().toLocaleDateString('en-CA'); 

        // Filtramos ventas de hoy
        const ventasHoy = ventas.filter(venta => {
            const fechaVenta = venta.createdAt.substring(0, 10);
            return fechaVenta === hoy;
        });

        mostrarResultados(ventasHoy, resultadoDia);

    } catch (error) {
        console.error(error);
        resultadoDia.innerHTML = '<p class="text-red-500">Error al cargar datos.</p>';
    }
});

// --- REPORTE POR RANGO ---
btnReporteRango?.addEventListener('click', async () => {
    const inicio = startDateInput.value;
    const fin = endDateInput.value;

    if (!inicio || !fin) { alert('Selecciona ambas fechas'); return; }

    resultadoRango.classList.remove('hidden');
    resultadoRango.innerHTML = '<p class="text-gray-500 animate-pulse">Calculando...</p>';

    try {
        const res = await fetch(`${API_URL}/sales`);
        const ventas = await res.json();

        // Filtramos por rango
        const ventasRango = ventas.filter(venta => {
            const fechaVenta = venta.createdAt.substring(0, 10);
            return fechaVenta >= inicio && fechaVenta <= fin;
        });

        mostrarResultados(ventasRango, resultadoRango);
    } catch (error) {
        resultadoRango.innerHTML = '<p class="text-red-500">Error al cargar datos.</p>';
    }
});

// --- CÁLCULO DE TOTALES POR SOCIO ---
function mostrarResultados(listaVentas, contenedorDiv) {
    if (listaVentas.length === 0) {
        contenedorDiv.innerHTML = '<p class="text-center text-gray-500">No hubo ventas en este periodo.</p>';
        return;
    }

    let totalGeneral = 0;
    const porSocio = {}; 

    listaVentas.forEach(v => {
        totalGeneral += v.total;
        
        v.products.forEach(item => {
            // Buscamos el producto en la lista local para saber sus tags
            const productoInfo = allProducts.find(p => p._id === item.product); 
            
            if (productoInfo && productoInfo.tags && productoInfo.tags.length > 0) {
                // Tomamos el primer tag como el Socio (ej: 'M' o 'P')
                const tagSocio = productoInfo.tags[0].toUpperCase(); 
                
                // Calculamos monto (Precio x Cantidad)
                const subtotal = productoInfo.price * item.quantity;

                if (porSocio[tagSocio]) {
                    porSocio[tagSocio] += subtotal;
                } else {
                    porSocio[tagSocio] = subtotal;
                }
            } else {
                // Sin tag
                if (!porSocio['GENERAL']) porSocio['GENERAL'] = 0;
                const precio = productoInfo ? productoInfo.price : 0;
                porSocio['GENERAL'] += precio * item.quantity;
            }
        });
    });

    // Construir HTML
    let html = `
        <div class="flex justify-between items-center border-b pb-2 mb-2">
            <span class="text-lg font-bold text-gray-700">TOTAL:</span>
            <span class="text-2xl font-bold text-green-600">${formatMoney(totalGeneral)}</span>
        </div>
        <div class="text-sm text-gray-600 space-y-1">
            <p class="font-bold mb-1">Desglose por Socio:</p>
    `;

    for (const [tag, monto] of Object.entries(porSocio)) {
        html += `
            <div class="flex justify-between">
                <span class="uppercase">👤 ${tag}</span>
                <span class="font-medium">${formatMoney(monto)}</span>
            </div>
        `;
    }
    html += `</div>`;
    contenedorDiv.innerHTML = html;
}

// ====================
// EXPORTAR A EXCEL (CSV)
// ====================
window.exportarExcel = async function() {
    try {
        const res = await fetch(`${API_URL}/sales`);
        if (!res.ok) throw new Error('Error al bajar historial');
        const ventas = await res.json();

        if (ventas.length === 0) { alert('No hay ventas para exportar'); return; }

        let csv = 'Fecha,Total,Detalle\n';
        ventas.forEach(v => {
            const fecha = v.createdAt.substring(0, 10);
            // Creamos un resumen simple de productos
            const detalle = v.products.map(p => {
               const info = allProducts.find(prod => prod._id === p.product);
               return info ? `${info.name} (${p.quantity})` : 'Producto borrado';
            }).join(' | ');
            
            csv += `${fecha},${v.total},"${detalle}"\n`;
        });

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Reporte_Ventas_${new Date().toLocaleDateString('en-CA')}.csv`;
        link.click();
    } catch (error) {
        alert('Error al generar Excel');
    }
};