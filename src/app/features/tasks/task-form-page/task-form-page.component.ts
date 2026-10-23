import { Component, DestroyRef, OnInit, computed, inject, input } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';

import { TaskInput } from '../../../core/models/task.model';
import { TaskStore } from '../../../core/state/task.store';
import { TaskFormComponent } from '../task-form/task-form.component';
@Component({
  selector: 'app-task-form-page',
  imports: [RouterLink, TaskFormComponent],
  template: `
    <section>
      <a class="back-link" routerLink="/tasks">&larr; Back to tasks</a>
      <h1>{{ isEdit() ? 'Edit task' : 'New task' }}</h1>

      @if (isEdit() && store.loading() && !store.loaded()) {
        <div class="state" role="status">
          <span class="spinner" aria-hidden="true"></span>
          Loading task…
        </div>
      } @else if (isEdit() && store.error() && !store.loaded()) {
        <div class="state state--error" role="alert">
          <p>{{ store.error() }}</p>
          <button type="button" class="btn" (click)="store.load()">Try again</button>
        </div>
      } @else if (notFound()) {
        <div class="state" role="alert">
          <h2>Task not found</h2>
          <p>This task does not exist or was deleted.</p>
          <a class="btn btn--primary" routerLink="/tasks">Go to tasks</a>
        </div>
      } @else {
        <app-task-form
          [task]="task()"
          [submitting]="store.saving()"
          (submitted)="save($event)"
          (cancelled)="cancel()"
        />
      }
    </section>
  `,
})
export class TaskFormPageComponent implements OnInit {
  readonly id = input<string>();

  protected readonly store = inject(TaskStore);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly isEdit = computed(() => this.id() !== undefined);

  protected readonly task = computed(() => {
    const id = this.id();
    return id ? (this.store.tasks().find((t) => t.id === id) ?? null) : null;
  });

  protected readonly notFound = computed(() => this.isEdit() && this.store.loaded() && this.task() === null);

  ngOnInit(): void {
    if (this.isEdit()) {
       this.store.loadIfNeeded();
    }
  }

  protected save(input: TaskInput): void {
    const id = this.id();
    const request$ = id ? this.store.update(id, input) : this.store.create(input);
    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => void this.router.navigate(['/tasks']));
  }

  protected cancel(): void {
    void this.router.navigate(['/tasks']);
  }
}
