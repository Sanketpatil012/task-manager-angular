import { Task, TaskFilters, TaskStats } from '../models/task.model';


export function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function todayIso(now: Date = new Date()): string {
  return toIsoDate(now);
}

/** Returns the ISO date `days` away from `from` (negative = past). */
export function addDaysIso(days: number, from: Date = new Date()): string {
  return toIsoDate(new Date(from.getFullYear(), from.getMonth(), from.getDate() + days));
}

/** A task is overdue when it is not completed and its due date is before today. */
export function isOverdue(task: Pick<Task, 'status' | 'dueDate'>, today: string = todayIso()): boolean {
  // ISO dates compare correctly as plain strings.
  return task.status !== 'completed' && task.dueDate < today;
}

export function filterTasks(tasks: readonly Task[], filters: TaskFilters): Task[] {
  const query = filters.search.trim().toLowerCase();
  return tasks.filter(
    (task) =>
      (query === '' || task.title.toLowerCase().includes(query)) &&
      (filters.status === 'all' || task.status === filters.status) &&
      (filters.priority === 'all' || task.priority === filters.priority),
  );
}

export function sortByDueDate(tasks: readonly Task[]): Task[] {
  return [...tasks].sort((a, b) => a.dueDate.localeCompare(b.dueDate) || a.title.localeCompare(b.title));
}

export function computeStats(tasks: readonly Task[], today: string = todayIso()): TaskStats {
  return tasks.reduce<TaskStats>(
    (stats, task) => ({
      total: stats.total + 1,
      completed: stats.completed + (task.status === 'completed' ? 1 : 0),
      inProgress: stats.inProgress + (task.status === 'in-progress' ? 1 : 0),
      overdue: stats.overdue + (isOverdue(task, today) ? 1 : 0),
    }),
    { total: 0, completed: 0, inProgress: 0, overdue: 0 },
  );
}
