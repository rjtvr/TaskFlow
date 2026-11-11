import { forwardRef, useId, type InputHTMLAttributes } from 'react';
import styles from './Checkbox.module.scss';

export interface CheckboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
  error?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, error, id, className, ...rest }, ref) => {
    const autoId = useId();
    const inputId = id ?? autoId;
    const errorId = `${inputId}-error`;

    return (
      <div className={[styles.field, className].filter(Boolean).join(' ')}>
        <div className={styles.row}>
          <input
            ref={ref}
            id={inputId}
            type="checkbox"
            className={styles.box}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
            {...rest}
          />
          <label htmlFor={inputId}>{label}</label>
        </div>
        {error && (
          <p id={errorId} className={styles.error} role="alert">
            {error}
          </p>
        )}
      </div>
    );
  },
);
Checkbox.displayName = 'Checkbox';
