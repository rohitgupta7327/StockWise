const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    sku: {
      type: String,
      required: [true, 'SKU is required'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
    },
    purchasePrice: {
      type: Number,
      required: [true, 'Purchase price is required'],
      min: [0, 'Purchase price cannot be negative'],
    },
    sellingPrice: {
      type: Number,
      required: [true, 'Selling price is required'],
      min: [0, 'Selling price cannot be negative'],
    },
    stock: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Stock cannot be negative'],
    },
    reorderLevel: {
      type: Number,
      required: true,
      default: 10,
      min: [0, 'Reorder level cannot be negative'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Indexes for fast searching and filtering
productSchema.index({ name: 'text', sku: 'text' });
productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ isActive: 1, stock: 1 });
productSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Product', productSchema);
