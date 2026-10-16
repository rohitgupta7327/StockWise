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
  if (!sale) return <div className="empty-state"><h3>Invoice not found</h3></div>;

  return (
    <div>
      <div className="page-header no-print">
        <button className="btn btn-secondary" onClick={() => navigate('/sales')}>
          <HiOutlineArrowLeft /> Back to Sales
        </button>
        <div style={{ display: 'flex', gap: 10 }}>
          {isAdmin && sale.status === 'completed' && (
            <button
              className="btn btn-secondary danger"
              onClick={handleReturn}
              disabled={returning}
            >
              <HiOutlineReply /> {returning ? 'Processing Return...' : 'Return Sale'}
            </button>
          )}
          <button className="btn btn-primary" onClick={handlePrint}>
            <HiOutlinePrinter /> Print Receipt
          </button>
        </div>
      </div>

      {/* Printable Invoice Card */}
      <div className="card invoice-card">
        <div className="invoice-header">
          <div className="invoice-brand">
            <h2>Stock<span>Wise</span></h2>
            <p>Retail Inventory & Point of Sale</p>
          </div>
          <div className="invoice-meta">
            <div className="invoice-number">{sale.invoiceNumber}</div>
            <div className="invoice-date">Date: {formatDateTime(sale.createdAt)}</div>
            <div style={{ marginTop: 6 }}>
              <Badge variant={sale.status === 'completed' ? 'success' : 'danger'}>
                {sale.status === 'completed' ? 'PAID & COMPLETED' : 'RETURNED'}
              </Badge>
            </div>
          </div>
        </div>

        <div className="invoice-details-grid">
          <div>
            <div className="invoice-label">Customer</div>
            <div className="invoice-val">{sale.customer || 'Walk-in Customer'}</div>
          </div>
          <div>
            <div className="invoice-label">Cashier / Staff</div>
            <div className="invoice-val">{sale.createdBy?.name || 'Staff'}</div>
          </div>
        </div>

        <table className="table invoice-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Item & SKU</th>
              <th className="text-right">Price</th>
              <th className="text-center">Qty</th>
              <th className="text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {sale.items.map((item, index) => (
              <tr key={index}>
                <td style={{ color: 'var(--text-muted)' }}>{index + 1}</td>
                <td>
                  <div className="font-semibold">{item.productName}</div>
                  <span className="sku-badge">{item.sku}</span>
                </td>
                <td className="text-right">{formatCurrency(item.unitPrice, true)}</td>
                <td className="text-center font-bold">{item.quantity}</td>
                <td className="text-right font-semibold">
                  {formatCurrency(item.subtotal, true)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="invoice-summary-box">
          <div className="invoice-summary-row">
            <span>Subtotal:</span>
            <span>{formatCurrency(sale.subtotal, true)}</span>
          </div>
          {sale.discountAmount > 0 && (
            <div className="invoice-summary-row discount">
              <span>Discount ({sale.discountPercent}%):</span>
              <span>-{formatCurrency(sale.discountAmount, true)}</span>
            </div>
          )}
          {sale.taxAmount > 0 && (
            <div className="invoice-summary-row">
              <span>GST Tax ({sale.taxPercent}%):</span>
              <span>+{formatCurrency(sale.taxAmount, true)}</span>
            </div>
          )}
          <div className="invoice-summary-row grand-total">
            <span>Grand Total:</span>
            <span>{formatCurrency(sale.totalAmount, true)}</span>
          </div>
        </div>

        <div className="invoice-footer">
          <p>Thank you for shopping with StockWise!</p>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            This is a computer-generated tax invoice.
          </p>
        </div>
      </div>
    </div>
  );
};

export default InvoiceDetail;
