import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  imports: [RouterLink],
  template: `
    <section class="state">
      <h1>Page not found</h1>
      <p>The page you are looking for does not exist.</p>
      <a class="btn btn--primary" routerLink="/tasks">Back to tasks</a>
    </section>
  `,
})
export class NotFoundComponent {}
