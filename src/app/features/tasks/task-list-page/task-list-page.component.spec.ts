import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Subject, of, throwError } from 'rxjs';

import { buildSampleTasks } from '../../../../testing/task.fixtures';
import { TaskApiService } from '../../../core/api/task-api.service';
import { Task } from '../../../core/models/task.model';
import { TaskStore } from '../../../core/state/task.store';
import { TaskListPageComponent } from './task-list-page.component';

describe('TaskListPageComponent', () => {
  let fixture: ComponentFixture<TaskListPageComponent>;
  let api: jasmine.SpyObj<TaskApiService>;

  const el = (): HTMLElement => fixture.nativeElement as HTMLElement;
  const rows = (): HTMLElement[] => Array.from(el().querySelectorAll<HTMLElement>('[data-testid="task-row"]'));
  const stat = (name: string): string =>
    (el().querySelector(`[data-testid="stat-${name}"]`)?.textContent ?? '').trim();
  const dialog = (): HTMLElement | null => el().querySelector('app-confirm-dialog');

  function render(): void {
    fixture = TestBed.createComponent(TaskListPageComponent);
    fixture.detectChanges();
  }

  function rowButton(row: HTMLElement, label: string): HTMLButtonElement {
    const button = Array.from(row.querySelectorAll('button')).find((b) => (b.textContent ?? '').includes(label));
    if (!button) {
      throw new Error(`No "${label}" button in row`);
    }
    return button;
  }

  beforeEach(() => {
    api = jasmine.createSpyObj<TaskApiService>('TaskApiService', [
      'getTasks',
      'createTask',
      'updateTask',
      'deleteTask',
    ]);
    TestBed.configureTestingModule({
      imports: [TaskListPageComponent],
      providers: [provideRouter([]), { provide: TaskApiService, useValue: api }],
    });
  });

  it('shows a loading indicator until the tasks arrive, then renders them', () => {
    const response$ = new Subject<Task[]>();
    api.getTasks.and.returnValue(response$);

    render();
    expect(el().textContent).toContain('Loading tasks');
    expect(rows().length).toBe(0);

    response$.next(buildSampleTasks());
    response$.complete();
    fixture.detectChanges();

    expect(el().textContent).not.toContain('Loading tasks');
    expect(rows().length).toBe(4);
  });

  it('renders the tasks sorted by due date and flags only the overdue ones', () => {
    api.getTasks.and.returnValue(of(buildSampleTasks()));

    render();

    const titles = rows().map((row) => row.querySelector('.task-title')?.textContent?.trim());
    expect(titles).toEqual(['Book venue', 'Write report', 'Fix report bug', 'Review code']);

    const overdueTitles = rows()
      .filter((row) => row.querySelector('[data-testid="overdue-badge"]'))
      .map((row) => row.querySelector('.task-title')?.textContent?.trim());
    // 'Book venue' is past due but completed, so it is not overdue.
    expect(overdueTitles).toEqual(['Write report', 'Fix report bug']);
  });

  it('shows the dashboard summary computed from the tasks', () => {
    api.getTasks.and.returnValue(of(buildSampleTasks()));

    render();

    expect(stat('total')).toBe('4');
    expect(stat('completed')).toBe('1');
    expect(stat('in-progress')).toBe('2');
    expect(stat('overdue')).toBe('2');
  });

  it('shows a friendly error with a retry button when loading fails, and retries', () => {
    api.getTasks.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500 })));

    render();

    const alert = el().querySelector('[role="alert"]');
    expect(alert?.textContent).toContain('Could not load your tasks.');
    expect(rows().length).toBe(0);

    api.getTasks.and.returnValue(of(buildSampleTasks()));
    el().querySelector<HTMLButtonElement>('.state--error button')?.click();
    fixture.detectChanges();

    expect(api.getTasks).toHaveBeenCalledTimes(2);
    expect(el().querySelector('[role="alert"]')).toBeNull();
    expect(rows().length).toBe(4);
  });

  it('shows an empty state when no task matches the filters, and clears it', () => {
    api.getTasks.and.returnValue(of(buildSampleTasks()));
    render();

    TestBed.inject(TaskStore).setFilters({ search: 'does not exist', status: 'all', priority: 'all' });
    fixture.detectChanges();

    expect(rows().length).toBe(0);
    expect(el().querySelector('[data-testid="empty-state"]')?.textContent).toContain('No tasks match your filters');

    el().querySelector<HTMLButtonElement>('[data-testid="empty-state"] button')?.click();
    fixture.detectChanges();

    expect(rows().length).toBe(4);
  });

  it('shows a "no tasks yet" empty state when there are no tasks at all', () => {
    api.getTasks.and.returnValue(of([]));

    render();

    expect(el().querySelector('[data-testid="empty-state"]')?.textContent).toContain('No tasks yet');
  });

  describe('deleting', () => {
    beforeEach(() => {
      api.getTasks.and.returnValue(of(buildSampleTasks()));
      render();
    });

    it('asks for confirmation and does not delete when cancelled', () => {
      const target = rows().find((r) => r.textContent?.includes('Write report'));
      rowButton(target as HTMLElement, 'Delete').click();
      fixture.detectChanges();

      expect(dialog()?.textContent).toContain('Write report');

      Array.from(dialog()?.querySelectorAll('button') ?? [])
        .find((b) => b.textContent?.includes('Cancel'))
        ?.click();
      fixture.detectChanges();

      expect(dialog()).toBeNull();
      expect(api.deleteTask).not.toHaveBeenCalled();
      expect(rows().length).toBe(4);
    });

    it('deletes the task and updates the list and summary after confirming', () => {
      api.deleteTask.and.returnValue(of(undefined));
      const target = rows().find((r) => r.textContent?.includes('Write report'));
      rowButton(target as HTMLElement, 'Delete').click();
      fixture.detectChanges();

      dialog()?.querySelector<HTMLButtonElement>('.btn--danger')?.click();
      fixture.detectChanges();

      expect(api.deleteTask).toHaveBeenCalledOnceWith('a');
      expect(dialog()).toBeNull();
      expect(rows().length).toBe(3);
      expect(el().textContent).not.toContain('Write report');
      expect(stat('total')).toBe('3');
      expect(stat('overdue')).toBe('1');
    });

    it('keeps the task in the list when the delete request fails', () => {
      api.deleteTask.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
      const target = rows().find((r) => r.textContent?.includes('Write report'));
      rowButton(target as HTMLElement, 'Delete').click();
      fixture.detectChanges();

      dialog()?.querySelector<HTMLButtonElement>('.btn--danger')?.click();
      fixture.detectChanges();

      expect(rows().length).toBe(4);
    });
  });
});
