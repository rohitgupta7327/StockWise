import { createContext, useContext, useState, useEffect } from 'react';
import { getMe } from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('stockwise_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('stockwise_token');
    if (token && !user) {
      getMe()
        .then((res) => {
          setUser(res.data.data);
          localStorage.setItem('stockwise_user', JSON.stringify(res.data.data));
        })
        .catch(() => {
          localStorage.removeItem('stockwise_token');
          localStorage.removeItem('stockwise_user');
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const loginUser = (userData, token) => {
    localStorage.setItem('stockwise_token', token);
    localStorage.setItem('stockwise_user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('stockwise_token');
    localStorage.removeItem('stockwise_user');
    setUser(null);
  };

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, loading, loginUser, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
