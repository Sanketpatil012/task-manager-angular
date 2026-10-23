import { ComponentFixture, TestBed } from '@angular/core/testing';

import { buildTask } from '../../../../testing/task.fixtures';
import { TaskInput } from '../../../core/models/task.model';
import { TaskFormComponent } from './task-form.component';

describe('TaskFormComponent', () => {
  let fixture: ComponentFixture<TaskFormComponent>;
  let component: TaskFormComponent;
  let emitted: TaskInput[];

  const el = (): HTMLElement => fixture.nativeElement as HTMLElement;
  const errors = (): string[] =>
    Array.from(el().querySelectorAll('.field-error')).map((e) => (e.textContent ?? '').trim());

  function fillValidForm(): void {
    component.form.setValue({
      title: '  Prepare demo  ',
      description: '',
      status: 'in-progress',
      priority: 'high',
      dueDate: '2030-03-10',
    });
  }

  function clickSubmit(): void {
    el().querySelector<HTMLButtonElement>('button[type="submit"]')?.click();
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [TaskFormComponent] }).compileComponents();
    fixture = TestBed.createComponent(TaskFormComponent);
    component = fixture.componentInstance;
    emitted = [];
    component.submitted.subscribe((value) => emitted.push(value));
    fixture.detectChanges();
  });

  describe('validation', () => {
    it('requires a title', () => {
      const title = component.form.controls.title;
      title.setValue('');
      expect(title.errors?.['required']).toBeTrue();
    });

    it('requires at least three characters in the title', () => {
      const title = component.form.controls.title;

      title.setValue('ab');
      expect(title.errors?.['minlength']).toBeTruthy();

      title.setValue('abc');
      expect(title.valid).toBeTrue();
    });

    it('does not count surrounding whitespace towards the minimum title length', () => {
      const title = component.form.controls.title;
      title.setValue('  a ');
      expect(title.errors?.['minlength']).toBeTruthy();
    });

    it('requires status, priority and due date', () => {
      const { status, priority, dueDate } = component.form.controls;
      expect(status.errors?.['required']).toBeTrue();
      expect(priority.errors?.['required']).toBeTrue();
      expect(dueDate.errors?.['required']).toBeTrue();
    });

    it('is valid once every required field is filled', () => {
      expect(component.form.valid).toBeFalse();
      fillValidForm();
      expect(component.form.valid).toBeTrue();
    });

    it('limits the description to 500 characters', () => {
      component.form.controls.description.setValue('x'.repeat(501));
      expect(component.form.controls.description.errors?.['maxlength']).toBeTruthy();
    });
  });

  describe('submitting', () => {
    it('shows a clear message for every invalid field and emits nothing', () => {
      clickSubmit();

      expect(emitted.length).toBe(0);
      expect(errors()).toEqual([
        'Title is required.',
        'Status is required.',
        'Priority is required.',
        'Due date is required.',
      ]);
    });

    it('shows the minimum length message for a too-short title', () => {
      component.form.controls.title.setValue('ab');
      component.form.controls.title.markAsTouched();
      fixture.detectChanges();

      expect(errors()).toEqual(['Title must be at least 3 characters long.']);
    });

    it('emits a trimmed, typed payload when valid (blank description becomes undefined)', () => {
      fillValidForm();

      clickSubmit();

      expect(emitted).toEqual([
        {
          title: 'Prepare demo',
          description: undefined,
          status: 'in-progress',
          priority: 'high',
          dueDate: '2030-03-10',
        },
      ]);
    });

    it('disables the submit button and shows progress while submitting', () => {
      fixture.componentRef.setInput('submitting', true);
      fixture.detectChanges();

      const button = el().querySelector<HTMLButtonElement>('button[type="submit"]');
      expect(button?.disabled).toBeTrue();
      expect(button?.textContent).toContain('Saving');
    });

    it('emits cancelled when Cancel is clicked', () => {
      let cancelled = false;
      component.cancelled.subscribe(() => (cancelled = true));

      el().querySelector<HTMLButtonElement>('button[type="button"]')?.click();

      expect(cancelled).toBeTrue();
    });
  });

  describe('edit mode', () => {
    it('populates the form from the task and relabels the button', () => {
      const task = buildTask({
        title: 'Existing task',
        description: 'Some details',
        status: 'completed',
        priority: 'low',
        dueDate: '2031-01-02',
      });

      fixture.componentRef.setInput('task', task);
      fixture.detectChanges();

      expect(component.form.getRawValue()).toEqual({
        title: 'Existing task',
        description: 'Some details',
        status: 'completed',
        priority: 'low',
        dueDate: '2031-01-02',
      });
      expect(el().querySelector('button[type="submit"]')?.textContent).toContain('Save changes');
    });

    it('emits the edited values', () => {
      fixture.componentRef.setInput('task', buildTask({ title: 'Old title', status: 'todo', priority: 'low' }));
      fixture.detectChanges();

      component.form.controls.title.setValue('New title');
      clickSubmit();

      expect(emitted.length).toBe(1);
      expect(emitted[0].title).toBe('New title');
      expect(emitted[0].status).toBe('todo');
    });
  });
});
