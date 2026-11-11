import styles from './Spinner.module.scss';

export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}

export function Spinner({ size = 'md', label = 'Loading' }: SpinnerProps) {
  return (
    <span role="status" aria-label={label} className={[styles.spinner, styles[size]].join(' ')} />
  );
}
