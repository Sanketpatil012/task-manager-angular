import { Component, ElementRef, afterNextRender, input, output, viewChild } from '@angular/core';


@Component({
  selector: 'app-confirm-dialog',
  template: `
    <div class="dialog-backdrop" (click)="cancelled.emit()">
      <div
        class="dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-heading"
        aria-describedby="confirm-dialog-message"
        (click)="$event.stopPropagation()"
        (keydown.escape)="cancelled.emit()"
      >
        <h2 id="confirm-dialog-heading">{{ heading() }}</h2>
        <p id="confirm-dialog-message">{{ message() }}</p>
        <div class="dialog__actions">
          <button #cancelButton type="button" class="btn" (click)="cancelled.emit()">Cancel</button>
          <button type="button" class="btn btn--danger" (click)="confirmed.emit()">{{ confirmLabel() }}</button>
        </div>
      </div>
    </div>
  `,
})
export class ConfirmDialogComponent {
  readonly heading = input.required<string>();
  readonly message = input.required<string>();
  readonly confirmLabel = input('Confirm');

  readonly confirmed = output<void>();
  readonly cancelled = output<void>();

  private readonly cancelButton = viewChild<ElementRef<HTMLButtonElement>>('cancelButton');

  constructor() {
    
    afterNextRender(() => this.cancelButton()?.nativeElement.focus());
  }
}
