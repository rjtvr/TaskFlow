import { forwardRef, type ButtonHTMLAttributes } from 'react';
import styles from './Button.module.scss';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading = false, disabled,
     className, type = 'button', children, ...rest }, ref) => (
    <button
      ref={ref}
      type={type}
      className={[styles.button, styles[variant], styles[size], className]
        .filter(Boolean).join(' ')}
      disabled={disabled || loading}
      aria-busy={loading}
      {...rest}
    >
      {loading && <span className={styles.spinner} aria-hidden="true" />}
      {children}
    </button>
  ),
);
Button.displayName = 'Button';
