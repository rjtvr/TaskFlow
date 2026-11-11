import type { HTMLAttributes, ReactNode } from 'react';
import styles from './Card.module.scss';

export interface CardProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  title?: ReactNode;
  footer?: ReactNode;
}

export function Card({ title, footer, className, children, ...rest }: CardProps) {
  return (
    <article className={[styles.card, className].filter(Boolean).join(' ')} {...rest}>
      {title && <h3 className={styles.title}>{title}</h3>}
      <div className={styles.body}>{children}</div>
      {footer && <footer className={styles.footer}>{footer}</footer>}
    </article>
  );
}
