import { ISSUE_PRIORITIES, type IssuePriority } from '@taskforge/shared';
import clsx from 'clsx';
import { PRIORITY_LABELS } from './labels.ts';
import styles from './PriorityLabel.module.css';

const BARS = [
  { x: 1, height: 4 },
  { x: 5, height: 7 },
  { x: 9, height: 10 },
] as const;

/** Signal-strength bars: one per rank. Only High uses the signal colour. */
export function PriorityGlyph({ priority }: { priority: IssuePriority }) {
  const rank = ISSUE_PRIORITIES.indexOf(priority) + 1;
  return (
    <svg
      className={clsx(styles.glyph, styles[priority])}
      width="12"
      height="12"
      viewBox="0 0 12 12"
      aria-hidden="true"
      focusable="false"
    >
      {BARS.map((bar, index) => (
        <rect
          key={bar.x}
          x={bar.x}
          y={11 - bar.height}
          width="2"
          height={bar.height}
          className={index < rank ? styles.on : styles.off}
        />
      ))}
    </svg>
  );
}

export function PriorityLabel({ priority }: { priority: IssuePriority }) {
  return (
    <span className={clsx(styles.label, styles[priority])}>
      <PriorityGlyph priority={priority} />
      {PRIORITY_LABELS[priority]}
    </span>
  );
}
