// ====================
// 🌍 CONEXIÓN AL SERVIDOR
// ====================
const API_URL = 'https://tienda-de-denisse.onrender.com/api'; 

// ====================
// VARIABLES GLOBALES
// ====================
let allProducts = [];
let allPartners = [];
let cart = [];
let productoEnEdicionId = null; 

// ====================
// ELEMENTOS DEL DOM
// ====================
// Inputs y Tablas
const productsDiv = document.getElementById('products'); 
const productList = document.getElementById('productList'); 
const searchInput = document.getElementById('search');
const barcodeInputPOS = document.getElementById('barcodeInputPOS');
const cartTable = document.getElementById('cartTable');
const totalSpan = document.getElementById('total');
const checkoutBtn = document.getElementById('checkoutBtn');

// Elementos del Modal (Corregidos para el nuevo diseño)
const modal = document.getElementById('paymentModal');
const modalTotal = document.getElementById('modalTotal');
const modalCashInput = document.getElementById('modalCashInput');
const modalChange = document.getElementById('modalChange');
const confirmPaymentBtn = document.getElementById('confirmPayment');
const closeModalBtn = document.getElementById('closeModal');

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

// Formulario Productos (Inventario)
const barcodeInput = document.getElementById('barcodeInput');
const nameInput = document.getElementById('nameInput');
const priceInput = document.getElementById('priceInput');
const stockInput = document.getElementById('stockInput');
const tagsInput = document.getElementById('tagsInput');
const btnGuardarProducto = document.getElementById('addProduct'); 

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

const inventorySearch = document.getElementById('inventorySearch');

// ====================
// UTILIDADES
// ====================
const formatMoney = n => n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });

const hideAllSections = () => {
    [posSection, productsSection, reportsSection, partnersSection].forEach(section => {
        section?.classList.add('hidden');
    });
};

// ====================
// 🚀 INICIALIZACIÓN
// ====================
document.addEventListener('DOMContentLoaded', () => {
    console.log("App iniciada 🚀");
    fetchProducts();
    fetchPartners();
    renderCart();
});

// 1. Definimos la función para que el navegador la conozca
function renderProductAdmin(products) {
    const productList = document.getElementById('productList');
    if (!productList) return;
    productList.innerHTML = '';

    products.forEach(p => {
        const div = document.createElement('div');
        div.className = 'bg-white p-5 rounded-2xl shadow-sm border-2 border-gray-50 flex justify-between items-center mb-3 hover:shadow-md transition-all';
        div.innerHTML = `
            <div class="flex-1">
                <h4 class="font-black text-gray-800 text-lg uppercase">${p.name}</h4>
                <p class="text-xs text-gray-400 font-mono">${p.barcode}</p>
                <p class="text-gray-600 font-bold mt-1">
                    <span class="text-pink-600">${formatMoney(p.price)}</span> | Stock: ${p.stock}
                </p>
            </div>
            <div class="flex gap-2">
                <button class="edit-btn bg-yellow-400 hover:bg-yellow-500 text-white w-10 h-10 rounded-xl shadow-sm flex items-center justify-center transition-all active:scale-90">
                    ✏️
                </button>
                <button class="delete-btn bg-red-500 hover:bg-red-600 text-white w-10 h-10 rounded-xl shadow-sm flex items-center justify-center transition-all active:scale-90">
                    🗑️
                </button>
            </div>
        `;

        // Configurar el botón de Editar
        div.querySelector('.edit-btn').onclick = () => {
            productoEnEdicionId = p._id; // Guardamos el ID para actualizar luego
            
            document.getElementById('barcodeInput').value = p.barcode || '';
            document.getElementById('nameInput').value = p.name || '';
            document.getElementById('priceInput').value = p.price || 0;
            document.getElementById('stockInput').value = p.stock || 0;
            document.getElementById('tagsInput').value = p.tags ? p.tags.join(', ') : '';
            
            document.getElementById('barcodeInput').disabled = true;
            document.getElementById('addProduct').innerHTML = "<span>🔄</span> Actualizar";
            
            window.scrollTo({ top: 0, behavior: 'smooth' });
        };

        // Configurar el botón de Eliminar
        div.querySelector('.delete-btn').onclick = async () => {
            if (confirm(`¿Eliminar ${p.name}?`)) {
                await fetch(`${API_URL}/products/${p._id}`, { method: 'DELETE' });
                fetchProducts();
            }
        };

        productList.appendChild(div);
    });
}

