import React, { useState } from 'react';
import { Calendar, Clock, MapPin, User, Filter, Search } from 'lucide-react';
import { Assignment } from '../../types';
import { useDebounce } from '../../hooks/useDebounce';

interface MobileScheduleViewProps {
  assignments: Assignment[];
  onAssignmentClick?: (assignment: Assignment) => void;
  className?: string;
}

export const MobileScheduleView: React.FC<MobileScheduleViewProps> = ({
  assignments,
  onAssignmentClick,
  className = ''
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  
  const debouncedSearch = useDebounce(searchTerm, 300);

  const filteredAssignments = assignments.filter(assignment => {
    const matchesSearch = !debouncedSearch || 
      assignment.teacher.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      assignment.location.toLowerCase().includes(debouncedSearch.toLowerCase());
    
    const matchesDate = !selectedDate || assignment.date === selectedDate;
    
    return matchesSearch && matchesDate;
  });

  const groupedByDate = filteredAssignments.reduce((acc, assignment) => {
    if (!acc[assignment.date]) {
      acc[assignment.date] = [];
    }
    acc[assignment.date].push(assignment);
    return acc;
  }, {} as Record<string, Assignment[]>);

  const uniqueDates = Array.from(new Set(assignments.map(a => a.date))).sort();

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Mobile Header */}
      <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-gray-200 p-4 z-10">
        {/* Search Bar */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="搜索教师或考场..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Filter Toggle */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            排班安排 ({filteredAssignments.length})
          </h2>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`
              flex items-center space-x-1 px-3 py-1 rounded-lg text-sm font-medium transition-colors
              ${showFilters ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}
            `}
          >
            <Filter className="w-4 h-4" />
            <span>筛选</span>
          </button>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              按日期筛选
            </label>
            <select
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="">所有日期</option>
              {uniqueDates.map(date => (
                <option key={date} value={date}>{date}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Assignment List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {Object.keys(groupedByDate).length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">暂无排班数据</p>
          </div>
        ) : (
          Object.entries(groupedByDate)
            .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
            .map(([date, dateAssignments]) => (
              <div key={date} className="space-y-3">
                {/* Date Header */}
                <div className="sticky top-0 bg-white/95 backdrop-blur-sm py-2 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-500" />
                    {date}
                    <span className="text-sm font-normal text-gray-500">
                      ({dateAssignments.length} 个安排)
                    </span>
                  </h3>
                </div>

                {/* Assignments for this date */}
                <div className="space-y-2">
                  {dateAssignments
                    .sort((a, b) => a.startTime.localeCompare(b.startTime))
                    .map((assignment, index) => (
                      <div
                        key={`${assignment.id}_${index}`}
                        onClick={() => onAssignmentClick?.(assignment)}
                        className={`
                          p-4 rounded-xl border transition-all duration-200 active:scale-95
                          ${assignment.teacher.startsWith('!!')
                            ? 'bg-red-50 border-red-200'
                            : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-sm'
                          }
                        `}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            <User className={`w-4 h-4 ${
                              assignment.teacher.startsWith('!!') ? 'text-red-500' : 'text-blue-500'
                            }`} />
                            <span className={`font-medium ${
                              assignment.teacher.startsWith('!!') ? 'text-red-700' : 'text-gray-900'
                            }`}>
                              {assignment.teacher}
                            </span>
                          </div>
                          
                          {assignment.assignedBy !== 'auto' && (
                            <span className={`
                              px-2 py-1 text-xs rounded-full font-medium
                              ${assignment.assignedBy === 'forced' 
                                ? 'bg-orange-100 text-orange-700' 
                                : assignment.assignedBy === 'designated'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-blue-100 text-blue-700'
                              }
                            `}>
                              {assignment.assignedBy === 'forced' ? '锁定' : 
                               assignment.assignedBy === 'designated' ? '指定' : '手动'}
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="flex items-center space-x-2 text-gray-600">
                            <Clock className="w-4 h-4" />
                            <span>{assignment.startTime} - {assignment.endTime}</span>
                          </div>
                          
                          <div className="flex items-center space-x-2 text-gray-600">
                            <MapPin className="w-4 h-4" />
                            <span>考场 {assignment.location}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ))
        )}
      </div>
    </div>
  );
};