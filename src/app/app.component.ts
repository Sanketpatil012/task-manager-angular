import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { NotificationToastComponent } from './shared/components/notification-toast/notification-toast.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, NotificationToastComponent],
  template: `
    <a class="skip-link" href="#main">Skip to content</a>
    <header class="app-header">
      <div class="container app-header__inner">
        <a class="brand" routerLink="/tasks">TaskFlow</a>
        <nav aria-label="Main">
          <a routerLink="/tasks" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">Tasks</a>
          <a routerLink="/tasks/new" routerLinkActive="active">New task</a>
        </nav>
      </div>
    </header>
    <main id="main" class="container">
      <router-outlet />
    </main>
    <app-notification-toast />
  `,
})
export class AppComponent {}
