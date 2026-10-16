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
      <div className="page-header">
        <div>
          <h1 className="page-title">Reports & Analytics</h1>
          <p className="page-description">Sales performance, profit margins, and inventory metrics</p>
        </div>
        <button className="btn btn-secondary" onClick={handleCSV}>
          <HiOutlineDownload /> Export CSV
        </button>
      </div>

      <div className="toolbar">
        <div className="tabs" style={{ marginBottom: 0, borderBottom: 'none' }}>
          <button
            className={`tab ${tab === 'sales' ? 'active' : ''}`}
            onClick={() => setTab('sales')}
          >
            Sales Overview
          </button>
          <button
            className={`tab ${tab === 'profit' ? 'active' : ''}`}
            onClick={() => setTab('profit')}
          >
            Profit Analysis
          </button>
          <button
            className={`tab ${tab === 'top' ? 'active' : ''}`}
            onClick={() => setTab('top')}
          >
            Top Products
          </button>
        </div>

        <div style={{ marginLeft: 'auto' }}>
          <div className="date-filter">
            <label>From:</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <label>To:</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner message="Generating report..." />
      ) : (
        <>
          {/* Sales Report Tab */}
          {tab === 'sales' && salesData && (
            <div>
              <div className="kpi-grid">
                <div className="kpi-card">
                  <div className="kpi-info">
                    <h3>Total Gross Sales</h3>
                    <div className="kpi-value">{formatCurrency(salesData.summary.totalSales)}</div>
                  </div>
                </div>
                <div className="kpi-card">
                  <div className="kpi-info">
                    <h3>Total Transactions</h3>
                    <div className="kpi-value">{formatNumber(salesData.summary.transactionCount)}</div>
                  </div>
                </div>
                <div className="kpi-card">
                  <div className="kpi-info">
                    <h3>Average Order Value</h3>
                    <div className="kpi-value">{formatCurrency(salesData.summary.avgSaleValue)}</div>
                  </div>
                </div>
                <div className="kpi-card">
                  <div className="kpi-info">
                    <h3>Discounts Given</h3>
                    <div className="kpi-value text-muted">
                      {formatCurrency(salesData.summary.totalDiscount)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <div className="card-title">Daily Sales Trend</div>
                </div>
                <div className="card-body">
                  {salesData.dailyBreakdown?.length > 0 ? (
                    <ResponsiveContainer width="100%" height={320}>
                      <BarChart data={salesData.dailyBreakdown}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
                        <XAxis
                          dataKey="_id"
                          tick={{ fontSize: 12 }}
                          stroke="var(--text-muted)"
                        />
                        <YAxis
                          tick={{ fontSize: 12 }}
                          stroke="var(--text-muted)"
                          tickFormatter={(v) => `₹${v}`}
                        />
                        <Tooltip formatter={(v) => [formatCurrency(v), 'Sales']} />
                        <Bar dataKey="totalSales" fill="var(--primary-500)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="empty-state">
                      <p>No transactions found for the selected period</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Profit Report Tab */}
          {tab === 'profit' && profitData && (
            <div>
              <div className="kpi-grid">
                <div className="kpi-card">
                  <div className="kpi-info">
                    <h3>Total Revenue</h3>
                    <div className="kpi-value">{formatCurrency(profitData.totalRevenue)}</div>
                  </div>
                </div>
                <div className="kpi-card">
                  <div className="kpi-info">
                    <h3>Cost of Goods (COGS)</h3>
                    <div className="kpi-value">{formatCurrency(profitData.totalCost)}</div>
                  </div>
                </div>
                <div className="kpi-card">
                  <div className="kpi-info">
                    <h3>Gross Profit</h3>
                    <div
                      className="kpi-value"
                      style={{
                        color:
                          profitData.grossProfit >= 0
                            ? 'var(--success-600)'
                            : 'var(--danger-600)',
                      }}
                    >
                      {formatCurrency(profitData.grossProfit)}
                    </div>
                  </div>
                </div>
                <div className="kpi-card">
                  <div className="kpi-info">
                    <h3>Profit Margin</h3>
                    <div
                      className="kpi-value"
                      style={{
                        color:
                          profitData.profitMargin >= 0
                            ? 'var(--success-600)'
                            : 'var(--danger-600)',
                      }}
                    >
                      {Number(profitData.profitMargin || 0).toFixed(1)}%
                    </div>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <div className="card-title">Revenue vs Cost Breakdown</div>
                </div>
                <div className="card-body">
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart
                      data={[
                        { name: 'Revenue', value: profitData.totalRevenue },
                        { name: 'Cost', value: profitData.totalCost },
                        { name: 'Gross Profit', value: profitData.grossProfit },
                      ]}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="var(--text-muted)" />
                      <YAxis
                        tick={{ fontSize: 12 }}
                        stroke="var(--text-muted)"
                        tickFormatter={(v) => `₹${v}`}
                      />
                      <Tooltip formatter={(v) => [formatCurrency(v)]} />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        <Cell fill="var(--primary-500)" />
                        <Cell fill="var(--warning-500)" />
                        <Cell fill="var(--success-500)" />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* Top Products Tab */}
          {tab === 'top' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              <div className="card">
                <div className="card-header">
                  <div className="card-title">Top Selling Products</div>
                </div>
                <div className="card-body" style={{ padding: 0 }}>
                  {topProducts.length > 0 ? (
                    <table className="table">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Product</th>
                          <th className="text-right">Qty Sold</th>
                          <th className="text-right">Revenue</th>
                        </tr>
                      </thead>
                      <tbody>
                        {topProducts.map((p, i) => (
                          <tr key={p._id || i}>
                            <td className="font-bold">{i + 1}</td>
                            <td>
                              <div className="font-bold">{p.productName}</div>
                              <span className="sku-badge">{p.sku}</span>
                            </td>
                            <td className="text-right font-bold">{formatNumber(p.totalQuantity)}</td>
                            <td className="text-right font-bold text-primary">
                              {formatCurrency(p.totalRevenue)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="empty-state">
                      <p>No sales activity recorded</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <div className="card-title">Revenue Distribution</div>
                </div>
                <div className="card-body">
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
                    <div className="empty-state">
                      <p>No revenue distribution data</p>
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
