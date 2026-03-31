const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// --- MIDDLEWARES ---
app.use(cors());
app.use(express.json());

// --- API ROUTES ---
// Asegúrate de que estos archivos existan en src/routes/
app.use('/api/products', require('./routes/product.routes'));
app.use('/api/sales', require('./routes/sales.routes'));
app.use('/api/partners', require('./routes/partner.routes'));

// --- FRONTEND (ESTÁTICO) ---
// Servimos los archivos de la carpeta raíz (donde está tu index.html y js/)
const rootPath = path.resolve(__dirname, '..');
app.use(express.static(rootPath));

// --- MANEJADOR DE RUTAS (SPA) ---
// Usamos '*splat' o '(.*)' para capturar todo sin errores en Node v22
app.get('*splat', (req, res) => {
    const indexPath = path.join(rootPath, 'index.html');
    res.sendFile(indexPath, (err) => {
        if (err) {
            console.error("Error al enviar index.html:", err);
            res.status(500).send("Error interno: No se encontró el archivo principal.");
        }
    });
});

// --- MANEJO DE ERRORES GLOBAL (Para que no se muera el server) ---
app.use((err, req, res, next) => {
    console.error("❌ Error detectado:", err.stack);
    res.status(500).json({ message: "Ocurrió un error en el servidor" });
});

module.exports = app;