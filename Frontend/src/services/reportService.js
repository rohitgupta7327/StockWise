import api from './api';

export const getDashboard = () => api.get('/reports/dashboard');
export const getSalesReport = (params) => api.get('/reports/sales', { params });
export const getProfitReport = (params) => api.get('/reports/profit', { params });
export const getTopProducts = (params) => api.get('/reports/top-products', { params });
export const downloadCSV = (params) =>
  api.get('/reports/sales/csv', { params, responseType: 'blob' });
