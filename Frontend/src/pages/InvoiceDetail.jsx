import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getSale, returnSale } from '../services/salesService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/common/Toast';
import { formatCurrency, formatDateTime } from '../utils/formatters';
import { Badge } from '../components/common/Badge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { HiOutlineArrowLeft, HiOutlinePrinter, HiOutlineReply } from 'react-icons/hi';

const InvoiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { addToast } = useToast();
  const [sale, setSale] = useState(null);
  const [loading, setLoading] = useState(true);
  const [returning, setReturning] = useState(false);

  useEffect(() => {
    let isMounted = true;
    getSale(id)
      .then((res) => {
        if (isMounted) setSale(res.data.data);
      })
      .catch(() => addToast('Failed to load invoice details', 'error'))
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [id, addToast]);

  const handleReturn = async () => {
    if (
      !confirm(
        'Are you sure you want to return this sale? Items will be refunded and inventory stock will be restored.'
      )
    )
      return;

    setReturning(true);
    try {
      const res = await returnSale(id);
      setSale(res.data.data);
      addToast('Sale returned successfully. Stock restored.', 'success');
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to return sale', 'error');
    } finally {
      setReturning(false);
    }
  };

  const handlePrint = () => window.print();

  if (loading) return <LoadingSpinner message="Loading invoice..." />;
  if (!sale)
    return (
      <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
        <h3 className="text-base font-semibold text-slate-800">Invoice not found</h3>
      </div>
    );

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 no-print">
        <button
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition"
          onClick={() => navigate('/sales')}
        >
          <HiOutlineArrowLeft className="text-lg" /> Back to Sales
        </button>
        <div className="flex items-center gap-3">
          {isAdmin && sale.status === 'completed' && (
            <button
              className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700 hover:bg-rose-100 transition disabled:opacity-50"
              onClick={handleReturn}
              disabled={returning}
            >
              <HiOutlineReply className="text-lg" />{' '}
              {returning ? 'Processing Return...' : 'Return Sale'}
            </button>
          )}
          <button
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-indigo-700 transition"
            onClick={handlePrint}
          >
            <HiOutlinePrinter className="text-lg" /> Print Receipt
          </button>
        </div>
      </div>

      {/* Printable Invoice Card */}
      <div className="max-w-3xl mx-auto bg-white rounded-3xl border border-slate-200/80 shadow-xl p-8 sm:p-12 print:shadow-none print:border-none print:p-0">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-200 pb-8">
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">
              Stock<span className="text-indigo-600">Wise</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-medium">
              Retail Inventory & Point of Sale
            </p>
          </div>
          <div className="sm:text-right space-y-1">
            <div className="font-mono text-lg font-bold text-slate-900">
              {sale.invoiceNumber}
            </div>
            <div className="text-xs text-slate-500">
              Date: {formatDateTime(sale.createdAt)}
            </div>
            <div className="pt-1">
              <Badge variant={sale.status === 'completed' ? 'success' : 'danger'}>
                {sale.status === 'completed' ? 'PAID & COMPLETED' : 'RETURNED'}
              </Badge>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 my-8 p-4 rounded-2xl bg-slate-50 border border-slate-100 text-sm">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Customer
            </div>
            <div className="font-semibold text-slate-800">
              {sale.customer || 'Walk-in Customer'}
            </div>
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Payment Method
            </div>
            <div className="mt-0.5">
              {sale.paymentMethod === 'upi' ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/80">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                  UPI
                </span>
              ) : sale.paymentMethod === 'card' ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-50 text-sky-700 border border-sky-200/80">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span>
                  CARD
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  CASH
                </span>
              )}
            </div>
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Cashier / Staff
            </div>
            <div className="font-semibold text-slate-800">
              {sale.createdBy?.name || 'Staff'}
            </div>
          </div>
        </div>

        <table className="w-full text-left text-sm mb-8">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">#</th>
              <th className="py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Item & SKU</th>
              <th className="py-3 text-xs font-semibold uppercase tracking-wider text-slate-400 text-right">Price</th>
              <th className="py-3 text-xs font-semibold uppercase tracking-wider text-slate-400 text-center">Qty</th>
              <th className="py-3 text-xs font-semibold uppercase tracking-wider text-slate-400 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sale.items.map((item, index) => (
              <tr key={index}>
                <td className="py-4 text-xs text-slate-400">{index + 1}</td>
                <td className="py-4">
                  <div className="font-semibold text-slate-900">{item.productName}</div>
                  <span className="font-mono text-xs text-slate-400">{item.sku}</span>
                </td>
                <td className="py-4 text-right text-slate-600">
                  {formatCurrency(item.unitPrice, true)}
                </td>
                <td className="py-4 text-center font-bold text-slate-800">
                  {item.quantity}
                </td>
                <td className="py-4 text-right font-semibold text-slate-900">
                  {formatCurrency(item.subtotal, true)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="max-w-xs ml-auto space-y-2.5 pt-4 border-t border-slate-200">
          <div className="flex justify-between text-sm text-slate-600">
            <span>Payment Mode:</span>
            <span className="font-bold uppercase tracking-wider text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700">
              {sale.paymentMethod || 'cash'}
            </span>
          </div>
          <div className="flex justify-between text-sm text-slate-600">
            <span>Subtotal:</span>
            <span>{formatCurrency(sale.subtotal, true)}</span>
          </div>
          {sale.discountAmount > 0 && (
            <div className="flex justify-between text-sm text-emerald-600 font-medium">
              <span>Discount ({sale.discountPercent}%):</span>
              <span>-{formatCurrency(sale.discountAmount, true)}</span>
            </div>
          )}
          {sale.taxAmount > 0 && (
            <div className="flex justify-between text-sm text-slate-600">
              <span>GST Tax ({sale.taxPercent}%):</span>
              <span>+{formatCurrency(sale.taxAmount, true)}</span>
            </div>
          )}
          <div className="flex justify-between items-baseline pt-3 border-t-2 border-slate-100 text-base font-bold text-slate-900">
            <span>Grand Total:</span>
            <span className="text-xl text-indigo-600">
              {formatCurrency(sale.totalAmount, true)}
            </span>
          </div>
        </div>

        <div className="text-center pt-8 border-t border-slate-100 text-xs text-slate-400 space-y-1 mt-8">
          <p className="font-medium text-slate-600">Thank you for shopping with StockWise!</p>
          <p>This is a computer-generated tax invoice.</p>
        </div>
      </div>
    </div>
  );
};

export default InvoiceDetail;
