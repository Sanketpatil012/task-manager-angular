import { Injectable, computed, inject, signal } from '@angular/core';
import { EMPTY, Observable, catchError, defer, finalize, tap } from 'rxjs';

import { TaskApiService } from '../api/task-api.service';
import { NotificationService } from '../notification/notification.service';
import { DEFAULT_FILTERS, Task, TaskFilters, TaskInput } from '../models/task.model';
import { toErrorMessage } from '../utils/error.util';
import { computeStats, filterTasks, sortByDueDate } from '../utils/task.utils';

interface TaskState {
  readonly tasks: readonly Task[];
  /** True while the task list is being fetched. */
  readonly loading: boolean;
  /** True while a create / update / delete request is in flight. */
  readonly saving: boolean;
  /** True once the list has been fetched successfully at least once. */
  readonly loaded: boolean;
  /** User-friendly error for a failed list load (mutation errors are toasts). */
  readonly error: string | null;
}

const INITIAL_STATE: TaskState = {
  tasks: [],
  loading: false,
  saving: false,
  loaded: false,
  error: null,
};

/**
 * Single source of truth for task data.
 *
 *  - State lives in one private signal and is only ever replaced, never mutated.
 *  - Everything the UI needs (filtered list, statistics) is derived with computed().
 *  - Components call intent methods (load, create, update, remove, setFilters);
 *    they never touch HttpClient or the state directly.
 */
@Injectable({ providedIn: 'root' })
export class TaskStore {
  private readonly api = inject(TaskApiService);
  private readonly notifications = inject(NotificationService);

  private readonly state = signal<TaskState>(INITIAL_STATE);
  private readonly filterState = signal<TaskFilters>(DEFAULT_FILTERS);

  // ---- selectors (read-only) ----
  readonly tasks = computed(() => this.state().tasks);
  readonly loading = computed(() => this.state().loading);
  readonly saving = computed(() => this.state().saving);
  readonly loaded = computed(() => this.state().loaded);
  readonly error = computed(() => this.state().error);
  readonly filters = this.filterState.asReadonly();

  // ---- derived state ----
  readonly filteredTasks = computed(() => sortByDueDate(filterTasks(this.tasks(), this.filters())));
  readonly stats = computed(() => computeStats(this.tasks()));
  readonly hasActiveFilters = computed(() => {
    const { search, status, priority } = this.filters();
    return search.trim() !== '' || status !== 'all' || priority !== 'all';
  });

  // ---- commands ----

  /** Fetches the list only if it has not been fetched yet. */
  loadIfNeeded(): void {
    const { loaded, loading } = this.state();
    if (!loaded && !loading) {
      this.load();
    }
  }

  load(): void {
    this.patch({ loading: true, error: null });
    this.api.getTasks().subscribe({
      next: (tasks) => this.patch({ tasks, loaded: true, loading: false }),
      error: (err: unknown) =>
        this.patch({ loading: false, error: toErrorMessage(err, 'Could not load your tasks.') }),
    });
  }

  /** Emits the created task once the server confirmed it. Errors are handled (toast) and swallowed. */
  create(input: TaskInput): Observable<Task> {
    return this.mutate(
      () => this.api.createTask(input),
      (created) => this.state.update((s) => ({ ...s, tasks: [...s.tasks, created] })),
      'Task created.',
      'Could not create the task.',
    );
  }

  update(id: string, input: TaskInput): Observable<Task> {
    return this.mutate(
      () => this.api.updateTask(id, input),
      (updated) =>
        this.state.update((s) => ({ ...s, tasks: s.tasks.map((t) => (t.id === id ? updated : t)) })),
      'Task updated.',
      'Could not update the task.',
    );
  }

  remove(id: string): Observable<void> {
    return this.mutate(
      () => this.api.deleteTask(id),
      () => this.state.update((s) => ({ ...s, tasks: s.tasks.filter((t) => t.id !== id) })),
      'Task deleted.',
      'Could not delete the task.',
    );
  }

  setFilters(filters: TaskFilters): void {
    this.filterState.set({ ...filters });
  }

  clearFilters(): void {
    this.filterState.set(DEFAULT_FILTERS);
  }

  // ---- internals ----

  /**
   * Shared pipeline for writes: toggles `saving`, applies the result to state on
   * success, shows success / error feedback, and never lets an error escape to
   * the caller (the returned stream simply completes without emitting).
   */
  private mutate<T>(
    request: () => Observable<T>,
    apply: (result: T) => void,
    successMessage: string,
    failureMessage: string,
  ): Observable<T> {
    return defer(() => {
      this.patch({ saving: true });
      return request().pipe(
        tap((result) => {
          apply(result);
          this.notifications.success(successMessage);
        }),
        catchError((err: unknown) => {
          this.notifications.error(toErrorMessage(err, failureMessage));
          return EMPTY;
        }),
        finalize(() => this.patch({ saving: false })),
      );
    });
  }

  private patch(partial: Partial<TaskState>): void {
    this.state.update((s) => ({ ...s, ...partial }));
  }
}
