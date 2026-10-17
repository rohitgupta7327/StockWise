import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  getSalesReport,
  getProfitReport,
  getTopProducts,
  downloadCSV,
} from '../services/reportService';
import { useToast } from '../components/common/Toast';
import { formatCurrency, formatNumber } from '../utils/formatters';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { HiOutlineDownload } from 'react-icons/hi';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const CHART_COLORS = [
  '#6366f1',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
  '#14b8a6',
  '#f97316',
  '#6b7280',
];

const Reports = () => {
  const { addToast } = useToast();
  const [tab, setTab] = useState('sales');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [salesData, setSalesData] = useState(null);
  const [profitData, setProfitData] = useState(null);
  const [topProducts, setTopProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;

    try {
      if (tab === 'sales') {
        const res = await getSalesReport(params);
        setSalesData(res.data.data);
      } else if (tab === 'profit') {
        const res = await getProfitReport(params);
        setProfitData(res.data.data);
      } else if (tab === 'top') {
        const res = await getTopProducts({ ...params, limit: 10 });
        setTopProducts(res.data.data);
      }
    } catch {
      addToast('Failed to load report analytics', 'error');
    } finally {
      setLoading(false);
    }
  }, [tab, startDate, endDate, addToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCSV = async () => {
    try {
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      const res = await downloadCSV(params);
      const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `StockWise-SalesReport-${Date.now()}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      addToast('CSV exported successfully', 'success');
    } catch {
      addToast('Failed to export CSV report', 'error');
    }
  };

  // Performance: Memoize pie chart dataset
  const pieChartData = useMemo(() => {
    return topProducts.map((p) => ({
      name: p.productName,
      value: p.totalRevenue,
    }));
  }, [topProducts]);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Reports & Analytics</h1>
          <p className="text-sm text-slate-500 mt-1">Sales performance, profit margins, and inventory metrics</p>
        </div>
        <button
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition shrink-0"
          onClick={handleCSV}
        >
          <HiOutlineDownload className="text-lg" /> Export CSV
        </button>
      </div>

      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-6">
        <div className="flex border-b border-slate-200 gap-2">
          <button
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition -mb-px ${
              tab === 'sales'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
            onClick={() => setTab('sales')}
          >
            Sales Overview
          </button>
          <button
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition -mb-px ${
              tab === 'profit'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
            onClick={() => setTab('profit')}
          >
            Profit Analysis
          </button>
          <button
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition -mb-px ${
              tab === 'top'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
            onClick={() => setTab('top')}
          >
            Top Products
          </button>
        </div>

        <div className="flex items-center gap-2 text-sm text-slate-600">
          <label className="text-xs font-semibold text-slate-500">From:</label>
          <input
            type="date"
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 shadow-xs transition"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <label className="text-xs font-semibold text-slate-500">To:</label>
          <input
            type="date"
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 shadow-xs transition"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <LoadingSpinner message="Generating report..." />
      ) : (
        <>
          {/* Sales Report Tab */}
          {tab === 'sales' && salesData && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Gross Sales</span>
                  <div className="text-2xl font-bold text-slate-900 tracking-tight mt-1">
                    {formatCurrency(salesData.summary.totalSales)}
                  </div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Transactions</span>
                  <div className="text-2xl font-bold text-slate-900 tracking-tight mt-1">
                    {formatNumber(salesData.summary.transactionCount)}
                  </div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Average Order Value</span>
                  <div className="text-2xl font-bold text-slate-900 tracking-tight mt-1">
                    {formatCurrency(salesData.summary.avgSaleValue)}
                  </div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Discounts Given</span>
                  <div className="text-2xl font-bold text-slate-500 tracking-tight mt-1">
                    {formatCurrency(salesData.summary.totalDiscount)}
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100">
                  <h2 className="text-base font-semibold text-slate-900">Daily Sales Trend</h2>
                </div>
                <div className="p-4 sm:p-6">
                  {salesData.dailyBreakdown?.length > 0 ? (
                    <ResponsiveContainer width="100%" height={320}>
                      <BarChart data={salesData.dailyBreakdown}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="_id" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                        <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" tickFormatter={(v) => `₹${v}`} />
                        <Tooltip formatter={(v) => [formatCurrency(v), 'Sales']} />
                        <Bar dataKey="totalSales" fill="#4f46e5" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="p-8 text-center text-sm text-slate-400">
                      No transactions found for the selected period
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Profit Report Tab */}
          {tab === 'profit' && profitData && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Revenue</span>
                  <div className="text-2xl font-bold text-slate-900 tracking-tight mt-1">
                    {formatCurrency(profitData.totalRevenue)}
                  </div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Cost of Goods (COGS)</span>
                  <div className="text-2xl font-bold text-slate-900 tracking-tight mt-1">
                    {formatCurrency(profitData.totalCost)}
                  </div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Gross Profit</span>
                  <div
                    className={`text-2xl font-bold tracking-tight mt-1 ${
                      profitData.grossProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {formatCurrency(profitData.grossProfit)}
                  </div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Profit Margin</span>
                  <div
                    className={`text-2xl font-bold tracking-tight mt-1 ${
                      profitData.profitMargin >= 0 ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {Number(profitData.profitMargin || 0).toFixed(1)}%
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100">
                  <h2 className="text-base font-semibold text-slate-900">Revenue vs Cost Breakdown</h2>
                </div>
                <div className="p-4 sm:p-6">
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart
                      data={[
                        { name: 'Revenue', value: profitData.totalRevenue },
                        { name: 'Cost', value: profitData.totalCost },
                        { name: 'Gross Profit', value: profitData.grossProfit },
                      ]}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                      <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" tickFormatter={(v) => `₹${v}`} />
                      <Tooltip formatter={(v) => [formatCurrency(v)]} />
                      <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                        <Cell fill="#4f46e5" />
                        <Cell fill="#f59e0b" />
                        <Cell fill="#10b981" />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* Top Products Tab */}
          {tab === 'top' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100">
                  <h2 className="text-base font-semibold text-slate-900">Top Selling Products</h2>
                </div>
                <div className="overflow-x-auto">
                  {topProducts.length > 0 ? (
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/75">
                          <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">#</th>
                          <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Product</th>
                          <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500 text-right">Qty Sold</th>
                          <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500 text-right">Revenue</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {topProducts.map((p, i) => (
                          <tr key={p._id || i} className="hover:bg-slate-50/50 transition">
                            <td className="px-6 py-4 font-bold text-slate-500">{i + 1}</td>
                            <td className="px-6 py-4">
                              <div className="font-semibold text-slate-900">{p.productName}</div>
                              <span className="font-mono text-xs text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                {p.sku}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right font-bold text-slate-800">
                              {formatNumber(p.totalQuantity)}
                            </td>
                            <td className="px-6 py-4 text-right font-bold text-indigo-600">
                              {formatCurrency(p.totalRevenue)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="p-8 text-center text-sm text-slate-400">No sales activity recorded</div>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100">
                  <h2 className="text-base font-semibold text-slate-900">Revenue Distribution</h2>
                </div>
                <div className="p-4 sm:p-6">
                  {pieChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={350}>
                      <PieChart>
                        <Pie
                          data={pieChartData}
                          cx="50%"
                          cy="50%"
                          outerRadius={110}
                          dataKey="value"
                          label={({ name, percent }) =>
                            `${name.substring(0, 14)}${name.length > 14 ? '…' : ''} (${(
                              percent * 100
                            ).toFixed(0)}%)`
                          }
                        >
                          {pieChartData.map((_, i) => (
                            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v) => formatCurrency(v)} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="p-8 text-center text-sm text-slate-400">
                      No revenue distribution data
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Reports;
