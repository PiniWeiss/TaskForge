import type { ReactNode } from 'react';
import type { IssueViewState } from '../../issues/list-params.ts';
import { Button } from '../ui/Button.tsx';
import { Kbd } from '../ui/Kbd.tsx';
import styles from './IssuesEmpty.module.css';
import { PRIORITY_LABELS, STATUS_LABELS } from './labels.ts';

/** "status Closed, priority High and “refund”" — exactly what is filtering the list. */
function describeFilters(state: IssueViewState): ReactNode[] {
  const parts: ReactNode[] = [];
  if (state.status) parts.push(<strong key="s">status {STATUS_LABELS[state.status]}</strong>);
  if (state.priority)
    parts.push(<strong key="p">priority {PRIORITY_LABELS[state.priority]}</strong>);
  if (state.q) {
    parts.push(
      <strong key="q" dir="auto">
        “{state.q}”
      </strong>,
    );
  }
  return parts.flatMap((part, i) => {
    if (i === 0) return [part];
    return [i === parts.length - 1 ? ' and ' : ', ', part];
  });
}

interface IssuesEmptyProps {
  projectName: string;
  state: IssueViewState;
  filtered: boolean;
  onClearFilters: () => void;
  /** Opens quick-add; without it the empty state only describes the situation. */
  onCreate?: () => void;
}

export function IssuesEmpty({
  projectName,
  state,
  filtered,
  onClearFilters,
  onCreate,
}: IssuesEmptyProps) {
  if (filtered) {
    return (
      <div className={styles.empty} role="status">
        <p className={styles.title}>No issues match {describeFilters(state)}.</p>
        <p className={styles.hint}>Widen the filters, or clear them to see everything.</p>
        <Button className={styles.action} onClick={onClearFilters}>
          Clear filters
        </Button>
      </div>
    );
  }

  return (
    <div className={styles.empty} role="status">
      <p className={styles.title}>
        No issues in <span dir="auto">{projectName}</span> yet.
      </p>
      {onCreate && (
        <>
          <p className={styles.hint}>
            File the first one: a bug, a chore, a question for the team. Press <Kbd>C</Kbd> from
            anywhere in the list.
          </p>
          <Button variant="primary" className={styles.action} onClick={onCreate}>
            New issue
          </Button>
        </>
      )}
    </div>
  );
}
