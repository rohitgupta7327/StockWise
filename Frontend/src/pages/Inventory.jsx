import React, { useState, useEffect, useCallback } from 'react';
import { getProducts } from '../services/productService';
import { createAdjustment, getMovements } from '../services/inventoryService';
import { useToast } from '../components/common/Toast';
import { formatDateTime } from '../utils/formatters';
import { Badge } from '../components/common/Badge';
import Pagination from '../components/common/Pagination';
import LoadingSpinner from '../components/common/LoadingSpinner';

const TYPE_BADGE_MAP = {
  received: 'success',
  adjustment: 'info',
  sale: 'warning',
  return: 'neutral',
};

const Inventory = () => {
  const { addToast } = useToast();
  const [tab, setTab] = useState('adjust');

  // Adjustment form
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({ productId: '', type: 'received', quantity: '', reason: '' });
  const [adjustLoading, setAdjustLoading] = useState(false);

  // Movement history
  const [movements, setMovements] = useState([]);
  const [movementLoading, setMovementLoading] = useState(false);
  const [movFilter, setMovFilter] = useState({ type: '', startDate: '', endDate: '' });
  const [movPage, setMovPage] = useState(1);
  const [movTotalPages, setMovTotalPages] = useState(1);

  const loadAllProducts = useCallback(async () => {
    try {
      const res = await getProducts({ all: true });
      setProducts(res.data.data);
    } catch {
      // non-blocking
    }
  }, []);

  useEffect(() => {
    loadAllProducts();
  }, [loadAllProducts]);

  const fetchMovements = useCallback(async () => {
    setMovementLoading(true);
    try {
      const res = await getMovements({ ...movFilter, page: movPage, limit: 20 });
      setMovements(res.data.data);
      setMovTotalPages(res.data.pages);
    } catch {
      addToast('Failed to load inventory movements', 'error');
    } finally {
      setMovementLoading(false);
    }
  }, [movFilter, movPage, addToast]);

  useEffect(() => {
    if (tab === 'history') {
      fetchMovements();
    }
  }, [tab, fetchMovements]);

  const handleAdjust = async (e) => {
    e.preventDefault();
    if (!form.productId || form.quantity === '') {
      addToast('Please select a product and enter quantity', 'warning');
      return;
    }

    setAdjustLoading(true);
    try {
      await createAdjustment({
        productId: form.productId,
        type: form.type,
        quantity: parseInt(form.quantity, 10),
        reason: form.reason.trim(),
      });
      addToast('Stock adjusted successfully', 'success');
      setForm({ productId: '', type: 'received', quantity: '', reason: '' });
      loadAllProducts();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to adjust stock', 'error');
    } finally {
      setAdjustLoading(false);
    }
  };

  const selectedProduct = products.find((p) => p._id === form.productId);
  const parsedQty = parseInt(form.quantity, 10);
  const hasValidQty = !isNaN(parsedQty);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Inventory Management</h1>
          <p className="page-description">Adjust product stock levels and audit movement logs</p>
        </div>
      </div>

      <div className="tabs">
        <button
          className={`tab ${tab === 'adjust' ? 'active' : ''}`}
          onClick={() => setTab('adjust')}
        >
          Stock Adjustment
        </button>
        <button
          className={`tab ${tab === 'history' ? 'active' : ''}`}
          onClick={() => setTab('history')}
        >
          Movement History
        </button>
      </div>

      {tab === 'adjust' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>
          <div className="card">
            <div className="card-header">
              <div className="card-title">Record Stock Adjustment</div>
            </div>
            <div className="card-body">
              <form onSubmit={handleAdjust}>
                <div className="form-group">
                  <label className="form-label">Product *</label>
                  <select
                    className="form-select"
                    value={form.productId}
                    onChange={(e) => setForm({ ...form, productId: e.target.value })}
                    required
                  >
                    <option value="">Select a product...</option>
                    {products.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.sku} — {p.name} (Stock: {p.stock})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-row">
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Type *</label>
                    <select
                      className="form-select"
                      value={form.type}
                      onChange={(e) => setForm({ ...form, type: e.target.value })}
                    >
                      <option value="received">Stock Received (Inward)</option>
                      <option value="adjustment">Manual Adjustment (Reconcile)</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Quantity *</label>
                    <input
                      type="number"
                      className="form-input"
                      placeholder="e.g. 50 or -5"
                      value={form.quantity}
                      onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                      required
                    />
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Positive = increase, negative = decrease
                    </span>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Reason / Invoice Note</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g., Supplier PO #9823 or physical count discrepancy"
                    value={form.reason}
                    onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  />
                </div>

                <button type="submit" className="btn btn-primary" disabled={adjustLoading}>
                  {adjustLoading ? 'Updating Stock...' : 'Submit Adjustment'}
                </button>
              </form>
            </div>
          </div>

          {/* Live Preview Card */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">Live Calculation Preview</div>
            </div>
            <div className="card-body">
              {selectedProduct ? (
                <div>
                  <div style={{ marginBottom: 16 }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{selectedProduct.name}</h3>
                    <p className="text-muted">
                      {selectedProduct.sku} · {selectedProduct.category}
                    </p>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                    <div
                      style={{
                        padding: 16,
                        background: 'var(--gray-50)',
                        borderRadius: 'var(--radius-md)',
                        textAlign: 'center',
                      }}
                    >
                      <div className="text-muted" style={{ fontSize: '0.78rem', marginBottom: 4 }}>
                        Current Stock
                      </div>
                      <div style={{ fontSize: '1.3rem', fontWeight: 800 }}>
                        {selectedProduct.stock}
                      </div>
                    </div>

                    <div
                      style={{
                        padding: 16,
                        background: hasValidQty
                          ? parsedQty >= 0
                            ? 'var(--success-50)'
                            : 'var(--danger-50)'
                          : 'var(--gray-50)',
                        borderRadius: 'var(--radius-md)',
                        textAlign: 'center',
                      }}
                    >
                      <div className="text-muted" style={{ fontSize: '0.78rem', marginBottom: 4 }}>
                        Change
                      </div>
                      <div
                        style={{
                          fontSize: '1.3rem',
                          fontWeight: 800,
                          color: hasValidQty
                            ? parsedQty >= 0
                              ? 'var(--success-600)'
                              : 'var(--danger-600)'
                            : 'inherit',
                        }}
                      >
                        {hasValidQty ? (parsedQty >= 0 ? `+${parsedQty}` : parsedQty) : '—'}
                      </div>
                    </div>

                    <div
                      style={{
                        padding: 16,
                        background: 'var(--primary-50)',
                        borderRadius: 'var(--radius-md)',
                        textAlign: 'center',
                      }}
                    >
                      <div className="text-muted" style={{ fontSize: '0.78rem', marginBottom: 4 }}>
                        Resulting Stock
                      </div>
                      <div
                        style={{
                          fontSize: '1.3rem',
                          fontWeight: 800,
                          color: 'var(--primary-600)',
                        }}
                      >
                        {hasValidQty ? selectedProduct.stock + parsedQty : '—'}
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      marginTop: 16,
                      padding: 12,
                      background: 'var(--gray-50)',
                      borderRadius: 'var(--radius-md)',
                    }}
                  >
                    <span className="text-muted" style={{ fontSize: '0.82rem' }}>
                      Reorder Threshold: <strong>{selectedProduct.reorderLevel} units</strong>
                    </span>
                  </div>
                </div>
              ) : (
                <div className="empty-state">
                  <p>Select a product to view real-time stock simulation</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {tab === 'history' && (
        <div>
          <div className="toolbar">
            <select
              className="filter-select"
              value={movFilter.type}
              onChange={(e) => {
                setMovFilter({ ...movFilter, type: e.target.value });
                setMovPage(1);
              }}
            >
              <option value="">All Movement Types</option>
              <option value="received">Received</option>
              <option value="adjustment">Adjustment</option>
              <option value="sale">Sale</option>
              <option value="return">Return</option>
            </select>
            <div className="date-filter">
              <label>From:</label>
              <input
                type="date"
                value={movFilter.startDate}
                onChange={(e) => {
                  setMovFilter({ ...movFilter, startDate: e.target.value });
                  setMovPage(1);
                }}
              />
              <label>To:</label>
              <input
                type="date"
                value={movFilter.endDate}
                onChange={(e) => {
                  setMovFilter({ ...movFilter, endDate: e.target.value });
                  setMovPage(1);
                }}
              />
            </div>
          </div>

          <div className="card">
            <div className="table-container">
              {movementLoading ? (
                <LoadingSpinner />
              ) : movements.length === 0 ? (
                <div className="empty-state">
                  <h3>No movement history recorded</h3>
                  <p>Inventory adjustments, purchases, and sales will appear here</p>
                </div>
              ) : (
                <table className="table">
                  <thead>
                    <tr>
                      <th>Date & Time</th>
                      <th>Product</th>
                      <th>Type</th>
                      <th className="text-right">Quantity</th>
                      <th className="text-right">Previous</th>
                      <th className="text-right">New Stock</th>
                      <th>Reference</th>
                      <th>Staff</th>
                      <th>Reason / Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movements.map((m) => (
                      <tr key={m._id}>
                        <td style={{ fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
                          {formatDateTime(m.createdAt)}
                        </td>
                        <td>
                          <div className="font-semibold">{m.product?.name}</div>
                          <span className="sku-badge">{m.product?.sku}</span>
                        </td>
                        <td>
                          <Badge variant={TYPE_BADGE_MAP[m.type] || 'neutral'}>
                            {m.type}
                          </Badge>
                        </td>
                        <td className="text-right">
                          <span
                            style={{
                              fontWeight: 700,
                              color:
                                m.quantity >= 0
                                  ? 'var(--success-600)'
                                  : 'var(--danger-600)',
                            }}
                          >
                            {m.quantity >= 0 ? `+${m.quantity}` : m.quantity}
                          </span>
                        </td>
                        <td className="text-right">{m.previousStock}</td>
                        <td className="text-right font-bold">{m.newStock}</td>
                        <td className="font-mono" style={{ fontSize: '0.8rem' }}>
                          {m.reference}
                        </td>
                        <td>{m.user?.name}</td>
                        <td className="text-muted" style={{ fontSize: '0.82rem' }}>
                          {m.reason}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <Pagination page={movPage} totalPages={movTotalPages} onPageChange={setMovPage} />
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
