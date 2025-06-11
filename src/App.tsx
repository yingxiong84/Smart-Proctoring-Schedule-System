import React, { useState, useCallback } from 'react';
import { Calendar, Download, AlertTriangle, CheckCircle, Wand2, FileText, Printer, Settings, BarChart3, Users, Clock, Zap, RefreshCw, Undo2, Redo2, HelpCircle, Maximize2, Minimize2 } from 'lucide-react';
import { useScheduling } from './hooks/useScheduling';
import { processTeacherFile, processScheduleFile } from './utils/fileProcessing';
import { exportToExcel, exportHistoricalStats } from './utils/export';
import FileUpload from './components/FileUpload';
import ScheduleTable from './components/ScheduleTable';
import StatisticsPanel from './components/StatisticsPanel';
import RulesPanel from './components/RulesPanel';
import Modal from './components/ui/Modal';
import Alert from './components/ui/Alert';
import LoadingSpinner from './components/ui/LoadingSpinner';
import { Teacher, Schedule, HistoricalStats, Session, Slot } from './types';

function App() {
  const {
    teachers,
    schedules,
    sessions,
    assignments,
    specialTasks,
    teacherExclusions,
    historicalStats,
    isLoading,
    validationIssues,
    setTeachers,
    setSchedules,
    setSessions,
    setSpecialTasks,
    setHistoricalStats,
    generateAssignments,
    swapAssignments,
    getConflicts,
    addTeacherExclusion,
    removeTeacherExclusion
  } = useScheduling();

  const [alertMessage, setAlertMessage] = useState<{ type: 'success' | 'error' | 'warning'; title: string; message: string } | null>(null);
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [printTeacher, setPrintTeacher] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [operationHistory, setOperationHistory] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState(1);

  const showAlert = useCallback((type: 'success' | 'error' | 'warning', title: string, message: string) => {
    setAlertMessage({ type, title, message });
    // 添加操作历史
    setOperationHistory(prev => [...prev.slice(-9), `${new Date().toLocaleTimeString()}: ${title}`]);
  }, []);

  const groupScheduleIntoSessions = useCallback((scheduleData: Schedule[]) => {
    const sessionMap = new Map<string, Session>();
    
    scheduleData.forEach(slot => {
      const sessionId = `${slot.date}_${slot.startTime}_${slot.endTime}`;
      
      if (!sessionMap.has(sessionId)) {
        sessionMap.set(sessionId, {
          id: sessionId,
          date: slot.date,
          startTime: slot.startTime,
          endTime: slot.endTime,
          slots: []
        });
      }
      
      sessionMap.get(sessionId)!.slots.push({
        location: slot.location,
        required: slot.required
      });
    });

    const sessionsArray = Array.from(sessionMap.values()).sort((a, b) => 
      new Date(`${a.date} ${a.startTime}`).getTime() - new Date(`${b.date} ${b.startTime}`).getTime()
    );

    setSessions(sessionsArray);
    return sessionsArray;
  }, [setSessions]);

  const handleTeacherData = useCallback((data: Teacher[]) => {
    setTeachers(data);
    setCurrentStep(2);
    showAlert('success', '教师数据导入成功', `成功导入 ${data.length} 位教师信息`);
  }, [setTeachers, showAlert]);

  const handleScheduleData = useCallback((data: Schedule[]) => {
    setSchedules(data);
    groupScheduleIntoSessions(data);
    setCurrentStep(3);
    showAlert('success', '排班数据导入成功', `成功导入 ${data.length} 个排班安排`);
  }, [setSchedules, groupScheduleIntoSessions, showAlert]);

  const handleGenerateAssignments = useCallback(async () => {
    try {
      setCurrentStep(4);
      await generateAssignments();
      showAlert('success', '智能分配完成', '排班分配已完成，请查看结果！');
    } catch (error) {
      showAlert('error', '分配失败', error instanceof Error ? error.message : '生成排班时发生错误');
    }
  }, [generateAssignments, showAlert]);

  const handleExportExcel = useCallback(() => {
    try {
      exportToExcel(assignments, `排班结果_${new Date().toISOString().slice(0, 10)}.xlsx`);
      showAlert('success', '导出成功', '排班结果已导出到Excel文件');
    } catch (error) {
      showAlert('error', '导出失败', error instanceof Error ? error.message : '导出失败');
    }
  }, [assignments, showAlert]);

  const handleImportHistory = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const importedData = JSON.parse(event.target?.result as string);
          if (typeof importedData === 'object' && !Array.isArray(importedData)) {
            setHistoricalStats(importedData);
            showAlert('success', '历史数据导入成功', '历史数据已成功导入');
          } else {
            throw new Error('格式不正确');
          }
        } catch (err) {
          showAlert('error', '导入失败', '无法解析文件或文件格式不正确');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }, [setHistoricalStats, showAlert]);

  const handleExportHistory = useCallback(() => {
    try {
      const dataToExport = { ...historicalStats };

      teachers.forEach(teacher => {
        const current = assignments
          .filter(a => a.teacher === teacher.name && !a.teacher.startsWith('!!'))
          .reduce((acc, a) => {
            acc.count++;
            const duration = (new Date(`1970-01-01T${a.endTime}:00`).getTime() - 
                             new Date(`1970-01-01T${a.startTime}:00`).getTime()) / 60000;
            acc.duration += duration;
            return acc;
          }, { count: 0, duration: 0 });

        if (!dataToExport[teacher.name]) {
          dataToExport[teacher.name] = { count: 0, duration: 0 };
        }

        dataToExport[teacher.name].count += current.count;
        dataToExport[teacher.name].duration += current.duration;
      });

      exportHistoricalStats(dataToExport, `监考工作量累计_${new Date().toISOString().slice(0, 10)}.json`);
      showAlert('success', '导出成功', '累计数据已导出');
    } catch (error) {
      showAlert('error', '导出失败', '导出失败');
    }
  }, [historicalStats, teachers, assignments, showAlert]);

  const handleClearHistory = useCallback(() => {
    setHistoricalStats({});
    showAlert('success', '清空成功', '历史数据已清空');
  }, [setHistoricalStats, showAlert]);

  const handleShowConflicts = useCallback(() => {
    setShowConflictModal(true);
  }, []);

  const handlePrintSlip = useCallback((teacherName: string) => {
    setPrintTeacher(teacherName);
    setShowPrintModal(true);
  }, []);

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(!isFullscreen);
  }, [isFullscreen]);

  const conflicts = getConflicts();
  const canGenerate = teachers.length > 0 && schedules.length > 0;
  const completionRate = Math.round((currentStep / 4) * 100);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* 顶部导航栏 */}
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
                      className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-500"
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
              {operationHistory.length > 0 && (
                <div className="hidden lg:flex items-center space-x-1 text-xs text-gray-500">
                  <Clock className="w-3 h-3" />
                  <span>{operationHistory[operationHistory.length - 1]}</span>
                </div>
              )}

              {/* 快捷按钮 */}
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => setShowHelpModal(true)}
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
                    onClick={handleExportExcel}
                    className="flex items-center space-x-1 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
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

      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Alert Messages */}
        {alertMessage && (
          <div className="mb-6 animate-in slide-in-from-top duration-300">
            <Alert
              type={alertMessage.type}
              title={alertMessage.title}
              message={alertMessage.message}
              onClose={() => setAlertMessage(null)}
            />
          </div>
        )}

        {/* Validation Issues */}
        {validationIssues.length > 0 && (
          <div className="mb-6 animate-in slide-in-from-top duration-300">
            <Alert
              type="warning"
              title="数据校验警告"
              message={validationIssues.map(issue => issue.message).join('\n')}
            />
          </div>
        )}

        {/* 主要内容区域 */}
        <div className={`grid gap-6 transition-all duration-300 ${
          isFullscreen 
            ? 'grid-cols-1' 
            : 'grid-cols-12'
        }`}>
          {/* 左侧设置面板 */}
          {!isFullscreen && (
            <div className="col-span-12 lg:col-span-3">
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-white/40 shadow-xl">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                      <Settings className="w-5 h-5 text-blue-500" />
                      排班设置
                    </h2>
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-xs text-gray-500">实时同步</span>
                    </div>
                  </div>
                </div>
                
                <div className="p-6 space-y-8">
                  {/* 步骤1: 数据导入 */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                        currentStep >= 1 ? 'bg-blue-500 text-white shadow-lg' : 'bg-gray-200 text-gray-500'
                      }`}>
                        {currentStep > 1 ? <CheckCircle className="w-4 h-4" /> : '1'}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-700">数据导入</h3>
                        <p className="text-xs text-gray-500">导入教师和排班数据</p>
                      </div>
                    </div>
                    <div className="ml-11 space-y-4">
                      <FileUpload type="teacher" onDataLoaded={handleTeacherData} />
                      <FileUpload type="schedule" onDataLoaded={handleScheduleData} />
                    </div>
                  </div>

                  {/* 步骤2: 规则配置 */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                        currentStep >= 2 ? 'bg-green-500 text-white shadow-lg' : 'bg-gray-200 text-gray-500'
                      }`}>
                        {currentStep > 2 ? <CheckCircle className="w-4 h-4" /> : '2'}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-700">规则配置</h3>
                        <p className="text-xs text-gray-500">设置排班规则和约束</p>
                      </div>
                    </div>
                    <div className="ml-11">
                      <RulesPanel
                        teachers={teachers}
                        sessions={sessions}
                        specialTasks={specialTasks}
                        teacherExclusions={teacherExclusions}
                        onUpdateSpecialTasks={setSpecialTasks}
                        onAddExclusion={addTeacherExclusion}
                        onRemoveExclusion={removeTeacherExclusion}
                      />
                    </div>
                  </div>

                  {/* 步骤3: 智能分配 */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                        currentStep >= 3 ? 'bg-purple-500 text-white shadow-lg' : 'bg-gray-200 text-gray-500'
                      }`}>
                        {currentStep > 3 ? <CheckCircle className="w-4 h-4" /> : '3'}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-700">智能分配</h3>
                        <p className="text-xs text-gray-500">AI算法自动排班</p>
                      </div>
                    </div>
                    <div className="ml-11">
                      <button
                        onClick={handleGenerateAssignments}
                        disabled={!canGenerate || isLoading}
                        className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-lg hover:shadow-xl disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center gap-3 group"
                      >
                        {isLoading ? (
                          <>
                            <LoadingSpinner size="sm" className="text-white" />
                            <span>智能分配中...</span>
                          </>
                        ) : (
                          <>
                            <Zap className="w-5 h-5 group-hover:animate-pulse" />
                            <span>开始智能分配</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 中央排班预览区域 */}
          <div className={`${isFullscreen ? 'col-span-1' : 'col-span-12 lg:col-span-6'}`}>
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-white/40 shadow-xl h-[80vh] flex flex-col">
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-blue-500" />
                  <h2 className="text-lg font-semibold text-gray-800">排班预览</h2>
                  {assignments.length > 0 && (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Users className="w-4 h-4" />
                      <span>{assignments.length} 个分配</span>
                    </div>
                  )}
                </div>
                
                {assignments.length > 0 && (
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleShowConflicts}
                      className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${
                        conflicts.length === 0
                          ? 'bg-green-100 text-green-700 hover:bg-green-200 shadow-sm'
                          : 'bg-red-100 text-red-700 hover:bg-red-200 shadow-sm animate-pulse'
                      }`}
                    >
                      {conflicts.length === 0 ? (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          无冲突
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="w-4 h-4" />
                          {conflicts.length} 条冲突
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
              
              <div className="flex-1 overflow-hidden p-6">
                <ScheduleTable
                  assignments={assignments}
                  onSwapAssignments={swapAssignments}
                  className="h-full"
                />
              </div>
            </div>
          </div>

          {/* 右侧统计面板 */}
          {!isFullscreen && (
            <div className="col-span-12 lg:col-span-3">
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-white/40 shadow-xl h-[80vh] flex flex-col">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-green-500" />
                    数据统计
                  </h2>
                </div>
                
                <div className="flex-1 overflow-hidden p-6">
                  <StatisticsPanel
                    assignments={assignments}
                    teachers={teachers}
                    historicalStats={historicalStats}
                    onExportHistory={handleExportHistory}
                    onImportHistory={handleImportHistory}
                    onClearHistory={handleClearHistory}
                    onPrintSlip={handlePrintSlip}
                    className="h-full"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 模态框 */}
      <Modal
        isOpen={showConflictModal}
        onClose={() => setShowConflictModal(false)}
        title={conflicts.length === 0 ? '冲突检测结果' : `发现 ${conflicts.length} 条冲突`}
        size="lg"
      >
        <div className="p-6">
          {conflicts.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-10 h-10 text-green-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">太棒了！</h3>
              <p className="text-gray-600">系统未检测到任何排班冲突</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {conflicts.map((conflict, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-xl border-l-4 ${
                    conflict.severity === 'high'
                      ? 'bg-red-50 border-red-400'
                      : conflict.severity === 'medium'
                      ? 'bg-yellow-50 border-yellow-400'
                      : 'bg-blue-50 border-blue-400'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <AlertTriangle className={`w-5 h-5 mt-0.5 ${
                      conflict.severity === 'high'
                        ? 'text-red-500'
                        : conflict.severity === 'medium'
                        ? 'text-yellow-500'
                        : 'text-blue-500'
                    }`} />
                    <div>
                      <h4 className="font-semibold text-sm">{conflict.type}</h4>
                      <p className="text-sm text-gray-600 mt-1">{conflict.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>

      {/* 帮助模态框 */}
      <Modal
        isOpen={showHelpModal}
        onClose={() => setShowHelpModal(false)}
        title="使用帮助"
        size="lg"
      >
        <div className="p-6">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-3">快速开始</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <p>1. 上传教师名单和考场安排Excel文件</p>
                <p>2. 根据需要设置排除规则和特殊任务</p>
                <p>3. 点击"开始智能分配"生成排班结果</p>
                <p>4. 通过拖拽调整排班，导出最终结果</p>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-3">快捷键</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                  <p><kbd className="px-2 py-1 bg-gray-100 rounded">Ctrl + S</kbd> 保存当前状态</p>
                  <p><kbd className="px-2 py-1 bg-gray-100 rounded">Ctrl + Z</kbd> 撤销操作</p>
                </div>
                <div className="space-y-1">
                  <p><kbd className="px-2 py-1 bg-gray-100 rounded">Ctrl + E</kbd> 导出结果</p>
                  <p><kbd className="px-2 py-1 bg-gray-100 rounded">F11</kbd> 全屏模式</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* 打印通知单模态框 */}
      <Modal
        isOpen={showPrintModal}
        onClose={() => setShowPrintModal(false)}
        title="监考通知单"
        size="md"
      >
        <div className="p-6">
          {printTeacher && (
            <div className="space-y-6">
              <div className="text-center border-b pb-4">
                <h3 className="text-2xl font-bold mb-2">监考通知单</h3>
                <p className="text-lg font-medium text-blue-600">{printTeacher} 老师</p>
              </div>
              
              <p className="text-gray-600">您好！本次考试您的监考安排如下，请准时参加：</p>
              
              <div className="overflow-hidden rounded-xl border border-gray-200">
                <table className="w-full text-sm">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                    <tr>
                      <th className="p-4 text-left font-semibold">日期</th>
                      <th className="p-4 text-left font-semibold">时间</th>
                      <th className="p-4 text-left font-semibold">地点</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assignments
                      .filter(a => a.teacher === printTeacher)
                      .map((assignment, index) => (
                        <tr key={index} className="border-t hover:bg-gray-50">
                          <td className="p-4">{assignment.date}</td>
                          <td className="p-4">{assignment.startTime} - {assignment.endTime}</td>
                          <td className="p-4">考场 {assignment.location}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
              
              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={() => window.print()}
                  className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  打印
                </button>
                <button
                  onClick={() => setShowPrintModal(false)}
                  className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  关闭
                </button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* 加载遮罩 */}
      {isLoading && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 shadow-2xl border border-gray-200">
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <LoadingSpinner size="lg" className="text-blue-500" />
                <div className="absolute inset-0 animate-ping">
                  <div className="w-8 h-8 border-2 border-blue-300 rounded-full"></div>
                </div>
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold text-gray-800 mb-1">AI智能计算中</p>
                <p className="text-sm text-gray-500">正在为您生成最优排班方案...</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;