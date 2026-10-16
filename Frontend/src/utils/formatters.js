// StockWise Shared High-Performance Formatters
// Instantiated once to avoid expensive re-creation per render

const currencyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const currencyFormatterExact = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const numberFormatter = new Intl.NumberFormat('en-IN');

export const formatCurrency = (amount, exact = false) => {
  if (amount === null || amount === undefined || isNaN(amount)) return '₹0';
  return exact ? currencyFormatterExact.format(amount) : currencyFormatter.format(amount);
};

export const formatNumber = (num) => {
  if (num === null || num === undefined || isNaN(num)) return '0';
  return numberFormatter.format(num);
};

export const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export const formatDateTime = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};
