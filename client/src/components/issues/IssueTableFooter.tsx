import type { IssueSortField } from '@taskforge/shared';
import { ISSUE_PAGE_SIZE } from '../../api/endpoints.ts';
import type { IssueViewState } from '../../issues/list-params.ts';
import { Button } from '../ui/Button.tsx';
import styles from './IssueTableFooter.module.css';

const SORT_WORDS: Record<IssueSortField, { asc: string; desc: string }> = {
  number: { asc: 'by ID, lowest first', desc: 'by ID, highest first' },
  createdAt: { asc: 'by created, oldest first', desc: 'by created, newest first' },
  priority: { asc: 'by priority, lowest first', desc: 'by priority, highest first' },
  status: { asc: 'by status, open first', desc: 'by status, closed first' },
  title: { asc: 'by title, A–Z', desc: 'by title, Z–A' },
};

interface IssueTableFooterProps {
  total: number;
  shown: number;
  state: IssueViewState;
  onPageChange: (page: number) => void;
}

export function IssueTableFooter({ total, shown, state, onPageChange }: IssueTableFooterProps) {
  const first = (state.page - 1) * ISSUE_PAGE_SIZE + 1;
  const last = first + shown - 1;
  const pages = Math.max(1, Math.ceil(total / ISSUE_PAGE_SIZE));
  const range =
    total <= ISSUE_PAGE_SIZE
      ? String(total)
      : `${String(first)}–${String(last)} of ${String(total)}`;

  return (
    <footer className={styles.footer}>
      <p className={styles.summary} aria-live="polite">
        {range} {total === 1 ? 'issue' : 'issues'} · sorted{' '}
        {SORT_WORDS[state.sort.field][state.sort.dir]}
      </p>
      {pages > 1 && (
        <nav className={styles.pager} aria-label="Pages">
          <Button
            variant="quiet"
            disabled={state.page <= 1}
            onClick={() => {
              onPageChange(state.page - 1);
            }}
          >
            Previous
          </Button>
          <span className={styles.page}>
            {state.page} / {pages}
          </span>
          <Button
            variant="quiet"
            disabled={state.page >= pages}
            onClick={() => {
              onPageChange(state.page + 1);
            }}
          >
            Next
          </Button>
        </nav>
      )}
    </footer>
  );
}
