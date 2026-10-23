import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Subject, of, throwError } from 'rxjs';

import { buildSampleTasks, buildTask } from '../../../testing/task.fixtures';
import { TaskApiService } from '../api/task-api.service';
import { DEFAULT_FILTERS, Task, TaskInput } from '../models/task.model';
import { NotificationService } from '../notification/notification.service';
import { TaskStore } from './task.store';

describe('TaskStore', () => {
  let api: jasmine.SpyObj<TaskApiService>;
  let store: TaskStore;
  let notifications: NotificationService;

  const input: TaskInput = {
    title: 'New task',
    status: 'todo',
    priority: 'low',
    dueDate: '2030-01-01',
  };

  beforeEach(() => {
    api = jasmine.createSpyObj<TaskApiService>('TaskApiService', [
      'getTasks',
      'createTask',
      'updateTask',
      'deleteTask',
    ]);
    TestBed.configureTestingModule({ providers: [{ provide: TaskApiService, useValue: api }] });
    store = TestBed.inject(TaskStore);
    notifications = TestBed.inject(NotificationService);
  });

  function loadSampleTasks(): Task[] {
    const tasks = buildSampleTasks();
    api.getTasks.and.returnValue(of(tasks));
    store.load();
    return tasks;
  }

  describe('loading', () => {
    it('exposes a loading flag while the request is in flight, then the tasks', () => {
      const response$ = new Subject<Task[]>();
      api.getTasks.and.returnValue(response$);

      store.load();
      expect(store.loading()).toBeTrue();
      expect(store.loaded()).toBeFalse();

      const tasks = buildSampleTasks();
      response$.next(tasks);
      response$.complete();

      expect(store.loading()).toBeFalse();
      expect(store.loaded()).toBeTrue();
      expect(store.tasks()).toEqual(tasks);
    });

    it('loadIfNeeded() only calls the API once', () => {
      loadSampleTasks();
      store.loadIfNeeded();
      store.loadIfNeeded();
      expect(api.getTasks).toHaveBeenCalledTimes(1);
    });

    it('stores a user-friendly error (not the raw HTTP error) when loading fails', () => {
      api.getTasks.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500, statusText: 'boom' })));

      store.load();

      expect(store.loading()).toBeFalse();
      expect(store.loaded()).toBeFalse();
      expect(store.error()).toContain('Could not load your tasks.');
      expect(store.error()).not.toContain('boom');
    });

    it('clears a previous error when retrying', () => {
      api.getTasks.and.returnValue(throwError(() => new HttpErrorResponse({ status: 0 })));
      store.load();
      expect(store.error()).toContain('Unable to reach the server');

      api.getTasks.and.returnValue(of(buildSampleTasks()));
      store.load();

      expect(store.error()).toBeNull();
      expect(store.tasks().length).toBe(4);
    });
  });

  describe('derived state', () => {
    it('computes statistics from the tasks', () => {
      loadSampleTasks();
      expect(store.stats()).toEqual({ total: 4, completed: 1, inProgress: 2, overdue: 2 });
    });

    it('does not count completed tasks as overdue', () => {
      loadSampleTasks();
      const completedPastDue = store.tasks().find((t) => t.id === 'c');
      expect(completedPastDue?.status).toBe('completed');
      expect(store.stats().overdue).toBe(2); // only 'a' and 'd'
    });

    it('filters by title search (case-insensitive)', () => {
      loadSampleTasks();
      store.setFilters({ ...DEFAULT_FILTERS, search: 'REPORT' });
      expect(store.filteredTasks().map((t) => t.id).sort()).toEqual(['a', 'd']);
    });

    it('filters by status and priority together', () => {
      loadSampleTasks();
      store.setFilters({ search: '', status: 'in-progress', priority: 'high' });
      expect(store.filteredTasks().map((t) => t.id)).toEqual(['d']);
    });

    it('sorts the filtered list by due date (earliest first)', () => {
      loadSampleTasks();
      expect(store.filteredTasks().map((t) => t.id)).toEqual(['c', 'a', 'd', 'b']);
    });

    it('reports active filters and resets them', () => {
      loadSampleTasks();
      expect(store.hasActiveFilters()).toBeFalse();
      store.setFilters({ ...DEFAULT_FILTERS, status: 'completed' });
      expect(store.hasActiveFilters()).toBeTrue();
      store.clearFilters();
      expect(store.hasActiveFilters()).toBeFalse();
      expect(store.filteredTasks().length).toBe(4);
    });

    it('updates the statistics when tasks change', () => {
      loadSampleTasks();
      api.createTask.and.returnValue(of(buildTask({ id: 'e', status: 'completed' })));

      store.create(input).subscribe();

      expect(store.stats().total).toBe(5);
      expect(store.stats().completed).toBe(2);
    });
  });

  describe('mutations', () => {
    it('create() appends the created task without mutating the previous state', () => {
      loadSampleTasks();
      const before = store.tasks();
      const created = buildTask({ id: 'new', title: input.title });
      api.createTask.and.returnValue(of(created));

      store.create(input).subscribe();

      expect(before.length).toBe(4); // old array untouched
      expect(store.tasks()).not.toBe(before);
      expect(store.tasks().length).toBe(5);
      expect(store.tasks()).toContain(created);
      expect(api.createTask).toHaveBeenCalledWith(input);
    });

    it('update() replaces only the matching task', () => {
      loadSampleTasks();
      const updated: Task = { ...buildTask({ id: 'b' }), title: 'Review code v2', status: 'completed' };
      api.updateTask.and.returnValue(of(updated));

      store.update('b', input).subscribe();

      expect(store.tasks().find((t) => t.id === 'b')).toEqual(updated);
      expect(store.tasks().find((t) => t.id === 'a')?.title).toBe('Write report');
      expect(store.tasks().length).toBe(4);
    });

    it('remove() deletes the task', () => {
      loadSampleTasks();
      api.deleteTask.and.returnValue(of(undefined));

      store.remove('a').subscribe();

      expect(store.tasks().map((t) => t.id)).toEqual(['b', 'c', 'd']);
      expect(api.deleteTask).toHaveBeenCalledWith('a');
    });

    it('shows success feedback after a successful write', () => {
      loadSampleTasks();
      api.deleteTask.and.returnValue(of(undefined));

      store.remove('a').subscribe();

      const [toast] = notifications.items();
      expect(toast.type).toBe('success');
      expect(toast.message).toBe('Task deleted.');
    });

    it('toggles the saving flag during a write', () => {
      loadSampleTasks();
      const response$ = new Subject<void>();
      api.deleteTask.and.returnValue(response$);

      store.remove('a').subscribe();
      expect(store.saving()).toBeTrue();

      response$.next();
      response$.complete();
      expect(store.saving()).toBeFalse();
    });

    it('keeps state unchanged, shows an error toast and does not emit when a write fails', () => {
      loadSampleTasks();
      const before = store.tasks();
      api.createTask.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500 })));

      let emitted = false;
      let completed = false;
      store.create(input).subscribe({ next: () => (emitted = true), complete: () => (completed = true) });

      expect(emitted).toBeFalse();
      expect(completed).toBeTrue();
      expect(store.tasks()).toBe(before);
      expect(store.saving()).toBeFalse();
      const [toast] = notifications.items();
      expect(toast.type).toBe('error');
      expect(toast.message).toContain('Could not create the task.');
    });

    it('explains a 404 on delete in plain language', () => {
      loadSampleTasks();
      api.deleteTask.and.returnValue(throwError(() => new HttpErrorResponse({ status: 404 })));

      store.remove('a').subscribe();

      expect(store.tasks().length).toBe(4);
      expect(notifications.items()[0].message).toContain('could not be found');
    });
  });
});
