import React, { useState, useEffect } from 'react';
import { CheckSquare, Plus, RefreshCw, Clock4, User, MoreVertical, Flag, X } from 'lucide-react';
import { 
  getCachedTasks, 
  saveTasksToCache, 
  clearTasksCacheForLead,
  type Task 
} from '@/utils/crmCache';

interface LeadTasksTabProps {
  leadId: string;
  employeeId: string;
  email: string;
}

// Task Modal Component
interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (taskData: any) => void;
  loading: boolean;
}

const TaskModal: React.FC<TaskModalProps> = ({ isOpen, onClose, onSubmit, loading }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    due_date: '',
    priority: 'Medium' as 'Low' | 'Medium' | 'High'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleClose = () => {
    setFormData({
      title: '',
      description: '',
      due_date: '',
      priority: 'Medium'
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Create New Task</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter task title"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Enter task description"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Due Date & Time *
            </label>
            <input
              type="datetime-local"
              required
              value={formData.due_date}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Priority
            </label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value as 'Low' | 'Medium' | 'High' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>
          
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !formData.title || !formData.due_date}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="animate-spin h-4 w-4" />
                  Creating...
                </>
              ) : (
                <>
                  <CheckSquare size={16} />
                  Create Task
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const LeadTasksTab: React.FC<LeadTasksTabProps> = ({ leadId, employeeId, email }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [creatingTask, setCreatingTask] = useState(false);
  const [updatingTask, setUpdatingTask] = useState<string | null>(null);

  // Function to fetch tasks with caching
  const fetchTasks = async () => {
    if (!leadId) return;
    
    setTasksLoading(true);
    try {
      // Check cache first
      const cachedTasks = getCachedTasks(leadId);
      if (cachedTasks) {
        console.log('Returning cached tasks');
        setTasks(cachedTasks);
        setTasksLoading(false);
        return;
      }

      console.log('Fetching tasks from API...');
      const response = await fetch('https://n8n.gopocket.in/webhook/client', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          source: 'gettasks',
          employeeId: employeeId,
          email: email,
          leadid: leadId
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch tasks: ${response.status}`);
      }

      const tasksData: Task[] = await response.json();
      // Sort tasks by due date (soonest first)
      tasksData.sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());
      
      setTasks(tasksData);
      // Save to cache
      saveTasksToCache(leadId, tasksData);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setTasksLoading(false);
    }
  };

  // Function to create a new task
  const createTask = async (taskData: any) => {
    if (!leadId) return;
    
    setCreatingTask(true);
    try {
      // Format the due_date to "YYYY-MM-DD HH:MM:00"
      const dueDate = new Date(taskData.due_date);
      const formattedDueDate = `${dueDate.getFullYear()}-${String(dueDate.getMonth() + 1).padStart(2, '0')}-${String(dueDate.getDate()).padStart(2, '0')} ${String(dueDate.getHours()).padStart(2, '0')}:${String(dueDate.getMinutes()).padStart(2, '0')}:00`;

      const response = await fetch('https://n8n.gopocket.in/webhook/client', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          doc: {
            doctype: "CRM Task",
            reference_doctype: "CRM Lead",
            reference_docname: leadId,
            title: taskData.title,
            description: `<p>${taskData.description}</p>`,
            assigned_to: email,
            due_date: formattedDueDate,
            priority: taskData.priority,
            status: "Todo"
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to create task: ${response.status}`);
      }

      await response.json();
      setIsTaskModalOpen(false);
      
      // Clear cache for this lead and refresh tasks
      clearTasksCacheForLead(leadId);
      fetchTasks();
    } catch (error) {
      console.error('Error creating task:', error);
    } finally {
      setCreatingTask(false);
    }
  };

  // Function to update task status
  const updateTaskStatus = async (taskId: string, status: 'Todo' | 'Done') => {
    setUpdatingTask(taskId);
    try {
      const response = await fetch('https://n8n.gopocket.in/webhook/client', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          doctype: "CRM Task",
          name: taskId,
          fieldname: "status",
          value: status,
          leadid: leadId
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to update task: ${response.status}`);
      }

      await response.json();
      
      // Clear cache for this lead and refresh tasks
      clearTasksCacheForLead(leadId);
      fetchTasks();
    } catch (error) {
      console.error('Error updating task:', error);
    } finally {
      setUpdatingTask(null);
    }
  };

  // Fetch tasks when component mounts
  useEffect(() => {
    if (leadId) {
      fetchTasks();
    }
  }, [leadId]);

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

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-800">Tasks</h3>
          <button 
            onClick={() => setIsTaskModalOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Plus size={16} />
            New Task
          </button>
        </div>
        
        {tasksLoading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="animate-spin h-8 w-8 text-blue-500 mr-3" />
            <p className="text-gray-600">Loading tasks...</p>
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-12">
            <CheckSquare className="mx-auto h-16 w-16 text-gray-300 mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">No tasks yet</h4>
            <p className="text-gray-500 mb-6">Get started by creating your first task</p>
            <button 
              onClick={() => setIsTaskModalOpen(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 mx-auto"
            >
              <Plus size={18} />
              Create Your First Task
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {tasks.map((task) => (
              <div key={task.name} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-all duration-200 bg-white">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <button
                      onClick={() => updateTaskStatus(task.name, task.status === 'Done' ? 'Todo' : 'Done')}
                      disabled={updatingTask === task.name}
                      className={`flex-shrink-0 w-5 h-5 rounded border-2 mt-1 transition-all ${
                        task.status === 'Done' 
                          ? 'bg-green-500 border-green-500 text-white' 
                          : 'border-gray-300 hover:border-green-500'
                      } ${updatingTask === task.name ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {task.status === 'Done' && (
                        <CheckSquare size={14} className="w-full h-full" />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`font-medium text-lg ${task.status === 'Done' ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                          {task.title}
                        </span>
                        <span className={`px-2 py-1 text-xs rounded-full border ${getPriorityColor(task.priority)} flex items-center gap-1`}>
                          <Flag size={10} className={getPriorityIcon(task.priority)} />
                          {task.priority}
                        </span>
                        <span className={`px-2 py-1 text-xs rounded-full ${getTaskStatusColor(task.status)}`}>
                          {task.status}
                        </span>
                      </div>
                      
                      {task.description && (
                        <p 
                          className={`text-sm text-gray-600 mb-3 ${task.status === 'Done' ? 'line-through' : ''}`}
                          dangerouslySetInnerHTML={{ __html: task.description }}
                        />
                      )}
                      
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock4 size={14} />
                          Due: {formatTaskDate(task.due_date)}
                        </span>
                        <span className="flex items-center gap-1">
                          <User size={14} />
                          {task.assigned_to}
                        </span>
                        {task.modified && (
                          <span className="text-xs text-gray-400">
                            Updated: {formatTaskDate(task.modified)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0 ml-2">
                    <MoreVertical size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Task Modal */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSubmit={createTask}
        loading={creatingTask}
      />
    </div>
  );
};

export default LeadTasksTab;