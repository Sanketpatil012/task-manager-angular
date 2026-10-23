export type TaskStatus = 'todo' | 'in-progress' | 'completed';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
 dueDate: string;
}


export type TaskInput = Omit<Task, 'id'>;

export type StatusFilter = TaskStatus | 'all';
export type PriorityFilter = TaskPriority | 'all';

export interface TaskFilters {
  search: string;
  status: StatusFilter;
  priority: PriorityFilter;
}

export interface TaskStats {
  total: number;
  completed: number;
  inProgress: number;
  overdue: number;
}

export interface SelectOption<T extends string> {
  value: T;
  label: string;
}

export const TASK_STATUSES: readonly SelectOption<TaskStatus>[] = [
  { value: 'todo', label: 'To do' },
  { value: 'in-progress', label: 'In progress' },
  { value: 'completed', label: 'Completed' },
];

export const TASK_PRIORITIES: readonly SelectOption<TaskPriority>[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

export const STATUS_LABELS: Readonly<Record<TaskStatus, string>> = {
  todo: 'To do',
  'in-progress': 'In progress',
  completed: 'Completed',
};

export const PRIORITY_LABELS: Readonly<Record<TaskPriority, string>> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};

export const DEFAULT_FILTERS: TaskFilters = {
  search: '',
  status: 'all',
  priority: 'all',
};
