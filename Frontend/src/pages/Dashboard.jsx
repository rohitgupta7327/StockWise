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
      <div className="empty-state">
        <h3>Failed to load dashboard</h3>
        <p>Could not connect to the analytics server</p>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-description">Overview of your business performance at a glance</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon blue">
            <HiOutlineCurrencyRupee />
          </div>
          <div className="kpi-info">
            <h3>Total Sales</h3>
            <div className="kpi-value">{formatCurrency(data.totalSales)}</div>
            <div className="kpi-sub">Today: {formatCurrency(data.todaySales)}</div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon green">
            <HiOutlineShoppingCart />
          </div>
          <div className="kpi-info">
            <h3>Transactions</h3>
            <div className="kpi-value">{formatNumber(data.transactionCount)}</div>
            <div className="kpi-sub">Today: {formatNumber(data.todayTransactions)} orders</div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon orange">
            <HiOutlineCube />
          </div>
          <div className="kpi-info">
            <h3>Total Products</h3>
            <div className="kpi-value">{formatNumber(data.totalProducts)}</div>
            <div className="kpi-sub">Active catalog items</div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon red">
            <HiOutlineExclamationCircle />
          </div>
          <div className="kpi-info">
            <h3>Low Stock Items</h3>
            <div className="kpi-value">{formatNumber(data.lowStockCount)}</div>
            <div className="kpi-sub">
              {data.lowStockCount > 0 ? (
                <Link to="/low-stock" style={{ color: 'var(--danger-500)', fontWeight: 600 }}>
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
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <div className="card-title">
            <HiOutlineTrendingUp style={{ marginRight: 8, color: 'var(--primary-500)' }} />
            Sales Trend (Last 7 Days)
          </div>
        </div>
        <div style={{ height: 300, width: '100%' }}>
          {data.salesLast7Days?.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.salesLast7Days} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
                <XAxis dataKey="_id" stroke="var(--text-muted)" fontSize={12} />
                <YAxis
                  stroke="var(--text-muted)"
                  fontSize={12}
                  tickFormatter={(val) => `₹${val}`}
                />
                <Tooltip
                  formatter={(val) => [formatCurrency(val), 'Sales']}
                  contentStyle={{
                    backgroundColor: 'var(--bg-card)',
                    borderColor: 'var(--border-light)',
                    borderRadius: 8,
                    boxShadow: 'var(--shadow-md)',
                  }}
                />
                <Bar dataKey="sales" fill="var(--primary-500)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state" style={{ padding: 40 }}>
              <p>No sales activity recorded in the last 7 days</p>
            </div>
          )}
        </div>
      </div>

      {/* Grid: Top Selling Products & Low Stock Alerts */}
      <div className="dashboard-grid">
        {/* Top Selling Products */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Top Selling Products</div>
            <Link to="/reports" className="btn-link">
              View All
            </Link>
          </div>
          <div className="table-container">
            {data.topProducts?.length === 0 ? (
              <div className="empty-state">
                <p>No sales recorded yet</p>
              </div>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th className="text-center">Units Sold</th>
                    <th className="text-right">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topProducts.map((p) => (
                    <tr key={p._id}>
                      <td>
                        <div className="product-name">{p.productName}</div>
                        <span className="sku-badge">{p.sku}</span>
                      </td>
                      <td className="text-center font-semibold">{formatNumber(p.totalQuantity)}</td>
                      <td className="text-right font-semibold text-primary">
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
        <div className="card">
          <div className="card-header">
            <div className="card-title">Low Stock Alerts</div>
            <Link to="/low-stock" className="btn-link">
              View All
            </Link>
          </div>
          <div className="table-container">
            {data.lowStockProducts?.length === 0 ? (
              <div className="empty-state">
                <p>All products have healthy stock levels</p>
              </div>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th className="text-center">Stock</th>
                    <th className="text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {data.lowStockProducts.map((p) => (
                    <tr key={p._id}>
                      <td>
                        <div className="product-name">{p.name}</div>
                        <span className="sku-badge">{p.sku}</span>
                      </td>
                      <td className="text-center">
                        <StockBadge stock={p.stock} reorderLevel={p.reorderLevel} />
                      </td>
                      <td className="text-center">
                        <Link to="/inventory" className="btn btn-secondary btn-sm">
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
