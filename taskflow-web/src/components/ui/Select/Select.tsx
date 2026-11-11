import { forwardRef, useId, type SelectHTMLAttributes } from 'react';
import styles from './Select.module.scss';

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  hint?: string;
}

// Options are passed as children: <Select label="Status"><option .../></Select>
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, hint, id, className, children, ...rest }, ref) => {
    const autoId = useId();
    const selectId = id ?? autoId;
    const errorId = `${selectId}-error`;
    const hintId = `${selectId}-hint`;
    const describedBy =
      [hint && hintId, error && errorId].filter(Boolean).join(' ') || undefined;

    return (
      <div className={[styles.field, className].filter(Boolean).join(' ')}>
        <label htmlFor={selectId} className={styles.label}>
          {label}
        </label>
        <select
          ref={ref}
          id={selectId}
          className={styles.select}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          {...rest}
        >
          {children}
        </select>
        {hint && (
          <p id={hintId} className={styles.hint}>
            {hint}
          </p>
        )}
        {error && (
          <p id={errorId} className={styles.error} role="alert">
            {error}
          </p>
        )}
      </div>
    );
  },
);
Select.displayName = 'Select';
