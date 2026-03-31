const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// --- API ROUTES ---
app.use('/api/products', require('./routes/product.routes'));
app.use('/api/sales', require('./routes/sales.routes'));
app.use('/api/partners', require('./routes/partner.routes'));

// --- FRONTEND (ESTÁTICO) ---
// Usamos path.resolve para asegurar que encuentre la carpeta raíz
// Suponiendo que tu estructura es:
// /proyecto
//    /backend/app.js
//    /index.html
//    /js/app.js
app.use(express.static(path.resolve(__dirname, '..')));

// Manejador para que cualquier ruta no encontrada cargue el index.html (Modo SPA)
app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '..', 'index.html'));
});

module.exports = app;