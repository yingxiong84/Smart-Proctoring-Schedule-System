import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <div className={`${sizeClasses[size]} ${className} relative`}>
      {/* 外圈 */}
      <div className="absolute inset-0 rounded-full border-2 border-gray-200"></div>
      {/* 内圈动画 */}
      <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-current animate-spin"></div>
      {/* 中心点 */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-1 h-1 bg-current rounded-full animate-pulse"></div>
      </div>
    </div>
  );
};

export default LoadingSpinner;