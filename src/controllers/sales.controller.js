const Sale = require('../models/sale');
const Product = require('../models/products'); // 👈 IMPORTANTE: Necesitamos esto para restar stock

// Crear una nueva venta
exports.createSale = async (req, res) => {
  try {
    const { products, total, paymentMethod } = req.body;

    // 1. Guardar la venta en el historial (Como hacíamos antes)
    const newSale = new Sale({
      products,
      total,
      paymentMethod
    });
    
    await newSale.save();

    // ==========================================
    // 2. 📉 ACTUALIZAR INVENTARIO (LA MAGIA)
    // ==========================================
    
    // Recorremos la lista de productos que se vendieron
    for (const item of products) {
        
        // Usamos una función especial de Mongo llamada $inc (incrementar)
        // Al poner un número negativo, RESTA.
        // item.product es el ID
        // item.quantity es cuánto vendiste (ej: 1 o 0.250)
        
        await Product.findByIdAndUpdate(
            item.product, 
            { $inc: { stock: -item.quantity } } 
        );
    }

    res.status(201).json(newSale);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al procesar la venta', error });
  }
};

// Obtener todas las ventas
exports.getSales = async (req, res) => {
  try {
    // populate('products.product') sirve para traer el nombre del producto en el reporte
    const sales = await Sale.find()
        .populate('products.product') 
        .sort({ createdAt: -1 }); // Ordenar por fecha (más reciente primero)
    res.json(sales);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener ventas' });
  }
};