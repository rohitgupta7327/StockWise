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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Products</h1>
          <p className="text-sm text-slate-500 mt-1">Manage your product catalog and pricing</p>
        </div>
        {isAdmin && (
          <Link
            to="/products/new"
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-indigo-700 transition shrink-0"
          >
            <HiOutlinePlus className="text-lg" /> Add Product
          </Link>
        )}
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6">
        <div className="relative flex-1">
          <HiOutlineSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg" />
          <input
            type="text"
            className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 shadow-xs transition"
            placeholder="Search by name or SKU..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <select
          className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-700 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 shadow-xs transition"
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
          className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-700 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 shadow-xs transition"
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

      {/* Products Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <LoadingSpinner />
          ) : products.length === 0 ? (
            <div className="p-12 text-center">
              <h3 className="text-base font-semibold text-slate-800">No products found</h3>
              <p className="text-sm text-slate-500 mt-1">Try adjusting your search or filters</p>
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/75">
                  <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">SKU</th>
                  <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Product Name</th>
                  <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Category</th>
                  <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500 text-right">Cost Price</th>
                  <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500 text-right">Selling Price</th>
                  <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500 text-center">Stock</th>
                  <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500 text-center">Status</th>
                  {isAdmin && <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500 text-center">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50/50 transition">
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md font-medium">
                        {p.sku}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{p.name}</div>
                      {!p.isActive && (
                        <span className="inline-block mt-0.5 text-xs font-semibold text-rose-500">Deactivated</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                        {p.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-slate-600">{formatCurrency(p.purchasePrice)}</td>
                    <td className="px-6 py-4 text-right font-semibold text-slate-900">{formatCurrency(p.sellingPrice)}</td>
                    <td className="px-6 py-4 text-center">
                      <StockBadge stock={p.stock} reorderLevel={p.reorderLevel} />
                    </td>
                    <td className="px-6 py-4 text-center">
                      {p.isActive ? (
                        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/80">Active</span>
                      ) : (
                        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200/80">Inactive</span>
                      )}
                    </td>
                    {isAdmin && (
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <Link
                            to={`/products/${p._id}/edit`}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition"
                            title="Edit Product"
                          >
                            <HiOutlinePencil className="text-lg" />
                          </Link>
                          <button
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition"
                            onClick={() => handleDeactivate(p._id, p.name, p.isActive)}
                            title={p.isActive ? 'Deactivate' : 'Activate'}
                          >
                            <HiOutlineBan className="text-lg" />
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
