const Sale = require('../models/Sale');
const Product = require('../models/Product');

// @desc    Sales summary report
// @route   GET /api/reports/sales
// @access  Private
exports.salesReport = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const match = { status: 'completed' };

    if (startDate || endDate) {
      match.createdAt = {};
      if (startDate) match.createdAt.$gte = new Date(startDate);
      if (endDate) match.createdAt.$lte = new Date(endDate + 'T23:59:59.999Z');
    }

    // Parallelize summary and daily breakdown
    const [result, dailyBreakdown] = await Promise.all([
      Sale.aggregate([
        { $match: match },
        {
          $group: {
            _id: null,
            totalSales: { $sum: '$totalAmount' },
            totalDiscount: { $sum: '$discountAmount' },
            totalTax: { $sum: '$taxAmount' },
            transactionCount: { $sum: 1 },
            avgSaleValue: { $avg: '$totalAmount' },
          },
        },
      ]),
      Sale.aggregate([
        { $match: match },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            totalSales: { $sum: '$totalAmount' },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    res.status(200).json({
      success: true,
      data: {
        summary: result[0] || {
          totalSales: 0,
          totalDiscount: 0,
          totalTax: 0,
          transactionCount: 0,
          avgSaleValue: 0,
        },
        dailyBreakdown,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Profit report
// @route   GET /api/reports/profit
// @access  Private
exports.profitReport = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const match = { status: 'completed' };

    if (startDate || endDate) {
      match.createdAt = {};
      if (startDate) match.createdAt.$gte = new Date(startDate);
      if (endDate) match.createdAt.$lte = new Date(endDate + 'T23:59:59.999Z');
    }

    const result = await Sale.aggregate([
      { $match: match },
      { $unwind: '$items' },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$items.subtotal' },
          totalCost: {
            $sum: { $multiply: ['$items.costPrice', '$items.quantity'] },
          },
          totalItemsSold: { $sum: '$items.quantity' },
        },
      },
      {
        $project: {
          totalRevenue: 1,
          totalCost: 1,
          totalItemsSold: 1,
          grossProfit: { $subtract: ['$totalRevenue', '$totalCost'] },
          profitMargin: {
            $cond: [
              { $eq: ['$totalRevenue', 0] },
              0,
              {
                $multiply: [
                  {
                    $divide: [
                      { $subtract: ['$totalRevenue', '$totalCost'] },
                      '$totalRevenue',
                    ],
                  },
                  100,
                ],
              },
            ],
          },
        },
      },
    ]);

    // Daily profit breakdown
    const dailyProfit = await Sale.aggregate([
      { $match: match },
      { $unwind: '$items' },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$items.subtotal' },
          cost: {
            $sum: { $multiply: ['$items.costPrice', '$items.quantity'] },
          },
        },
      },
      {
        $project: {
          _id: 1,
          revenue: 1,
          cost: 1,
          profit: { $subtract: ['$revenue', '$cost'] },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.status(200).json({
      success: true,
      data: {
        summary: result[0] || {
          totalRevenue: 0,
          totalCost: 0,
          totalItemsSold: 0,
          grossProfit: 0,
          profitMargin: 0,
        },
        dailyProfit,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Top-selling products
// @route   GET /api/reports/top-products
// @access  Private
exports.topProducts = async (req, res, next) => {
  try {
    const { startDate, endDate, limit = 10 } = req.query;
    const match = { status: 'completed' };

    if (startDate || endDate) {
      match.createdAt = {};
      if (startDate) match.createdAt.$gte = new Date(startDate);
      if (endDate) match.createdAt.$lte = new Date(endDate + 'T23:59:59.999Z');
    }

    const topProducts = await Sale.aggregate([
      { $match: match },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          productName: { $first: '$items.productName' },
          sku: { $first: '$items.sku' },
          totalQuantity: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.subtotal' },
        },
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: Math.max(1, parseInt(limit) || 10) },
    ]);

    res.status(200).json({
      success: true,
      data: topProducts,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Dashboard summary
// @route   GET /api/reports/dashboard
// @access  Private
exports.dashboardSummary = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    // Performance Optimization: Run ALL 8 queries in parallel via Promise.all
    const [
      totalProducts,
      lowStockCount,
      salesSummary,
      todaySales,
      topProducts,
      lowStockProducts,
      recentSales,
      salesLast7Days,
    ] = await Promise.all([
      // 1. Total active products
      Product.countDocuments({ isActive: true }),

      // 2. Low stock count
      Product.countDocuments({
        isActive: true,
        $expr: { $lte: ['$stock', '$reorderLevel'] },
      }),

      // 3. Sales summary (all time completed)
      Sale.aggregate([
        { $match: { status: 'completed' } },
        {
          $group: {
            _id: null,
            totalSales: { $sum: '$totalAmount' },
            transactionCount: { $sum: 1 },
          },
        },
      ]),

      // 4. Today's sales
      Sale.aggregate([
        { $match: { status: 'completed', createdAt: { $gte: today } } },
        {
          $group: {
            _id: null,
            totalSales: { $sum: '$totalAmount' },
            count: { $sum: 1 },
          },
        },
      ]),

      // 5. Top 5 selling products
      Sale.aggregate([
        { $match: { status: 'completed' } },
        { $unwind: '$items' },
        {
          $group: {
            _id: '$items.product',
            productName: { $first: '$items.productName' },
            sku: { $first: '$items.sku' },
            totalQuantity: { $sum: '$items.quantity' },
            totalRevenue: { $sum: '$items.subtotal' },
          },
        },
        { $sort: { totalQuantity: -1 } },
        { $limit: 5 },
      ]),

      // 6. Low stock products (top 5) with lean()
      Product.find({
        isActive: true,
        $expr: { $lte: ['$stock', '$reorderLevel'] },
      })
        .sort('stock')
        .limit(5)
        .lean(),

      // 7. Recent 5 sales with lean()
      Sale.find()
        .populate('createdBy', 'name')
        .sort('-createdAt')
        .limit(5)
        .lean(),

      // 8. Sales last 7 days
      Sale.aggregate([
        {
          $match: {
            status: 'completed',
            createdAt: { $gte: sevenDaysAgo },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            sales: { $sum: '$totalAmount' },
            orders: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalProducts,
        lowStockCount,
        totalSales: salesSummary[0]?.totalSales || 0,
        transactionCount: salesSummary[0]?.transactionCount || 0,
        todaySales: todaySales[0]?.totalSales || 0,
        todayTransactions: todaySales[0]?.count || 0,
        topProducts,
        lowStockProducts,
        recentSales,
        salesLast7Days,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Export sales report to CSV
// @route   GET /api/reports/sales/csv
// @access  Private
exports.exportSalesCSV = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const match = {};

    if (startDate || endDate) {
      match.createdAt = {};
      if (startDate) match.createdAt.$gte = new Date(startDate);
      if (endDate) match.createdAt.$lte = new Date(endDate + 'T23:59:59.999Z');
    }

    const sales = await Sale.find(match)
      .populate('createdBy', 'name')
      .sort('-createdAt')
      .lean();

    // Generate CSV string
    const headers = [
      'Invoice Number',
      'Date',
      'Customer',
      'Payment Method',
      'Items Count',
      'Subtotal (INR)',
      'Discount (INR)',
      'Tax (INR)',
      'Total Amount (INR)',
      'Status',
      'Created By',
    ];

    const rows = sales.map((sale) => [
      `"${sale.invoiceNumber}"`,
      `"${new Date(sale.createdAt).toISOString().split('T')[0]}"`,
      `"${sale.customer || 'Walk-in'}"`,
      `"${(sale.paymentMethod || 'cash').toUpperCase()}"`,
      sale.items ? sale.items.reduce((sum, i) => sum + i.quantity, 0) : 0,
      sale.subtotal.toFixed(2),
      sale.discountAmount.toFixed(2),
      sale.taxAmount.toFixed(2),
      sale.totalAmount.toFixed(2),
      `"${sale.status}"`,
      `"${sale.createdBy ? sale.createdBy.name : 'Unknown'}"`,
    ]);

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=sales-report-${Date.now()}.csv`
    );
    res.status(200).send(csv);
  } catch (error) {
    next(error);
  }
};

exports.salesReportCSV = exports.exportSalesCSV;
