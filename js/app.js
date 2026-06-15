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

// ==========================================
// 🔫 ESCÁNER GLOBAL (Fix Principal)
// Buffer que captura lo que escupe el escáner
// sin importar en qué parte de la pantalla estés
// ==========================================
let scannerBuffer = '';
let scannerTimer = null;
const SCANNER_TIMEOUT_MS = 80; // Los escáneres son rápidos, teclas humanas no

document.addEventListener('keydown', (e) => {
    const activeElem = document.activeElement;
    const tag = activeElem?.tagName;
    const esInputNormal = (tag === 'INPUT' || tag === 'TEXTAREA');

    // Si el usuario está escribiendo en el modal de pago, en búsqueda,
    // en inventario u otro input que NO sea el del escáner POS → ignorar
    if (esInputNormal && activeElem.id !== 'barcodeInputPOS') return;
    if (e.ctrlKey || e.altKey || e.metaKey) return;

    // Teclas de navegación/función → ignorar
    const ignoradas = ['Tab', 'Escape', 'F1','F2','F3','F4','F5','F6','F7','F8','F9','F10','F11','F12',
        'ArrowUp','ArrowDown','ArrowLeft','ArrowRight','CapsLock','Shift','Control','Alt','Meta'];
    if (ignoradas.includes(e.key)) return;

    // Solo actuar si la sección POS está visible
    const posVisible = !posSection?.classList.contains('hidden');
    if (!posVisible) return;

    if (e.key === 'Enter') {
        clearTimeout(scannerTimer);
        const code = scannerBuffer.trim();
        scannerBuffer = '';

        if (code.length === 0) {
            // ENTER vacío = abrir cobro si hay carrito
            if (cart.length > 0) checkoutBtn?.click();
            return;
        }

        // Buscar producto por código
        const p = allProducts.find(prod => String(prod.barcode) === code);
        if (p) {
            addToCart(p);
            // Feedback visual breve
            flashScanner('ok');
        } else {
            flashScanner('error');
        }

        // Limpiar input visible (si estaba enfocado)
        if (barcodeInputPOS) barcodeInputPOS.value = '';

    } else {
        // Acumular caracteres en el buffer
        scannerBuffer += e.key;
        clearTimeout(scannerTimer);
        scannerTimer = setTimeout(() => { scannerBuffer = ''; }, SCANNER_TIMEOUT_MS);
    }
}, true); // 'true' = capture phase, para que llegue antes que otros listeners

// Feedback visual cuando se escanea
function flashScanner(tipo) {
    const input = barcodeInputPOS;
    if (!input) return;
    input.style.transition = 'background 0.1s';
    input.style.background = tipo === 'ok' ? '#dcfce7' : '#fee2e2';
    setTimeout(() => { input.style.background = ''; }, 600);
}

// ====================
// ELEMENTOS DEL DOM
// ====================
const productsDiv        = document.getElementById('products');
const productList        = document.getElementById('productList');
const searchInput        = document.getElementById('search');
const barcodeInputPOS    = document.getElementById('barcodeInputPOS');
const cartTable          = document.getElementById('cartTable');
const totalSpan          = document.getElementById('total');
const checkoutBtn        = document.getElementById('checkoutBtn');
const modal              = document.getElementById('paymentModal');
const modalTotal         = document.getElementById('modalTotal');
const modalCashInput     = document.getElementById('modalCashInput');
const modalChange        = document.getElementById('modalChange');
const confirmPaymentBtn  = document.getElementById('confirmPayment');
const closeModalBtn      = document.getElementById('closeModal');
const btnPOS             = document.getElementById('btnPOS');
const btnProducts        = document.getElementById('btnProducts');
const btnReports         = document.getElementById('btnReports');
const btnPartners        = document.getElementById('btnPartners');
const posSection         = document.getElementById('posSection');
const productsSection    = document.getElementById('productsSection');
const reportsSection     = document.getElementById('reportsSection');
const partnersSection    = document.getElementById('partnersSection');
const barcodeInput       = document.getElementById('barcodeInput');
const nameInput          = document.getElementById('nameInput');
const priceInput         = document.getElementById('priceInput');
const stockInput         = document.getElementById('stockInput');
const tagsInput          = document.getElementById('tagsInput');
const btnGuardarProducto = document.getElementById('addProduct');
const partnerList        = document.getElementById('partnerList');
const partnerName        = document.getElementById('partnerName');
const partnerTag         = document.getElementById('partnerTag');
const addPartnerBtn      = document.getElementById('addPartner');
const btnReporteDia      = document.getElementById('btnReporteDia');
const resultadoDia       = document.getElementById('resultadoDia');
const btnReporteRango    = document.getElementById('btnReporteRango');
const resultadoRango     = document.getElementById('resultadoRango');
const startDateInput     = document.getElementById('startDate');
const endDateInput       = document.getElementById('endDate');
const inventorySearch    = document.getElementById('inventorySearch');

