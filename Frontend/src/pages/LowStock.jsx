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
      <div className="page-header">
        <div>
          <h1 className="page-title">⚠️ Low Stock Alerts</h1>
          <p className="page-description">
            Critical inventory alerts: products currently at or below reorder levels
          </p>
        </div>
        <Link to="/inventory" className="btn btn-primary">
          <HiOutlinePlusCircle /> Restock Inventory
        </Link>
      </div>

      {products.length > 0 && (
        <div
          style={{
            marginBottom: 20,
            padding: '12px 16px',
            background: 'var(--warning-50)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid rgba(245,158,11,0.2)',
            color: 'var(--warning-600)',
            fontSize: '0.88rem',
            fontWeight: 500,
          }}
        >
          <HiOutlineExclamationCircle style={{ verticalAlign: 'middle', marginRight: 6 }} />
          {products.length} product{products.length !== 1 ? 's' : ''} require immediate restocking
        </div>
      )}

      <div className="card">
        <div className="table-container">
          {loading ? (
            <LoadingSpinner message="Checking inventory levels..." />
          ) : products.length === 0 ? (
            <div className="empty-state">
              <h3>All products are well stocked! 🎉</h3>
              <p>No products are currently at or below their reorder threshold</p>
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Product Name</th>
                  <th>Category</th>
                  <th className="text-center">Current Stock</th>
                  <th className="text-center">Reorder Threshold</th>
                  <th className="text-center">Deficit</th>
                  <th className="text-right">Unit Cost</th>
                  <th className="text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => {
                  const deficit = Math.max(0, p.reorderLevel - p.stock);
                  return (
                    <tr key={p._id}>
                      <td>
                        <span className="sku-badge">{p.sku}</span>
                      </td>
                      <td className="font-medium">{p.name}</td>
                      <td>
                        <span className="category-pill">{p.category}</span>
                      </td>
                      <td className="text-center">
                        <StockBadge stock={p.stock} reorderLevel={p.reorderLevel} />
                      </td>
                      <td className="text-center font-semibold">{p.reorderLevel}</td>
                      <td className="text-center">
                        <span className="badge badge-danger">+{deficit} needed</span>
                      </td>
                      <td className="text-right">{formatCurrency(p.purchasePrice)}</td>
                      <td className="text-center">
                        <Link to="/inventory" className="btn btn-secondary btn-sm">
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
