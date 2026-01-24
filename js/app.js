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

// Elementos de Reportes
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

async function fetchProducts() {
    try {
        const res = await fetch(`${API_URL}/products`);
        if (!res.ok) throw new Error('Error cargando productos');
        allProducts = await res.json();
        // Aseguramos que los precios sean números
        allProducts = allProducts.map(p => ({...p, price: Number(p.price)}));
        
        renderProducts(allProducts);
        renderProductAdmin(allProducts);
    } catch (error) {
        console.error(error);
        alert('Error conectando con el servidor. Revisa tu internet.');
    }
}

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
// LOGICA DE CARRITO Y CAJA
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
    const subtotal = Number(item.price) * Number(item.qty);
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
    // IMPORTANTE: Aseguramos que price sea número
    cart.push({ 
        _id: producto._id, 
        name: producto.name, 
        price: Number(producto.price), 
        qty: 1 
    });
  }
  renderCart();
}

function getTotal() { return cart.reduce((sum, item) => sum + (Number(item.price) * item.qty), 0); }

// ====================
// GUARDAR PRODUCTO
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
// SOCIOS
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
        partnerName.value = ''; partnerTag.value = ''; fetchPartners();
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
// BÚSQUEDA Y ESCÁNER
// ====================
searchInput?.addEventListener('input', e => {
  const texto = e.target.value.trim().toLowerCase();
  if (!texto) { renderProducts(allProducts); return; }

  const filtrados = allProducts.filter(p => {
    const nombre = p.name ? p.name.toLowerCase() : '';
    const codigo = p.barcode ? String(p.barcode).toLowerCase() : '';
    
    if (nombre.includes(texto) || codigo.includes(texto)) return true;
    if (p.tags && Array.isArray(p.tags)) {
        return p.tags.some(tag => tag.toLowerCase().includes(texto));
    }
    return false;
  });
  renderProducts(filtrados);
});

barcodeInputPOS?.addEventListener('keydown', e => {
  if (e.key !== 'Enter') return;
  e.preventDefault();
  
  const codigo = barcodeInputPOS.value.trim();
  const producto = allProducts.find(p => String(p.barcode).trim() === codigo);
  
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
// CHECKOUT
// ====================
checkoutBtn.addEventListener('click', async () => {
  if (cart.length === 0) return;
  const total = getTotal();
  const cash = Number(cashInput.value);
  if (cash < total) { alert('❌ Pago insuficiente'); return; }

  // Enviamos price al backend
  const products = cart.map(item => ({ 
      product: item._id, 
      quantity: item.qty,
      price: Number(item.price)
  }));

  try {
      const res = await fetch(`${API_URL}/sales`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
              products, 
              total: total, 
              paymentMethod: 'efectivo' 
          })
      });

      if(res.ok) {
          alert(`✅ Venta realizada\nCambio: ${formatMoney(cash - total)}`);
          cart = [];
          cashInput.value = '';
          changeSpan.textContent = formatMoney(0);
          renderCart();
          fetchProducts(); 
      } else {
          const errorData = await res.json();
          alert('Error al guardar venta: ' + (errorData.message || 'Desconocido'));
      }
  } catch (error) {
      alert('Error de conexión');
  }
});

// ====================
// 📊 REPORTES (PROTEGIDO - ANTI ERROR NULL)
// ====================

btnReporteDia?.addEventListener('click', async () => {
    resultadoDia.classList.remove('hidden');
    resultadoDia.innerHTML = '<p class="text-gray-500 animate-pulse">Cargando ventas...</p>';

    try {
        const res = await fetch(`${API_URL}/sales`);
        if (!res.ok) throw new Error('Error al obtener ventas');
        const ventas = await res.json();
        
        const hoy = new Date().toLocaleDateString('en-CA'); 
        
        const ventasHoy = ventas.filter(venta => {
            if(!venta.createdAt) return false;
            return venta.createdAt.substring(0, 10) === hoy;
        });

        mostrarResultados(ventasHoy, resultadoDia);

    } catch (error) {
        console.error(error);
        resultadoDia.innerHTML = `<p class="text-red-500">Error: ${error.message}</p>`;
    }
});

