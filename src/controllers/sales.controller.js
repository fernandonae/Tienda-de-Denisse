const Sale = require('../models/sale.js');
const Product = require('../models/products.js');

/* =========================
   CREAR VENTA
========================= */
const createSale = async (req, res) => {
  try {
    const { products, paymentMethod } = req.body;

    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({
        message: 'products debe ser un arreglo con al menos un producto'
      });
    }

    if (!paymentMethod) {
      return res.status(400).json({
        message: 'paymentMethod es obligatorio'
      });
    }

    let total = 0;
    const saleProducts = [];

    for (const item of products) {
      if (!item.product || !item.quantity) {
        return res.status(400).json({
          message: 'Cada producto debe tener product y quantity'
        });
      }

      const product = await Product.findById(item.product);

      if (!product) {
        return res.status(404).json({ message: 'Producto no encontrado' });
      }

      if (!product.active) {
        return res.status(400).json({
          message: `${product.name} está desactivado`
        });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({
          message: `Stock insuficiente para ${product.name}`
        });
      }

      product.stock -= item.quantity;
      await product.save();

      const subtotal = product.price * item.quantity;
      total += subtotal;

      saleProducts.push({
        product: product._id,
        quantity: item.quantity,
        price: product.price
      });
    }

    const sale = new Sale({
      products: saleProducts,
      total,
      paymentMethod
    });

    await sale.save();

    res.status(201).json({
      message: 'Venta realizada correctamente',
      sale
    });

  } catch (error) {
    res.status(500).json({
      message: 'Error al crear la venta',
      error: error.message
    });
  }
};

/* =========================
   TODAS LAS VENTAS
========================= */
const getSales = async (req, res) => {
  try {
    const { start, end } = req.query;

    let filter = {};

    if (start && end) {
      filter.createdAt = {
        $gte: new Date(start),
        $lte: new Date(end + 'T23:59:59')
      };
    }

    const sales = await Sale.find(filter)
      .populate('products.product')
      .sort({ createdAt: -1 });

    res.json(sales);
  } catch (error) {
    res.status(500).json({
      message: 'Error al obtener ventas',
      error: error.message
    });
  }
};


/* =========================
   CORTE POR FECHAS
   ?start=2026-01-01&end=2026-01-05
========================= */
const getDailyReport = async (req, res) => {
  try {
    const { start, end } = req.query;

    if (!start || !end) {
      return res.status(400).json({
        message: 'Debes enviar start y end (YYYY-MM-DD)'
      });
    }

    const startDate = new Date(start);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(end);
    endDate.setHours(23, 59, 59, 999);

    const sales = await Sale.find({
      createdAt: { $gte: startDate, $lte: endDate }
    });

    let totalVentas = 0;
    let efectivo = 0;
    let tarjeta = 0;
    let transferencia = 0;

    sales.forEach(sale => {
      totalVentas += sale.total;

      if (sale.paymentMethod === 'efectivo') efectivo += sale.total;
      if (sale.paymentMethod === 'tarjeta') tarjeta += sale.total;
      if (sale.paymentMethod === 'transferencia') transferencia += sale.total;
    });

    res.json({
      desde: start,
      hasta: end,
      numeroVentas: sales.length,
      totalVentas,
      efectivo,
      tarjeta,
      transferencia
    });

  } catch (error) {
    res.status(500).json({
      message: 'Error al generar corte',
      error: error.message
    });
  }
};

/* =========================
   VENTAS POR SOCIO Y FECHAS
   /partner/m?start=2026-01-01&end=2026-01-05
========================= */
const getSalesByPartner = async (req, res) => {
  try {
    const { partner } = req.params;
    const { start, end } = req.query;

    if (!start || !end) {
      return res.status(400).json({
        message: 'Debes enviar start y end (YYYY-MM-DD)'
      });
    }

    const startDate = new Date(start);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(end);
    endDate.setHours(23, 59, 59, 999);

    const sales = await Sale.find({
      createdAt: { $gte: startDate, $lte: endDate }
    }).populate('products.product');

    let total = 0;
    let productsSold = [];

    sales.forEach(sale => {
      sale.products.forEach(item => {
        // 🔒 DETALLITO CORREGIDO
        if (item.product.tags && item.product.tags.includes(partner)) {
          const subtotal = item.price * item.quantity;
          total += subtotal;

          productsSold.push({
            name: item.product.name,
            quantity: item.quantity,
            subtotal
          });
        }
      });
    });

    res.json({
      socio: partner,
      desde: start,
      hasta: end,
      totalVendido: total,
      productos: productsSold
    });

  } catch (error) {
    res.status(500).json({
      message: 'Error al obtener ventas por socio',
      error: error.message
    });
  }
};

module.exports = {
  createSale,
  getSales,
  getDailyReport,
  getSalesByPartner
};
