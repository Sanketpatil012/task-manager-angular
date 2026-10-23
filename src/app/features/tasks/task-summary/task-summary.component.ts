import { Component, input } from '@angular/core';

import { TaskStats } from '../../../core/models/task.model';

@Component({
  selector: 'app-task-summary',
  template: `
    <section class="summary" aria-label="Task summary">
      <div class="stat">
        <span class="stat__value" data-testid="stat-total">{{ stats().total }}</span>
        <span class="stat__label">Total tasks</span>
      </div>
      <div class="stat stat--completed">
        <span class="stat__value" data-testid="stat-completed">{{ stats().completed }}</span>
        <span class="stat__label">Completed</span>
      </div>
      <div class="stat stat--progress">
        <span class="stat__value" data-testid="stat-in-progress">{{ stats().inProgress }}</span>
        <span class="stat__label">In progress</span>
      </div>
      <div class="stat stat--overdue">
        <span class="stat__value" data-testid="stat-overdue">{{ stats().overdue }}</span>
        <span class="stat__label">Overdue</span>
      </div>
    </section>
  `,
})
export class TaskSummaryComponent {
  readonly stats = input.required<TaskStats>();
}