async function fetchProducts() {
    try {
        const res = await fetch(`${API_URL}/products`);
        if (!res.ok) throw new Error('Error cargando productos');
        allProducts = await res.json();
        allProducts = allProducts.map(p => ({...p, price: Number(p.price)}));
        renderProducts(allProducts);
        renderProductAdmin(allProducts);
    } catch (error) {
        console.error(error);
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
        let bordeColor = 'border-pink-100';
        let opacidad = 'opacity-100';
        let clickeable = true;

        if (p.stock > 0 && p.stock <= 5) {
            bordeColor = 'border-orange-400 bg-orange-50';
        } else if (p.stock <= 0) {
            bordeColor = 'border-gray-200 bg-gray-100';
            opacidad = 'opacity-60';
            clickeable = false;
        }

        card.className = `product-card p-4 rounded shadow hover:shadow-lg transition cursor-pointer border-2 ${bordeColor} ${opacidad} relative`;
        card.innerHTML = `
            <div class="flex justify-between items-start">
                <h3 class="font-bold text-lg text-gray-800 leading-tight">${p.name}</h3>
            </div>
            <div class="flex justify-between items-center mt-3">
                <p class="text-pink-600 font-bold text-xl">${formatMoney(p.price)}</p>
                <p class="text-sm text-gray-600 font-medium">Stock: ${p.stock}</p>
            </div>
        `;

        if (clickeable) {
            card.onclick = () => {
                const inputGranel = document.getElementById('bulkMoneyInput');
                const dinero = parseFloat(inputGranel?.value) || 0;
                let cant = dinero > 0 ? dinero / p.price : 1;
                if(inputGranel) inputGranel.value = '';
                addToCart(p, cant);
            };
        }
        productsDiv.appendChild(card);
    });
}

// ==========================================
// 💾 FUNCIÓN MAESTRA: GUARDAR O ACTUALIZAR
// ==========================================
const btnGuardar = document.getElementById('addProduct');

if (btnGuardar) {
    btnGuardar.onclick = async () => {
        // 1. Capturamos los datos con IDs directos
        const nameInput = document.getElementById('nameInput');
        const priceInput = document.getElementById('priceInput');
        const stockInput = document.getElementById('stockInput');
        const barcodeInput = document.getElementById('barcodeInput');
        const tagsInput = document.getElementById('tagsInput');

        const name = nameInput.value.trim();
        const price = parseFloat(priceInput.value);
        const stock = parseInt(stockInput.value) || 0;
        const barcode = barcodeInput.value.trim();
        const tags = tagsInput.value.split(',').map(t => t.trim().toLowerCase()).filter(t => t !== "");

        // Validación
        if (!name || isNaN(price)) {
            alert("⚠️ Por favor, llena el nombre y el precio.");
            return;
        }

        // 2. Lógica de Decisión (POST o PUT)
        const esEdicion = productoEnEdicionId !== null;
        const url = esEdicion 
            ? `${API_URL}/products/${productoEnEdicionId}` 
            : `${API_URL}/products`;
        const metodo = esEdicion ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method: metodo,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ barcode, name, price, stock, tags })
            });

            if (res.ok) {
                alert(esEdicion ? "✨ ¡Producto actualizado!" : "✅ ¡Producto guardado!");
                
                // 3. RESETEAR FORMULARIO Y VARIABLE GLOBAL
                productoEnEdicionId = null; 
                
                nameInput.value = '';
                priceInput.value = '';
                stockInput.value = '';
                barcodeInput.value = '';
                tagsInput.value = '';
                
                // 4. RESTAURAR ESTADO DEL BOTÓN E INPUT
                barcodeInput.disabled = false;
                barcodeInput.classList.remove('bg-gray-100');
                
                btnGuardar.innerHTML = "Guardar Producto";
                // Limpiamos colores de edición y ponemos el original
                btnGuardar.classList.remove('bg-pink-500', 'bg-yellow-500'); 
                btnGuardar.classList.add('bg-pink-600');

                // 5. RECARGAR LISTAS
                fetchProducts(); 
                
            } else {
                const errorData = await res.json();
                alert("❌ Error: " + (errorData.message || "No se pudo procesar"));
            }
        } catch (err) {
            console.error("Error en el fetch:", err);
            alert("📡 Error de conexión con el servidor.");
        }
    };
}

