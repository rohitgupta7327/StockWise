const Product = require('../models/Product');

//  Get all products (with search, filter, pagination)
//   GET /api/products
// access  Private
exports.getProducts = async (req, res, next) => {
  try {
    const { search, category, stockStatus, page = 1, limit = 20, all } = req.query;
    const query = {};

    // Search by name or SKU (escaped to prevent regex injection)
    if (search && typeof search === 'string') {
      const safeSearch = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const searchRegex = new RegExp(safeSearch, 'i');
      query.$or = [{ name: searchRegex }, { sku: searchRegex }];
    }

    // Filter by category
    if (category) {
      query.category = category;
    }

    // Filter by stock status
    if (stockStatus === 'low') {
      query.$expr = { $lte: ['$stock', '$reorderLevel'] };
      query.stock = { $gt: 0 };
    } else if (stockStatus === 'out') {
      query.stock = 0;
    } else if (stockStatus === 'in') {
      query.$expr = { $gt: ['$stock', '$reorderLevel'] };
    }

    // Only show active products by default
    if (!req.query.showInactive) {
      query.isActive = true;
    }

    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.max(1, parseInt(limit) || 20);

    // Parallelize count & query with .lean() for minimal memory & fastest response
    let productsQuery = Product.find(query).sort('-createdAt').lean();

    if (!all) {
      const skip = (pageNum - 1) * limitNum;
      productsQuery = productsQuery.skip(skip).limit(limitNum);
    }

    const [total, products] = await Promise.all([
      all ? Promise.resolve(0) : Product.countDocuments(query),
      productsQuery,
    ]);

    const totalCount = all ? products.length : total;

    res.status(200).json({
      success: true,
      count: products.length,
      total: totalCount,
      page: pageNum,
      pages: all ? 1 : Math.ceil(totalCount / limitNum),
      data: products,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Private
exports.getProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id).lean();

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a product
// @route   POST /api/products
// @access  Admin
exports.createProduct = async (req, res, next) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Admin
exports.updateProduct = async (req, res, next) => {
  try {
    // Don't allow stock updates through this endpoint (use inventory adjustments instead)
    delete req.body.stock;

    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).lean();

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Deactivate a product (soft delete toggle)
// @route   PATCH /api/products/:id/deactivate
// @access  Admin
exports.deactivateProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    product.isActive = !product.isActive;
    await product.save();

    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all unique categories
// @route   GET /api/products/categories
// @access  Private
exports.getCategories = async (req, res, next) => {
  try {
    const categories = await Product.distinct('category', { isActive: true });
    res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error) {
    next(error);
  }
};
