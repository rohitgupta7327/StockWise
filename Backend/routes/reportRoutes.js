const express = require('express');
const router = express.Router();
const {
  salesReport,
  profitReport,
  topProducts,
  dashboardSummary,
  exportSalesCSV,
} = require('../controllers/reportController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

router.get('/dashboard', protect, dashboardSummary);
router.get('/sales', protect, authorize('admin'), salesReport);
router.get('/sales/csv', protect, authorize('admin'), exportSalesCSV);
router.get('/profit', protect, authorize('admin'), profitReport);
router.get('/top-products', protect, authorize('admin'), topProducts);

module.exports = router;
