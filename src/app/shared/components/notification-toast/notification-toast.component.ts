import { Component, inject } from '@angular/core';

import { NotificationService } from '../../../core/notification/notification.service';

@Component({
  selector: 'app-notification-toast',
  template: `
    <div class="toast-region">
      @for (item of notifications.items(); track item.id) {
        <div
          class="toast"
          [class.toast--error]="item.type === 'error'"
          [attr.role]="item.type === 'error' ? 'alert' : 'status'"
        >
          <span class="toast__message">{{ item.message }}</span>
          <button type="button" class="toast__close" aria-label="Dismiss notification" (click)="notifications.dismiss(item.id)">
            &times;
          </button>
        </div>
      }
    </div>
  `,
})
export class NotificationToastComponent {
  protected readonly notifications = inject(NotificationService);
}
