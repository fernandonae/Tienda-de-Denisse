// ====================
// 🌍 CONEXIÓN AL SERVIDOR
// ====================
const API_URL = 'https://tienda-de-denisse.onrender.com/api';;

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
const btnVentas   = document.getElementById('btnVentas');
const ventasSection = document.getElementById('ventasSection');
const ventasList  = document.getElementById('ventasList');

// ====================
// UTILIDADES
// ====================
const formatMoney = n => Number(n).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });

const hideAllSections = () => {
    [posSection, productsSection, reportsSection, partnersSection, ventasSection]
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
        let bordeColor = 'border-pink-100 bg-white';
        let opacidad   = 'opacity-100';
        let clickeable = true;

        // Indicadores visuales de Stock
        if (p.stock > 0 && p.stock <= 5) {
            bordeColor = 'border-orange-300 bg-orange-50';
        } else if (p.stock <= 0) {
            bordeColor = 'border-gray-200 bg-gray-100';
            opacidad   = 'opacity-60';
            clickeable = false;
        }

        // Mostrar Badge del Tag / Socio si cuenta con uno
        const tagBadge = (p.tags && p.tags.length > 0)
            ? `<span class="bg-pink-100 text-pink-700 text-[10px] font-black px-1.5 py-0.5 rounded-md uppercase">#${p.tags[0]}</span>`
            : '';

        card.className = `product-card p-4 rounded-2xl shadow-sm hover:shadow-md transition border-2 ${bordeColor} ${opacidad} relative flex flex-col justify-between group cursor-pointer`;
        
        card.innerHTML = `
            <div>
                <div class="flex justify-between items-start gap-2">
                    <h3 class="font-bold text-base text-gray-800 leading-tight">${p.name}</h3>
                    <div class="flex items-center gap-1 shrink-0">
                        ${tagBadge}
                        <button class="btn-print-pos opacity-0 group-hover:opacity-100 transition-opacity bg-blue-50 hover:bg-blue-200 text-blue-600 p-1.5 rounded-lg text-xs" title="Imprimir Etiqueta">
                            🏷️
                        </button>
                    </div>
                </div>
            </div>

            <div class="flex justify-between items-end mt-4">
                <div>
                    <p class="text-pink-600 font-black text-xl leading-none">${formatMoney(p.price)}</p>
                    ${p.barcode ? `<p class="text-[10px] text-gray-400 font-mono mt-1">${p.barcode}</p>` : ''}
                </div>
                <span class="text-xs ${p.stock <= 5 && p.stock > 0 ? 'text-orange-600 font-bold' : 'text-gray-500'} font-medium">
                    Stock: ${p.stock}
                </span>
            </div>
        `;

        // Evento de impresión directa desde la tarjeta del POS
        const btnPrint = card.querySelector('.btn-print-pos');
        if (btnPrint) {
            btnPrint.onclick = (e) => {
                e.stopPropagation(); // Evita meter el producto al carrito cuando solo se quiere imprimir
                if (typeof window.imprimirEtiquetas === 'function') {
                    window.imprimirEtiquetas([p]);
                } else {
                    alert('Función de impresión no disponible.');
                }
            };
        }

        // Evento normal de agregar al carrito (al tocar la tarjeta)
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
        const stock   = parseFloat(document.getElementById('stockInput').value) || 0;
        let barcode   = document.getElementById('barcodeInput').value.trim();
        const tags    = document.getElementById('tagsInput').value
            .split(',').map(t => t.trim().toLowerCase()).filter(t => t !== '');

        const isBulkInput = document.getElementById('isBulkInput');
        const unitInput   = document.getElementById('unitInput');
        
        const isBulk = isBulkInput ? isBulkInput.checked : false;
        const unit   = unitInput ? (unitInput.value.trim() || 'kg') : 'kg';

        if (!isBulk && !barcode) {
            alert('⚠️ Ingresa un código de barras para productos normales.');
            return;
        }

        if (isBulk && !barcode) {
            barcode = 'GRANEL-' + Date.now();
        }

        if (!name || isNaN(price)) { alert('⚠️ Llena nombre y precio.'); return; }

        const esEdicion = productoEnEdicionId !== null;
        const url    = esEdicion ? `${API_URL}/products/${productoEnEdicionId}` : `${API_URL}/products`;
        const metodo = esEdicion ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method: metodo,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ barcode, name, price, stock, tags, isBulk, unit })
            });

            if (res.ok) {
                // 🟢 1. OBTIENE EL PRODUCTO GUARDADO/EDITADO
                let productoGuardado = null;
                try {
                    productoGuardado = await res.json();
                } catch (e) {
                    // Si el servidor no devolvió un JSON, creamos el objeto con los datos introducidos
                    productoGuardado = { _id: productoEnEdicionId || barcode, name, price, stock, barcode, isBulk, unit };
                }

                // 🟢 2. REGISTRA EL PRODUCTO PARA IMPRIMIR SU ETIQUETA
                if (typeof registrarProductoModificado === 'function') {
                    registrarProductoModificado(productoGuardado);
                }

                alert(esEdicion ? '✨ ¡Producto actualizado!' : '✅ ¡Producto guardado!');
                productoEnEdicionId = null;

                // Limpiar campos de texto
                ['nameInput','priceInput','stockInput','barcodeInput','tagsInput','unitInput']
                    .forEach(id => { 
                        const el = document.getElementById(id);
                        if (el) el.value = ''; 
                    });

                if (isBulkInput) isBulkInput.checked = false;

                document.getElementById('barcodeInput').disabled = false;
                document.getElementById('barcodeInput').classList.remove('bg-gray-100');
                btnGuardar.innerHTML = 'Guardar Producto';
                btnGuardar.classList.remove('bg-yellow-500');
                btnGuardar.classList.add('bg-pink-600');

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
    [btnPOS, btnProducts, btnReports, btnPartners, btnVentas].forEach(b => b?.classList.remove('border-b-2', 'border-white'));
    btnPOS?.classList.add('border-b-2', 'border-white');
});

