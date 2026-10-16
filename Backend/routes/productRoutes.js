const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deactivateProduct,
  getCategories,
} = require('../controllers/productController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

router.get('/categories', protect, getCategories);
router.get('/', protect, getProducts);
router.get('/:id', protect, getProduct);
router.post('/', protect, authorize('admin'), createProduct);
router.put('/:id', protect, authorize('admin'), updateProduct);
router.patch('/:id/deactivate', protect, authorize('admin'), deactivateProduct);

module.exports = router;
