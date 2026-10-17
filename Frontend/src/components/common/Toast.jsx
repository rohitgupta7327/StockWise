import { useState, createContext, useContext, useCallback } from 'react';
import { HiCheckCircle, HiXCircle, HiExclamation } from 'react-icons/hi';

const ToastContext = createContext(null);

const TOAST_STYLES = {
  success: 'bg-white text-slate-800 border-emerald-500 shadow-emerald-500/10 border-l-4',
  error: 'bg-white text-slate-800 border-rose-500 shadow-rose-500/10 border-l-4',
  warning: 'bg-white text-slate-800 border-amber-500 shadow-amber-500/10 border-l-4',
};

const TOAST_ICONS = {
  success: <HiCheckCircle className="text-emerald-500 text-lg shrink-0" />,
  error: <HiXCircle className="text-rose-500 text-lg shrink-0" />,
  warning: <HiExclamation className="text-amber-500 text-lg shrink-0" />,
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'success', duration = 3500) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium shadow-xl border border-slate-200/80 ${
              TOAST_STYLES[toast.type] || TOAST_STYLES.success
            }`}
          >
            {TOAST_ICONS[toast.type] || TOAST_ICONS.success}
            <span className="flex-1">{toast.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
};

export default ToastProvider;
