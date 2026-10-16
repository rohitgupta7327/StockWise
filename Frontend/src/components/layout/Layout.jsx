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
    <div className="app-layout">
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">SW</div>
          <h1>Stock<span>Wise</span></h1>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-section">
            <div className="sidebar-section-title">Main</div>
            <NavLink
              to="/"
              end
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <HiOutlineHome /> Dashboard
            </NavLink>
            <NavLink
              to="/products"
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <HiOutlineCube /> Products
            </NavLink>
          </div>

          <div className="sidebar-section">
            <div className="sidebar-section-title">Inventory</div>
            <NavLink
              to="/inventory"
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <HiOutlineClipboardList /> Stock Management
            </NavLink>
            <NavLink
              to="/low-stock"
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <HiOutlineExclamationCircle /> Low Stock Alerts
            </NavLink>
          </div>

          <div className="sidebar-section">
            <div className="sidebar-section-title">Sales</div>
            <NavLink
              to="/sales/new"
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <HiOutlineShoppingCart /> New Sale
            </NavLink>
            <NavLink
              to="/sales"
              end
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <HiOutlineDocumentText /> Sales History
            </NavLink>
          </div>

          {isAdmin && (
            <div className="sidebar-section">
              <div className="sidebar-section-title">Analytics</div>
              <NavLink
                to="/reports"
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                onClick={() => setSidebarOpen(false)}
              >
                <HiOutlineChartBar /> Reports
              </NavLink>
            </div>
          )}

          {isAdmin && (
            <div className="sidebar-section">
              <div className="sidebar-section-title">Admin</div>
              <NavLink
                to="/users"
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                onClick={() => setSidebarOpen(false)}
              >
                <HiOutlineUsers /> User Management
              </NavLink>
            </div>
          )}
        </nav>

        <div style={{ padding: '12px' }}>
          <button className="btn-logout" onClick={logout}>
            <HiOutlineLogout /> Sign Out
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="header">
          <div className="header-left">
            <button className="menu-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
              <HiOutlineMenu />
            </button>
            <div>
              <div className="header-title">{getPageTitle()}</div>
            </div>
          </div>
          <div className="header-right">
            <div className="header-user">
              <div className="header-avatar">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div className="header-user-info">
                <div className="header-user-name">{user?.name}</div>
                <div className="header-user-role">{user?.role}</div>
              </div>
            </div>
          </div>
        </header>

        <div className="page-content">
          {children}
        </div>
      </main>

      {sidebarOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.3)',
            zIndex: 99,
          }}
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default Layout;
