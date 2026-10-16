const express = require('express');
const router = express.Router();
const {
  createSale,
  getSales,
  getSale,
  returnSale,
} = require('../controllers/salesController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

router.post('/', protect, createSale);
router.get('/', protect, getSales);
router.get('/:id', protect, getSale);
router.post('/:id/return', protect, authorize('admin'), returnSale);

module.exports = router;
