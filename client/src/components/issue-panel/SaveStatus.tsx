import clsx from 'clsx';
import styles from './SaveStatus.module.css';

export type SaveState =
  { kind: 'idle' } | { kind: 'saving' } | { kind: 'saved' } | { kind: 'error'; field: string };

const FIELD_NAMES: Record<string, string> = {
  title: 'Title',
  description: 'Description',
  status: 'Status',
  priority: 'Priority',
};

function describe(state: SaveState): string {
  switch (state.kind) {
    case 'idle':
      return 'Changes save as you go.';
    case 'saving':
      return 'Saving…';
    case 'saved':
      return 'Saved.';
    case 'error':
      // The reason is shown, and announced, next to the field itself.
      return `${FIELD_NAMES[state.field] ?? 'Last change'} not saved.`;
  }
}

/** One quiet line at the foot of the panel, announced politely to screen readers. */
export function SaveStatus({ state }: { state: SaveState }) {
  return (
    <p
      className={clsx(styles.status, state.kind === 'error' && styles.error)}
      role="status"
      aria-live="polite"
    >
      {describe(state)}
    </p>
  );
}
