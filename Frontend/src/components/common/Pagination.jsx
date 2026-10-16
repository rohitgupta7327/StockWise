import React from 'react';

/**
 * Reusable, accessible Pagination component
 */
export const Pagination = ({ page, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  return (
    <div className="pagination">
      <button
        className="btn btn-secondary"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        Previous
      </button>

      <span className="page-indicator">
        Page {page} of {totalPages}
      </span>

      <button
        className="btn btn-secondary"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        Next
      </button>
    </div>
  );
};

export default Pagination;
