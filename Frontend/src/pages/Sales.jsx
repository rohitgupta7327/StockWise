import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getSales } from '../services/salesService';
import { useToast } from '../components/common/Toast';
import { useDebounce } from '../hooks/useDebounce';
import { formatCurrency, formatDateTime } from '../utils/formatters';
import { Badge } from '../components/common/Badge';
import Pagination from '../components/common/Pagination';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { HiOutlineSearch, HiOutlineDocumentText, HiOutlinePlus } from 'react-icons/hi';

const Sales = () => {
  const { addToast } = useToast();
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const debouncedSearch = useDebounce(search, 300);

  const fetchSales = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getSales({
        search: debouncedSearch,
        startDate,
        endDate,
        page,
        limit: 15,
      });
      setSales(res.data.data);
      setTotalPages(res.data.pages);
    } catch (err) {
      addToast('Failed to load sales', 'error');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, startDate, endDate, page, addToast]);

  useEffect(() => {
    fetchSales();
  }, [fetchSales]);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Sales History</h1>
          <p className="page-description">View all sales transactions, receipts, and order statuses</p>
        </div>
        <Link to="/sales/new" className="btn btn-primary">
          <HiOutlinePlus /> New Sale (POS)
        </Link>
      </div>

      <div className="toolbar">
        <div className="search-box">
          <HiOutlineSearch />
          <input
            type="text"
            placeholder="Search by invoice number..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <div className="date-filter">
          <label>From:</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <div className="date-filter">
          <label>To:</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setPage(1);
            }}
          />
        </div>
      </div>

      <div className="card">
        <div className="table-container">
          {loading ? (
            <LoadingSpinner />
          ) : sales.length === 0 ? (
            <div className="empty-state">
              <h3>No sales found</h3>
              <p>No transactions match the selected filters</p>
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Date & Time</th>
                  <th>Customer</th>
                  <th className="text-center">Items</th>
                  <th className="text-right">Total Amount</th>
                  <th className="text-center">Status</th>
                  <th>Billed By</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((sale) => (
                  <tr key={sale._id}>
                    <td>
                      <span className="sku-badge font-bold">{sale.invoiceNumber}</span>
                    </td>
                    <td>{formatDateTime(sale.createdAt)}</td>
                    <td>{sale.customer || 'Walk-in Customer'}</td>
                    <td className="text-center">
                      <span className="badge badge-default">
                        {sale.items ? sale.items.reduce((sum, i) => sum + i.quantity, 0) : 0} items
                      </span>
                    </td>
                    <td className="text-right font-bold text-primary">
                      {formatCurrency(sale.totalAmount, true)}
                    </td>
                    <td className="text-center">
                      <Badge variant={sale.status === 'completed' ? 'success' : 'danger'}>
                        {sale.status === 'completed' ? 'Completed' : 'Returned'}
                      </Badge>
                    </td>
                    <td>{sale.createdBy?.name || 'Staff'}</td>
                    <td className="text-center">
                      <Link to={`/sales/${sale._id}`} className="btn btn-secondary btn-sm">
                        <HiOutlineDocumentText /> View Invoice
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>
    </div>
  );
};

export default Sales;