btnProducts?.addEventListener('click', () => {
    hideAllSections();
    productsSection?.classList.remove('hidden');
    [btnPOS, btnProducts, btnReports, btnPartners, btnVentas].forEach(b => b?.classList.remove('border-b-2', 'border-white'));
    btnProducts?.classList.add('border-b-2', 'border-white');
});

btnReports?.addEventListener('click', () => {
    hideAllSections();
    reportsSection?.classList.remove('hidden');
   [btnPOS, btnProducts, btnReports, btnPartners, btnVentas].forEach(b => b?.classList.remove('border-b-2', 'border-white'));
    btnReports?.classList.add('border-b-2', 'border-white');
});

btnPartners?.addEventListener('click', () => {
    hideAllSections();
    partnersSection?.classList.remove('hidden');
    [btnPOS, btnProducts, btnReports, btnPartners, btnVentas].forEach(b => b?.classList.remove('border-b-2', 'border-white'));
    btnPartners?.classList.add('border-b-2', 'border-white');
    fetchPartners();
});

btnVentas?.addEventListener('click', () => {
    hideAllSections();
    ventasSection?.classList.remove('hidden');
    [btnPOS, btnProducts, btnReports, btnPartners, btnVentas].forEach(b => b?.classList.remove('border-b-2', 'border-white'));
    btnVentas?.classList.add('border-b-2', 'border-white');
    fetchSales();
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
                
                let tagSocio = 'TIENDA';
                if (productoInfo?.tags?.length > 0) {
                    const tagProd = String(productoInfo.tags[0]).toLowerCase().trim();
                    const socioEncontrado = (allPartners || []).find(partner => 
                        String(partner.tag || '').toLowerCase().trim() === tagProd ||
                        String(partner.name || '').toLowerCase().trim() === tagProd
                    );
                    tagSocio = socioEncontrado ? socioEncontrado.name.toUpperCase() : tagProd.toUpperCase();
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
    html += '</div>';
    contenedorDiv.innerHTML = html;
}

window.exportarExcel = async function () {
    try {
        const res = await fetch(`${API_URL}/sales`);
        if (!res.ok) throw new Error('No se pudieron obtener las ventas');
        const ventas = await res.json();

        if (ventas.length === 0) { alert('No hay ventas registradas.'); return; }

        // 1. Obtener dinámicamente las columnas según tus socios/tags reales registrados
        const nombresSocios = (allPartners || []).map(p => p.name.toUpperCase().trim());
        
        // Si por alguna razón no han cargado los socios, usamos la lista real de tu pantalla
        const columnasSocios = nombresSocios.length > 0 
            ? nombresSocios 
            : ['DENISSE', 'MARIA', 'BIMBO', 'VERDURA'];

        // Construir la lista final: TIENDA primero + los nombres de socios (sin repetir)
        const categorias = ['TIENDA', ...columnasSocios.filter(c => c !== 'TIENDA')];

        // Encabezado del CSV con formato utf-8 BOM para Excel
        let csv = '\uFEFF';
        csv += 'Fecha,' + categorias.join(',') + ',Total\n';

        ventas.forEach(v => {
            const fecha = v.createdAt ? v.createdAt.substring(0, 10) : 'Sin Fecha';
            
            // Inicializar acumuladores por categoría en $0
            const subtotalesPorCategoria = {};
            categorias.forEach(cat => subtotalesPorCategoria[cat] = 0);

            let totalVenta = Number(v.total) || 0;

            // 2. Mapear cada producto vendido a su socio/tag correspondiente
            if (v.products && Array.isArray(v.products)) {
                v.products.forEach(p => {
                    const id = p.product?._id || p.product;
                    const info = allProducts.find(prod => String(prod._id) === String(id));
                    
                    const precioUnitario = Number(p.price) || (info ? Number(info.price) : 0);
                    const cantidad = Number(p.quantity) || 1;
                    const subtotalProducto = cantidad * precioUnitario;

                    let categoriaAsignada = 'TIENDA';

                    if (info && info.tags && info.tags.length > 0) {
                        const tagProducto = String(info.tags[0]).toLowerCase().trim();
                        
                        // Buscar coincidencia en la lista de socios (por tag ej "#m" o por nombre ej "maria")
                        const socioEncontrado = (allPartners || []).find(partner => {
                            const pTag = String(partner.tag || '').toLowerCase().trim();
                            const pName = String(partner.name || '').toLowerCase().trim();
                            return pTag === tagProducto || pName === tagProducto;
                        });

                        if (socioEncontrado) {
                            categoriaAsignada = socioEncontrado.name.toUpperCase().trim();
                        } else {
                            const catDirecta = categorias.find(c => c.toLowerCase() === tagProducto);
                            if (catDirecta) categoriaAsignada = catDirecta;
                        }
                    }

                    // Asignar al acumulador de la categoría correspondiente
                    if (subtotalesPorCategoria.hasOwnProperty(categoriaAsignada)) {
                        subtotalesPorCategoria[categoriaAsignada] += subtotalProducto;
                    } else {
                        subtotalesPorCategoria['TIENDA'] += subtotalProducto;
                    }
                });
            }

            // 3. Si la categoría tiene $0 se deja en blanco (como en la foto de tu Excel)
            const valoresColumnas = categorias.map(cat => {
                const monto = subtotalesPorCategoria[cat];
                return monto > 0 ? monto.toFixed(2) : '';
            });

            csv += `${fecha},${valoresColumnas.join(',')},${totalVenta.toFixed(2)}\n`;
        });

        // 4. Descargar archivo CSV
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `Reporte_Ventas_Matriz_${new Date().toLocaleDateString().replace(/\//g, '-')}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

    } catch (error) {
        console.error('Error Excel:', error);
        alert('Error al generar el archivo.');
    }
};

// ====================
// 🧾 HISTORIAL DE VENTAS
// ====================
let todasLasVentas = []; // Guardará las ventas para poder consultar sus productos

async function fetchSales() {
    if (!ventasList) return;
    ventasList.innerHTML = '<p class="text-center text-gray-400 py-6 animate-pulse">Cargando ventas...</p>';
    try {
        const res = await fetch(`${API_URL}/sales`);
        if (!res.ok) throw new Error('Error al obtener ventas');
        const ventas = await res.json();
        todasLasVentas = ventas; // Guardamos copia local
        renderVentas(ventas);
    } catch (error) {
        console.error('fetchSales error:', error);
        ventasList.innerHTML = '<p class="text-center text-red-500 py-6">Error al cargar ventas.</p>';
    }
}

function renderVentas(ventas) {
    if (!ventasList) return;
    ventasList.innerHTML = '';

    if (ventas.length === 0) {
        ventasList.innerHTML = '<p class="text-center text-gray-400 py-6 italic">No hay ventas registradas</p>';
        return;
    }

    ventas.forEach(v => {
        const cancelada = v.status === 'cancelled';
        const fecha = v.createdAt ? new Date(v.createdAt).toLocaleString('es-MX') : 'Sin fecha';

        // 1. DIBUJAMOS CADA PRODUCTO CON SU PROPIO BOTÓN DE ELIMINAR
        let productosHtml = '';
        if (v.products && v.products.length > 0) {
            productosHtml = v.products.map((item, index) => {
                const nombre = item.product?.name || item.name || 'Producto eliminado';
                const precio = parseFloat(item.price || item.product?.price || 0);
                const cantidad = parseFloat(item.quantity || 1);
                const subtotal = precio * cantidad;

                return `
                    <div class="flex justify-between items-center py-1.5 border-b border-gray-100 last:border-0">
                        <span class="text-sm text-gray-700">
                            <strong class="text-gray-800">${nombre}</strong> x${cantidad} 
                            <span class="text-gray-400 text-xs">($${subtotal.toFixed(2)})</span>
                        </span>
                        ${!cancelada ? `
                            <button onclick="cancelarProductoDeVenta('${v._id}', ${index})" 
                                    class="bg-red-100 hover:bg-red-200 text-red-600 px-2 py-0.5 rounded-lg text-xs font-bold transition-all ml-2 shrink-0">
                                🗑️ Quitar
                            </button>
                        ` : ''}
                    </div>
                `;
            }).join('');
        } else {
            productosHtml = '<p class="text-xs text-gray-400 italic">Sin productos</p>';
        }

        const div = document.createElement('div');
        div.className = `bg-white p-4 rounded-2xl shadow-sm border-2 ${cancelada ? 'border-red-200 bg-red-50' : 'border-gray-100'} flex flex-col gap-3`;

        div.innerHTML = `
            <div class="flex justify-between items-start ${cancelada ? 'opacity-60 line-through' : ''}">
                <div>
                    <div class="flex items-center gap-2">
                        <span class="font-black text-gray-800 text-xl">${formatMoney(v.total)}</span>
                        ${cancelada ? '<span class="text-xs font-bold text-red-600 bg-red-100 px-2 py-1 rounded-lg not-italic no-underline">CANCELADA</span>' : ''}
                    </div>
                    <p class="text-xs text-gray-400 mt-0.5">${fecha} · ${v.paymentMethod || 'efectivo'}</p>
                </div>
                ${!cancelada ? `<button class="cancel-venta-btn bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-xl font-bold text-xs shadow-sm active:scale-95 transition-all shrink-0">Cancelar Venta</button>` : ''}
            </div>

            <!-- Lista desplegada de productos de la venta -->
            <div class="bg-gray-50 p-3 rounded-xl border border-gray-100">
                <p class="text-xs font-bold text-gray-400 uppercase mb-1">Productos comprados:</p>
                ${productosHtml}
            </div>
        `;

        if (!cancelada) {
            div.querySelector('.cancel-venta-btn').onclick = () => cancelarVenta(v._id);
        }

        ventasList.appendChild(div);
    });
}

// 2. FUNCIÓN PARA ELIMINAR UN SOLO PRODUCTO Y RECALCULAR PAGO/CAMBIO
window.cancelarProductoDeVenta = async function(ventaId, itemIndex) {
    const venta = todasLasVentas.find(v => v._id === ventaId);
    if (!venta || !venta.products || !venta.products[itemIndex]) return;

    const item = venta.products[itemIndex];
    const nombreProducto = item.product?.name || item.name || 'este producto';
    const precio = parseFloat(item.price || item.product?.price || 0);
    const cantidad = parseFloat(item.quantity || 1);
    const montoACancelar = precio * cantidad;

    const totalAnterior = parseFloat(venta.total || 0);
    const nuevoTotal = Math.max(0, totalAnterior - montoACancelar);

    // 🟢 Obtenemos con cuánto pagó el cliente originalmente
    let pagoCliente = parseFloat(venta.pagoCliente || venta.paidWith || 0);
    
    // Si no estaba guardado 'pagoCliente', lo deducimos si existía el campo 'cambio'
    if (!pagoCliente && venta.cambio !== undefined && venta.cambio !== null) {
        pagoCliente = totalAnterior + parseFloat(venta.cambio || 0);
    }

    // 🟢 Recalculamos los cambios
    const cambioAnterior = pagoCliente > 0 ? Math.max(0, pagoCliente - totalAnterior) : 0;
    const nuevoCambio = pagoCliente > 0 ? Math.max(0, pagoCliente - nuevoTotal) : 0;

    // 📋 Texto de desglose para la ventana de confirmación
    let desgloseTexto = `📦 Producto a quitar: ${nombreProducto} ($${montoACancelar.toFixed(2)})\n`;
    desgloseTexto += `----------------------------------------\n`;
    desgloseTexto += `📉 Total Anterior: ${formatMoney(totalAnterior)} ➡️ Nuevo Total: ${formatMoney(nuevoTotal)}\n`;

    if (pagoCliente > 0) {
        desgloseTexto += `💵 Pagó con: ${formatMoney(pagoCliente)}\n`;
        desgloseTexto += `🔄 Cambio que se le dio antes: ${formatMoney(cambioAnterior)}\n`;
        desgloseTexto += `💰 Nuevo Cambio que le corresponde: ${formatMoney(nuevoCambio)}\n`;
    }
    desgloseTexto += `----------------------------------------\n`;
    desgloseTexto += `🔴 EFECTIVO A REGRESAR AL CLIENTE AHORA: ${formatMoney(montoACancelar)}`;

    if (!confirm(desgloseTexto)) return;

    // Preparamos lista de productos para la BD
    const productosFiltrados = venta.products.filter((_, idx) => idx !== itemIndex);
    const productosParaEnviar = productosFiltrados.map(p => ({
        product: p.product?._id || p.product || p.id,
        quantity: parseFloat(p.quantity || 1),
        price: parseFloat(p.price || p.product?.price || 0)
    }));

    try {
        const res = await fetch(`${API_URL}/sales/${ventaId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                products: productosParaEnviar, 
                total: nuevoTotal,
                pagoCliente: pagoCliente,
                paidWith: pagoCliente,
                cambio: nuevoCambio
            })
        });

        if (res.ok) {
            alert(
                `✅ Venta recalculada y guardada:\n\n` +
                `💵 Devuelve al cliente: ${formatMoney(montoACancelar)}\n` +
                `📉 Nuevo Total Venta: ${formatMoney(nuevoTotal)}` +
                (pagoCliente > 0 ? `\n🔄 Nuevo Cambio Registrado: ${formatMoney(nuevoCambio)}` : '')
            );

            await fetchSales(); 
            if (typeof fetchProducts === 'function') fetchProducts(); 
            if (typeof fetchReportes === 'function') fetchReportes();
            if (typeof renderReportes === 'function') renderReportes();
        } else {
            const err = await res.json().catch(() => ({}));
            alert('❌ No se pudo actualizar la venta: ' + (err.message || 'Error en el servidor'));
        }
    } catch (error) {
        console.error('Error de conexión:', error);
        alert('📡 Error de conexión con el servidor.');
    }
};
// ==========================================
// 🏷️ FUNCIONES DE IMPRESIÓN DE PRECIOS
// ==========================================

