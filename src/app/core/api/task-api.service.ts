import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { Task, TaskInput } from '../models/task.model';


@Injectable({ providedIn: 'root' })
export class TaskApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/tasks';

  getTasks(): Observable<Task[]> {
    return this.http.get<Task[]>(this.baseUrl);
  }

  createTask(input: TaskInput): Observable<Task> {
    return this.http.post<Task>(this.baseUrl, input);
  }

  updateTask(id: string, input: TaskInput): Observable<Task> {
    return this.http.put<Task>(this.url(id), input);
  }

  deleteTask(id: string): Observable<void> {
    return this.http.delete<void>(this.url(id));
  }

  private url(id: string): string {
    return `${this.baseUrl}/${encodeURIComponent(id)}`;
  }
}
