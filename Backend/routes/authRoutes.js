const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getMe,
  getUsers,
  updateUserStatus,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');
const { authLimiter } = require('../middleware/rateLimiter');

router.post('/register', protect, authorize('admin'), authLimiter, register);
router.post('/login', authLimiter, login);
router.get('/me', protect, getMe);
router.get('/users', protect, authorize('admin'), getUsers);
router.patch('/users/:id/status', protect, authorize('admin'), updateUserStatus);

module.exports = router;
