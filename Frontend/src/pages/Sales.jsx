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
  const [paymentMethod, setPaymentMethod] = useState('');
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
        paymentMethod: paymentMethod || undefined,
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
  }, [debouncedSearch, startDate, endDate, paymentMethod, page, addToast]);

  useEffect(() => {
    fetchSales();
  }, [fetchSales]);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Sales History</h1>
          <p className="text-sm text-slate-500 mt-1">View all sales transactions, receipts, and order statuses</p>
        </div>
        <Link
          to="/sales/new"
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-indigo-700 transition shrink-0"
        >
          <HiOutlinePlus className="text-lg" /> New Sale (POS)
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6">
        <div className="relative flex-1">
          <HiOutlineSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg" />
          <input
            type="text"
            className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 shadow-xs transition"
            placeholder="Search by invoice number..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <div className="flex items-center gap-2 text-sm text-slate-600">
          <label className="text-xs font-semibold text-slate-500">From:</label>
          <input
            type="date"
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 shadow-xs transition"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <div className="flex items-center gap-2 text-sm text-slate-600">
          <label className="text-xs font-semibold text-slate-500">To:</label>
          <input
            type="date"
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 shadow-xs transition"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <div className="flex items-center gap-2 text-sm text-slate-600">
          <label className="text-xs font-semibold text-slate-500">Payment:</label>
          <select
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 shadow-xs transition"
            value={paymentMethod}
            onChange={(e) => {
              setPaymentMethod(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Payments</option>
            <option value="cash">Cash</option>
            <option value="upi">UPI</option>
            <option value="card">Card</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <LoadingSpinner />
          ) : sales.length === 0 ? (
            <div className="p-12 text-center">
              <h3 className="text-base font-semibold text-slate-800">No sales found</h3>
              <p className="text-sm text-slate-500 mt-1">No transactions match the selected filters</p>
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/75">
                  <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Invoice #</th>
                  <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Date & Time</th>
                  <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Customer</th>
                  <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500 text-center">Payment</th>
                  <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500 text-center">Items</th>
                  <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500 text-right">Total Amount</th>
                  <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500 text-center">Status</th>
                  <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Billed By</th>
                  <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sales.map((sale) => (
                  <tr key={sale._id} className="hover:bg-slate-50/50 transition">
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs text-indigo-700 bg-indigo-50 border border-indigo-200/70 px-2 py-0.5 rounded-md font-bold">
                        {sale.invoiceNumber}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500 whitespace-nowrap">
                      {formatDateTime(sale.createdAt)}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-900">
                      {sale.customer || 'Walk-in Customer'}
                    </td>
                    <td className="px-6 py-4 text-center">
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
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-slate-100 text-slate-700">
                        {sale.items ? sale.items.reduce((sum, i) => sum + i.quantity, 0) : 0} items
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-slate-900">
                      {formatCurrency(sale.totalAmount, true)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Badge variant={sale.status === 'completed' ? 'success' : 'danger'}>
                        {sale.status === 'completed' ? 'Completed' : 'Returned'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{sale.createdBy?.name || 'Staff'}</td>
                    <td className="px-6 py-4 text-center">
                      <Link
                        to={`/sales/${sale._id}`}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-xs hover:bg-slate-50 transition"
                      >
                        <HiOutlineDocumentText className="text-base" /> View Invoice
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
