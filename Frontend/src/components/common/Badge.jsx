import React from 'react';

const VARIANTS = {
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
  danger: 'bg-rose-50 text-rose-700 border-rose-200/80',
  warning: 'bg-amber-50 text-amber-700 border-amber-200/80',
  info: 'bg-blue-50 text-blue-700 border-blue-200/80',
  primary: 'bg-indigo-50 text-indigo-700 border-indigo-200/80',
  neutral: 'bg-slate-100 text-slate-700 border-slate-200/80',
  default: 'bg-slate-100 text-slate-700 border-slate-200/80',
};

export const Badge = ({ variant = 'default', children, className = '' }) => {
  const variantClass = VARIANTS[variant] || VARIANTS.default;
  return (
    <span
      className={`inline-flex items-center justify-center font-medium rounded-full px-2.5 py-0.5 text-xs border ${variantClass} ${className}`}
    >
      {children}
    </span>
  );
};

export const StockBadge = ({ stock, reorderLevel }) => {
  if (stock === 0) return <Badge variant="danger">Out of Stock</Badge>;
  if (stock <= reorderLevel) return <Badge variant="warning">Low Stock ({stock})</Badge>;
  return <Badge variant="success">In Stock ({stock})</Badge>;
};

export const StatusBadge = ({ isActive }) => {
  return isActive ? (
    <Badge variant="success">Active</Badge>
  ) : (
    <Badge variant="danger">Inactive</Badge>
  );
};

export default Badge;
