import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { buildTask } from '../../../testing/task.fixtures';
import { TaskInput } from '../models/task.model';
import { TaskApiService } from './task-api.service';

describe('TaskApiService', () => {
  let service: TaskApiService;
  let http: HttpTestingController;

  const input: TaskInput = { title: 'Write tests', status: 'todo', priority: 'high', dueDate: '2030-05-01' };

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(TaskApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('GETs the task list', () => {
    const tasks = [buildTask(), buildTask()];
    let result: unknown;

    service.getTasks().subscribe((r) => (result = r));

    const req = http.expectOne('/api/tasks');
    expect(req.request.method).toBe('GET');
    req.flush(tasks);
    expect(result).toEqual(tasks);
  });

  it('POSTs a new task', () => {
    const created = buildTask({ ...input, id: 'x' });
    let result: unknown;

    service.createTask(input).subscribe((r) => (result = r));

    const req = http.expectOne('/api/tasks');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(input);
    req.flush(created);
    expect(result).toEqual(created);
  });

  it('PUTs an update to the task URL (id is URL-encoded)', () => {
    service.updateTask('a/b', input).subscribe();

    const req = http.expectOne('/api/tasks/a%2Fb');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(input);
    req.flush(buildTask({ ...input, id: 'a/b' }));
  });

  it('DELETEs a task', () => {
    let completed = false;

    service.deleteTask('abc').subscribe({ complete: () => (completed = true) });

    const req = http.expectOne('/api/tasks/abc');
    expect(req.request.method).toBe('DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });
    expect(completed).toBeTrue();
  });

  describe('error handling', () => {
    it('propagates a server error as an HttpErrorResponse', () => {
      let error: unknown;

      service.getTasks().subscribe({ error: (e: unknown) => (error = e) });

      http.expectOne('/api/tasks').flush({ message: 'boom' }, { status: 500, statusText: 'Server Error' });

      expect(error instanceof HttpErrorResponse).toBeTrue();
      expect((error as HttpErrorResponse).status).toBe(500);
    });

    it('propagates a network failure (status 0)', () => {
      let error: unknown;

      service.createTask(input).subscribe({ error: (e: unknown) => (error = e) });

      http.expectOne('/api/tasks').error(new ProgressEvent('error'));

      expect((error as HttpErrorResponse).status).toBe(0);
    });

    it('propagates a 404 when deleting a task that no longer exists', () => {
      let status: number | undefined;

      service.deleteTask('gone').subscribe({ error: (e: HttpErrorResponse) => (status = e.status) });

      http.expectOne('/api/tasks/gone').flush('Not found', { status: 404, statusText: 'Not Found' });

      expect(status).toBe(404);
    });
  });
});
