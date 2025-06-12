import React from 'react';
import { Calendar, Clock, HelpCircle, Maximize2, Minimize2, Download } from 'lucide-react';
import { useAppStore } from '../../store';

export const Header: React.FC = () => {
  const { currentStep, assignments, isFullscreen, operationHistory } = useAppStore();
  const completionRate = Math.round((currentStep / 4) * 100);

  const toggleFullscreen = () => {
    useAppStore.setState(state => ({ isFullscreen: !state.isFullscreen }));
  };

  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-white/20 shadow-sm sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo和标题 */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">智能监考排班系统</h1>
                <p className="text-xs text-gray-500">AI-Powered Scheduling System</p>
              </div>
            </div>
            
            {/* 进度指示器 */}
            <div className="hidden md:flex items-center space-x-2 ml-8">
              <div className="flex items-center space-x-1">
                <div className="text-xs font-medium text-gray-600">进度:</div>
                <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-500 progress-bar"
                    style={{ width: `${completionRate}%` }}
                  />
                </div>
                <div className="text-xs font-medium text-blue-600">{completionRate}%</div>
              </div>
            </div>
          </div>

          {/* 快捷操作栏 */}
          <div className="flex items-center space-x-2">
            {/* 操作历史 */}
            {operationHistory?.length > 0 && (
              <div className="hidden lg:flex items-center space-x-1 text-xs text-gray-500">
                <Clock className="w-3 h-3" />
                <span>{operationHistory[operationHistory.length - 1]}</span>
              </div>
            )}

            {/* 快捷按钮 */}
            <div className="flex items-center space-x-1">
              <button
                onClick={() => {/* Show help modal */}}
                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="帮助"
              >
                <HelpCircle className="w-4 h-4" />
              </button>
              
              <button
                onClick={toggleFullscreen}
                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title={isFullscreen ? "退出全屏" : "全屏模式"}
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>

              {assignments.length > 0 && (
                <button
                  onClick={() => {/* Handle export */}}
                  className="flex items-center space-x-1 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium btn-primary"
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">导出</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};