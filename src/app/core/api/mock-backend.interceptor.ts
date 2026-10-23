import {
  HttpErrorResponse,
  HttpEvent,
  HttpInterceptorFn,
  HttpRequest,
  HttpResponse,
} from '@angular/common/http';
import { Observable, map, mergeMap, throwError, timer } from 'rxjs';

import { TASK_PRIORITIES, TASK_STATUSES, Task, TaskInput } from '../models/task.model';
import { addDaysIso } from '../utils/task.utils';


const ROUTE = /^\/api\/tasks(?:\/([^/?#]+))?$/;
const LATENCY_MS = 400;

const STATUS_VALUES: readonly string[] = TASK_STATUSES.map((s) => s.value);
const PRIORITY_VALUES: readonly string[] = TASK_PRIORITIES.map((p) => p.value);


let database: readonly Task[] = createSeed();

export const mockBackendInterceptor: HttpInterceptorFn = (req, next) => {
  const match = ROUTE.exec(req.url);
  if (!match) {
    return next(req);
  }
  const id = match[1] ? decodeURIComponent(match[1]) : undefined;

  if (isFailureSimulated()) {
    return fail(req, 500, 'Simulated server error');
  }

  switch (req.method) {
    case 'GET': {
      if (!id) {
        return respond(req, 200, [...database]);
      }
      const task = database.find((t) => t.id === id);
      return task ? respond(req, 200, task) : fail(req, 404, 'Task not found');
    }
    case 'POST': {
      if (id || !isTaskInput(req.body)) {
        return fail(req, 400, 'Invalid task');
      }
      const created: Task = { id: newId(), ...req.body };
      database = [...database, created];
      return respond(req, 201, created);
    }
    case 'PUT': {
      if (!id || !isTaskInput(req.body)) {
        return fail(req, 400, 'Invalid task');
      }
      if (!database.some((t) => t.id === id)) {
        return fail(req, 404, 'Task not found');
      }
      const updated: Task = { ...req.body, id };
      database = database.map((t) => (t.id === id ? updated : t));
      return respond(req, 200, updated);
    }
    case 'DELETE': {
      if (!id) {
        return fail(req, 400, 'Missing task id');
      }
      if (!database.some((t) => t.id === id)) {
        return fail(req, 404, 'Task not found');
      }
      database = database.filter((t) => t.id !== id);
      return respond(req, 204, null);
    }
    default:
      return fail(req, 405, 'Method not allowed');
  }
};

function respond<T>(req: HttpRequest<unknown>, status: number, body: T): Observable<HttpEvent<unknown>> {
  return timer(LATENCY_MS).pipe(map(() => new HttpResponse<T>({ status, body, url: req.url })));
}

function fail(req: HttpRequest<unknown>, status: number, message: string): Observable<never> {
  // `delay` does not delay errors, so use timer + mergeMap.
  return timer(LATENCY_MS).pipe(
    mergeMap(() =>
      throwError(
        () => new HttpErrorResponse({ status, statusText: message, url: req.url, error: { message } }),
      ),
    ),
  );
}

function isFailureSimulated(): boolean {
  try {
    return localStorage.getItem('mockApiFail') === 'true';
  } catch {
    return false;
  }
}

function isTaskInput(value: unknown): value is TaskInput {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const { title, description, status, priority, dueDate } = value as Record<string, unknown>;
  return (
    typeof title === 'string' &&
    title.trim().length >= 3 &&
    (description === undefined || typeof description === 'string') &&
    typeof status === 'string' &&
    STATUS_VALUES.includes(status) &&
    typeof priority === 'string' &&
    PRIORITY_VALUES.includes(priority) &&
    typeof dueDate === 'string' &&
    dueDate.length > 0
  );
}

function newId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function createSeed(): Task[] {
  return [
    {
      id: 'seed-1',
      title: 'Prepare sprint planning notes',
      description: 'Collect open questions and estimates before Monday.',
      status: 'todo',
      priority: 'high',
      dueDate: addDaysIso(-2),
    },
    {
      id: 'seed-2',
      title: 'Review pull request #142',
      description: 'Focus on the auth guard changes.',
      status: 'in-progress',
      priority: 'high',
      dueDate: addDaysIso(1),
    },
    {
      id: 'seed-3',
      title: 'Update onboarding documentation',
      status: 'todo',
      priority: 'medium',
      dueDate: addDaysIso(5),
    },
    {
      id: 'seed-4',
      title: 'Fix flaky checkout test',
      description: 'Fails intermittently on CI due to a race condition.',
      status: 'in-progress',
      priority: 'medium',
      dueDate: addDaysIso(-1),
    },
    {
      id: 'seed-5',
      title: 'Book team offsite venue',
      status: 'completed',
      priority: 'low',
      dueDate: addDaysIso(-7),
    },
    {
      id: 'seed-6',
      title: 'Upgrade Angular to latest minor',
      description: 'Run ng update and fix any deprecation warnings.',
      status: 'todo',
      priority: 'low',
      dueDate: addDaysIso(14),
    },
    {
      id: 'seed-7',
      title: 'Write release notes',
      status: 'completed',
      priority: 'medium',
      dueDate: addDaysIso(-3),
    },
    {
      id: 'seed-8',
      title: 'Plan quarterly retrospective',
      description: 'Invite stakeholders and prepare the board.',
      status: 'todo',
      priority: 'high',
      dueDate: addDaysIso(9),
    },
  ];
}
