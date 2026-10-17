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
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4 sm:p-6">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 sm:p-10 border border-slate-100">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold text-lg mx-auto mb-3 shadow-lg shadow-indigo-600/30">
            SW
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">StockWise</h1>
          <p className="text-sm text-slate-500 mt-1">Retail Inventory & Sales Management</p>
        </div>

        {error && (
          <div className="mb-6 rounded-xl bg-rose-50 border border-rose-200 p-3.5 text-sm text-rose-700 font-medium text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <HiOutlineMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg" />
              <input
                type="email"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 transition"
                placeholder="admin@stockwise.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Password
            </label>
            <div className="relative">
              <HiOutlineLockClosed className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg" />
              <input
                type="password"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 transition"
                placeholder="Enter your password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full mt-2 rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-600/25 hover:bg-indigo-700 active:scale-[0.99] transition disabled:opacity-60 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-8 rounded-2xl bg-slate-50 border border-slate-200/60 p-4 text-xs text-slate-500 space-y-1.5">
          <strong className="text-slate-700 font-semibold block mb-1">Demo Credentials:</strong>
          <div>
            Admin:{' '}
            <span className="font-mono text-slate-700 font-medium">admin@stockwise.com</span> /{' '}
            <span className="font-mono text-slate-700 font-medium">admin123</span>
          </div>
          <div>
            Staff:{' '}
            <span className="font-mono text-slate-700 font-medium">staff@stockwise.com</span> /{' '}
            <span className="font-mono text-slate-700 font-medium">staff123</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
