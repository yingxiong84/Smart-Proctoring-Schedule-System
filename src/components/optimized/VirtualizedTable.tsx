import React, { memo } from 'react';
import { useVirtualization } from '../../hooks/useVirtualization';
import { Assignment } from '../../types';

interface VirtualizedTableProps {
  assignments: Assignment[];
  onRowClick?: (assignment: Assignment) => void;
  className?: string;
}

const TableRow = memo<{ assignment: Assignment; onClick?: () => void }>(
  ({ assignment, onClick }) => (
    <div
      className="flex items-center p-4 border-b hover:bg-gray-50 cursor-pointer transition-colors"
      onClick={onClick}
    >
      <div className="flex-1 min-w-0">
        <div className="font-medium text-gray-900">{assignment.teacher}</div>
        <div className="text-sm text-gray-500">
          {assignment.date} {assignment.startTime}-{assignment.endTime}
        </div>
      </div>
      <div className="text-sm text-gray-500">考场 {assignment.location}</div>
    </div>
  )
);

export const VirtualizedTable: React.FC<VirtualizedTableProps> = ({
  assignments,
  onRowClick,
  className = ''
}) => {
  const { visibleItems, handleScroll, totalHeight } = useVirtualization(
    assignments,
    {
      itemHeight: 80,
      containerHeight: 600,
      overscan: 5
    }
  );

  return (
    <div className={`relative ${className}`}>
      <div
        className="overflow-auto h-[600px] border rounded-lg"
        onScroll={handleScroll}
      >
        <div style={{ height: totalHeight, position: 'relative' }}>
          <div
            style={{
              transform: `translateY(${visibleItems.offsetY}px)`,
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0
            }}
          >
            {visibleItems.items.map((assignment, index) => (
              <TableRow
                key={`${visibleItems.startIndex + index}`}
                assignment={assignment}
                onClick={() => onRowClick?.(assignment)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};