const mongoose = require('mongoose');

const saleItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    productName: { type: String, required: true },
    sku: { type: String, required: true },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be at least 1'],
    },
    unitPrice: { type: Number, required: true },
    costPrice: { type: Number, required: true },
    subtotal: { type: Number, required: true },
  },
  { _id: false }
);

const saleSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
    },
    items: {
      type: [saleItemSchema],
      required: true,
      validate: [arr => arr.length > 0, 'Sale must have at least one item'],
    },
    subtotal: { type: Number, required: true },
    discountPercent: { type: Number, default: 0, min: 0, max: 100 },
    discountAmount: { type: Number, default: 0 },
    taxPercent: { type: Number, default: 0, min: 0 },
    taxAmount: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
    customer: { type: String, trim: true, default: '' },
    status: {
      type: String,
      enum: ['completed', 'returned'],
      default: 'completed',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

// Indexes for fast querying, date filtering, and analytics
saleSchema.index({ createdAt: -1 });
saleSchema.index({ status: 1, createdAt: -1 });
saleSchema.index({ createdBy: 1 });

module.exports = mongoose.model('Sale', saleSchema);
