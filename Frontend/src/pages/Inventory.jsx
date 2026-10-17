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
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Inventory Management</h1>
        <p className="text-sm text-slate-500 mt-1">Adjust product stock levels and audit movement logs</p>
      </div>

      <div className="flex border-b border-slate-200 mb-6 gap-2">
        <button
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition -mb-px ${
            tab === 'adjust'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
          onClick={() => setTab('adjust')}
        >
          Stock Adjustment
        </button>
        <button
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition -mb-px ${
            tab === 'history'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
          onClick={() => setTab('history')}
        >
          Movement History
        </button>
      </div>

      {tab === 'adjust' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 sm:p-8">
            <h2 className="text-base font-semibold text-slate-900 mb-6">Record Stock Adjustment</h2>
            <form onSubmit={handleAdjust} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                  Product *
                </label>
                <select
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 shadow-xs transition"
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                    Type *
                  </label>
                  <select
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 shadow-xs transition"
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                  >
                    <option value="received">Stock Received (Inward)</option>
                    <option value="adjustment">Manual Adjustment (Reconcile)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                    Quantity *
                  </label>
                  <input
                    type="number"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 shadow-xs transition"
                    placeholder="e.g. 50 or -5"
                    value={form.quantity}
                    onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                    required
                  />
                  <span className="block mt-1 text-xs text-slate-400">
                    Positive = increase, negative = decrease
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                  Reason / Invoice Note
                </label>
                <input
                  type="text"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 shadow-xs transition"
                  placeholder="e.g., Supplier PO #9823 or physical count discrepancy"
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                />
              </div>

              <button
                type="submit"
                className="w-full sm:w-auto rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-indigo-700 transition disabled:opacity-60"
                disabled={adjustLoading}
              >
                {adjustLoading ? 'Updating Stock...' : 'Submit Adjustment'}
              </button>
            </form>
          </div>

          {/* Live Preview Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 sm:p-8">
            <h2 className="text-base font-semibold text-slate-900 mb-6">Live Calculation Preview</h2>
            {selectedProduct ? (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{selectedProduct.name}</h3>
                  <p className="text-sm text-slate-500 font-mono mt-0.5">
                    {selectedProduct.sku} · {selectedProduct.category}
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-slate-50 rounded-2xl text-center border border-slate-100">
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                      Current
                    </div>
                    <div className="text-2xl font-bold text-slate-900">
                      {selectedProduct.stock}
                    </div>
                  </div>

                  <div
                    className={`p-4 rounded-2xl text-center border ${
                      hasValidQty
                        ? parsedQty >= 0
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                        : 'bg-slate-50 text-slate-500 border-slate-100'
                    }`}
                  >
                    <div className="text-xs font-semibold uppercase tracking-wider mb-1">
                      Change
                    </div>
                    <div className="text-2xl font-bold">
                      {hasValidQty ? (parsedQty >= 0 ? `+${parsedQty}` : parsedQty) : '—'}
                    </div>
                  </div>

                  <div className="p-4 bg-indigo-50 rounded-2xl text-center border border-indigo-100">
                    <div className="text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-1">
                      Result
                    </div>
                    <div className="text-2xl font-bold text-indigo-700">
                      {hasValidQty ? selectedProduct.stock + parsedQty : '—'}
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600">
                  Reorder Threshold: <strong className="text-slate-900 font-semibold">{selectedProduct.reorderLevel} units</strong>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-sm text-slate-400">
                Select a product to view real-time stock simulation
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'history' && (
        <div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6">
            <select
              className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-700 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 shadow-xs transition"
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

            <div className="flex items-center gap-2 text-sm text-slate-600">
              <label className="text-xs font-semibold text-slate-500">From:</label>
              <input
                type="date"
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 shadow-xs transition"
                value={movFilter.startDate}
                onChange={(e) => {
                  setMovFilter({ ...movFilter, startDate: e.target.value });
                  setMovPage(1);
                }}
              />
              <label className="text-xs font-semibold text-slate-500">To:</label>
              <input
                type="date"
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 shadow-xs transition"
                value={movFilter.endDate}
                onChange={(e) => {
                  setMovFilter({ ...movFilter, endDate: e.target.value });
                  setMovPage(1);
                }}
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              {movementLoading ? (
                <LoadingSpinner />
              ) : movements.length === 0 ? (
                <div className="p-12 text-center">
                  <h3 className="text-base font-semibold text-slate-800">No movement history recorded</h3>
                  <p className="text-sm text-slate-500 mt-1">Inventory adjustments, purchases, and sales will appear here</p>
                </div>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/75">
                      <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Date & Time</th>
                      <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Product</th>
                      <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Type</th>
                      <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500 text-right">Quantity</th>
                      <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500 text-right">Previous</th>
                      <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500 text-right">New Stock</th>
                      <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Reference</th>
                      <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Staff</th>
                      <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Reason / Note</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {movements.map((m) => (
                      <tr key={m._id} className="hover:bg-slate-50/50 transition">
                        <td className="px-6 py-4 text-xs text-slate-500 whitespace-nowrap">
                          {formatDateTime(m.createdAt)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-slate-900">{m.product?.name}</div>
                          <span className="font-mono text-xs text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                            {m.product?.sku}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant={TYPE_BADGE_MAP[m.type] || 'neutral'}>
                            {m.type}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span
                            className={`font-bold ${
                              m.quantity >= 0 ? 'text-emerald-600' : 'text-rose-600'
                            }`}
                          >
                            {m.quantity >= 0 ? `+${m.quantity}` : m.quantity}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right text-slate-600">{m.previousStock}</td>
                        <td className="px-6 py-4 text-right font-bold text-slate-900">{m.newStock}</td>
                        <td className="px-6 py-4 font-mono text-xs text-slate-500">
                          {m.reference}
                        </td>
                        <td className="px-6 py-4 text-slate-700">{m.user?.name}</td>
                        <td className="px-6 py-4 text-xs text-slate-500">
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
