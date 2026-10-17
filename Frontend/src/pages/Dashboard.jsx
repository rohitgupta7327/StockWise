import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getDashboard } from '../services/reportService';
import { formatCurrency, formatNumber } from '../utils/formatters';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { StockBadge } from '../components/common/Badge';
import {
  HiOutlineCurrencyRupee,
  HiOutlineShoppingCart,
  HiOutlineCube,
  HiOutlineExclamationCircle,
  HiOutlineTrendingUp,
} from 'react-icons/hi';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    getDashboard()
      .then((res) => {
        if (isMounted) setData(res.data.data);
      })
      .catch((err) => console.error('Dashboard fetch error:', err))
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return <LoadingSpinner message="Loading dashboard metrics..." />;
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-2xl border border-slate-200/80">
        <h3 className="text-lg font-semibold text-slate-800">Failed to load dashboard</h3>
        <p className="text-sm text-slate-500 mt-1">Could not connect to the analytics server</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">Overview of your business performance at a glance</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <div className="flex items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 text-2xl">
            <HiOutlineCurrencyRupee />
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Sales</span>
            <div className="text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
              {formatCurrency(data.totalSales)}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">Today: {formatCurrency(data.todaySales)}</div>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 text-2xl">
            <HiOutlineShoppingCart />
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Transactions</span>
            <div className="text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
              {formatNumber(data.transactionCount)}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">Today: {formatNumber(data.todayTransactions)} orders</div>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 text-2xl">
            <HiOutlineCube />
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Products</span>
            <div className="text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
              {formatNumber(data.totalProducts)}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">Active catalog items</div>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600 text-2xl">
            <HiOutlineExclamationCircle />
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Low Stock Items</span>
            <div className="text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
              {formatNumber(data.lowStockCount)}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              {data.lowStockCount > 0 ? (
                <Link to="/low-stock" className="text-rose-600 font-semibold hover:underline">
                  Needs Attention →
                </Link>
              ) : (
                'All levels healthy'
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Sales Trend Chart */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs mb-8 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <HiOutlineTrendingUp className="text-indigo-600 text-xl" />
            Sales Trend (Last 7 Days)
          </div>
        </div>
        <div className="p-4 sm:p-6 h-[320px] w-full">
          {data.salesLast7Days?.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.salesLast7Days} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="_id" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(val) => `₹${val}`} />
                <Tooltip
                  formatter={(val) => [formatCurrency(val), 'Sales']}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#e2e8f0',
                    borderRadius: 12,
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.08)',
                  }}
                />
                <Bar dataKey="sales" fill="#4f46e5" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-400 text-sm">
              No sales activity recorded in the last 7 days
            </div>
          )}
        </div>
      </div>

      {/* Grid: Top Selling Products & Low Stock Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Selling Products */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <h2 className="text-base font-semibold text-slate-900">Top Selling Products</h2>
            <Link to="/reports" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:underline">
              View All
            </Link>
          </div>
          <div className="overflow-x-auto">
            {data.topProducts?.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-400">No sales recorded yet</div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/75">
                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Product</th>
                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 text-center">Units Sold</th>
                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 text-right">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.topProducts.map((p) => (
                    <tr key={p._id} className="hover:bg-slate-50/50 transition">
                      <td className="px-6 py-3.5">
                        <div className="font-medium text-slate-900">{p.productName}</div>
                        <span className="font-mono text-xs text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                          {p.sku}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-center font-semibold text-slate-700">
                        {formatNumber(p.totalQuantity)}
                      </td>
                      <td className="px-6 py-3.5 text-right font-semibold text-indigo-600">
                        {formatCurrency(p.totalRevenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <h2 className="text-base font-semibold text-slate-900">Low Stock Alerts</h2>
            <Link to="/low-stock" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:underline">
              View All
            </Link>
          </div>
          <div className="overflow-x-auto">
            {data.lowStockProducts?.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-400">All products have healthy stock levels</div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/75">
                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Product</th>
                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 text-center">Stock</th>
                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.lowStockProducts.map((p) => (
                    <tr key={p._id} className="hover:bg-slate-50/50 transition">
                      <td className="px-6 py-3.5">
                        <div className="font-medium text-slate-900">{p.name}</div>
                        <span className="font-mono text-xs text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                          {p.sku}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-center">
                        <StockBadge stock={p.stock} reorderLevel={p.reorderLevel} />
                      </td>
                      <td className="px-6 py-3.5 text-center">
                        <Link
                          to="/inventory"
                          className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-xs hover:bg-slate-50 transition"
                        >
                          Restock
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
