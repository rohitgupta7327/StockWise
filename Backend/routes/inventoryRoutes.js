const express = require('express');
const router = express.Router();
const {
  getLowStock,
  createAdjustment,
  getMovements,
} = require('../controllers/inventoryController');
const { protect } = require('../middleware/auth');

router.get('/low-stock', protect, getLowStock);
router.post('/adjustments', protect, createAdjustment);
router.get('/movements', protect, getMovements);

module.exports = router;
