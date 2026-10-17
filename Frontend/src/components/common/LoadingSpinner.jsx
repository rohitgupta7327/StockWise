import React from 'react';

export const LoadingSpinner = ({ message = '' }) => (
  <div className="flex flex-col items-center justify-center p-8 min-h-[160px]">
    <div className="h-8 w-8 animate-spin rounded-full border-3 border-indigo-200 border-t-indigo-600" />
    {message && <p className="mt-3 text-sm text-slate-500 font-medium">{message}</p>}
  </div>
);

export default LoadingSpinner;
