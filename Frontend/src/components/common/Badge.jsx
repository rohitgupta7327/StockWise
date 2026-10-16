import React from 'react';

/**
 * Reusable Badge component for product stock, status, or transaction type
 */
export const Badge = ({ variant = 'default', children, className = '' }) => {
  return (
    <span className={`badge badge-${variant} ${className}`}>
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