// ====================
// UTILIDADES
// ====================
const formatMoney = n => Number(n).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });

const hideAllSections = () => {
    [posSection, productsSection, reportsSection, partnersSection]
        .forEach(s => s?.classList.add('hidden'));
};

// ====================
// 🚀 INICIALIZACIÓN
// ====================
document.addEventListener('DOMContentLoaded', () => {
    console.log("App iniciada 🚀");
    fetchProducts();
    fetchPartners();
    renderCart();

    // Mantener foco en escáner cuando se toca la pantalla en POS
    // (en móvil/tablet el foco se pierde fácil)
    document.addEventListener('touchend', (e) => {
        const posVisible = !posSection?.classList.contains('hidden');
        if (!posVisible) return;

        // No redirigir si tocó un input, botón o el ticket
        const target = e.target;
        const esInteractivo = target.closest('input, button, select, textarea, table');
        if (esInteractivo) return;

        // Si tocó un producto (card) ya se maneja con onclick → no hacer nada
        if (target.closest('.product-card')) return;
    });
});

// ====================
// FETCH PRODUCTOS
// (Solo recarga visual sin fetch extra cuando no es necesario)
// ====================
async function fetchProducts() {
    try {
        const res = await fetch(`${API_URL}/products`);
        if (!res.ok) throw new Error('Error cargando productos');
        const data = await res.json();
        allProducts = data.map(p => ({ ...p, price: Number(p.price) }));
        renderProducts(allProducts);
        renderProductAdmin(allProducts);
    } catch (error) {
        console.error('fetchProducts error:', error);
    }
}

async function fetchPartners() {
    try {
        const res = await fetch(`${API_URL}/partners`);
        if (res.ok) {
            allPartners = await res.json();
            renderPartners(allPartners);
        }
    } catch (error) {
        console.error('fetchPartners error:', error);
    }
}

// ====================
// VISTAS DE PRODUCTOS (POS)
// ====================
function renderProducts(products) {
    if (!productsDiv) return;
    productsDiv.innerHTML = '';

    products.forEach(p => {
        const card = document.createElement('div');
        let bordeColor = 'border-pink-100';
        let opacidad   = 'opacity-100';
        let clickeable = true;

        if (p.stock > 0 && p.stock <= 5) {
            bordeColor = 'border-orange-400 bg-orange-50';
        } else if (p.stock <= 0) {
            bordeColor = 'border-gray-200 bg-gray-100';
            opacidad   = 'opacity-60';
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
                const cant = dinero > 0 ? dinero / p.price : 1;
                if (inputGranel) inputGranel.value = '';
                addToCart(p, cant);
            };
        }
        productsDiv.appendChild(card);
    });
}

