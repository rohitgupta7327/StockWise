import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getLowStock } from '../services/inventoryService';
import { formatCurrency } from '../utils/formatters';
import { StockBadge } from '../components/common/Badge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { HiOutlineExclamationCircle, HiOutlinePlusCircle } from 'react-icons/hi';

const LowStock = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    getLowStock()
      .then((res) => {
        if (isMounted) setProducts(res.data.data);
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">⚠️ Low Stock Alerts</h1>
          <p className="text-sm text-slate-500 mt-1">
            Critical inventory alerts: products currently at or below reorder levels
          </p>
        </div>
        <Link
          to="/inventory"
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-indigo-700 transition shrink-0"
        >
          <HiOutlinePlusCircle className="text-lg" /> Restock Inventory
        </Link>
      </div>

      {products.length > 0 && (
        <div className="flex items-center gap-2.5 mb-6 rounded-2xl bg-amber-50 border border-amber-200/80 p-4 text-sm font-medium text-amber-800 shadow-xs">
          <HiOutlineExclamationCircle className="text-xl text-amber-600 shrink-0" />
          <span>
            {products.length} product{products.length !== 1 ? 's' : ''} require immediate restocking
          </span>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <LoadingSpinner message="Checking inventory levels..." />
          ) : products.length === 0 ? (
            <div className="p-12 text-center">
              <h3 className="text-base font-semibold text-slate-800">All products are well stocked! 🎉</h3>
              <p className="text-sm text-slate-500 mt-1">No products are currently at or below their reorder threshold</p>
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/75">
                  <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">SKU</th>
                  <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Product Name</th>
                  <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Category</th>
                  <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500 text-center">Current Stock</th>
                  <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500 text-center">Reorder Level</th>
                  <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500 text-center">Deficit</th>
                  <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500 text-right">Unit Cost</th>
                  <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((p) => {
                  const deficit = Math.max(0, p.reorderLevel - p.stock);
                  return (
                    <tr key={p._id} className="hover:bg-slate-50/50 transition">
                      <td className="px-6 py-4">
                        <span className="font-mono text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md font-medium">
                          {p.sku}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-900">{p.name}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                          {p.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <StockBadge stock={p.stock} reorderLevel={p.reorderLevel} />
                      </td>
                      <td className="px-6 py-4 text-center font-semibold text-slate-700">{p.reorderLevel}</td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200/80">
                          +{deficit} needed
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-slate-600">{formatCurrency(p.purchasePrice)}</td>
                      <td className="px-6 py-4 text-center">
                        <Link
                          to="/inventory"
                          className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-xs hover:bg-slate-50 transition"
                        >
                          Adjust
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default LowStock;
