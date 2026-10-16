const mongoose = require('mongoose');
const Sale = require('../models/Sale');
const Product = require('../models/Product');
const Counter = require('../models/Counter');
const InventoryMovement = require('../models/InventoryMovement');

// @desc    Create a new sale
// @route   POST /api/sales
// @access  Private
exports.createSale = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { items, discountPercent = 0, taxPercent = 0, customer } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Sale must have at least one item',
      });
    }

    // Performance Optimization: Batch fetch all products in a single roundtrip (O(1) network calls vs O(N))
    const productIds = items.map((i) => i.productId);
    const products = await Product.find({ _id: { $in: productIds } }).session(session);
    const productMap = new Map(products.map((p) => [p._id.toString(), p]));

    let subtotal = 0;
    const saleItems = [];
    const bulkProductUpdates = [];
    const movementDocs = [];

    // Pre-generate invoice number
    const seq = await Counter.getNextSequence('invoice');
    const invoiceNumber = `INV-${String(seq).padStart(5, '0')}`;

    for (const item of items) {
      const product = productMap.get(String(item.productId));

      if (!product) {
        await session.abortTransaction();
        session.endSession();
        return res.status(404).json({
          success: false,
          message: `Product not found: ${item.productId}`,
        });
      }

      if (!product.isActive) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({
          success: false,
          message: `Product "${product.name}" is deactivated and cannot be sold`,
        });
      }

      if (item.quantity <= 0) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({
          success: false,
          message: `Quantity must be positive for "${product.name}"`,
        });
      }

      if (product.stock < item.quantity) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for "${product.name}". Available: ${product.stock}, Requested: ${item.quantity}`,
        });
      }

      // Server-side price calculation — never trust the client
      const itemSubtotal = product.sellingPrice * item.quantity;
      subtotal += itemSubtotal;

      saleItems.push({
        product: product._id,
        productName: product.name,
        sku: product.sku,
        quantity: item.quantity,
        unitPrice: product.sellingPrice,
        costPrice: product.purchasePrice,
        subtotal: itemSubtotal,
      });

      const previousStock = product.stock;
      const newStock = previousStock - item.quantity;
      product.stock = newStock; // update in-memory reference

      bulkProductUpdates.push({
        updateOne: {
          filter: { _id: product._id },
          update: { $set: { stock: newStock } },
        },
      });

      movementDocs.push({
        product: product._id,
        type: 'sale',
        quantity: -item.quantity,
        previousStock,
        newStock,
        reason: `Sale: ${invoiceNumber}`,
        reference: invoiceNumber,
        user: req.user._id,
      });
    }

    // Server-side total calculation
    const discountAmount = (subtotal * discountPercent) / 100;
    const afterDiscount = subtotal - discountAmount;
    const taxAmount = (afterDiscount * taxPercent) / 100;
    const totalAmount = afterDiscount + taxAmount;

    // Create sale document
    const [sale] = await Sale.create(
      [
        {
          invoiceNumber,
          items: saleItems,
          subtotal: Math.round(subtotal * 100) / 100,
          discountPercent,
          discountAmount: Math.round(discountAmount * 100) / 100,
          taxPercent,
          taxAmount: Math.round(taxAmount * 100) / 100,
          totalAmount: Math.round(totalAmount * 100) / 100,
          customer: customer ? customer.trim() : '',
          createdBy: req.user._id,
        },
      ],
      { session }
    );

    // Performance Optimization: Bulk write products and bulk insert movements
    await Promise.all([
      Product.bulkWrite(bulkProductUpdates, { session }),
      InventoryMovement.insertMany(movementDocs, { session }),
    ]);

    await session.commitTransaction();
    session.endSession();

    // Populate createdBy and return
    const populatedSale = await Sale.findById(sale._id)
      .populate('createdBy', 'name email')
      .lean();

    res.status(201).json({
      success: true,
      data: populatedSale,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

// @desc    Get all sales
// @route   GET /api/sales
// @access  Private
exports.getSales = async (req, res, next) => {
  try {
    const { search, startDate, endDate, status, page = 1, limit = 20 } = req.query;
    const query = {};

    if (search) {
      query.invoiceNumber = { $regex: search.trim(), $options: 'i' };
    }

    if (status) {
      query.status = status;
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate + 'T23:59:59.999Z');
    }

    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.max(1, parseInt(limit) || 20);
    const skip = (pageNum - 1) * limitNum;

    // Parallel count and fetch with .lean() for high concurrency
    const [total, sales] = await Promise.all([
      Sale.countDocuments(query),
      Sale.find(query)
        .populate('createdBy', 'name')
        .sort('-createdAt')
        .skip(skip)
        .limit(limitNum)
        .lean(),
    ]);

    res.status(200).json({
      success: true,
      count: sales.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      data: sales,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single sale by ID
// @route   GET /api/sales/:id
// @access  Private
exports.getSale = async (req, res, next) => {
  try {
    const sale = await Sale.findById(req.params.id)
      .populate('createdBy', 'name email')
      .lean();

    if (!sale) {
      return res.status(404).json({
        success: false,
        message: 'Sale not found',
      });
    }

    res.status(200).json({
      success: true,
      data: sale,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Return a sale (restore stock, mark returned)
// @route   POST /api/sales/:id/return
// @access  Admin
exports.returnSale = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const sale = await Sale.findById(req.params.id).session(session);

    if (!sale) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: 'Sale not found',
      });
    }

    if (sale.status === 'returned') {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'This sale has already been returned',
      });
    }

    // Mark sale as returned
    sale.status = 'returned';
    await sale.save({ session });

    // Batch restore product stocks
    const productIds = sale.items.map((i) => i.product);
    const products = await Product.find({ _id: { $in: productIds } }).session(session);
    const productMap = new Map(products.map((p) => [p._id.toString(), p]));

    const bulkProductUpdates = [];
    const movementDocs = [];

    for (const item of sale.items) {
      const product = productMap.get(item.product.toString());
      if (product) {
        const previousStock = product.stock;
        const newStock = previousStock + item.quantity;
        product.stock = newStock;

        bulkProductUpdates.push({
          updateOne: {
            filter: { _id: product._id },
            update: { $set: { stock: newStock } },
          },
        });

        movementDocs.push({
          product: product._id,
          type: 'adjustment',
          quantity: item.quantity,
          previousStock,
          newStock,
          reason: `Return of sale: ${sale.invoiceNumber}`,
          reference: sale.invoiceNumber,
          user: req.user._id,
        });
      }
    }

    await Promise.all([
      bulkProductUpdates.length > 0 ? Product.bulkWrite(bulkProductUpdates, { session }) : Promise.resolve(),
      movementDocs.length > 0 ? InventoryMovement.insertMany(movementDocs, { session }) : Promise.resolve(),
    ]);

    await session.commitTransaction();
    session.endSession();

    const populated = await Sale.findById(sale._id)
      .populate('createdBy', 'name email')
      .lean();

    res.status(200).json({
      success: true,
      message: 'Sale returned and stock restored successfully',
      data: populated,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};