// ====================
// ADMIN DE PRODUCTOS
// ====================
function renderProductAdmin(products) {
    const list = document.getElementById('productList');
    if (!list) return;
    list.innerHTML = '';

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
                <button class="edit-btn bg-yellow-400 hover:bg-yellow-500 text-white w-10 h-10 rounded-xl shadow-sm flex items-center justify-center transition-all active:scale-90">✏️</button>
                <button class="delete-btn bg-red-500 hover:bg-red-600 text-white w-10 h-10 rounded-xl shadow-sm flex items-center justify-center transition-all active:scale-90">🗑️</button>
            </div>
        `;

        div.querySelector('.edit-btn').onclick = () => {
            productoEnEdicionId = p._id;
            document.getElementById('barcodeInput').value = p.barcode || '';
            document.getElementById('nameInput').value    = p.name    || '';
            document.getElementById('priceInput').value   = p.price   || 0;
            document.getElementById('stockInput').value   = p.stock   || 0;
            document.getElementById('tagsInput').value    = p.tags ? p.tags.join(', ') : '';
            document.getElementById('barcodeInput').disabled = true;
            document.getElementById('addProduct').innerHTML   = "<span>🔄</span> Actualizar";
            window.scrollTo({ top: 0, behavior: 'smooth' });
        };

        div.querySelector('.delete-btn').onclick = async () => {
            if (!confirm(`¿Eliminar ${p.name}?`)) return;
            await fetch(`${API_URL}/products/${p._id}`, { method: 'DELETE' });
            fetchProducts();
        };

        list.appendChild(div);
    });
}

// ====================
// GUARDAR / ACTUALIZAR PRODUCTO
// ====================
const btnGuardar = document.getElementById('addProduct');
if (btnGuardar) {
    btnGuardar.onclick = async () => {
        const name    = document.getElementById('nameInput').value.trim();
        const price   = parseFloat(document.getElementById('priceInput').value);
        const stock   = parseInt(document.getElementById('stockInput').value) || 0;
        const barcode = document.getElementById('barcodeInput').value.trim();
        const tags    = document.getElementById('tagsInput').value
            .split(',').map(t => t.trim().toLowerCase()).filter(t => t !== '');

        if (!name || isNaN(price)) { alert('⚠️ Llena nombre y precio.'); return; }

        const esEdicion = productoEnEdicionId !== null;
        const url    = esEdicion ? `${API_URL}/products/${productoEnEdicionId}` : `${API_URL}/products`;
        const metodo = esEdicion ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method: metodo,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ barcode, name, price, stock, tags })
            });

            if (res.ok) {
                alert(esEdicion ? '✨ ¡Producto actualizado!' : '✅ ¡Producto guardado!');
                productoEnEdicionId = null;

                ['nameInput','priceInput','stockInput','barcodeInput','tagsInput']
                    .forEach(id => { document.getElementById(id).value = ''; });

                document.getElementById('barcodeInput').disabled = false;
                document.getElementById('barcodeInput').classList.remove('bg-gray-100');
                btnGuardar.innerHTML = 'Guardar Producto';
                btnGuardar.classList.remove('bg-yellow-500');
                btnGuardar.classList.add('bg-pink-600');

                // ✅ Actualizar local sin re-fetch completo para mejorar velocidad
                fetchProducts();
            } else {
                const err = await res.json();
                alert('❌ Error: ' + (err.message || 'No se pudo procesar'));
            }
        } catch (err) {
            console.error(err);
            alert('📡 Error de conexión con el servidor.');
        }
    };
}

// ====================
// 🛒 CARRITO
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
                ${formatMoney(subtotal)}
                <button onclick="removeFromCart(${index})" class="text-red-500 ml-2 text-lg leading-none">✖</button>
            </td>
        `;
        cartTable.appendChild(tr);
    });
    totalSpan.textContent = formatMoney(total);
}

// ====================
// 💸 COBRO (MODAL)
// ====================
checkoutBtn?.addEventListener('click', () => {
    if (cart.length === 0) return;
    const total = cart.reduce((acc, i) => acc + (i.price * i.qty), 0);
    modalTotal.textContent    = formatMoney(total);
    modalCashInput.value      = '';
    modalChange.textContent   = formatMoney(0);
    modal?.classList.remove('hidden');
    setTimeout(() => modalCashInput.focus(), 200);
});

modalCashInput?.addEventListener('input', () => {
    const total = parseFloat(modalTotal.textContent.replace(/[^0-9.-]+/g, '')) || 0;
    const pago  = parseFloat(modalCashInput.value) || 0;
    const cambio = pago - total;
    modalChange.textContent = cambio > 0 ? formatMoney(cambio) : formatMoney(0);
    modalCashInput.style.borderColor = pago >= total ? '#22c55e' : '#f472b6';
});

modalCashInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); confirmPaymentBtn?.click(); }
});

closeModalBtn?.addEventListener('click', () => modal?.classList.add('hidden'));

confirmPaymentBtn?.addEventListener('click', async () => {
    const total = parseFloat(modalTotal.textContent.replace(/[^0-9.-]+/g, '')) || 0;
    const pago  = parseFloat(modalCashInput.value) || 0;

    if (pago < total) { alert('⚠️ Pago insuficiente. El total es ' + formatMoney(total)); return; }

    const saleData = {
        products: cart.map(i => ({ product: i._id, quantity: i.qty, price: i.price })),
        total,
        paymentMethod: 'efectivo'
    };

    try {
        const res = await fetch(`${API_URL}/sales`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(saleData)
        });

        if (res.ok) {
            // ✅ Actualizar stock localmente (sin re-fetch) para no esperar al servidor dormido
            cart.forEach(item => {
                const prod = allProducts.find(p => p._id === item._id);
                if (prod) prod.stock = Math.max(0, prod.stock - item.qty);
            });
            renderProducts(allProducts);

            alert('Venta guardada ✅');
            cart = [];
            renderCart();
            modal?.classList.add('hidden');

            // Fetch en background para sincronizar stock real
            fetchProducts();
        } else {
            alert('❌ Hubo un problema al guardar la venta.');
        }
    } catch (e) {
        console.error(e);
        alert('📡 Error de conexión al guardar venta');
    }
});

