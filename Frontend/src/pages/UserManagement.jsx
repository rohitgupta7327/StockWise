import React, { useState, useEffect, useCallback } from 'react';
import { getUsers, register, toggleUserStatus } from '../services/authService';
import { useToast } from '../components/common/Toast';
import { StatusBadge } from '../components/common/Badge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { formatDateTime } from '../utils/formatters';
import { HiOutlinePlus, HiOutlineUserAdd, HiX } from 'react-icons/hi';

const UserManagement = () => {
  const { addToast } = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'staff' });
  const [submitting, setSubmitting] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await getUsers();
      setUsers(res.data.data);
    } catch {
      addToast('Failed to load user accounts', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await register(form);
      addToast('User account created successfully', 'success');
      setShowModal(false);
      setForm({ name: '', email: '', password: '', role: 'staff' });
      fetchUsers();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to create user', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (id, name, isActive) => {
    if (!confirm(`${isActive ? 'Deactivate' : 'Activate'} user "${name}"?`)) return;
    try {
      await toggleUserStatus(id);
      addToast(`User ${isActive ? 'deactivated' : 'activated'} successfully`, 'success');
      fetchUsers();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to update user', 'error');
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">User Management</h1>
          <p className="page-description">Manage administrator and cashier staff access permissions</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <HiOutlinePlus /> Add New User
        </button>
      </div>

      <div className="card">
        <div className="table-container">
          {loading ? (
            <LoadingSpinner message="Loading user directory..." />
          ) : users.length === 0 ? (
            <div className="empty-state">
              <h3>No users registered</h3>
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th className="text-center">Status</th>
                  <th>Created At</th>
                  <th className="text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id}>
                    <td className="font-semibold">{u.name}</td>
                    <td>{u.email}</td>
                    <td>
                      <span className={`badge ${u.role === 'admin' ? 'badge-primary' : 'badge-neutral'}`}>
                        {u.role.toUpperCase()}
                      </span>
                    </td>
                    <td className="text-center">
                      <StatusBadge isActive={u.isActive} />
                    </td>
                    <td>{formatDateTime(u.createdAt)}</td>
                    <td className="text-center">
                      <button
                        className={`btn btn-sm ${u.isActive ? 'btn-secondary danger' : 'btn-primary'}`}
                        onClick={() => handleToggleStatus(u._id, u.name, u.isActive)}
                      >
                        {u.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal for Creating User */}
      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                <HiOutlineUserAdd style={{ marginRight: 8, color: 'var(--primary-500)' }} />
                Add New Staff / Admin
              </div>
              <button className="btn-icon" onClick={() => setShowModal(false)}>
                <HiX />
              </button>
            </div>

            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Rahul Sharma"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email Address *</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="rahul@store.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Password *</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Min 6 characters"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  minLength={6}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">System Role *</label>
                <select
                  className="form-select"
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                >
                  <option value="staff">Staff (Sales, POS, View Inventory)</option>
                  <option value="admin">Admin (Full Control, Products, Users)</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 24 }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Creating User...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