btnReporteRango?.addEventListener('click', async () => {
    const inicio = startDateInput.value;
    const fin = endDateInput.value;
    if (!inicio || !fin) { alert('Selecciona ambas fechas'); return; }

    resultadoRango.classList.remove('hidden');
    resultadoRango.innerHTML = '<p class="text-gray-500 animate-pulse">Calculando...</p>';

    try {
        const res = await fetch(`${API_URL}/sales`);
        const ventas = await res.json();
        
        const ventasRango = ventas.filter(venta => {
            if(!venta.createdAt) return false;
            const f = venta.createdAt.substring(0, 10);
            return f >= inicio && f <= fin;
        });

        mostrarResultados(ventasRango, resultadoRango);
    } catch (error) {
        resultadoRango.innerHTML = `<p class="text-red-500">Error: ${error.message}</p>`;
    }
});

function mostrarResultados(listaVentas, contenedorDiv) {
    if (listaVentas.length === 0) {
        contenedorDiv.innerHTML = '<p class="text-center text-gray-500">No hubo ventas.</p>';
        return;
    }

    let totalGeneral = 0;
    const porSocio = {}; 

    listaVentas.forEach(v => {
        totalGeneral += Number(v.total);
        
        if (v.products && Array.isArray(v.products)) {
            v.products.forEach(item => {
                // 🔥 PROTECCIÓN: Si el producto es null, saltamos al siguiente
                if (!item.product) {
                    console.warn("Venta con producto nulo (borrado)", v);
                    // Opcional: Sumar a GENERAL lo que se pueda si item.price existe
                    if(item.price) porSocio['GENERAL'] = (porSocio['GENERAL'] || 0) + (item.price * item.quantity);
                    return; 
                }

                // Extraer ID (puede venir como string o como objeto populated)
                const idProd = item.product._id || item.product;
                
                // Buscar producto en memoria (forzando String)
                const productoInfo = allProducts.find(p => String(p._id) === String(idProd)); 
                
                // Usamos el precio guardado en la venta o el actual
                let precio = Number(item.price) || 0; 
                if(precio === 0 && productoInfo) precio = Number(productoInfo.price);

                const subtotal = precio * item.quantity;
                let tagSocio = 'GENERAL';

                if (productoInfo && productoInfo.tags && productoInfo.tags.length > 0) {
                    tagSocio = productoInfo.tags[0].toUpperCase();
                }

                porSocio[tagSocio] = (porSocio[tagSocio] || 0) + subtotal;
            });
        }
    });

    let html = `
        <div class="flex justify-between items-center border-b pb-2 mb-2">
            <span class="text-lg font-bold text-gray-700">TOTAL:</span>
            <span class="text-2xl font-bold text-green-600">${formatMoney(totalGeneral)}</span>
        </div>
        <div class="text-sm text-gray-600 space-y-1">
            <p class="font-bold mb-1">Desglose:</p>
    `;

    let sumaDesglosada = 0;
    for (const [tag, monto] of Object.entries(porSocio)) {
        sumaDesglosada += monto;
        html += `<div class="flex justify-between"><span class="uppercase">👤 ${tag}</span><span class="font-medium">${formatMoney(monto)}</span></div>`;
    }

    if (totalGeneral > sumaDesglosada) {
         html += `<div class="flex justify-between text-orange-500"><span class="uppercase">⚠️ Prod. Borrados</span><span class="font-medium">${formatMoney(totalGeneral - sumaDesglosada)}</span></div>`;
    }

    html += `</div>`;
    contenedorDiv.innerHTML = html;
}

window.exportarExcel = async function() {
    try {
        const res = await fetch(`${API_URL}/sales`);
        if (!res.ok) throw new Error('Error al bajar historial');
        const ventas = await res.json();
        if (ventas.length === 0) { alert('No hay ventas'); return; }

        let csv = 'Fecha,Total,Detalle\n';
        ventas.forEach(v => {
            const fecha = v.createdAt ? v.createdAt.substring(0, 10) : 'Sin fecha';
            
            let detalle = 'Sin productos';
            if (v.products && Array.isArray(v.products)) {
                detalle = v.products.map(p => {
                   if(!p.product) return 'Producto Borrado'; // Protección aquí también
                   const idProd = p.product._id || p.product;
                   const info = allProducts.find(prod => String(prod._id) === String(idProd));
                   return info ? `${info.name} (${p.quantity})` : 'Borrado';
                }).join(' | ');
            }
            csv += `${fecha},${v.total},"${detalle}"\n`;
        });

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Ventas.csv`;
        link.click();
    } catch (error) {
        console.error(error);
        alert('Error al generar Excel: ' + error.message);
    }
};