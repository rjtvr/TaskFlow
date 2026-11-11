import type { HTMLAttributes } from 'react';
import styles from './Badge.module.scss';

export type BadgeTone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
}

export function Badge({ tone = 'neutral', className, children, ...rest }: BadgeProps) {
  return (
    <span
      className={[styles.badge, styles[tone], className].filter(Boolean).join(' ')}
      {...rest}
    >
      {children}
    </span>
  );
}
