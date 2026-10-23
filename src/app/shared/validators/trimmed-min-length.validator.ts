import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
export function trimmedMinLength(min: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value: unknown = control.value;
    if (typeof value !== 'string' || value.length === 0) {
      return null;
    }
    const actualLength = value.trim().length;
    return actualLength < min ? { minlength: { requiredLength: min, actualLength } } : null;
  };
}