// Imprime solo los productos a granel o sin código de barras
window.imprimirSoloGranel = function() {
    const granel = allProducts.filter(p => {
        if (!p) return false;

        const sinCodigo = !p.barcode || p.barcode.trim() === '';
        const esCodigoGranel = p.barcode && p.barcode.toUpperCase().startsWith('GRANEL');
        const esBanderaGranel = p.isBulk === true || p.isBulk === "true" || p.isBulk == 1 || p.is_bulk === true || p.is_bulk == 1;

        return sinCodigo || esCodigoGranel || esBanderaGranel;
    });

    if (granel.length === 0) {
        alert('No hay productos registrados a granel o sin código.');
        return;
    }
    imprimirEtiquetas(granel);
};

// Función principal que abre la ventana limpia lista para imprimir
window.imprimirEtiquetas = function(productos) {
    if (!productos || productos.length === 0) {
        alert('No hay productos para imprimir.');
        return;
    }

    // Crear ventana emergente de impresión
    const win = window.open('', '_blank', 'width=800,height=600');
    
    let htmlEtiquetas = '';
    productos.forEach(p => {
        // Detectar si es a granel (por código o propiedad)
        const esGranel = !p.barcode || p.barcode.trim() === '' || p.barcode.toUpperCase().startsWith('GRANEL') || p.isBulk || p.is_bulk;
        const unidad = esGranel ? (p.unit || 'kg') : 'pza';

        htmlEtiquetas += `
            <div class="etiqueta">
                <div class="nombre">${p.name}</div>
                <div class="precio">$${Number(p.price || 0).toFixed(2)} <span style="font-size: 11px; font-weight: normal; color: #555;">/ ${unidad}</span></div>
                ${esGranel ? '<div class="granel">⚖️ GRANEL</div>' : `<div class="codigo">${p.barcode}</div>`}
            </div>
        `;
    });

   win.document.write(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <title>Imprimir Precios</title>
        <style>
            @page {
                size: A4;
                margin: 8mm;
            }
            body {
                font-family: Arial, sans-serif;
                margin: 0;
                padding: 0;
                background: #fff;
            }
            /* 🔹 CAMBIO 1: 3 columnas para que la etiqueta no quede tan ancha y tenga forma de tarjeta */
            .grid-etiquetas {
                display: grid;
                grid-template-columns: repeat(3, 1fr); 
                gap: 6mm;
            }
            /* 🔹 CAMBIO 2: Distribución vertical para aprovechar la altura */
            .etiqueta {
                border: 2px dashed #222;
                border-radius: 10px;
                padding: 10px 8px;
                text-align: center;
                box-sizing: border-box;
                page-break-inside: avoid;
                display: flex;
                flex-direction: column;
                justify-content: space-between;
                align-items: center;
                min-height: 60mm; /* Mayor altura para que quepa la letra grande */
            }
            /* 🔹 CAMBIO 3: Nombre de producto más grande y resaltado */
            .nombre {
                font-size: 19px; 
                font-weight: 800;
                color: #000;
                line-height: 1.15;
                max-height: 2.3em;
                overflow: hidden;
                margin-bottom: 4px;
                text-transform: uppercase;
                width: 100%;
                word-break: break-word;
            }
            /* 🔹 CAMBIO 4: Precio gigante para vista rápida */
            .precio {
                font-size: 44px; 
                font-weight: 900;
                color: #000;
                margin: 2px 0;
                line-height: 1;
                letter-spacing: -1px;
            }
            /* 🔹 CAMBIO 5: Ajuste de código de barras / imagen */
            .etiqueta img, 
            .etiqueta svg {
                max-width: 95%;
                height: auto;
                max-height: 65px;
                margin: 4px 0;
                object-fit: contain;
            }
            /* 🔹 CAMBIO 6: Texto de código e indicador de granel más legibles */
            .codigo {
                font-family: monospace;
                font-size: 14px; 
                font-weight: bold;
                color: #222;
                border-top: 2px solid #bbb;
                width: 100%;
                padding-top: 4px;
                margin-top: 2px;
            }
            .granel {
                font-size: 13px; 
                font-weight: 800;
                color: #047857;
                background: #d1fae5;
                padding: 3px 8px;
                border-radius: 6px;
                margin-top: 2px;
            }
        </style>
    </head>
    <body>
        <div class="grid-etiquetas">
            ${htmlEtiquetas}
        </div>
        <script>
            window.onload = function() {
                window.print();
                window.close();
            };
        <\/script>
    </body>
    </html>
`);
    win.document.close();
};

// ==========================================
// 🏷️ GESTIÓN DE ETIQUETAS MODIFICADAS
// ==========================================

// Guardar un producto en la lista de modificados
function registrarProductoModificado(producto) {
    if (!producto) return;
    let pendientes = JSON.parse(localStorage.getItem('etiquetasPendientes')) || [];
    
    // Evitamos duplicados: si ya estaba en la lista, lo actualiza
    const idProd = producto._id || producto.id;
    pendientes = pendientes.filter(p => (p._id || p.id) !== idProd);
    pendientes.push(producto);
    
    localStorage.setItem('etiquetasPendientes', JSON.stringify(pendientes));
    actualizarContadorEtiquetasPendientes();
}

// Actualizar el numerito del botón
function actualizarContadorEtiquetasPendientes() {
    const pendientes = JSON.parse(localStorage.getItem('etiquetasPendientes')) || [];
    const badge = document.getElementById('numEtiquetasPendientes');
    if (badge) {
        badge.textContent = pendientes.length;
    }
}

// Función que manda a imprimir SOLO las modificadas
window.imprimirEtiquetasModificadas = function() {
    const pendientes = JSON.parse(localStorage.getItem('etiquetasPendientes')) || [];
    
    if (pendientes.length === 0) {
        alert("ℹ️ No hay productos modificados recientemente para imprimir.");
        return;
    }

    if (typeof imprimirEtiquetas === 'function') {
        imprimirEtiquetas(pendientes);
    } else {
        alert("⚠️ No se encontró la función de impresión.");
        return;
    }

    setTimeout(() => {
        if (confirm("¿Deseas limpiar la lista de etiquetas modificadas ya impresas?")) {
            localStorage.removeItem('etiquetasPendientes');
            actualizarContadorEtiquetasPendientes();
        }
    }, 1000);
};

// Cargar el contador al abrir la página
document.addEventListener('DOMContentLoaded', actualizarContadorEtiquetasPendientes);