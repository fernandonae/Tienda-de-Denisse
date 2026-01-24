const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

app.use(cors());
app.use(express.json());

// API
app.use('/api/products', require('./routes/product.routes'));
app.use('/api/sales', require('./routes/sales.routes'));
app.use('/api/partners', require('./routes/partner.routes'));


// 🔥 FRONTEND (ESTE ERA EL ERROR)
app.use(express.static(path.join(__dirname, '../public')));

module.exports = app;
