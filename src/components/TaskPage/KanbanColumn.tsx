// components/KanbanColumn.tsx
import React from 'react';
import { TaskCard } from '@/components/TaskPage/TaskCard';
import { type Task } from '@/utils/tasksCache';

interface KanbanColumnProps {
  id: string;
  title: string;
  tasks: Task[];
  color: string;
  onTaskUpdate: (taskId: string, status: 'Todo' | 'In Progress' | 'Done') => void;
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({ 
  id, 
  title, 
  tasks, 
  color,
  onTaskUpdate 
}) => {
  return (
    <div 
      className={`
        rounded-2xl border-2 border-dashed p-4 min-h-[600px] transition-all duration-200
        ${color}
      `}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-800 text-lg">{title}</h3>
        <span className="bg-white bg-opacity-50 text-gray-700 text-sm font-medium px-2 py-1 rounded-full">
          {tasks.length}
        </span>
      </div>

      {/* Tasks */}
      <div className="space-y-3">
        {tasks.map((task) => (
          <TaskCard
            key={task.name}
            task={task}
            onTaskUpdate={onTaskUpdate}
          />
        ))}
        
        {tasks.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            <p>No tasks</p>
          </div>
        )}
      </div>
    </div>
  );
};