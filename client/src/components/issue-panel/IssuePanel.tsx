import type { Issue, Project } from '@taskforge/shared';
import { useEffect, useRef, type ReactNode } from 'react';
import { ApiError } from '../../api/client.ts';
import { useIssue } from '../../api/issues.ts';
import { useHotkeys } from '../../hooks/useHotkeys.ts';
import { formatIssueNumber } from '../issues/labels.ts';
import { ErrorState } from '../ui/ErrorState.tsx';
import { IconClose } from '../ui/icons.tsx';
import { Kbd } from '../ui/Kbd.tsx';
import { IssueDetail } from './IssueDetail.tsx';
import styles from './IssuePanel.module.css';

interface IssuePanelProps {
  project: Project;
  issueId: string;
  onClose: () => void;
}

/** A side panel (not a modal): the table stays usable next to it on wide screens. */
export function IssuePanel({ project, issueId, onClose }: IssuePanelProps) {
  const issue = useIssue(project.id, issueId);
  const panelRef = useRef<HTMLElement>(null);

  useHotkeys({ Escape: onClose });

  // Move focus into the panel when it opens or switches issue, so the keyboard follows the eye.
  useEffect(() => {
    panelRef.current?.focus({ preventScroll: true });
  }, [issueId]);

  let body: ReactNode;
  let label = 'Issue';
  if (issue.isPending) {
    body = <PanelSkeleton />;
  } else if (issue.isError) {
    body = (
      <ErrorState
        title={
          issue.error instanceof ApiError && issue.error.status === 404
            ? 'This issue doesn’t exist.'
            : 'Couldn’t load this issue.'
        }
        error={issue.error}
        onRetry={() => void issue.refetch()}
      />
    );
  } else {
    label = `Issue ${formatIssueNumber(issue.data.number)}`;
    body = <IssueDetail project={project} issue={issue.data} />;
  }

  return (
    <aside ref={panelRef} className={styles.panel} aria-label={label} tabIndex={-1}>
      <header className={styles.header}>
        <PanelHeading issue={issue.data} project={project} />
        <button
          type="button"
          className={styles.close}
          onClick={onClose}
          aria-label="Close issue"
          aria-keyshortcuts="Escape"
        >
          <Kbd>Esc</Kbd>
          <IconClose />
        </button>
      </header>
      <div className={styles.body}>{body}</div>
    </aside>
  );
}

function PanelHeading({ issue, project }: { issue: Issue | undefined; project: Project }) {
  return (
    <p className={styles.heading}>
      {issue && <span className={styles.number}>{formatIssueNumber(issue.number)}</span>}
      <span className={styles.project} dir="auto">
        {project.name}
      </span>
    </p>
  );
}

function PanelSkeleton() {
  return (
    <div className={styles.skeleton} aria-busy="true" aria-label="Loading issue">
      <span className={styles.skeletonTitle} />
      <span className={styles.skeletonLine} />
      <span className={styles.skeletonLine} />
      <span className={styles.skeletonShort} />
    </div>
  );
}
