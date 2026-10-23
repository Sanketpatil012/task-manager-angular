import { Component, effect, inject, input, output } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { debounceTime } from 'rxjs';

import {
  DEFAULT_FILTERS,
  PriorityFilter,
  StatusFilter,
  TASK_PRIORITIES,
  TASK_STATUSES,
  TaskFilters,
} from '../../../core/models/task.model';


@Component({
  selector: 'app-task-filter-bar',
  imports: [ReactiveFormsModule],
  template: `
    <form class="filters" role="search" [formGroup]="form" (submit)="$event.preventDefault()">
      <div class="field field--grow">
        <label for="filter-search">Search by title</label>
        <input id="filter-search" type="search" formControlName="search" placeholder="Search tasks…" autocomplete="off" />
      </div>
      <div class="field">
        <label for="filter-status">Status</label>
        <select id="filter-status" formControlName="status">
          <option value="all">All statuses</option>
          @for (option of statuses; track option.value) {
            <option [value]="option.value">{{ option.label }}</option>
          }
        </select>
      </div>
      <div class="field">
        <label for="filter-priority">Priority</label>
        <select id="filter-priority" formControlName="priority">
          <option value="all">All priorities</option>
          @for (option of priorities; track option.value) {
            <option [value]="option.value">{{ option.label }}</option>
          }
        </select>
      </div>
    </form>
  `,
})
export class TaskFilterBarComponent {
  readonly filters = input.required<TaskFilters>();
  readonly filtersChange = output<TaskFilters>();

  protected readonly statuses = TASK_STATUSES;
  protected readonly priorities = TASK_PRIORITIES;

  private readonly fb = inject(NonNullableFormBuilder);
  protected readonly form = this.fb.group({
    search: this.fb.control(DEFAULT_FILTERS.search),
    status: this.fb.control<StatusFilter>(DEFAULT_FILTERS.status),
    priority: this.fb.control<PriorityFilter>(DEFAULT_FILTERS.priority),
  });

  constructor() {
    
    effect(() => {
      this.form.patchValue(this.filters(), { emitEvent: false });
    });

    this.form.valueChanges
      .pipe(debounceTime(250), takeUntilDestroyed())
      .subscribe(() => this.filtersChange.emit(this.form.getRawValue()));
  }
}
