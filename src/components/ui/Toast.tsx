import React, { useEffect, useState } from 'react';
import { CheckCircle, AlertTriangle, Info, X, Zap } from 'lucide-react';
import { createPortal } from 'react-dom';

export interface ToastProps {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  duration?: number;
  onClose: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({
  id,
  type,
  title,
  message,
  duration = 5000,
  onClose,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [duration]);

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(() => {
      onClose(id);
    }, 300);
  };

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-green-500" />,
    error: <AlertTriangle className="w-5 h-5 text-red-500" />,
    warning: <AlertTriangle className="w-5 h-5 text-yellow-500" />,
    info: <Info className="w-5 h-5 text-blue-500" />
  };

  const typeClasses = {
    success: "bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-200",
    error: "bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200",
    warning: "bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-200",
    info: "bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-200"
  };

  return createPortal(
    <div
      className={`
        fixed top-4 right-4 z-50 max-w-sm w-full transform transition-all duration-300 ease-out
        ${isVisible && !isLeaving ? 'translate-x-0 opacity-100 scale-100' : 'translate-x-full opacity-0 scale-95'}
      `}
    >
      <div className={`
        p-4 rounded-xl border shadow-lg backdrop-blur-sm flex items-start gap-3 relative
        ${typeClasses[type]}
      `}>
        <div className="flex-shrink-0">
          {icons[type]}
        </div>
        <div className="flex-1 min-w-0">
          {title && (
            <h4 className="font-semibold text-sm mb-1 flex items-center gap-2">
              {title}
              {type === 'success' && <Zap className="w-3 h-3 text-green-500" />}
            </h4>
          )}
          <p className="text-sm leading-relaxed">{message}</p>
        </div>
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-colors group"
          aria-label="关闭提示"
        >
          <X className="w-4 h-4 group-hover:scale-110 transition-transform" />
        </button>
      </div>
    </div>,
    document.body
  );
};

// Toast Manager Hook
export const useToast = () => {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const addToast = (toast: Omit<ToastProps, 'id' | 'onClose'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { ...toast, id, onClose: removeToast }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const ToastContainer = () => (
    <>
      {toasts.map(toast => (
        <Toast key={toast.id} {...toast} />
      ))}
    </>
  );

  return {
    addToast,
    removeToast,
    ToastContainer,
  };
};