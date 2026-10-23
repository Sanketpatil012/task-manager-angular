import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'tasks' },
  {
    path: 'tasks',
    title: 'Tasks | TaskFlow',
    loadComponent: () =>
      import('./features/tasks/task-list-page/task-list-page.component').then((m) => m.TaskListPageComponent),
  },
  {
    
    path: 'tasks/new',
    title: 'New task | TaskFlow',
    loadComponent: () =>
      import('./features/tasks/task-form-page/task-form-page.component').then((m) => m.TaskFormPageComponent),
  },
  {
    path: 'tasks/:id/edit',
    title: 'Edit task | TaskFlow',
    loadComponent: () =>
      import('./features/tasks/task-form-page/task-form-page.component').then((m) => m.TaskFormPageComponent),
  },
  {
    path: '**',
    title: 'Page not found | TaskFlow',
    loadComponent: () =>
      import('./features/not-found/not-found.component').then((m) => m.NotFoundComponent),
  },
];
