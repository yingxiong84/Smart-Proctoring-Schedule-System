import React from 'react';
import { useMediaQuery } from '../hooks/useMediaQuery';

interface ResponsiveGridProps {
  children: React.ReactNode;
  className?: string;
}

export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({ children, className = '' }) => {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const isTablet = useMediaQuery('(max-width: 1024px)');

  const getGridClasses = () => {
    if (isMobile) return 'grid-cols-1 gap-4';
    if (isTablet) return 'grid-cols-1 lg:grid-cols-2 gap-6';
    return 'grid-cols-12 gap-6';
  };

  return (
    <div className={`grid ${getGridClasses()} ${className}`}>
      {children}
    </div>
  );
};