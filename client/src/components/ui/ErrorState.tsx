import clsx from 'clsx';
import { Button } from './Button.tsx';
import styles from './ErrorState.module.css';

interface ErrorStateProps {
  /** What failed, in the user's terms: "Couldn't load issues." */
  title: string;
  error: unknown;
  onRetry?: () => void;
  compact?: boolean;
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : 'Something went wrong.';
}

/** The API's own message plus a retry. Announced to screen readers when it appears. */
export function ErrorState({ title, error, onRetry, compact = false }: ErrorStateProps) {
  return (
    <div className={clsx(styles.error, compact && styles.compact)} role="alert">
      <p className={styles.title}>{title}</p>
      <p className={styles.message}>{messageOf(error)}</p>
      {onRetry && (
        <Button className={styles.retry} onClick={onRetry}>
          Retry
        </Button>
      )}
    </div>
  );
}
