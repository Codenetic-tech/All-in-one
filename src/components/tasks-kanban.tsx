// pages/tasks-kanban.tsx
import React, { useState, useEffect } from 'react';
import { 
  CheckSquare, 
  Plus, 
  RefreshCw, 
  Clock, 
  User, 
  Flag, 
  Phone,
  Mail,
  MoreVertical,
  Search,
  AlertCircle
} from 'lucide-react';
import { TaskCard } from '@/components/TaskPage/TaskCard';
import { KanbanColumn } from '@/components/TaskPage/KanbanColumn';
import { TaskModal } from '@/components/TaskPage/TaskModal';
import { getCachedAllTasks, saveAllTasksToCache, type Task } from '@/utils/tasksCache';
import { useAuth } from '@/contexts/AuthContext';

// Define the column structure
interface Column {
  id: string;
  title: string;
  tasks: Task[];
  color: string;
}

const TasksKanbanPage: React.FC = () => {
  const { user } = useAuth();
  const [columns, setColumns] = useState<Column[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [creatingTask, setCreatingTask] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [error, setError] = useState<string | null>(null);

  // Get actual user credentials from auth context
  const employeeId = user?.employeeId || '';
  const email = user?.email || '';

  // Initialize columns
  const initializeColumns = (taskList: Task[]) => {
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const endOfWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

    const todayTasks = taskList.filter(task => {
      const dueDate = new Date(task.due_date);
      return dueDate.toDateString() === today.toDateString();
    });

    const tomorrowTasks = taskList.filter(task => {
      const dueDate = new Date(task.due_date);
      return dueDate.toDateString() === tomorrow.toDateString();
    });

    const upcomingTasks = taskList.filter(task => {
      const dueDate = new Date(task.due_date);
      return dueDate > tomorrow && dueDate <= endOfWeek;
    });

    const laterTasks = taskList.filter(task => {
      const dueDate = new Date(task.due_date);
      return dueDate > endOfWeek;
    });

    return [
      {
        id: 'today',
        title: 'Today',
        tasks: todayTasks,
        color: 'bg-red-50 border-red-200'
      },
      {
        id: 'tomorrow',
        title: 'Tomorrow',
        tasks: tomorrowTasks,
        color: 'bg-orange-50 border-orange-200'
      },
      {
        id: 'this-week',
        title: 'This Week',
        tasks: upcomingTasks,
        color: 'bg-blue-50 border-blue-200'
      },
      {
        id: 'later',
        title: 'Later',
        tasks: laterTasks,
        color: 'bg-gray-50 border-gray-200'
      }
    ];
  };

  // Fetch tasks from API
  const fetchTasks = async () => {
    if (!employeeId || !email) {
      setError('User authentication required');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // Check cache first
      const cachedTasks = getCachedAllTasks(employeeId, email);
      if (cachedTasks) {
        console.log('Returning cached tasks');
        setTasks(cachedTasks);
        setColumns(initializeColumns(cachedTasks));
        setLoading(false);
        return;
      }

      console.log('Fetching tasks from API...');
      const response = await fetch('https://n8n.gopocket.in/webhook/client', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          source: 'getalltasks',
          employeeId: employeeId,
          email: email
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch tasks: ${response.status}`);
      }

      const tasksData: Task[] = await response.json();
      
      // Sort tasks by due date
      tasksData.sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());
      
      setTasks(tasksData);
      setColumns(initializeColumns(tasksData));
      
      // Save to cache
      saveAllTasksToCache(tasksData, employeeId, email);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setError('Failed to load tasks. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Refresh tasks
  const refreshTasks = async () => {
    if (!employeeId || !email) return;
    
    setRefreshing(true);
    setError(null);
    // Clear cache and fetch fresh data
    localStorage.removeItem('crm_all_tasks_cache');
    await fetchTasks();
    setRefreshing(false);
  };

  // Filter tasks based on search and priority
  const getFilteredColumns = () => {
    if (!searchTerm && filterPriority === 'all') return columns;

    return columns.map(column => ({
      ...column,
      tasks: column.tasks.filter(task => {
        const matchesSearch = searchTerm === '' || 
          task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          task.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          task.description?.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesPriority = filterPriority === 'all' || task.priority === filterPriority;
        
        return matchesSearch && matchesPriority;
      })
    }));
  };

  // Create new task
  const createTask = async (taskData: any) => {
    if (!email) {
      setError('User authentication required');
      return;
    }

    setCreatingTask(true);
    setError(null);
    try {
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
            reference_docname: taskData.leadId || '',
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
      
      // Refresh tasks
      refreshTasks();
    } catch (error) {
      console.error('Error creating task:', error);
      setError('Failed to create task');
    } finally {
      setCreatingTask(false);
    }
  };

  // Update task status
  const updateTaskStatus = async (taskId: string, status: 'Todo' | 'In Progress' | 'Done') => {
    if (!employeeId) return;

    try {
      const task = tasks.find(t => t.name === taskId);
      if (!task) return;

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
          leadid: task.reference_docname
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to update task: ${response.status}`);
      }

      // Refresh tasks
      refreshTasks();
    } catch (error) {
      console.error('Error updating task:', error);
      setError('Failed to update task status');
    }
  };

  // Initial data fetch
  useEffect(() => {
    if (employeeId && email) {
      fetchTasks();
    }
  }, [employeeId, email]);

  const filteredColumns = getFilteredColumns();

  // Show error state
  if (error && tasks.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-4">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Unable to Load Tasks</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={refreshTasks}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="w-full p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Task Manager</h1>
              <p className="text-gray-600">Manage your tasks in a beautiful Kanban view</p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={refreshTasks}
                disabled={loading || refreshing || !employeeId}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${(loading || refreshing) ? 'animate-spin' : ''}`} />
                {loading ? 'Loading...' : refreshing ? 'Refreshing...' : 'Refresh'}
              </button>
              <button
                onClick={() => setIsTaskModalOpen(true)}
                disabled={!employeeId}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                <Plus size={16} />
                New Task
              </button>
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
              <p className="text-red-700">{error}</p>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-red-500 hover:text-red-700"
              >
                ×
              </button>
            </div>
          )}

          {/* Search and Filter */}
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Priorities</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            {filteredColumns.map(column => (
              <div key={column.id} className="bg-white rounded-lg p-4 shadow-sm border">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">{column.title}</span>
                  <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2 py-1 rounded-full">
                    {loading ? '...' : column.tasks.length}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Kanban Board */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading tasks...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredColumns.map(column => (
              <KanbanColumn
                key={column.id}
                id={column.id}
                title={column.title}
                tasks={column.tasks}
                color={column.color}
                onTaskUpdate={updateTaskStatus}
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredColumns.every(column => column.tasks.length === 0) && (
          <div className="text-center py-16">
            <CheckSquare className="mx-auto h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
            <p className="text-gray-500 mb-6">
              {searchTerm || filterPriority !== 'all' 
                ? 'Try adjusting your search or filter criteria'
                : 'Get started by creating your first task'
              }
            </p>
            {!(searchTerm || filterPriority !== 'all') && (
              <button
                onClick={() => setIsTaskModalOpen(true)}
                disabled={!employeeId}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 mx-auto disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                <Plus size={18} />
                Create Your First Task
              </button>
            )}
          </div>
        )}
      </div>

      {/* Task Modal */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSubmit={createTask}
        loading={creatingTask}
        userEmail={email}
      />
    </div>
  );
};

export default TasksKanbanPage;