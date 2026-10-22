import type { IssueStatus } from '@taskforge/shared';
import clsx from 'clsx';
import { STATUS_LABELS } from './labels.ts';
import styles from './StatusLabel.module.css';

/** Hollow → half → full circle reads as progress without relying on colour alone. */
export function StatusGlyph({ status }: { status: IssueStatus }) {
  return (
    <svg
      className={clsx(styles.glyph, styles[status])}
      width="12"
      height="12"
      viewBox="0 0 12 12"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="6" cy="6" r="4.75" fill="none" stroke="currentColor" strokeWidth="1.5" />
      {status === 'in_progress' && <path d="M6 1.25a4.75 4.75 0 0 1 0 9.5z" fill="currentColor" />}
      {status === 'closed' && <circle cx="6" cy="6" r="4.75" fill="currentColor" />}
    </svg>
  );
}

export function StatusLabel({ status }: { status: IssueStatus }) {
  return (
    <span className={styles.label}>
      <StatusGlyph status={status} />
      {STATUS_LABELS[status]}
    </span>
  );
}
