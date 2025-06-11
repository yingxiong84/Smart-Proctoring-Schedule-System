import React, { useMemo, useState } from 'react';
import { useDrag, useDrop, DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Assignment } from '../types';
import { transformAssignmentsToPivot } from '../utils/export';

interface ScheduleTableProps {
  assignments: Assignment[];
  onSwapAssignments: (id1: string, id2: string) => void;
  className?: string;
}

const DraggableTeacher: React.FC<{
  teacher: string;
  assignmentId: string;
  slotId: string;
  onDrop: (sourceId: string, targetId: string) => void;
}> = ({ teacher, assignmentId, slotId, onDrop }) => {
  const [{ isDragging }, drag] = useDrag({
    type: 'teacher',
    item: { id: assignmentId, teacher, slotId },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [{ isOver, canDrop }, drop] = useDrop({
    accept: 'teacher',
    drop: (item: { id: string; teacher: string; slotId: string }) => {
      if (item.id !== assignmentId) {
        onDrop(item.id, assignmentId);
      }
    },
    canDrop: (item) => item.slotId !== slotId, // 不能拖拽到同一个时间段
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  const isError = teacher.startsWith('!!');

  return (
    <div
      ref={(node) => {
        if (!isError) {
          drag(drop(node));
        }
      }}
      className={`
        px-3 py-2 text-xs rounded-lg border transition-all duration-200 select-none
        ${isDragging ? 'opacity-40 scale-95 rotate-2 shadow-lg z-50' : ''}
        ${isOver && canDrop ? 'ring-2 ring-blue-400 ring-opacity-75 scale-105 shadow-md' : ''}
        ${isOver && !canDrop ? 'ring-2 ring-red-400 ring-opacity-75' : ''}
        ${isError 
          ? 'bg-red-100 border-red-300 text-red-700 font-bold cursor-not-allowed' 
          : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-sm cursor-grab active:cursor-grabbing hover:scale-102'
        }
        ${!isError && !isDragging ? 'hover:bg-blue-50' : ''}
      `}
      title={isError ? '无法拖拽错误分配' : '拖拽以重新分配'}
    >
      <div className="flex items-center gap-1">
        {!isError && (
          <div className="w-1.5 h-1.5 bg-gray-400 rounded-full opacity-60"></div>
        )}
        <span className="font-medium">{teacher}</span>
      </div>
    </div>
  );
};

const DropZone: React.FC<{
  slotId: string;
  children: React.ReactNode;
  isEmpty: boolean;
  onDrop: (sourceId: string, targetId: string) => void;
}> = ({ slotId, children, isEmpty, onDrop }) => {
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: 'teacher',
    drop: (item: { id: string; teacher: string; slotId: string }) => {
      // 如果是空位置，创建一个虚拟的目标ID
      const targetId = isEmpty ? `empty_${slotId}` : '';
      if (targetId) {
        onDrop(item.id, targetId);
      }
    },
    canDrop: (item) => item.slotId !== slotId,
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  return (
    <div
      ref={drop}
      className={`
        min-h-[60px] p-2 border-2 border-dashed transition-all duration-200 rounded-lg
        ${isOver && canDrop 
          ? 'border-blue-400 bg-blue-50 shadow-inner' 
          : isOver && !canDrop
          ? 'border-red-400 bg-red-50'
          : isEmpty 
          ? 'border-gray-200 bg-gray-50 hover:border-gray-300' 
          : 'border-transparent bg-transparent'
        }
      `}
    >
      {isEmpty && isOver && canDrop && (
        <div className="flex items-center justify-center h-full text-blue-500 text-xs font-medium">
          <span>释放以分配到此位置</span>
        </div>
      )}
      {isEmpty && isOver && !canDrop && (
        <div className="flex items-center justify-center h-full text-red-500 text-xs font-medium">
          <span>无法分配到同一时间段</span>
        </div>
      )}
      {!isEmpty && (
        <div className="space-y-2">
          {children}
        </div>
      )}
      {isEmpty && !isOver && (
        <div className="flex items-center justify-center h-full text-gray-400 text-xs">
          <span>空位</span>
        </div>
      )}
    </div>
  );
};

const ScheduleTable: React.FC<ScheduleTableProps> = ({ 
  assignments, 
  onSwapAssignments, 
  className = '' 
}) => {
  const [dragPreview, setDragPreview] = useState<string | null>(null);

  const pivotData = useMemo(() => 
    transformAssignmentsToPivot(assignments), 
    [assignments]
  );

  const groupedByDate = useMemo(() => {
    return pivotData.timeSlots.reduce((acc, slot) => {
      if (!acc[slot.date]) acc[slot.date] = [];
      acc[slot.date].push(slot);
      return acc;
    }, {} as Record<string, typeof pivotData.timeSlots>);
  }, [pivotData.timeSlots]);

  const handleSwap = (sourceId: string, targetId: string) => {
    // 添加视觉反馈
    setDragPreview(`${sourceId} → ${targetId}`);
    setTimeout(() => setDragPreview(null), 2000);
    
    onSwapAssignments(sourceId, targetId);
  };

  if (assignments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="text-6xl mb-4">📊</div>
        <h3 className="text-xl font-semibold text-gray-500 mb-2">等待生成排班结果...</h3>
        <p className="text-gray-400">请先在左侧完成设置并点击"开始分配"</p>
      </div>
    );
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className={`overflow-auto ${className} relative`}>
        {/* 拖拽操作提示 */}
        {dragPreview && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg animate-pulse">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
              <span className="text-sm font-medium">正在调整排班...</span>
            </div>
          </div>
        )}

        {/* 操作说明 */}
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2 text-blue-700">
            <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs">💡</span>
            </div>
            <span className="text-sm font-medium">拖拽提示：</span>
          </div>
          <p className="text-xs text-blue-600 mt-1 ml-6">
            拖拽教师姓名可以重新分配监考任务，支持教师互换或移动到空位
          </p>
        </div>

        <table className="min-w-full text-sm border-collapse bg-white rounded-lg overflow-hidden shadow-sm">
          <thead>
            <tr className="bg-gradient-to-r from-gray-100 to-gray-50">
              <th className="p-3 text-xs font-semibold text-center text-gray-600 border w-20 sticky top-0 bg-gray-100 z-10">
                日期
              </th>
              <th className="p-3 text-xs font-semibold text-center text-gray-600 border w-24 sticky top-0 bg-gray-100 z-10">
                时间
              </th>
              {pivotData.locations.map(location => (
                <th 
                  key={location}
                  className="p-3 text-xs font-semibold text-center text-gray-600 border min-w-[140px] sticky top-0 bg-gray-100 z-10"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>考场 {location}</span>
                    <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Object.keys(groupedByDate)
              .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
              .map(date => {
                const slotsForDate = groupedByDate[date];
                
                return slotsForDate.map((slot, index) => (
                  <tr key={`${slot.date}_${slot.startTime}_${slot.endTime}`} className="hover:bg-gray-50 transition-colors">
                    {index === 0 && (
                      <td 
                        className="p-3 text-sm text-center align-middle text-gray-700 font-medium border bg-gradient-to-b from-gray-50 to-gray-100"
                        rowSpan={slotsForDate.length}
                      >
                        <div className="writing-mode-vertical">
                          {slot.date.substring(5).replace(/\//g, '-')}
                        </div>
                      </td>
                    )}
                    <td className="p-3 text-xs text-center align-middle text-gray-600 border whitespace-nowrap bg-gray-50">
                      <div className="font-medium">{slot.startTime}</div>
                      <div className="text-gray-400">-</div>
                      <div className="font-medium">{slot.endTime}</div>
                    </td>
                    {pivotData.locations.map(location => {
                      const teachersInSlot = slot.assignmentsByLocation[location] || [];
                      const slotId = `${slot.date}_${slot.startTime}_${slot.endTime}_${location}`;
                      const isEmpty = teachersInSlot.length === 0;
                      
                      return (
                        <td 
                          key={location}
                          className="border align-top min-w-[140px] p-1"
                        >
                          <DropZone
                            slotId={slotId}
                            isEmpty={isEmpty}
                            onDrop={handleSwap}
                          >
                            {teachersInSlot.map((teacher, teacherIndex) => {
                              const assignmentId = `${slotId}_${teacherIndex}`;
                              return (
                                <DraggableTeacher
                                  key={assignmentId}
                                  teacher={teacher}
                                  assignmentId={assignmentId}
                                  slotId={slotId}
                                  onDrop={handleSwap}
                                />
                              );
                            })}
                          </DropZone>
                        </td>
                      );
                    })}
                  </tr>
                ));
              })}
          </tbody>
        </table>
      </div>
    </DndProvider>
  );
};

export default ScheduleTable;