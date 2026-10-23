import { Injectable, signal } from '@angular/core';

export type NotificationType = 'success' | 'error';

export interface AppNotification {
  readonly id: number;
  readonly type: NotificationType;
  readonly message: string;
}

/** Tiny toast service: components render `items`, anything can push messages. */
@Injectable({ providedIn: 'root' })
export class NotificationService {
  private nextId = 1;
  private readonly _items = signal<readonly AppNotification[]>([]);

  readonly items = this._items.asReadonly();

  success(message: string): void {
    this.push('success', message, 4000);
  }

  error(message: string): void {
    this.push('error', message, 7000);
  }

  dismiss(id: number): void {
    this._items.update((items) => items.filter((item) => item.id !== id));
  }

  private push(type: NotificationType, message: string, durationMs: number): void {
    const id = this.nextId++;
    this._items.update((items) => [...items, { id, type, message }]);
    setTimeout(() => this.dismiss(id), durationMs);
  }
}
