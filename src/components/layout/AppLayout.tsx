import React from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { MainContent } from './MainContent';
import { useAppStore } from '../../store';

export const AppLayout: React.FC = () => {
  const isFullscreen = useAppStore(state => state.isFullscreen);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Header />
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className={`grid gap-6 transition-all duration-300 ${
          isFullscreen ? 'grid-cols-1' : 'grid-cols-12'
        }`}>
          {!isFullscreen && <Sidebar />}
          <MainContent />
          {!isFullscreen && <div className="col-span-12 lg:col-span-3">
            {/* Statistics Panel */}
          </div>}
        </div>
      </div>
    </div>
  );
};