// ====================
// NAVEGACIÓN
// ====================
btnPOS?.addEventListener('click', () => {
    hideAllSections();
    posSection?.classList.remove('hidden');
    // Resaltar botón activo
    [btnPOS, btnProducts, btnReports, btnPartners].forEach(b => b?.classList.remove('border-b-2', 'border-white'));
    btnPOS?.classList.add('border-b-2', 'border-white');
});

btnProducts?.addEventListener('click', () => {
    hideAllSections();
    productsSection?.classList.remove('hidden');
    [btnPOS, btnProducts, btnReports, btnPartners].forEach(b => b?.classList.remove('border-b-2', 'border-white'));
    btnProducts?.classList.add('border-b-2', 'border-white');
});

btnReports?.addEventListener('click', () => {
    hideAllSections();
    reportsSection?.classList.remove('hidden');
    [btnPOS, btnProducts, btnReports, btnPartners].forEach(b => b?.classList.remove('border-b-2', 'border-white'));
    btnReports?.classList.add('border-b-2', 'border-white');
});

btnPartners?.addEventListener('click', () => {
    hideAllSections();
    partnersSection?.classList.remove('hidden');
    [btnPOS, btnProducts, btnReports, btnPartners].forEach(b => b?.classList.remove('border-b-2', 'border-white'));
    btnPartners?.classList.add('border-b-2', 'border-white');
    fetchPartners();
});

// ====================
// BUSCADORES
// ====================
searchInput?.addEventListener('input', (e) => {
    const text = e.target.value.toLowerCase();
    const filtered = allProducts.filter(p =>
        p.name.toLowerCase().includes(text) || String(p.barcode).includes(text)
    );
    renderProducts(filtered);
});

inventorySearch?.addEventListener('input', (e) => {
    const text = e.target.value.toLowerCase().trim();
    const filtered = allProducts.filter(p =>
        p.name.toLowerCase().includes(text) || String(p.barcode).includes(text)
    );
    renderProductAdmin(filtered);
});

// ====================
// ESCÁNER EN INVENTARIO
// (Solo cuando esa sección está visible)
// ====================
barcodeInput?.addEventListener('keydown', async (e) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    const code = barcodeInput.value.trim();
    if (!code) return;

    const product = allProducts.find(p => String(p.barcode) === code);
    if (product) {
        productoEnEdicionId = product._id;
        nameInput.value  = product.name;
        priceInput.value = product.price;
        stockInput.value = product.stock;
        tagsInput.value  = product.tags ? product.tags.join(', ') : '';
        barcodeInput.disabled = true;
        barcodeInput.classList.add('bg-gray-100');
        btnGuardarProducto.innerHTML = '<span>🔄</span> Actualizar';
        nameInput.focus();
    } else {
        productoEnEdicionId = null;
        nameInput.focus();
    }
});

// ====================
// SOCIOS
// ====================
function renderPartners(partners) {
    if (!partnerList) return;
    partnerList.innerHTML = '';

    if (partners.length === 0) {
        partnerList.innerHTML = '<p class="text-center text-gray-400 py-4 italic">No hay socios registrados</p>';
        return;
    }

    partners.forEach(p => {
        const div = document.createElement('div');
        div.className = 'bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center mb-3 hover:shadow-md transition-all';
        div.innerHTML = `
            <div>
                <span class="font-black text-gray-800 text-lg">${p.name}</span>
                <span class="ml-2 px-2 py-1 bg-pink-100 text-pink-600 text-xs font-bold rounded-lg uppercase">#${p.tag}</span>
            </div>
            <button class="del-p bg-red-50 hover:bg-red-500 hover:text-white text-red-500 w-10 h-10 rounded-xl transition-all font-bold flex items-center justify-center">🗑️</button>
        `;
        div.querySelector('.del-p').onclick = async () => {
            if (!confirm(`¿Eliminar al socio ${p.name}?`)) return;
            try {
                await fetch(`${API_URL}/partners/${p._id}`, { method: 'DELETE' });
                fetchPartners();
            } catch { alert('Error al eliminar'); }
        };
        partnerList.appendChild(div);
    });
}

