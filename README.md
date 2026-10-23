# TaskFlow – Angular Task Management App

A small task manager built with **Angular 19 (standalone components)**, **Signals** for state, **Reactive Forms**, and an **in-memory mock REST API** (an `HttpInterceptor`), so it runs with no backend.

## Setup & run

Requirements: Node.js 20+ (22 recommended) and npm. Chrome is needed for tests.

```bash
npm install
npm start          # http://localhost:4200
npm test           # Karma + Jasmine, Chrome, watch mode
npm run test:ci    # one-off headless run with coverage
npm run build      # production build into dist/
```

### See the error states
The mock API can be told to fail. In the browser console:

```js
localStorage.setItem('mockApiFail', 'true');   // every request now returns 500
localStorage.removeItem('mockApiFail');        // back to normal
```
Reload the page to see the load error + "Try again"; create/edit/delete failures show an error toast.

## Architecture

```
src/app
├── core
│   ├── api            TaskApiService (the ONLY HttpClient user) + mock-backend.interceptor
│   ├── models         Task, TaskInput, filters, stats, label/option constants
│   ├── notification   NotificationService (toast messages, signal based)
│   ├── state          TaskStore – single source of truth (signals)
│   └── utils          pure functions: filtering, sorting, stats, overdue, error messages
├── shared
│   ├── components     ConfirmDialog, NotificationToast
│   └── validators     trimmedMinLength
└── features
    ├── tasks
    │   ├── task-list-page   smart component (talks to the store)
    │   ├── task-form-page   smart component for /tasks/new and /tasks/:id/edit
    │   ├── task-form        reusable, presentational Reactive Form (create + edit)
    │   ├── task-filter-bar  presentational, debounced search + filters
    │   └── task-summary     presentational dashboard numbers
    └── not-found
```

**Layers:** `Component → TaskStore → TaskApiService → HttpClient (→ mock interceptor)`.
Components never import `HttpClient`; presentational components only use `input()` / `output()`.

**Routes** (all lazy loaded): `/` → redirects to `/tasks`, `/tasks`, `/tasks/new`, `/tasks/:id/edit`, `**` → not-found page. Route params arrive as component inputs (`withComponentInputBinding`).

## Requirements checklist

| # | Requirement | Status |
|---|-------------|--------|
| 1 | Task list: view, search by title, filter by status & priority, overdue marker, empty state | Done |
| 2 | Reusable Reactive Form for create + edit with required/min-length validation and messages | Done |
| 3 | Delete with confirmation dialog | Done |
| 4 | Dashboard summary (total, completed, in progress, overdue), updates with data | Done |
| 5 | Routing: `/tasks`, `/tasks/new`, `/tasks/:id/edit`, default redirect, not-found | Done |
| 6 | State management: single source of truth, immutable updates, derived state, loading/error | Done |
| 7 | Mock API: get / create / update / delete; components don't use HttpClient | Done |
| 8 | Loading indicator, friendly errors, success feedback (toasts) | Done |
| 9 | Tests: store, component, form validation, API error handling | Done |
| Optional | Debounced search, lazy-loaded routes, custom confirmation dialog, responsive layout, basic accessibility | Done |
| Optional | Pagination, optimistic updates, drag-and-drop, end-to-end tests | **Not done** |

## Tests

| File | What it verifies |
|------|------------------|
| `task.store.spec.ts` | loading flag, derived stats, filtering/sorting, immutable create/update/delete, success toasts, failed writes leave state untouched, load error + retry |
| `task-api.service.spec.ts` | correct HTTP verbs/URLs/bodies; 500, network (status 0) and 404 errors propagate |
| `task-form.component.spec.ts` | every validation rule, error messages in the DOM, trimmed typed payload, edit-mode prefill |
| `task-list-page.component.spec.ts` | loading state, sorted rows, overdue badges, summary, error + retry, empty states, delete confirm/cancel/failure |
| `task.utils.spec.ts` | overdue logic, date maths, error-message mapping |

## Assumptions & trade-offs

- **Description is optional** (the model marks it `description?`); only title, status, priority and due date are required. It is limited to 500 characters.
- **Status and priority start empty** in the create form ("Select a status") so the required validation is meaningful.
- **Overdue** = not completed and due date before today (local date). Dates are plain `yyyy-MM-dd` strings, so there are no timezone surprises.
- The mock API lives in memory: data resets on page reload.
- Overdue/summary values are recomputed when task data changes, not at midnight; fine for this scope.
- The dialog has no full focus trap (it focuses Cancel, closes on Escape/backdrop click).

## README questions

**1. Why did you choose your state-management approach?**
Angular Signals in a single injectable store. The app has one entity type and a few derived views, so a signal holding an immutable state object plus `computed()` selectors gives a single source of truth, fine-grained updates and almost no boilerplate. NgRx would add actions/reducers/effects that this scope doesn't need, but the store's public API (intent methods + read-only selectors) would map onto it cleanly if the app grew.

**2. How is data passed between the API, state layer, and components?**
`TaskApiService` wraps `HttpClient` and returns typed Observables. `TaskStore` calls it, and on success replaces its state immutably (`[...tasks, created]`, `map`, `filter`). Components read read-only signals (`filteredTasks`, `stats`, `loading`, `error`) and call intent methods (`load`, `create`, `update`, `remove`, `setFilters`). Presentational components receive data via `input()` and report events via `output()`. Write methods return an Observable that emits only on success, so the page can navigate afterwards; failures are handled inside the store (toast) and never leak to the UI.

**3. What technical trade-offs did you make because of the time limit?**
No optimistic updates (the UI waits for the server, which is simpler and always consistent), no pagination, no e2e tests, a lightweight dialog instead of a full focus-trapped one, and an interceptor-based mock instead of JSON Server so `npm start` needs no extra process.

**4. What would you improve before deploying to production?**
Real backend + auth; server-side validation errors mapped onto form fields; retry/backoff and request cancellation; optimistic updates with rollback; stronger a11y (focus trap, live-region audit, contrast check); i18n and date/timezone handling per user; e2e tests (Playwright/Cypress) in CI; error logging/monitoring; stricter budgets and a CSP.

**5. How would you support thousands of tasks efficiently?**
Move filtering, sorting and pagination to the server (query params + cursor/offset paging) and keep only the current page in the store. Use virtual scrolling (`@angular/cdk/scrolling`) or pagination in the table, debounce search (already done) and cancel in-flight requests with `switchMap`, return statistics from a dedicated aggregate endpoint instead of computing them from the full list, and keep `track task.id` plus `OnPush`-friendly signals so only changed rows re-render. Add HTTP caching/ETags and database indexes on status, priority and due date.


## Candidate declaration

This project was built with a combination of AI assistance and my own work.
- **AI assistance:** I used an AI coding assistant (ChatGpt) to help generate the initial project structure, code, tests and documentation.
- **My own work:** I reviewed the code, ran the application and the tests, and studied how each part works (state store, API layer, Reactive Form, routing and tests). I made my own changes and decisions during review, and I can explain and modify any part of the code in the follow-up discussion.
- **Other sources:** No external templates or copied solutions were used. Only standard Angular libraries and documentation were referenced.

