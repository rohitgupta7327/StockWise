import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProducts } from '../services/productService';
import { createSale } from '../services/salesService';
import { useToast } from '../components/common/Toast';
import { formatCurrency } from '../utils/formatters';
import { StockBadge } from '../components/common/Badge';
import {
  HiOutlineSearch,
  HiOutlineTrash,
  HiOutlineShoppingCart,
  HiOutlinePlus,
  HiOutlineMinus,
  HiOutlineCheck,
} from 'react-icons/hi';

const NewSale = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const searchRef = useRef(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [cart, setCart] = useState([]);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [taxPercent, setTaxPercent] = useState(18);
  const [customer, setCustomer] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Debounced live product search
  useEffect(() => {
    if (searchQuery.trim().length >= 2) {
      const timer = setTimeout(() => {
        getProducts({ search: searchQuery.trim(), all: true })
          .then((res) => {
            setSearchResults(res.data.data.filter((p) => p.stock > 0 && p.isActive));
            setShowResults(true);
          })
          .catch(() => {});
      }, 250);
      return () => clearTimeout(timer);
    } else {
      setSearchResults([]);
      setShowResults(false);
    }
  }, [searchQuery]);

  // Close search dropdown on click outside
  useEffect(() => {
    const handleClick = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const addToCart = useCallback(
    (product) => {
      setCart((prevCart) => {
        const existing = prevCart.find((item) => item.product._id === product._id);
        if (existing) {
          if (existing.quantity >= product.stock) {
            addToast(`Only ${product.stock} units available for "${product.name}"`, 'warning');
            return prevCart;
          }
          return prevCart.map((item) =>
            item.product._id === product._id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          );
        }
        return [...prevCart, { product, quantity: 1 }];
      });
      setSearchQuery('');
      setShowResults(false);
    },
    [addToast]
  );

  const updateQuantity = useCallback(
    (productId, delta) => {
      setCart((prevCart) =>
        prevCart
          .map((item) => {
            if (item.product._id !== productId) return item;
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            if (newQty > item.product.stock) {
              addToast(`Only ${item.product.stock} units available`, 'warning');
              return item;
            }
            return { ...item, quantity: newQty };
          })
          .filter(Boolean)
      );
    },
    [addToast]
  );

  const removeFromCart = useCallback((productId) => {
    setCart((prevCart) => prevCart.filter((item) => item.product._id !== productId));
  }, []);

  // Performance: Memoize order financial calculations
  const totals = useMemo(() => {
    const subtotal = cart.reduce(
      (sum, item) => sum + item.product.sellingPrice * item.quantity,
      0
    );
    const safeDiscount = Math.min(100, Math.max(0, Number(discountPercent) || 0));
    const safeTax = Math.max(0, Number(taxPercent) || 0);

    const discountAmount = (subtotal * safeDiscount) / 100;
    const afterDiscount = subtotal - discountAmount;
    const taxAmount = (afterDiscount * safeTax) / 100;
    const total = afterDiscount + taxAmount;

    return {
      subtotal,
      discountAmount,
      afterDiscount,
      taxAmount,
      total,
      totalItems: cart.reduce((sum, item) => sum + item.quantity, 0),
    };
  }, [cart, discountPercent, taxPercent]);

  const handleSubmit = async () => {
    if (cart.length === 0) {
      addToast('Cart is empty. Add products to create a sale.', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        items: cart.map((item) => ({
          productId: item.product._id,
          quantity: item.quantity,
        })),
        discountPercent: Number(discountPercent) || 0,
        taxPercent: Number(taxPercent) || 0,
        customer: customer.trim(),
      };

      const res = await createSale(payload);
      addToast(`Sale completed! Invoice: ${res.data.data.invoiceNumber}`, 'success');
      navigate(`/sales/${res.data.data._id}`);
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to complete sale', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">New Sale (POS)</h1>
          <p className="page-description">Point of Sale checkout and instant invoice generation</p>
        </div>
      </div>

      <div className="pos-layout">
        {/* Left Column: Product Search & Cart Table */}
        <div className="pos-left">
          {/* Autocomplete Search Bar */}
          <div className="pos-search-wrapper" ref={searchRef}>
            <div className="search-box" style={{ width: '100%' }}>
              <HiOutlineSearch />
              <input
                type="text"
                placeholder="Scan barcode or search product by name/SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchResults.length > 0 && setShowResults(true)}
              />
            </div>

            {showResults && (
              <div className="pos-dropdown">
                {searchResults.length === 0 ? (
                  <div className="pos-dropdown-empty">No matching products in stock</div>
                ) : (
                  searchResults.map((product) => (
                    <div
                      key={product._id}
                      className="pos-dropdown-item"
                      onClick={() => addToCart(product)}
                    >
                      <div className="pos-dropdown-item-left">
                        <span className="font-semibold">{product.name}</span>
                        <span className="sku-badge">{product.sku}</span>
                      </div>
                      <div className="pos-dropdown-item-right">
                        <StockBadge stock={product.stock} reorderLevel={product.reorderLevel} />
                        <span className="font-bold text-primary">
                          {formatCurrency(product.sellingPrice)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Cart Table */}
          <div className="card" style={{ marginTop: 16 }}>
            <div className="card-header">
              <div className="card-title">
                <HiOutlineShoppingCart style={{ marginRight: 8, color: 'var(--primary-500)' }} />
                Cart Items ({totals.totalItems})
              </div>
              {cart.length > 0 && (
                <button
                  className="btn btn-secondary btn-sm danger"
                  onClick={() => setCart([])}
                >
                  Clear Cart
                </button>
              )}
            </div>

            <div className="table-container">
              {cart.length === 0 ? (
                <div className="empty-state" style={{ padding: 48 }}>
                  <HiOutlineShoppingCart style={{ fontSize: 48, color: 'var(--text-muted)' }} />
                  <h3 style={{ marginTop: 12 }}>Your Cart is Empty</h3>
                  <p>Search and select products above to begin billing</p>
                </div>
              ) : (
                <table className="table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th className="text-right">Unit Price</th>
                      <th className="text-center" style={{ width: 140 }}>Quantity</th>
                      <th className="text-right">Subtotal</th>
                      <th className="text-center" style={{ width: 60 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {cart.map((item) => (
                      <tr key={item.product._id}>
                        <td>
                          <div className="product-name font-semibold">{item.product.name}</div>
                          <span className="sku-badge">{item.product.sku}</span>
                        </td>
                        <td className="text-right">{formatCurrency(item.product.sellingPrice)}</td>
                        <td className="text-center">
                          <div className="qty-control">
                            <button
                              className="qty-btn"
                              onClick={() => updateQuantity(item.product._id, -1)}
                            >
                              <HiOutlineMinus />
                            </button>
                            <span className="qty-value font-bold">{item.quantity}</span>
                            <button
                              className="qty-btn"
                              disabled={item.quantity >= item.product.stock}
                              onClick={() => updateQuantity(item.product._id, 1)}
                            >
                              <HiOutlinePlus />
                            </button>
                          </div>
                        </td>
                        <td className="text-right font-bold">
                          {formatCurrency(item.product.sellingPrice * item.quantity, true)}
                        </td>
                        <td className="text-center">
                          <button
                            className="btn-icon danger"
                            onClick={() => removeFromCart(item.product._id)}
                            title="Remove"
                          >
                            <HiOutlineTrash />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Checkout Summary & Customer Information */}
        <div className="pos-right">
          <div className="card pos-summary-card">
            <h3 style={{ marginBottom: 16 }}>Order Summary</h3>

            <div className="form-group">
              <label className="form-label">Customer Name / Phone</label>
              <input
                type="text"
                className="form-input"
                placeholder="Walk-in Customer"
                value={customer}
                onChange={(e) => setCustomer(e.target.value)}
              />
            </div>

            <div className="form-row">
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Discount (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  className="form-input"
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(Math.max(0, parseFloat(e.target.value) || 0))}
                />
              </div>

              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">GST Tax (%)</label>
                <input
                  type="number"
                  min="0"
                  className="form-input"
                  value={taxPercent}
                  onChange={(e) => setTaxPercent(Math.max(0, parseFloat(e.target.value) || 0))}
                />
              </div>
            </div>

            <div className="pos-totals">
              <div className="pos-total-row">
                <span>Items Subtotal:</span>
                <span className="font-semibold">{formatCurrency(totals.subtotal, true)}</span>
              </div>

              {totals.discountAmount > 0 && (
                <div className="pos-total-row discount">
                  <span>Discount ({discountPercent}%):</span>
                  <span>-{formatCurrency(totals.discountAmount, true)}</span>
                </div>
              )}

              <div className="pos-total-row">
                <span>Tax ({taxPercent}%):</span>
                <span>+{formatCurrency(totals.taxAmount, true)}</span>
              </div>

              <div className="pos-total-divider" />

              <div className="pos-grand-total">
                <span>Payable Amount:</span>
                <span className="pos-amount">{formatCurrency(totals.total, true)}</span>
              </div>
            </div>

            <button
              className="btn btn-primary btn-block btn-lg"
              style={{ marginTop: 20 }}
              disabled={cart.length === 0 || submitting}
              onClick={handleSubmit}
            >
              {submitting ? (
                'Processing Sale...'
              ) : (
                <>
                  <HiOutlineCheck /> Complete & Generate Invoice
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewSale;
