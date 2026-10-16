import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './components/common/Toast';
import Layout from './components/layout/Layout';
import LoadingSpinner from './components/common/LoadingSpinner';
import ErrorBoundary from './components/common/ErrorBoundary';

// Code-split pages for minimal initial bundle size & ultra-fast initial page load
const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Products = lazy(() => import('./pages/Products'));
const ProductForm = lazy(() => import('./pages/ProductForm'));
const Inventory = lazy(() => import('./pages/Inventory'));
const LowStock = lazy(() => import('./pages/LowStock'));
const NewSale = lazy(() => import('./pages/NewSale'));
const Sales = lazy(() => import('./pages/Sales'));
const InvoiceDetail = lazy(() => import('./pages/InvoiceDetail'));
const Reports = lazy(() => import('./pages/Reports'));
const UserManagement = lazy(() => import('./pages/UserManagement'));

// Protected route wrapper
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, loading, isAdmin } = useAuth();

  if (loading) {
    return <LoadingSpinner message="Checking authentication..." />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <Layout>{children}</Layout>;
};

// Public route wrapper (redirect to dashboard if already logged in)
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <ToastProvider>
            <Suspense fallback={<LoadingSpinner message="Loading application..." />}>
              <Routes>
                {/* Public Routes */}
                <Route
                  path="/login"
                  element={
                    <PublicRoute>
                      <Login />
                    </PublicRoute>
                  }
                />

                {/* Protected Routes */}
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/products"
                  element={
                    <ProtectedRoute>
                      <Products />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/products/new"
                  element={
                    <ProtectedRoute adminOnly>
                      <ProductForm />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/products/:id/edit"
                  element={
                    <ProtectedRoute adminOnly>
                      <ProductForm />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/inventory"
                  element={
                    <ProtectedRoute>
                      <Inventory />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/low-stock"
                  element={
                    <ProtectedRoute>
                      <LowStock />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/inventory/low-stock"
                  element={<Navigate to="/low-stock" replace />}
                />

                <Route
                  path="/sales"
                  element={
                    <ProtectedRoute>
                      <Sales />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/sales/new"
                  element={
                    <ProtectedRoute>
                      <NewSale />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/sales/:id"
                  element={
                    <ProtectedRoute>
                      <InvoiceDetail />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/reports"
                  element={
                    <ProtectedRoute adminOnly>
                      <Reports />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/users"
                  element={
                    <ProtectedRoute adminOnly>
                      <UserManagement />
                    </ProtectedRoute>
                  }
                />

                {/* Catch-all redirect */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </ToastProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
