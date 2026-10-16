import api from './api';

export const login = (credentials) => api.post('/auth/login', credentials);
export const getMe = () => api.get('/auth/me');
export const register = (userData) => api.post('/auth/register', userData);
export const getUsers = () => api.get('/auth/users');
export const toggleUserStatus = (id) => api.patch(`/auth/users/${id}/status`);
