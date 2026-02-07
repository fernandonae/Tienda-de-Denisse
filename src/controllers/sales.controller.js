const Sale = require('../models/sale');
const Product = require('../models/products');

// =======================
// 🛒 CREAR VENTA
// =======================
exports.createSale = async (req, res) => {
  try {
    const { products, total, paymentMethod, partner } = req.body;

    const newSale = new Sale({
      products,
      total,
      paymentMethod,
      partner
    });

    await newSale.save();

    // 📉 Actualizar stock
    for (const item of products) {
      await Product.findByIdAndUpdate(
        item.product,
        { $inc: { stock: -item.quantity } }
      );
    }

    res.status(201).json(newSale);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al procesar la venta' });
  }
};

// =======================
// 📄 TODAS LAS VENTAS
// =======================
exports.getSales = async (req, res) => {
  try {
    const sales = await Sale.find()
      .populate('products.product')
      .sort({ createdAt: -1 });

    res.json(sales);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener ventas' });
  }
};

// =======================
// 📊 REPORTE DIARIO
// =======================
exports.getDailyReport = async (req, res) => {
  try {
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const sales = await Sale.find({
      createdAt: { $gte: start, $lte: end }
    });

    const total = sales.reduce((sum, sale) => sum + sale.total, 0);

    res.json({
      date: start.toLocaleDateString(),
      totalSales: sales.length,
      totalAmount: total,
      sales
    });

  } catch (error) {
    res.status(500).json({ message: 'Error en reporte diario' });
  }
};

// =======================
// 🤝 REPORTE POR SOCIO / CAJERO
// =======================
exports.getSalesByPartner = async (req, res) => {
  try {
    const { partner } = req.params;

    const sales = await Sale.find({ partner })
      .sort({ createdAt: -1 });

    const total = sales.reduce((sum, sale) => sum + sale.total, 0);

    res.json({
      partner,
      totalSales: sales.length,
      totalAmount: total,
      sales
    });

  } catch (error) {
    res.status(500).json({ message: 'Error en reporte por socio' });
  }
};
