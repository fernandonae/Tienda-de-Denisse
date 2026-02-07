const Sale = require('../models/sale');
const Product = require('../models/products');

// ===============================
// Crear una nueva venta
// ===============================
exports.createSale = async (req, res) => {
  try {
    const { products, total, paymentMethod } = req.body;

    // 🔴 Validaciones básicas (MUY importantes)
    if (!products || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ message: 'La venta no tiene productos' });
    }

    if (!total || total <= 0) {
      return res.status(400).json({ message: 'Total inválido' });
    }

    // 1️⃣ Guardar la venta
    const newSale = new Sale({
      products,
      total,
      paymentMethod
    });

    await newSale.save();

    // 2️⃣ Actualizar inventario
    for (const item of products) {
      if (!item.product || !item.quantity) continue;

      await Product.findByIdAndUpdate(
        item.product,
        { $inc: { stock: -item.quantity } },
        { new: true }
      );
    }

    res.status(201).json({
      message: 'Venta registrada correctamente',
      sale: newSale
    });

  } catch (error) {
    console.error('❌ Error en createSale:', error);
    res.status(500).json({
      message: 'Error al procesar la venta',
      error: error.message
    });
  }
};

// ===============================
// Obtener todas las ventas
// ===============================
exports.getSales = async (req, res) => {
  try {
    const sales = await Sale.find()
      .populate('products.product') // Trae info del producto
      .sort({ createdAt: -1 });

    res.json(sales);

  } catch (error) {
    console.error('❌ Error en getSales:', error);
    res.status(500).json({
      message: 'Error al obtener ventas',
      error: error.message
    });
  }
};
