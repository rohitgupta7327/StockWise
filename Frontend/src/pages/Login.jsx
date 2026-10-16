import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { login as loginApi } from '../services/authService';
import { HiOutlineMail, HiOutlineLockClosed } from 'react-icons/hi';

const Login = () => {
  const { loginUser } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await loginApi(form);
      const { token, ...userData } = res.data.data;
      loginUser(userData, token);
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">SW</div>
          <h1>StockWise</h1>
          <p>Retail Inventory & Sales Management</p>
        </div>

        {error && <div className="login-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div style={{ position: 'relative' }}>
              <HiOutlineMail
                style={{
                  position: 'absolute',
                  left: 14,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                  fontSize: '1.1rem',
                }}
              />
              <input
                type="email"
                className="form-input"
                style={{ paddingLeft: 40 }}
                placeholder="admin@stockwise.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <HiOutlineLockClosed
                style={{
                  position: 'absolute',
                  left: 14,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                  fontSize: '1.1rem',
                }}
              />
              <input
                type="password"
                className="form-input"
                style={{ paddingLeft: 40 }}
                placeholder="Enter your password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            style={{ width: '100%', marginTop: 8 }}
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div style={{ marginTop: 24, padding: 16, background: 'var(--gray-50)', borderRadius: 'var(--radius-md)', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
          <strong style={{ color: 'var(--text-secondary)' }}>Demo Credentials:</strong>
          <div style={{ marginTop: 6 }}>
            Admin: <span className="font-mono">admin@stockwise.com</span> / <span className="font-mono">admin123</span>
          </div>
          <div style={{ marginTop: 2 }}>
            Staff: <span className="font-mono">staff@stockwise.com</span> / <span className="font-mono">staff123</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
