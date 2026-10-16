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
      <div className="page-header">
        <div>
          <h1 className="page-title">{isEdit ? 'Edit Product' : 'Add New Product'}</h1>
          <p className="page-description">
            {isEdit
              ? 'Update product details, pricing, and reorder levels'
              : 'Add a new inventory item to your store catalog'}
          </p>
        </div>
      </div>

      <div className="card" style={{ maxWidth: 720 }}>
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">SKU (Stock Keeping Unit) *</label>
                <input
                  type="text"
                  name="sku"
                  className="form-input"
                  placeholder="e.g. ELEC-001"
                  value={form.sku}
                  onChange={handleChange}
                  required
                  disabled={isEdit}
                />
                {isEdit && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    SKU is permanent and cannot be modified after creation
                  </span>
                )}
              </div>

              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Category *</label>
                <input
                  type="text"
                  name="category"
                  className="form-input"
                  placeholder="e.g., Electronics, Grocery, Dairy"
                  value={form.category}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Product Name *</label>
              <input
                type="text"
                name="name"
                className="form-input"
                placeholder="e.g., Wireless Bluetooth Earbuds"
                value={form.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Purchase / Cost Price (₹) *</label>
                <input
                  type="number"
                  name="purchasePrice"
                  step="0.01"
                  min="0"
                  className="form-input"
                  placeholder="0.00"
                  value={form.purchasePrice}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Selling Price (₹) *</label>
                <input
                  type="number"
                  name="sellingPrice"
                  step="0.01"
                  min="0"
                  className="form-input"
                  placeholder="0.00"
                  value={form.sellingPrice}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">
                  Initial Stock Quantity {isEdit ? '(Read Only)' : '*'}
                </label>
                <input
                  type="number"
                  name="stock"
                  min="0"
                  className="form-input"
                  placeholder="0"
                  value={form.stock}
                  onChange={handleChange}
                  disabled={isEdit}
                  required={!isEdit}
                />
                {isEdit && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    To adjust stock, visit the Inventory management tab
                  </span>
                )}
              </div>

              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Low Stock Reorder Threshold *</label>
                <input
                  type="number"
                  name="reorderLevel"
                  min="0"
                  className="form-input"
                  placeholder="10"
                  value={form.reorderLevel}
                  onChange={handleChange}
                  required
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Triggers alerts when stock falls to or below this count
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 24 }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => navigate('/products')}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Saving Product...' : isEdit ? 'Update Product' : 'Create Product'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProductForm;
