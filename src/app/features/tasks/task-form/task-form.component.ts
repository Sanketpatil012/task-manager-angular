import { Component, effect, inject, input, output } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import {
  TASK_PRIORITIES,
  TASK_STATUSES,
  Task,
  TaskInput,
  TaskPriority,
  TaskStatus,
} from '../../../core/models/task.model';
import { trimmedMinLength } from '../../../shared/validators/trimmed-min-length.validator';

export type TaskFormField = 'title' | 'description' | 'status' | 'priority' | 'dueDate';

const FIELD_LABELS: Readonly<Record<TaskFormField, string>> = {
  title: 'Title',
  description: 'Description',
  status: 'Status',
  priority: 'Priority',
  dueDate: 'Due date',
};


@Component({
  selector: 'app-task-form',
  imports: [ReactiveFormsModule],
  templateUrl: './task-form.component.html',
})
export class TaskFormComponent {
  readonly task = input<Task | null>(null);
  readonly submitting = input(false);

  readonly submitted = output<TaskInput>();
  readonly cancelled = output<void>();

  protected readonly statuses = TASK_STATUSES;
  protected readonly priorities = TASK_PRIORITIES;

  private readonly fb = inject(NonNullableFormBuilder);

  readonly form = this.fb.group({
    title: ['', [Validators.required, trimmedMinLength(3)]],
    description: ['', [Validators.maxLength(500)]],
    status: this.fb.control<TaskStatus | ''>('', Validators.required),
    priority: this.fb.control<TaskPriority | ''>('', Validators.required),
    dueDate: ['', Validators.required],
  });

  constructor() {
    
    effect(() => {
      const task = this.task();
      if (task) {
        this.form.reset({
          title: task.title,
          description: task.description ?? '',
          status: task.status,
          priority: task.priority,
          dueDate: task.dueDate,
        });
      }
    });
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { title, description, status, priority, dueDate } = this.form.getRawValue();
    if (status === '' || priority === '') {
      return; 
    }

    this.submitted.emit({
      title: title.trim(),
      description: description.trim() === '' ? undefined : description.trim(),
      status,
      priority,
      dueDate,
    });
  }

  
  protected errorMessage(field: TaskFormField): string | null {
    const control = this.form.controls[field];
    const errors = control.errors;
    if (!errors || !(control.touched || control.dirty)) {
      return null;
    }
    const label = FIELD_LABELS[field];

    if (errors['required']) {
      return `${label} is required.`;
    }
    if (errors['minlength']) {
      const { requiredLength } = errors['minlength'] as { requiredLength: number };
      return `${label} must be at least ${requiredLength} characters long.`;
    }
    if (errors['maxlength']) {
      const { requiredLength } = errors['maxlength'] as { requiredLength: number };
      return `${label} must be at most ${requiredLength} characters long.`;
    }
    return `${label} is invalid.`;
  }
}
