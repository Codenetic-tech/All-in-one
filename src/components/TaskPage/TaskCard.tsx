// components/TaskCard.tsx
import React from 'react';
import { Clock, User, Flag, Phone, Mail, MoreVertical, CheckSquare } from 'lucide-react';
import { type Task } from '@/utils/tasksCache';

interface TaskCardProps {
  task: Task;
  onTaskUpdate?: (taskId: string, status: 'Todo' | 'In Progress' | 'Done') => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, onTaskUpdate }) => {
  const formatTaskDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      High: 'bg-red-100 text-red-800 border-red-200',
      Medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      Low: 'bg-blue-100 text-blue-800 border-blue-200'
    };
    return colors[priority as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityIcon = (priority: string) => {
    const colors = {
      High: 'text-red-500',
      Medium: 'text-yellow-500',
      Low: 'text-blue-500'
    };
    return colors[priority as keyof typeof colors] || 'text-gray-500';
  };

  const getTaskStatusColor = (status: string) => {
    const colors = {
      Todo: 'bg-gray-100 text-gray-800',
      'In Progress': 'bg-blue-100 text-blue-800',
      Done: 'bg-green-100 text-green-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const handleStatusToggle = () => {
    if (onTaskUpdate) {
      const newStatus = task.status === 'Done' ? 'Todo' : 'Done';
      onTaskUpdate(task.name, newStatus);
    }
  };

  return (
    <div
      className={`
        bg-white rounded-xl shadow-sm border border-gray-200 p-4
        hover:shadow-md transition-all duration-200
        ${task.status === 'Done' ? 'opacity-75' : ''}
      `}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2 flex-1">
          <button
            onClick={handleStatusToggle}
            className={`flex-shrink-0 w-5 h-5 rounded border-2 transition-all ${
              task.status === 'Done' 
                ? 'bg-green-500 border-green-500 text-white' 
                : 'border-gray-300 hover:border-green-500'
            }`}
          >
            {task.status === 'Done' && (
              <CheckSquare size={14} className="w-full h-full" />
            )}
          </button>
          <span className={`font-semibold text-gray-900 ${task.status === 'Done' ? 'line-through' : ''}`}>
            {task.title} : {formatTaskDate(task.due_date)}
          </span>
        </div>
        <button className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0 ml-2">
          <MoreVertical size={16} />
        </button>
      </div>

      {/* Priority and Status */}
      <div className="flex items-center gap-2 mb-3">
        <span className={`px-2 py-1 text-xs rounded-full border ${getPriorityColor(task.priority)} flex items-center gap-1`}>
          <Flag size={10} className={getPriorityIcon(task.priority)} />
          {task.priority}
        </span>
        <span className={`px-2 py-1 text-xs rounded-full ${getTaskStatusColor(task.status)}`}>
          {task.status}
        </span>
      </div>

      {/* Description */}
      {task.description && (
        <div 
          className={`text-sm text-gray-600 mb-3 ${task.status === 'Done' ? 'line-through' : ''}`}
          dangerouslySetInnerHTML={{ __html: task.description }}
        />
      )}

      {/* Contact Info */}
      {(task.first_name || task.mobile_no || task.email) && (
        <div className="border-t border-gray-100 pt-3 mb-3">
          <div className="space-y-2">
            {task.first_name && (
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <User size={14} className="text-gray-400" />
                <span>{task.first_name}</span>
              </div>
            )}
            {task.mobile_no && (
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Phone size={14} className="text-gray-400" />
                <span>{task.mobile_no}</span>
              </div>
            )}
            {task.email && (
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Mail size={14} className="text-gray-400" />
                <span className="truncate">{task.email}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-sm text-gray-500">
        <div className="flex items-center gap-1">
          <Clock size={14} />
          <span>{formatTaskDate(task.due_date)}</span>
        </div>
        <div className="flex items-center gap-1">
          <User size={14} />
          <span className="truncate max-w-20">{task.assigned_to}</span>
        </div>
      </div>
    </div>
  );
};