import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getProducts, deactivateProduct, getCategories } from '../services/productService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/common/Toast';
import { useDebounce } from '../hooks/useDebounce';
import { formatCurrency } from '../utils/formatters';
import { StockBadge } from '../components/common/Badge';
import Pagination from '../components/common/Pagination';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { HiOutlineSearch, HiOutlinePlus, HiOutlinePencil, HiOutlineBan } from 'react-icons/hi';

const Products = () => {
  const { isAdmin } = useAuth();
  const { addToast } = useToast();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [stockStatus, setStockStatus] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Debounce search input by 300ms to eliminate redundant network traffic & re-renders
  const debouncedSearch = useDebounce(search, 300);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getProducts({
        search: debouncedSearch,
        category,
        stockStatus,
        page,
        limit: 15,
      });
      setProducts(res.data.data);
      setTotalPages(res.data.pages);
    } catch (err) {
      addToast('Failed to load products', 'error');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, category, stockStatus, page, addToast]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    getCategories()
      .then((res) => setCategories(res.data.data))
      .catch(() => {});
  }, []);

  const handleDeactivate = async (id, name, isActive) => {
    if (!confirm(`${isActive ? 'Deactivate' : 'Activate'} "${name}"?`)) return;
    try {
      await deactivateProduct(id);
      addToast(`Product ${isActive ? 'deactivated' : 'activated'} successfully`, 'success');
      fetchProducts();
    } catch (err) {
      addToast('Failed to update product status', 'error');
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Products</h1>
          <p className="page-description">Manage your product catalog and pricing</p>
        </div>
        {isAdmin && (
          <Link to="/products/new" className="btn btn-primary">
            <HiOutlinePlus /> Add Product
          </Link>
        )}
      </div>

      {/* Filter Toolbar */}
      <div className="toolbar">
        <div className="search-box">
          <HiOutlineSearch />
          <input
            type="text"
            placeholder="Search by name or SKU..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <select
          className="filter-select"
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>

        <select
          className="filter-select"
          value={stockStatus}
          onChange={(e) => {
            setStockStatus(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All Stock Levels</option>
          <option value="in">In Stock</option>
          <option value="low">Low Stock</option>
          <option value="out">Out of Stock</option>
        </select>
      </div>

      {/* Products Table */}
      <div className="card">
        <div className="table-container">
          {loading ? (
            <LoadingSpinner />
          ) : products.length === 0 ? (
            <div className="empty-state">
              <h3>No products found</h3>
              <p>Try adjusting your search or filters</p>
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Product Name</th>
                  <th>Category</th>
                  <th className="text-right">Cost Price</th>
                  <th className="text-right">Selling Price</th>
                  <th className="text-center">Stock</th>
                  <th className="text-center">Status</th>
                  {isAdmin && <th className="text-center">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p._id}>
                    <td>
                      <span className="sku-badge">{p.sku}</span>
                    </td>
                    <td>
                      <div className="product-cell">
                        <span className="product-name">{p.name}</span>
                        {!p.isActive && <span className="deactivated-tag">Deactivated</span>}
                      </div>
                    </td>
                    <td>
                      <span className="category-pill">{p.category}</span>
                    </td>
                    <td className="text-right">{formatCurrency(p.purchasePrice)}</td>
                    <td className="text-right font-semibold">{formatCurrency(p.sellingPrice)}</td>
                    <td className="text-center">
                      <StockBadge stock={p.stock} reorderLevel={p.reorderLevel} />
                    </td>
                    <td className="text-center">
                      {p.isActive ? (
                        <span className="badge badge-success">Active</span>
                      ) : (
                        <span className="badge badge-danger">Inactive</span>
                      )}
                    </td>
                    {isAdmin && (
                      <td className="text-center">
                        <div className="action-buttons">
                          <Link
                            to={`/products/${p._id}/edit`}
                            className="btn-icon"
                            title="Edit Product"
                          >
                            <HiOutlinePencil />
                          </Link>
                          <button
                            className="btn-icon danger"
                            onClick={() => handleDeactivate(p._id, p.name, p.isActive)}
                            title={p.isActive ? 'Deactivate' : 'Activate'}
                          >
                            <HiOutlineBan />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Reusable Pagination */}
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>
    </div>
  );
};

export default Products;
