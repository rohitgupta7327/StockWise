import api from './api';

export const getLowStock = () => api.get('/inventory/low-stock');
export const createAdjustment = (data) => api.post('/inventory/adjustments', data);
export const getMovements = (params) => api.get('/inventory/movements', { params });
