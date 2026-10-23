import { HttpErrorResponse } from '@angular/common/http';


export function toErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0) {
      return 'Unable to reach the server. Check your connection and try again.';
    }
    if (error.status === 404) {
      return 'That task could not be found. It may have already been deleted.';
    }
    if (error.status >= 500) {
      return `${fallback} Please try again shortly.`;
    }
  }
  return fallback;
}
