import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createProduct, updateProduct, getProduct } from '../services/productService';
import { useToast } from '../components/common/Toast';
import LoadingSpinner from '../components/common/LoadingSpinner';

const ProductForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const isEdit = Boolean(id);

  const [form, setForm] = useState({
    sku: '',
    name: '',
    category: '',
    purchasePrice: '',
    sellingPrice: '',
    stock: '',
    reorderLevel: '10',
  });
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(isEdit);

  useEffect(() => {
    if (isEdit) {
      let isMounted = true;
      getProduct(id)
        .then((res) => {
          if (!isMounted) return;
          const p = res.data.data;
          setForm({
            sku: p.sku,
            name: p.name,
            category: p.category,
            purchasePrice: p.purchasePrice.toString(),
            sellingPrice: p.sellingPrice.toString(),
            stock: p.stock.toString(),
            reorderLevel: p.reorderLevel.toString(),
          });
        })
        .catch(() => addToast('Failed to load product details', 'error'))
        .finally(() => {
          if (isMounted) setFetchLoading(false);
        });

      return () => {
        isMounted = false;
      };
    }
  }, [id, isEdit, addToast]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      ...form,
      purchasePrice: parseFloat(form.purchasePrice),
      sellingPrice: parseFloat(form.sellingPrice),
      stock: parseInt(form.stock, 10),
      reorderLevel: parseInt(form.reorderLevel, 10),
    };

    try {
      if (isEdit) {
        await updateProduct(id, payload);
        addToast('Product updated successfully', 'success');
      } else {
        await createProduct(payload);
        addToast('Product created successfully', 'success');
      }
      navigate('/products');
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to save product', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) {
    return <LoadingSpinner message="Loading product record..." />;
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          {isEdit ? 'Edit Product' : 'Add New Product'}
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          {isEdit
            ? 'Update product details, pricing, and reorder levels'
            : 'Add a new inventory item to your store catalog'}
        </p>
      </div>

      <div className="max-w-2xl bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                SKU (Stock Keeping Unit) *
              </label>
              <input
                type="text"
                name="sku"
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 shadow-xs transition disabled:bg-slate-50 disabled:text-slate-400 font-mono"
                placeholder="e.g. ELEC-001"
                value={form.sku}
                onChange={handleChange}
                required
                disabled={isEdit}
              />
              {isEdit && (
                <span className="block mt-1 text-xs text-slate-400">
                  SKU is permanent and cannot be modified after creation
                </span>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Category *
              </label>
              <input
                type="text"
                name="category"
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 shadow-xs transition"
                placeholder="e.g., Electronics, Grocery, Dairy"
                value={form.category}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Product Name *
            </label>
            <input
              type="text"
              name="name"
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 shadow-xs transition"
              placeholder="e.g., Wireless Bluetooth Earbuds"
              value={form.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Purchase / Cost Price (₹) *
              </label>
              <input
                type="number"
                name="purchasePrice"
                step="0.01"
                min="0"
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 shadow-xs transition"
                placeholder="0.00"
                value={form.purchasePrice}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Selling Price (₹) *
              </label>
              <input
                type="number"
                name="sellingPrice"
                step="0.01"
                min="0"
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 shadow-xs transition"
                placeholder="0.00"
                value={form.sellingPrice}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Initial Stock Quantity {isEdit ? '(Read Only)' : '*'}
              </label>
              <input
                type="number"
                name="stock"
                min="0"
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 shadow-xs transition disabled:bg-slate-50 disabled:text-slate-400"
                placeholder="0"
                value={form.stock}
                onChange={handleChange}
                disabled={isEdit}
                required={!isEdit}
              />
              {isEdit && (
                <span className="block mt-1 text-xs text-slate-400">
                  To adjust stock, visit the Inventory management tab
                </span>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Low Stock Reorder Threshold *
              </label>
              <input
                type="number"
                name="reorderLevel"
                min="0"
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 shadow-xs transition"
                placeholder="10"
                value={form.reorderLevel}
                onChange={handleChange}
                required
              />
              <span className="block mt-1 text-xs text-slate-400">
                Triggers alerts when stock falls to or below this count
              </span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition"
              onClick={() => navigate('/products')}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-indigo-700 transition disabled:opacity-60"
              disabled={loading}
            >
              {loading ? 'Saving Product...' : isEdit ? 'Update Product' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductForm;