addPartnerBtn?.addEventListener('click', async () => {
    const name = document.getElementById('partnerName').value.trim();
    const tag  = document.getElementById('partnerTag').value.trim().toLowerCase();

    if (!name || !tag) { alert('Llena nombre y tag (ej: Mamá, m)'); return; }

    try {
        const res = await fetch(`${API_URL}/partners`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, tag })
        });
        if (res.ok) {
            document.getElementById('partnerName').value = '';
            document.getElementById('partnerTag').value  = '';
            fetchPartners();
        } else {
            alert('Error al guardar socio. Quizás el tag ya existe.');
        }
    } catch { alert('Error de conexión'); }
});

// ====================
// LIMPIAR GRANEL
// ====================
document.getElementById('clearBulk')?.addEventListener('click', () => {
    document.getElementById('bulkMoneyInput').value = '';
});

// ====================
// 📊 REPORTES
// ====================
btnReporteDia?.addEventListener('click', async () => {
    resultadoDia.classList.remove('hidden');
    resultadoDia.innerHTML = '<p class="text-gray-500 animate-pulse">Cargando ventas de hoy...</p>';
    try {
        const res = await fetch(`${API_URL}/sales`);
        const ventas = await res.json();
        const hoy = new Date().toISOString().substring(0, 10);
        const ventasHoy = ventas.filter(v => v.createdAt?.substring(0, 10) === hoy);
        mostrarResultados(ventasHoy, resultadoDia);
    } catch (error) {
        resultadoDia.innerHTML = `<p class="text-red-500">Error: ${error.message}</p>`;
    }
});

btnReporteRango?.addEventListener('click', async () => {
    const inicio = startDateInput.value;
    const fin    = endDateInput.value;
    if (!inicio || !fin) { alert('Selecciona ambas fechas'); return; }

    resultadoRango.classList.remove('hidden');
    resultadoRango.innerHTML = '<p class="text-gray-500 animate-pulse">Calculando...</p>';
    try {
        const res = await fetch(`${API_URL}/sales`);
        const ventas = await res.json();
        const ventasRango = ventas.filter(v => {
            if (!v.createdAt) return false;
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
        contenedorDiv.innerHTML = '<p class="text-center text-gray-500 py-4">No hay ventas en este periodo.</p>';
        return;
    }

    let totalGeneral = 0;
    const porSocio = {};

    listaVentas.forEach(v => {
        totalGeneral += Number(v.total);
        if (v.products && Array.isArray(v.products)) {
            v.products.forEach(item => {
                const idProd = item.product?._id || item.product;
                const productoInfo = allProducts.find(p => String(p._id) === String(idProd));
                let tagSocio = 'GENERAL';
                if (productoInfo?.tags?.length > 0) tagSocio = productoInfo.tags[0].toUpperCase();
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
    html += '</div>';
    contenedorDiv.innerHTML = html;
}

// ====================
// 📥 EXPORTAR EXCEL
// ====================
window.exportarExcel = async function () {
    try {
        const res = await fetch(`${API_URL}/sales`);
        if (!res.ok) throw new Error('No se pudieron obtener las ventas');
        const ventas = await res.json();

        if (ventas.length === 0) { alert('No hay ventas registradas.'); return; }

        let csv = 'Fecha,Total,Metodo de Pago,Productos\n';
        ventas.forEach(v => {
            const fecha  = v.createdAt ? v.createdAt.substring(0, 10) : 'Sin Fecha';
            const total  = v.total || 0;
            const metodo = v.paymentMethod || 'efectivo';
            let detalle  = 'Venta';
            if (v.products && Array.isArray(v.products)) {
                detalle = v.products.map(p => {
                    const id   = p.product?._id || p.product;
                    const info = allProducts.find(prod => String(prod._id) === String(id));
                    return `${info ? info.name : 'Producto'} (x${p.quantity})`;
                }).join(' - ');
            }
            csv += `${fecha},${total},${metodo},"${detalle}"\n`;
        });

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href     = URL.createObjectURL(blob);
        link.download = `Reporte_Ventas_${new Date().toLocaleDateString().replace(/\//g, '-')}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (error) {
        console.error('Error Excel:', error);
        alert('Error al generar el archivo.');
    }
};