// ====================
// 🛒 LÓGICA CARRITO
// ====================
function addToCart(product, quantity = 1) {
    const existing = cart.find(item => item._id === product._id);
    if (existing) { existing.qty += quantity; } 
    else { cart.push({ _id: product._id, name: product.name, price: product.price, qty: quantity }); }
    renderCart();
}

function removeFromCart(index) {
    cart.splice(index, 1);
    renderCart();
}

function renderCart() {
    if (!cartTable || !totalSpan) return;
    cartTable.innerHTML = '';
    let total = 0;

    cart.forEach((item, index) => {
        const subtotal = item.qty * item.price;
        total += subtotal;
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="py-2 text-left pl-2">${item.name}</td>
            <td class="text-right">${formatMoney(item.price)}</td>
            <td class="text-center">${item.qty < 1 ? item.qty.toFixed(3) : item.qty}</td>
            <td class="text-right pr-2">
                ${formatMoney(subtotal)} <button onclick="removeFromCart(${index})" class="text-red-500 ml-2">✖</button>
            </td>
        `;
        cartTable.appendChild(tr);
    });
    totalSpan.textContent = formatMoney(total);
}

// ====================
// 💸 PROCESO DE COBRO (MODAL)
// ====================
checkoutBtn?.addEventListener('click', () => {
    if (cart.length === 0) return;
    const total = cart.reduce((acc, i) => acc + (i.price * i.qty), 0);
    modalTotal.textContent = formatMoney(total);
    modalCashInput.value = '';
    modalChange.textContent = formatMoney(0);
    modal?.classList.remove('hidden');
    setTimeout(() => modalCashInput.focus(), 200);
});

modalCashInput?.addEventListener('input', () => {
    const total = parseFloat(modalTotal.textContent.replace(/[^0-9.-]+/g,"")) || 0;
    const pago = parseFloat(modalCashInput.value) || 0;
    const cambio = pago - total;
    modalChange.textContent = cambio > 0 ? formatMoney(cambio) : formatMoney(0);
});

closeModalBtn?.addEventListener('click', () => modal.classList.add('hidden'));

confirmPaymentBtn?.addEventListener('click', async () => {
    const total = parseFloat(modalTotal.textContent.replace(/[^0-9.-]+/g,"")) || 0;
    const pago = parseFloat(modalCashInput.value) || 0;

    if (pago < total) { alert("Pago insuficiente"); return; }

    const saleData = {
        products: cart.map(i => ({ product: i._id, quantity: i.qty, price: i.price })),
        total: total,
        paymentMethod: 'efectivo'
    };

    try {
        const res = await fetch(`${API_URL}/sales`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(saleData)
        });

        if (res.ok) {
            alert("Venta guardada ✅");
            cart = [];
            renderCart();
            modal.classList.add('hidden');
            fetchProducts();
        }
    } catch (e) { alert("Error al guardar venta"); }
});

// ====================
// NAVEGACIÓN Y OTROS
// ====================
btnPOS.onclick = () => { hideAllSections(); posSection.classList.remove('hidden'); };
btnProducts.onclick = () => { hideAllSections(); productsSection.classList.remove('hidden'); };
btnReports.onclick = () => { hideAllSections(); reportsSection.classList.remove('hidden'); };
btnPartners.onclick = () => { hideAllSections(); partnersSection.classList.remove('hidden'); fetchPartners(); };

// Buscador POS
searchInput?.addEventListener('input', (e) => {
    const text = e.target.value.toLowerCase();
    const filtered = allProducts.filter(p => p.name.toLowerCase().includes(text) || p.barcode.includes(text));
    renderProducts(filtered);
});

/// Buscador INVENTARIO (Admin)
// Quitamos el "const" porque la variable ya fue declarada arriba del todo
if (inventorySearch) { 
    inventorySearch.addEventListener('input', (e) => {
        const text = e.target.value.toLowerCase().trim();
        // Filtramos la lista global 'allProducts'
        const filtered = allProducts.filter(p => 
            p.name.toLowerCase().includes(text) || 
            String(p.barcode).includes(text)
        );
        // Mandamos los resultados a la lista de administración
        renderProductAdmin(filtered);
    });
}
// Escáner Código de Barras
barcodeInputPOS?.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
        const p = allProducts.find(prod => prod.barcode === barcodeInputPOS.value.trim());
        if(p) { addToCart(p); barcodeInputPOS.value = ''; }
        else { alert("No encontrado"); barcodeInputPOS.value = ''; }
    }
});

/// Renderizar Socios (Diseño Mejorado)
function renderPartners(partners) {
    if(!partnerList) return;
    partnerList.innerHTML = '';
    
    if (partners.length === 0) {
        partnerList.innerHTML = '<p class="text-center text-gray-400 py-4 italic">No hay socios registrados</p>';
        return;
    }

    partners.forEach(p => {
        const div = document.createElement('div');
        // Diseño de tarjeta moderna igual al Inventario
        div.className = 'bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center mb-3 hover:shadow-md transition-all';
        div.innerHTML = `
            <div>
                <span class="font-black text-gray-800 text-lg">${p.name}</span>
                <span class="ml-2 px-2 py-1 bg-pink-100 text-pink-600 text-xs font-bold rounded-lg uppercase">#${p.tag}</span>
            </div>
            <button class="del-p bg-red-50 hover:bg-red-500 hover:text-white text-red-500 w-10 h-10 rounded-xl transition-all font-bold flex items-center justify-center">
                🗑️
            </button>
        `;

        div.querySelector('.del-p').onclick = async () => {
            if (!confirm(`¿Eliminar al socio ${p.name}?`)) return;
            try {
                await fetch(`${API_URL}/partners/${p._id}`, { method: 'DELETE' });
                fetchPartners();
            } catch (error) { alert('Error al eliminar'); }
        };
        partnerList.appendChild(div);
    });
}

// ESTE ES EL QUE HACÍA FALTA: El evento del botón "Agregar"

addPartnerBtn?.addEventListener('click', async () => {
    const name = document.getElementById('partnerName').value.trim();
    const tag = document.getElementById('partnerTag').value.trim().toLowerCase();

    if (!name || !tag) {
        alert('Llena nombre y tag (ej: Mamá, m)');
        return;
    }

    try {
        const res = await fetch(`${API_URL}/partners`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, tag })
        });

        if(res.ok) {
            document.getElementById('partnerName').value = '';
            document.getElementById('partnerTag').value = '';
            fetchPartners(); // Recarga la lista automáticamente
        } else {
            alert('Error al guardar socio. Quizás el tag ya existe.');
        }
    } catch (error) { alert('Error de conexión'); }
});

// Botón Limpiar Granel
document.getElementById('clearBulk')?.addEventListener('click', () => {
    document.getElementById('bulkMoneyInput').value = '';
});

// ====================
// 📊 SECCIÓN DE REPORTES (CORREGIDA)
// ====================

// Reporte de Hoy
btnReporteDia?.addEventListener('click', async () => {
    resultadoDia.classList.remove('hidden');
    resultadoDia.innerHTML = '<p class="text-gray-500 animate-pulse">Cargando ventas de hoy...</p>';
    try {
        const res = await fetch(`${API_URL}/sales`);
        const ventas = await res.json();
        const hoy = new Date().toISOString().substring(0, 10); // Formato YYYY-MM-DD
        
        const ventasHoy = ventas.filter(v => v.createdAt && v.createdAt.substring(0, 10) === hoy);
        mostrarResultados(ventasHoy, resultadoDia);
    } catch (error) {
        resultadoDia.innerHTML = `<p class="text-red-500">Error al cargar: ${error.message}</p>`;
    }
});

// Reporte por Rango de Fechas
btnReporteRango?.addEventListener('click', async () => {
    const inicio = startDateInput.value;
    const fin = endDateInput.value;
    if (!inicio || !fin) { alert('Selecciona ambas fechas'); return; }

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

// Función que dibuja los cuadritos de dinero y socios
function mostrarResultados(listaVentas, contenedorDiv) {
    if (listaVentas.length === 0) {
        contenedorDiv.innerHTML = '<p class="text-center text-gray-500 py-4">No hay ventas en este periodo.</p>';
        return;
    }

    let totalGeneral = 0;
    const porSocio = {}; 

    listaVentas.forEach(v => {
        totalGeneral += Number(v.total);
        if (v.products && Array.isArray(v.products)) {
            v.products.forEach(item => {
                // Buscamos el tag del producto para saber de qué socio es
                const idProd = item.product?._id || item.product;
                const productoInfo = allProducts.find(p => String(p._id) === String(idProd));
                
                let tagSocio = 'GENERAL';
                if (productoInfo && productoInfo.tags && productoInfo.tags.length > 0) {
                    tagSocio = productoInfo.tags[0].toUpperCase();
                }

                const subtotal = (Number(item.price) || 0) * (Number(item.quantity) || 0);
                porSocio[tagSocio] = (porSocio[tagSocio] || 0) + subtotal;
            });
        }
    });

    let html = `
        <div class="bg-green-50 p-4 rounded-xl border-2 border-green-200 mb-4">
            <p class="text-green-800 font-bold text-sm uppercase">Venta Total</p>
            <p class="text-3xl font-black text-green-600">${formatMoney(totalGeneral)}</p>
        </div>
        <div class="space-y-2">
            <p class="font-bold text-gray-700 border-b pb-1 text-sm">DIVISIÓN POR SOCIOS:</p>
    `;

    for (const [tag, monto] of Object.entries(porSocio)) {
        html += `
            <div class="flex justify-between bg-white p-2 rounded border shadow-sm">
                <span class="font-bold text-gray-600">👤 ${tag}</span>
                <span class="font-black text-gray-800">${formatMoney(monto)}</span>
            </div>
        `;
    }
    html += `</div>`;
    contenedorDiv.innerHTML = html;
}

// Función de Excel (Para que no falle)
window.exportarExcel = async function() {
    try {
        const res = await fetch(`${API_URL}/sales`);
        const ventas = await res.json();
        let csv = 'Fecha,Total,Metodo,Detalle\n';
        ventas.forEach(v => {
            const f = v.createdAt ? v.createdAt.substring(0, 10) : 'S/F';
            csv += `${f},${v.total},${v.paymentMethod || 'efectivo'},"Venta de productos"\n`;
        });
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `Ventas_Tienda.csv`;
        link.click();
    } catch (e) { alert("Error al exportar"); }
};

// ====================
// 📥 FUNCIÓN EXPORTAR A EXCEL (CSV)
// ====================
window.exportarExcel = async function() {
    try {
        console.log("Generando Excel...");
        const res = await fetch(`${API_URL}/sales`);
        if (!res.ok) throw new Error('No se pudieron obtener las ventas');
        
        const ventas = await res.json();
        if (ventas.length === 0) {
            alert('No hay ventas registradas para exportar.');
            return;
        }

        // Encabezados del CSV
        let csv = 'Fecha,Total,Metodo de Pago,Productos\n';

        ventas.forEach(v => {
            const fecha = v.createdAt ? v.createdAt.substring(0, 10) : 'Sin Fecha';
            const total = v.total || 0;
            const metodo = v.paymentMethod || 'efectivo';
            
            // Crear el detalle de productos (limpiando comas para que no rompan el CSV)
            let detalle = "Venta";
            if (v.products && Array.isArray(v.products)) {
                detalle = v.products.map(p => {
                    const idProd = p.product?._id || p.product;
                    const info = allProducts.find(prod => String(prod._id) === String(idProd));
                    const nombre = info ? info.name : "Producto";
                    return `${nombre} (x${p.quantity})`;
                }).join(' - ');
            }

            // Agregamos la fila al CSV (encerrando el detalle en comillas por si tiene guiones)
            csv += `${fecha},${total},${metodo},"${detalle}"\n`;
        });

        // Crear el archivo y descargarlo
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        
        const fechaArchivo = new Date().toLocaleDateString().replace(/\//g, '-');
        link.href = url;
        link.download = `Reporte_Ventas_Denisse_${fechaArchivo}.csv`;
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        console.log("Excel descargado ✅");
    } catch (error) {
        console.error("Error en Excel:", error);
        alert('Hubo un error al generar el archivo. Revisa la consola.');
    }
};