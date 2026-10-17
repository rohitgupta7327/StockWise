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
  HiOutlineCash,
  HiOutlineQrcode,
  HiOutlineCreditCard,
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
  const [paymentMethod, setPaymentMethod] = useState('cash');
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
        paymentMethod,
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
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">New Sale (POS)</h1>
        <p className="text-sm text-slate-500 mt-1">Point of Sale checkout and instant invoice generation</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column: Product Search & Cart Table */}
        <div className="lg:col-span-2 space-y-6">
          {/* Autocomplete Search Bar */}
          <div className="relative w-full" ref={searchRef}>
            <div className="relative">
              <HiOutlineSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl" />
              <input
                type="text"
                className="w-full rounded-2xl border border-slate-200 bg-white pl-12 pr-4 py-3.5 text-sm text-slate-800 placeholder-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 shadow-xs transition"
                placeholder="Scan barcode or search product by name/SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchResults.length > 0 && setShowResults(true)}
              />
            </div>

            {showResults && (
              <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden z-30 max-h-80 overflow-y-auto divide-y divide-slate-100">
                {searchResults.length === 0 ? (
                  <div className="p-4 text-center text-sm text-slate-400">
                    No matching products in stock
                  </div>
                ) : (
                  searchResults.map((product) => (
                    <div
                      key={product._id}
                      className="flex items-center justify-between p-4 hover:bg-slate-50 cursor-pointer transition"
                      onClick={() => addToCart(product)}
                    >
                      <div>
                        <div className="font-semibold text-slate-900 text-sm">{product.name}</div>
                        <span className="font-mono text-xs text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                          {product.sku}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <StockBadge stock={product.stock} reorderLevel={product.reorderLevel} />
                        <span className="font-bold text-indigo-600 text-sm">
                          {formatCurrency(product.sellingPrice)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Cart Table Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <HiOutlineShoppingCart className="text-indigo-600 text-xl" />
                Cart Items ({totals.totalItems})
              </div>
              {cart.length > 0 && (
                <button
                  className="inline-flex items-center rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition"
                  onClick={() => setCart([])}
                >
                  Clear Cart
                </button>
              )}
            </div>

            <div className="overflow-x-auto">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 text-center">
                  <HiOutlineShoppingCart className="text-5xl text-slate-300 mb-3" />
                  <h3 className="text-base font-semibold text-slate-800">Your Cart is Empty</h3>
                  <p className="text-sm text-slate-400 mt-1">
                    Search and select products above to begin billing
                  </p>
                </div>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/75">
                      <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Product</th>
                      <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500 text-right">Unit Price</th>
                      <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500 text-center w-36">Quantity</th>
                      <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500 text-right">Subtotal</th>
                      <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500 text-center w-16"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {cart.map((item) => (
                      <tr key={item.product._id} className="hover:bg-slate-50/50 transition">
                        <td className="px-6 py-4">
                          <div className="font-semibold text-slate-900">{item.product.name}</div>
                          <span className="font-mono text-xs text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                            {item.product.sku}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right text-slate-700">
                          {formatCurrency(item.product.sellingPrice)}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="inline-flex items-center rounded-xl border border-slate-200 bg-slate-50 p-1">
                            <button
                              className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-slate-600 shadow-xs hover:bg-slate-100 transition"
                              onClick={() => updateQuantity(item.product._id, -1)}
                            >
                              <HiOutlineMinus className="text-xs" />
                            </button>
                            <span className="px-3 text-sm font-bold text-slate-900">
                              {item.quantity}
                            </span>
                            <button
                              className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-slate-600 shadow-xs hover:bg-slate-100 transition disabled:opacity-40"
                              disabled={item.quantity >= item.product.stock}
                              onClick={() => updateQuantity(item.product._id, 1)}
                            >
                              <HiOutlinePlus className="text-xs" />
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-slate-900">
                          {formatCurrency(item.product.sellingPrice * item.quantity, true)}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                            onClick={() => removeFromCart(item.product._id)}
                            title="Remove"
                          >
                            <HiOutlineTrash className="text-lg" />
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
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 sm:p-8 space-y-6">
            <h2 className="text-lg font-bold text-slate-900">Order Summary</h2>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Customer Name / Phone
              </label>
              <input
                type="text"
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 shadow-xs transition"
                placeholder="Walk-in Customer"
                value={customer}
                onChange={(e) => setCustomer(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
                Payment Option
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('cash')}
                  className={`flex flex-col items-center justify-center gap-1.5 py-3 px-2 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                    paymentMethod === 'cash'
                      ? 'border-emerald-500 bg-emerald-50/80 text-emerald-800 ring-2 ring-emerald-500/20 shadow-xs'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                  }`}
                >
                  <HiOutlineCash className={`text-xl ${paymentMethod === 'cash' ? 'text-emerald-600' : 'text-slate-400'}`} />
                  <span>CASH</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('upi')}
                  className={`flex flex-col items-center justify-center gap-1.5 py-3 px-2 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                    paymentMethod === 'upi'
                      ? 'border-indigo-500 bg-indigo-50/80 text-indigo-800 ring-2 ring-indigo-500/20 shadow-xs'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                  }`}
                >
                  <HiOutlineQrcode className={`text-xl ${paymentMethod === 'upi' ? 'text-indigo-600' : 'text-slate-400'}`} />
                  <span>UPI</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`flex flex-col items-center justify-center gap-1.5 py-3 px-2 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                    paymentMethod === 'card'
                      ? 'border-sky-500 bg-sky-50/80 text-sky-800 ring-2 ring-sky-500/20 shadow-xs'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                  }`}
                >
                  <HiOutlineCreditCard className={`text-xl ${paymentMethod === 'card' ? 'text-sky-600' : 'text-slate-400'}`} />
                  <span>CARD</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                  Discount (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 shadow-xs transition"
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(Math.max(0, parseFloat(e.target.value) || 0))}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                  GST Tax (%)
                </label>
                <input
                  type="number"
                  min="0"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 shadow-xs transition"
                  value={taxPercent}
                  onChange={(e) => setTaxPercent(Math.max(0, parseFloat(e.target.value) || 0))}
                />
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-slate-100">
              <div className="flex justify-between text-sm text-slate-600">
                <span>Items Subtotal:</span>
                <span className="font-semibold text-slate-800">{formatCurrency(totals.subtotal, true)}</span>
              </div>

              {totals.discountAmount > 0 && (
                <div className="flex justify-between text-sm text-emerald-600 font-medium">
                  <span>Discount ({discountPercent}%):</span>
                  <span>-{formatCurrency(totals.discountAmount, true)}</span>
                </div>
              )}

              <div className="flex justify-between text-sm text-slate-600">
                <span>Tax ({taxPercent}%):</span>
                <span>+{formatCurrency(totals.taxAmount, true)}</span>
              </div>

              <div className="flex justify-between text-sm text-slate-600">
                <span>Payment Mode:</span>
                <span className="font-bold uppercase tracking-wider text-xs px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                  {paymentMethod}
                </span>
              </div>

              <div className="flex justify-between items-baseline pt-4 border-t-2 border-slate-100">
                <span className="text-base font-bold text-slate-900">Payable Amount:</span>
                <span className="text-2xl font-extrabold text-indigo-600">
                  {formatCurrency(totals.total, true)}
                </span>
              </div>
            </div>

            <button
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3.5 text-base font-semibold text-white shadow-md shadow-indigo-600/25 hover:bg-indigo-700 active:scale-[0.99] transition disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={cart.length === 0 || submitting}
              onClick={handleSubmit}
            >
              {submitting ? (
                'Processing Sale...'
              ) : (
                <>
                  <HiOutlineCheck className="text-xl" /> Complete & Generate Invoice
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
