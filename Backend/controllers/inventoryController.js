const Product = require('../models/Product');
const InventoryMovement = require('../models/InventoryMovement');

// @desc    Get low-stock products
// @route   GET /api/inventory/low-stock
// @access  Private
exports.getLowStock = async (req, res, next) => {
  try {
    const products = await Product.find({
      isActive: true,
      $expr: { $lte: ['$stock', '$reorderLevel'] },
    })
      .sort('stock')
      .lean();

    res.status(200).json({
      success: true,
      count: products.length,
      data: products,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Record stock adjustment (received / manual adjustment)
// @route   POST /api/inventory/adjustments
// @access  Private
exports.createAdjustment = async (req, res, next) => {
  try {
    const { productId, type, quantity, reason } = req.body;

    if (!productId || !type || quantity === undefined || quantity === null) {
      return res.status(400).json({
        success: false,
        message: 'productId, type, and quantity are required',
      });
    }

    if (!['received', 'adjustment'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Type must be "received" or "adjustment"',
      });
    }

    const qtyNum = Number(quantity);
    if (isNaN(qtyNum)) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be a valid number',
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    const previousStock = product.stock;
    const newStock = previousStock + qtyNum;

    if (newStock < 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot adjust stock below 0. Current stock: ${previousStock}, adjustment: ${quantity}`,
      });
    }

    // Atomic stock update & movement creation
    product.stock = newStock;
    const [savedProduct, movement] = await Promise.all([
      product.save(),
      InventoryMovement.create({
        product: product._id,
        type,
        quantity: qtyNum,
        previousStock,
        newStock,
        reason: reason ? reason.trim() : '',
        reference: `ADJ-${Date.now()}`,
        user: req.user._id,
      }),
    ]);

    await movement.populate([
      { path: 'product', select: 'name sku' },
      { path: 'user', select: 'name' },
    ]);

    res.status(201).json({
      success: true,
      data: movement,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get inventory movement history
// @route   GET /api/inventory/movements
// @access  Private
exports.getMovements = async (req, res, next) => {
  try {
    const { productId, type, startDate, endDate, page = 1, limit = 30 } = req.query;
    const query = {};

    if (productId) query.product = productId;
    if (type) query.type = type;

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate + 'T23:59:59.999Z');
    }

    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.max(1, parseInt(limit) || 30);
    const skip = (pageNum - 1) * limitNum;

    const [total, movements] = await Promise.all([
      InventoryMovement.countDocuments(query),
      InventoryMovement.find(query)
        .populate('product', 'name sku category')
        .populate('user', 'name')
        .sort('-createdAt')
        .skip(skip)
        .limit(limitNum)
        .lean(),
    ]);

    res.status(200).json({
      success: true,
      count: movements.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      data: movements,
    });
  } catch (error) {
    next(error);
  }
};
