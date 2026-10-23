import { DatePipe } from '@angular/common';
import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';

import { PRIORITY_LABELS, STATUS_LABELS, Task, TaskFilters } from '../../../core/models/task.model';
import { TaskStore } from '../../../core/state/task.store';
import { isOverdue } from '../../../core/utils/task.utils';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { TaskFilterBarComponent } from '../task-filter-bar/task-filter-bar.component';
import { TaskSummaryComponent } from '../task-summary/task-summary.component';

@Component({
  selector: 'app-task-list-page',
  imports: [DatePipe, RouterLink, TaskSummaryComponent, TaskFilterBarComponent, ConfirmDialogComponent],
  templateUrl: './task-list-page.component.html',
})
export class TaskListPageComponent implements OnInit {
  protected readonly store = inject(TaskStore);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly statusLabels = STATUS_LABELS;
  protected readonly priorityLabels = PRIORITY_LABELS;
  protected readonly isOverdue = isOverdue;

  
  protected readonly pendingDelete = signal<Task | null>(null);

  ngOnInit(): void {
    this.store.loadIfNeeded();
  }

  protected onFiltersChange(filters: TaskFilters): void {
    this.store.setFilters(filters);
  }

  protected askToDelete(task: Task): void {
    this.pendingDelete.set(task);
  }

  protected cancelDelete(): void {
    this.pendingDelete.set(null);
  }

  protected confirmDelete(): void {
    const task = this.pendingDelete();
    if (!task) {
      return;
    }
    this.pendingDelete.set(null);
    this.store.remove(task.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
  }
}
