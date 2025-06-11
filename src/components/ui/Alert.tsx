import React from 'react';
import { AlertTriangle, CheckCircle, Info, X, Zap } from 'lucide-react';

interface AlertProps {
  type?: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  onClose?: () => void;
  className?: string;
}

const Alert: React.FC<AlertProps> = ({ 
  type = 'info', 
  title, 
  message, 
  onClose,
  className = ''
}) => {
  const baseClasses = "p-4 rounded-xl border flex items-start gap-3 relative shadow-sm backdrop-blur-sm";
  
  const typeClasses = {
    success: "bg-green-50/90 border-green-200 text-green-800",
    error: "bg-red-50/90 border-red-200 text-red-800",
    warning: "bg-yellow-50/90 border-yellow-200 text-yellow-800",
    info: "bg-blue-50/90 border-blue-200 text-blue-800"
  };

  const icons = {
    success: <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0 text-green-500" />,
    error: <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0 text-red-500" />,
    warning: <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0 text-yellow-500" />,
    info: <Info className="w-5 h-5 mt-0.5 flex-shrink-0 text-blue-500" />
  };

  return (
    <div className={`${baseClasses} ${typeClasses[type]} ${className} animate-in slide-in-from-top`}>
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
        <p className="text-sm whitespace-pre-wrap leading-relaxed">{message}</p>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1 rounded-md hover:bg-black/5 transition-colors group"
          aria-label="关闭提示"
        >
          <X className="w-4 h-4 group-hover:scale-110 transition-transform" />
        </button>
      )}
    </div>
  );
};

export default Alert;