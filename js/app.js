// ====================
// 🌍 CONEXIÓN AL SERVIDOR (RENDER)
// ====================
const API_URL = 'https://tienda-de-denisse.onrender.com/api'; 

// ====================
// VARIABLES GLOBALES
// ====================
let allProducts = [];
let allPartners = [];
let cart = [];
let productoEnEdicionId = null; // Variable para controlar la edición

// ====================
// ELEMENTOS DEL DOM
// ====================
// Inputs y Tablas
const barcodeInput = document.getElementById('barcodeInput');
const productsDiv = document.getElementById('products'); // Vista Tarjetas (POS)
const productList = document.getElementById('productList'); // Vista Lista (Admin)
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
const btnGuardarProducto = document.getElementById('addProduct'); // El botón de guardar

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
    console.log("App iniciada 🚀");
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

// 1. VISTA TARJETAS (POS)
// ====================
// 1. VISTA TARJETAS (POS) - CON CLIC
// ====================
// ====================
// 1. VISTA TARJETAS (POS) - CON SEMÁFORO DE STOCK 🚦
// ====================
function renderProducts(products) {
  if (!productsDiv) return;
  productsDiv.innerHTML = '';
  
  products.forEach(p => {
    const card = document.createElement('div');
    
    // --- LÓGICA DEL SEMÁFORO ---
    let bordeColor = 'border-transparent';
    let estadoStock = '';
    let opacidad = 'opacity-100';
    let clickeable = true;

    // 1. Stock Crítico (1 a 5 unidades)
    if (p.stock > 0 && p.stock <= 5) {
        bordeColor = 'border-orange-400 bg-orange-50'; // Fondo naranjita
        estadoStock = '<span class="text-orange-600 font-bold text-xs animate-pulse">¡POCO STOCK!</span>';
    } 
    // 2. Agotado (0 o menos)
    else if (p.stock <= 0) {
        bordeColor = 'border-gray-200 bg-gray-100';
        opacidad = 'opacity-60'; // Se ve borroso
        estadoStock = '<span class="text-red-600 font-bold text-xs">AGOTADO</span>';
        clickeable = false;
    }

    // Clases base + dinámicas
    card.className = `p-4 rounded shadow hover:shadow-lg transition cursor-pointer border-2 ${bordeColor} ${opacidad} relative overflow-hidden`;
    
    card.innerHTML = `
      <div class="flex justify-between items-start">
          <h3 class="font-bold text-lg text-gray-800 leading-tight">${p.name}</h3>
          ${estadoStock}
      </div>
      
      <div class="flex justify-between items-center mt-3">
          <p class="text-pink-600 font-bold text-xl">${formatMoney(p.price)}</p>
          <p class="text-sm text-gray-600 font-medium">Stock: ${p.stock}</p>
      </div>
    `;

    // Solo permitimos clic si hay stock
    if (clickeable) {
        card.onclick = () => {
            const inputGranel = document.getElementById('bulkMoneyInput');
            const dineroCliente = inputGranel ? parseFloat(inputGranel.value) : 0;
            let cantidadAgregar = 1;

            if (dineroCliente > 0) {
                cantidadAgregar = dineroCliente / p.price;
                if(inputGranel) inputGranel.value = ''; 
            }

            // Validar stock antes de agregar
            addToCart(p, cantidadAgregar);

            // Efecto visual al clic
            card.style.transform = "scale(0.95)";
            setTimeout(() => card.style.transform = "scale(1)", 100);
        };
    } else {
        // Si está agotado, cursor de prohibido
        card.style.cursor = 'not-allowed';
    }

    productsDiv.appendChild(card);
  });
}
// 2. VISTA LISTA (ADMIN - CON BOTÓN EDITAR)
function renderProductAdmin(products) {
  if (!productList) return;
  productList.innerHTML = '';

  products.forEach(p => {
    const div = document.createElement('div');
    div.className = 'bg-white p-3 rounded shadow flex justify-between items-center mb-2 border-l-4 border-pink-200';
    div.innerHTML = `
      <div>
        <strong>${p.name}</strong>
        <p class="text-xs text-gray-500">${p.barcode}</p>
        <p class="text-sm">${formatMoney(p.price)} | Stock: ${p.stock}</p>
      </div>
      <div class="flex gap-2">
        <button class="edit bg-yellow-400 hover:bg-yellow-500 text-white px-3 py-1 rounded shadow">✏️</button>
        <button class="delete bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded shadow">🗑️</button>
      </div>
    `;

    // LOGICA EDITAR
    div.querySelector('.edit').onclick = () => {
        // Rellenar formulario
        barcodeInput.value = p.barcode;
        nameInput.value = p.name;
        priceInput.value = p.price;
        stockInput.value = p.stock;
        tagsInput.value = p.tags ? p.tags.join(',') : '';

        // Bloquear Barcode (ID único)
        barcodeInput.disabled = true;
        barcodeInput.classList.add('bg-gray-200');

        // Cambiar estado a EDICIÓN
        productoEnEdicionId = p._id;
        btnGuardarProducto.textContent = "🔄 Actualizar";
        btnGuardarProducto.classList.remove('bg-pink-600');
        btnGuardarProducto.classList.add('bg-yellow-500');

        // Subir scroll
        productsSection.scrollIntoView({ behavior: 'smooth' });
    };

    // LOGICA ELIMINAR
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
// GUARDAR / EDITAR PRODUCTO
// ====================
btnGuardarProducto?.addEventListener('click', async () => {
  const barcode = barcodeInput.value.trim();
  const name = nameInput.value.trim();
  const price = Number(priceInput.value);
  const stock = Number(stockInput.value);
  const tags = tagsInput.value.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);

  if (!barcode || !name || !price || !stock) {
    alert('Completa todos los campos');
    return;
  }

  btnGuardarProducto.disabled = true;

  try {
      let res;
      // ¿Estamos editando o creando?
      if (productoEnEdicionId) {
          // EDITAR (PUT)
          res = await fetch(`${API_URL}/products/${productoEnEdicionId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, price, stock, tags }) // No enviamos barcode
          });
      } else {
          // CREAR (POST)
          res = await fetch(`${API_URL}/products`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ barcode, name, price, stock, tags })
          });
      }

      if (res.ok) {
        alert(productoEnEdicionId ? 'Producto Actualizado 🔄' : 'Producto Guardado ✅');
        fetchProducts();
        
        // LIMPIAR FORMULARIO
        barcodeInput.value = ''; nameInput.value = ''; 
        priceInput.value = ''; stockInput.value = ''; tagsInput.value = '';
        
        // RESTAURAR ESTADO NORMAL
        productoEnEdicionId = null;
        barcodeInput.disabled = false;
        barcodeInput.classList.remove('bg-gray-200');
        btnGuardarProducto.textContent = "Guardar Producto";
        btnGuardarProducto.classList.add('bg-pink-600');
        btnGuardarProducto.classList.remove('bg-yellow-500');
      } else {
          const err = await res.json();
          alert('Error: ' + (err.message || 'Código duplicado'));
      }
  } catch (error) {
      console.error(error);
      alert('Error de conexión');
  } finally {
      btnGuardarProducto.disabled = false;
  }
});

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
    // Aquí construimos la fila
    tr.innerHTML = `
      <td>${item.name}</td>
      <td class="text-right">${formatMoney(item.price)}</td>
      
      <td class="text-center font-bold text-gray-700">
        ${item.qty < 1 ? Number(item.qty).toFixed(3) : Number(item.qty)}
      </td>

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

// Ahora la función recibe (producto, cantidad)
function addToCart(producto, cantidad = 1) {
  const item = cart.find(p => String(p._id) === String(producto._id));
  
  if (item) {
      // Sumamos la cantidad nueva (puede ser 1 o puede ser 0.25)
      if(item.qty + cantidad > producto.stock) { 
          alert('⚠️ Stock insuficiente'); 
          return; 
      }
      item.qty += cantidad; // Sumar decimales
  } else {
    cart.push({ 
        _id: producto._id, 
        name: producto.name, 
        price: Number(producto.price), 
        qty: cantidad // Guardamos la cantidad exacta
    });
  }
  
  renderCart();
}

function getTotal() { return cart.reduce((sum, item) => sum + (Number(item.price) * item.qty), 0); }

// ====================
// NAVEGACIÓN
// ====================
btnPOS.onclick = () => { hideAllSections(); posSection.classList.remove('hidden'); };
btnProducts.onclick = () => { hideAllSections(); productsSection.classList.remove('hidden'); };
btnReports.onclick = () => { hideAllSections(); reportsSection.classList.remove('hidden'); };
btnPartners.onclick = () => { hideAllSections(); partnersSection.classList.remove('hidden'); fetchPartners(); };

// ====================
// 🔍 BUSCADOR (ARREGLADO)
// ====================
if (searchInput) {
  searchInput.addEventListener('input', (e) => {
    const texto = e.target.value.trim().toLowerCase();
    console.log("Buscando:", texto); // 👈 Para depurar

    if (!texto) { 
        renderProducts(allProducts); 
        renderProductAdmin(allProducts);
        return; 
    }

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
    renderProductAdmin(filtrados);
  });
}

// ====================
// ESCÁNER POS
// ====================
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
          alert('Error: ' + errorData.message);
      }
  } catch (error) {
      alert('Error de conexión');
  }
});


// ====================
function imprimirTicket(productos, total, efectivo, cambio) {
    // Creamos una ventana nueva en blanco
    const ventana = window.open('', 'PRINT', 'height=600,width=400');

    // Generamos el HTML del ticket
    // Usamos estilos simples para impresora térmica (ancho 58mm o 80mm)
    ventana.document.write(`
        <html>
        <head>
            <title>Ticket de Venta</title>
            <style>
                body { font-family: 'Courier New', monospace; font-size: 12px; width: 300px; margin: 0; padding: 10px; }
                .centrado { text-align: center; }
                .linea { border-bottom: 1px dashed black; margin: 5px 0; }
                .flex { display: flex; justify-content: space-between; }
                h2 { margin: 5px 0; }
            </style>
        </head>
        <body>
            <div class="centrado">
                <h2>TIENDA DE DENISSE</h2>
                <p>Fecha: ${new Date().toLocaleString()}</p>
            </div>
            
            <div class="linea"></div>
            
            <div>
                ${productos.map(p => `
                    <div style="margin-bottom: 2px;">
                        <div>${p.name}</div>
                        <div class="flex">
                            <span>${p.qty < 1 ? Number(p.qty).toFixed(3) : p.qty} x $${p.price}</span>
                            <span>$${(p.qty * p.price).toFixed(2)}</span>
                        </div>
                    </div>
                `).join('')}
            </div>

            <div class="linea"></div>

            <div class="flex" style="font-size: 14px; font-weight: bold;">
                <span>TOTAL:</span>
                <span>$${total.toFixed(2)}</span>
            </div>
            
            <div class="flex">
                <span>Efectivo:</span>
                <span>$${efectivo.toFixed(2)}</span>
            </div>
            <div class="flex">
                <span>Cambio:</span>
                <span>$${cambio.toFixed(2)}</span>
            </div>

            <div class="linea"></div>
            <div class="centrado">
                <p>¡Gracias por su compra!</p>
            </div>
        </body>
        </html>
    `);

    // Mandamos a imprimir y cerramos la ventana
    ventana.document.close();
    ventana.focus();
    
    // Un pequeño retraso para asegurar que cargó el contenido
    setTimeout(() => {
        ventana.print();
        ventana.close();
    }, 250);
}

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
// 📊 REPORTES
// ====================
btnReporteDia?.addEventListener('click', async () => {
    resultadoDia.classList.remove('hidden');
    resultadoDia.innerHTML = '<p class="text-gray-500 animate-pulse">Cargando...</p>';

    try {
        const res = await fetch(`${API_URL}/sales`);
        if (!res.ok) throw new Error('Error al obtener ventas');
        const ventas = await res.json();
        
        const hoy = new Date().toLocaleDateString('en-CA'); 
        const ventasHoy = ventas.filter(v => v.createdAt && v.createdAt.substring(0, 10) === hoy);

        mostrarResultados(ventasHoy, resultadoDia);
    } catch (error) {
        resultadoDia.innerHTML = `<p class="text-red-500">Error: ${error.message}</p>`;
    }
});

btnReporteRango?.addEventListener('click', async () => {
    const inicio = startDateInput.value;
    const fin = endDateInput.value;
    if (!inicio || !fin) { alert('Selecciona fechas'); return; }

    resultadoRango.classList.remove('hidden');
    resultadoRango.innerHTML = '<p class="text-gray-500 animate-pulse">Calculando...</p>';

    try {
        const res = await fetch(`${API_URL}/sales`);
        const ventas = await res.json();
        const ventasRango = ventas.filter(v => {
            if(!v.createdAt) return false;
            const f = v.createdAt.substring(0, 10);
            return f >= inicio && f <= fin;
        });
        mostrarResultados(ventasRango, resultadoRango);
    } catch (error) {
        resultadoRango.innerHTML = `<p class="text-red-500">Error: ${error.message}</p>`;
    }
});

function mostrarResultados(listaVentas, contenedorDiv) {
    if (listaVentas.length === 0) {
        contenedorDiv.innerHTML = '<p class="text-center text-gray-500">No hay ventas.</p>';
        return;
    }

    let totalGeneral = 0;
    const porSocio = {}; 

    listaVentas.forEach(v => {
        totalGeneral += Number(v.total);
        if (v.products && Array.isArray(v.products)) {
            v.products.forEach(item => {
                if (!item.product) {
                     if(item.price) porSocio['GENERAL'] = (porSocio['GENERAL'] || 0) + (item.price * item.quantity);
                     return; 
                }
                const idProd = item.product._id || item.product;
                const productoInfo = allProducts.find(p => String(p._id) === String(idProd)); 
                
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
                   if(!p.product) return 'Borrado';
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
        alert('Error al generar Excel');
    }
};

document.getElementById('clearBulk')?.addEventListener('click', () => {
    document.getElementById('bulkMoneyInput').value = '';
});