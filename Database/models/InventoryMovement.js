const mongoose = require('mongoose');

const inventoryMovementSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    type: {
      type: String,
      enum: ['received', 'adjustment', 'sale', 'return'],
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      // Positive for additions, negative for deductions
    },
    previousStock: {
      type: Number,
      required: true,
    },
    newStock: {
      type: Number,
      required: true,
    },
    reason: {
      type: String,
      trim: true,
      default: '',
    },
    reference: {
      type: String,
      trim: true,
      default: '', // Invoice number or adjustment ID
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

// Indexes for fast history queries and audit filters
inventoryMovementSchema.index({ createdAt: -1 });
inventoryMovementSchema.index({ product: 1, createdAt: -1 });
inventoryMovementSchema.index({ type: 1, createdAt: -1 });

module.exports = mongoose.model('InventoryMovement', inventoryMovementSchema);
