import React from 'react';

export const LoadingSpinner = ({ message = '' }) => (
  <div className="loading-spinner">
    <div className="spinner" />
    {message && <p style={{ marginTop: 12, color: 'var(--text-muted)' }}>{message}</p>}
  </div>
);

export default LoadingSpinner;
