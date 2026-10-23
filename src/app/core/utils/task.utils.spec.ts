import { HttpErrorResponse } from '@angular/common/http';

import { toErrorMessage } from './error.util';
import { addDaysIso, computeStats, isOverdue } from './task.utils';

describe('task utils', () => {
  describe('isOverdue', () => {
    const today = '2030-06-15';

    it('is true for an unfinished task due before today', () => {
      expect(isOverdue({ status: 'todo', dueDate: '2030-06-14' }, today)).toBeTrue();
      expect(isOverdue({ status: 'in-progress', dueDate: '2029-12-31' }, today)).toBeTrue();
    });

    it('is false when due today or later', () => {
      expect(isOverdue({ status: 'todo', dueDate: today }, today)).toBeFalse();
      expect(isOverdue({ status: 'todo', dueDate: '2030-06-16' }, today)).toBeFalse();
    });

    it('is false for completed tasks, even when past due', () => {
      expect(isOverdue({ status: 'completed', dueDate: '2020-01-01' }, today)).toBeFalse();
    });
  });

  it('addDaysIso handles month boundaries', () => {
    expect(addDaysIso(1, new Date(2030, 0, 31))).toBe('2030-02-01');
    expect(addDaysIso(-1, new Date(2030, 2, 1))).toBe('2030-02-28');
  });

  it('computeStats returns zeros for an empty list', () => {
    expect(computeStats([])).toEqual({ total: 0, completed: 0, inProgress: 0, overdue: 0 });
  });
});

describe('toErrorMessage', () => {
  it('maps status 0 to a connectivity message', () => {
    expect(toErrorMessage(new HttpErrorResponse({ status: 0 }), 'x')).toContain('Unable to reach the server');
  });

  it('appends a retry hint to the fallback for 5xx errors', () => {
    expect(toErrorMessage(new HttpErrorResponse({ status: 503 }), 'Could not save.')).toBe(
      'Could not save. Please try again shortly.',
    );
  });

  it('returns the fallback for unknown errors', () => {
    expect(toErrorMessage(new Error('internal details'), 'Something failed.')).toBe('Something failed.');
  });
});
