import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  HiOutlineHome,
  HiOutlineCube,
  HiOutlineClipboardList,
  HiOutlineExclamationCircle,
  HiOutlineShoppingCart,
  HiOutlineDocumentText,
  HiOutlineChartBar,
  HiOutlineUsers,
  HiOutlineLogout,
  HiOutlineMenu,
} from 'react-icons/hi';
import { useState } from 'react';

const Layout = ({ children }) => {
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/') return 'Dashboard';
    if (path.startsWith('/products')) return 'Products';
    if (path.startsWith('/inventory')) return 'Inventory';
    if (path.startsWith('/sales/new')) return 'New Sale';
    if (path.startsWith('/sales')) return 'Sales';
    if (path.startsWith('/reports')) return 'Reports';
    if (path.startsWith('/users')) return 'User Management';
    return 'StockWise';
  };

  return (
    <div className="flex min-h-screen bg-slate-100 text-slate-800">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-slate-900 text-slate-300 transition-transform duration-300 ease-in-out md:sticky md:top-0 md:h-screen shrink-0 md:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-800/80 shrink-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-sm font-bold text-white shadow-md shadow-indigo-600/30">
            SW
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">
            Stock<span className="text-indigo-400">Wise</span>
          </h1>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-6 overscroll-contain">
          <div className="space-y-1">
            <div className="px-3 text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Main
            </div>
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`
              }
              onClick={() => setSidebarOpen(false)}
            >
              <HiOutlineHome className="text-lg shrink-0" /> Dashboard
            </NavLink>
            <NavLink
              to="/products"
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`
              }
              onClick={() => setSidebarOpen(false)}
            >
              <HiOutlineCube className="text-lg shrink-0" /> Products
            </NavLink>
          </div>

          <div className="space-y-1">
            <div className="px-3 text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Inventory
            </div>
            <NavLink
              to="/inventory"
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`
              }
              onClick={() => setSidebarOpen(false)}
            >
              <HiOutlineClipboardList className="text-lg shrink-0" /> Stock Management
            </NavLink>
            <NavLink
              to="/low-stock"
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`
              }
              onClick={() => setSidebarOpen(false)}
            >
              <HiOutlineExclamationCircle className="text-lg shrink-0" /> Low Stock Alerts
            </NavLink>
          </div>

          <div className="space-y-1">
            <div className="px-3 text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Sales
            </div>
            <NavLink
              to="/sales/new"
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`
              }
              onClick={() => setSidebarOpen(false)}
            >
              <HiOutlineShoppingCart className="text-lg shrink-0" /> New Sale (POS)
            </NavLink>
            <NavLink
              to="/sales"
              end
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`
              }
              onClick={() => setSidebarOpen(false)}
            >
              <HiOutlineDocumentText className="text-lg shrink-0" /> Sales History
            </NavLink>
          </div>

          {isAdmin && (
            <div className="space-y-1">
              <div className="px-3 text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Analytics
              </div>
              <NavLink
                to="/reports"
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`
                }
                onClick={() => setSidebarOpen(false)}
              >
                <HiOutlineChartBar className="text-lg shrink-0" /> Reports
              </NavLink>
            </div>
          )}

          {isAdmin && (
            <div className="space-y-1">
              <div className="px-3 text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Admin
              </div>
              <NavLink
                to="/users"
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`
                }
                onClick={() => setSidebarOpen(false)}
              >
                <HiOutlineUsers className="text-lg shrink-0" /> User Management
              </NavLink>
            </div>
          )}
        </nav>

        <div className="p-4 border-t border-slate-800/80 shrink-0 mt-auto">
          <button
            onClick={logout}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-800/50 px-4 py-2.5 text-sm font-medium text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition"
          >
            <HiOutlineLogout className="text-lg" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex flex-1 flex-col min-w-0 overflow-x-hidden">
        {/* Top Navbar */}
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white/80 px-4 md:px-8 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="inline-flex md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg text-xl"
            >
              <HiOutlineMenu />
            </button>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              {getPageTitle()}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 font-bold text-sm shadow-xs">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-sm font-semibold text-slate-800 leading-none">
                  {user?.name}
                </div>
                <div className="text-xs font-medium text-slate-400 uppercase tracking-wide mt-1">
                  {user?.role}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
          {children}
        </div>
      </main>

      {/* Mobile Sidebar Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default Layout;
