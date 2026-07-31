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

    // 📉 Descontar stock
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
// ❌ CANCELAR VENTA
// =======================
exports.cancelSale = async (req, res) => {
  try {

    const sale = await Sale.findById(req.params.id);

    if (!sale) {
      return res.status(404).json({
        message: 'Venta no encontrada'
      });
    }

    if (sale.status === 'cancelled') {
      return res.status(400).json({
        message: 'La venta ya fue cancelada'
      });
    }

    // Devolver inventario
    for (const item of sale.products) {
      await Product.findByIdAndUpdate(
        item.product,
        {
          $inc: {
            stock: item.quantity
          }
        }
      );
    }

    sale.status = 'cancelled';
    sale.cancelledAt = new Date();

    await sale.save();

    res.json({
      message: 'Venta cancelada correctamente'
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Error al cancelar la venta'
    });
  }
};

// =======================
// 📊 REPORTE DIARIO
// =======================
exports.getDailyReport = async (req, res) => {
  try {

    const start = new Date();
    start.setHours(0,0,0,0);

    const end = new Date();
    end.setHours(23,59,59,999);

    const sales = await Sale.find({
      createdAt:{
        $gte:start,
        $lte:end
      },
      status:'active'
    });

    const total = sales.reduce((sum,sale)=>sum+sale.total,0);

    res.json({
      date:start.toLocaleDateString(),
      totalSales:sales.length,
      totalAmount:total,
      sales
    });

  } catch (error) {
    res.status(500).json({
      message:'Error en reporte diario'
    });
  }
};

// =======================
// 🤝 REPORTE POR SOCIO
// =======================
exports.getSalesByPartner = async (req,res)=>{

  try{

    const { partner } = req.params;

    const sales = await Sale.find({
      partner,
      status:'active'
    }).sort({
      createdAt:-1
    });

    const total = sales.reduce((sum,sale)=>sum+sale.total,0);

    res.json({
      partner,
      totalSales:sales.length,
      totalAmount:total,
      sales
    });

  }catch(error){

    res.status(500).json({
      message:'Error en reporte por socio'
    });

  }

};