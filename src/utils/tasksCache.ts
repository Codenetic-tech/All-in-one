// utils/tasksCache.ts
export interface Task {
  name: string;
  owner: string;
  creation: string;
  modified: string;
  modified_by: string;
  docstatus: number;
  idx: number;
  title: string;
  priority: 'Low' | 'Medium' | 'High';
  start_date: string | null;
  reference_doctype: string;
  reference_docname: string;
  assigned_to: string;
  status: 'Todo' | 'In Progress' | 'Done';
  due_date: string;
  description: string;
  first_name?: string;
  mobile_no?: string;
  email?: string;
}

interface CachedAllTasksData {
  tasks: Task[];
  timestamp: number;
  employeeId: string;
  email: string;
}

const ALL_TASKS_CACHE_KEY = 'crm_all_tasks_cache';
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

export const getCachedAllTasks = (employeeId: string, email: string): Task[] | null => {
  try {
    const cached = localStorage.getItem(ALL_TASKS_CACHE_KEY);
    if (!cached) return null;

    const cachedData: CachedAllTasksData = JSON.parse(cached);
    const isExpired = Date.now() - cachedData.timestamp > CACHE_DURATION;
    const isSameUser = cachedData.employeeId === employeeId && cachedData.email === email;

    if (isExpired || !isSameUser) {
      localStorage.removeItem(ALL_TASKS_CACHE_KEY);
      return null;
    }

    return cachedData.tasks;
  } catch (error) {
    console.error('Error reading all tasks cache:', error);
    return null;
  }
};

export const saveAllTasksToCache = (tasks: Task[], employeeId: string, email: string): void => {
  try {
    const cacheData: CachedAllTasksData = {
      tasks,
      timestamp: Date.now(),
      employeeId,
      email
    };
    localStorage.setItem(ALL_TASKS_CACHE_KEY, JSON.stringify(cacheData));
  } catch (error) {
    console.error('Error saving all tasks to cache:', error);
  }
};

export const clearAllTasksCache = (): void => {
  localStorage.removeItem(ALL_TASKS_CACHE_KEY);
};