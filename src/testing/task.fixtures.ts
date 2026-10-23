import { Task } from '../app/core/models/task.model';
import { addDaysIso } from '../app/core/utils/task.utils';

let counter = 0;


export function buildTask(overrides: Partial<Task> = {}): Task {
  counter += 1;
  return {
    id: `task-${counter}`,
    title: `Task ${counter}`,
    status: 'todo',
    priority: 'medium',
    dueDate: addDaysIso(7),
    ...overrides,
  };
}


export function buildSampleTasks(): Task[] {
  return [
    buildTask({ id: 'a', title: 'Write report', status: 'todo', priority: 'high', dueDate: addDaysIso(-2) }),
    buildTask({ id: 'b', title: 'Review code', status: 'in-progress', priority: 'medium', dueDate: addDaysIso(3) }),
    buildTask({ id: 'c', title: 'Book venue', status: 'completed', priority: 'low', dueDate: addDaysIso(-5) }),
    buildTask({ id: 'd', title: 'Fix report bug', status: 'in-progress', priority: 'high', dueDate: addDaysIso(-1) }),
  ];
}
