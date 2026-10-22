import type { Issue, Project } from '@taskforge/shared';
import { formatAbsolute } from '../../lib/time.ts';
import { PriorityLabel } from '../issues/PriorityLabel.tsx';
import { StatusLabel } from '../issues/StatusLabel.tsx';
import { RelativeTime } from '../ui/RelativeTime.tsx';
import styles from './IssueDetail.module.css';

interface IssueDetailProps {
  project: Project;
  issue: Issue;
}

export function IssueDetail({ issue }: IssueDetailProps) {
  return (
    <div className={styles.detail}>
      <h2 className={styles.title} dir="auto">
        {issue.title}
      </h2>

      <dl className={styles.properties}>
        <div className={styles.property}>
          <dt>Status</dt>
          <dd>
            <StatusLabel status={issue.status} />
          </dd>
        </div>
        <div className={styles.property}>
          <dt>Priority</dt>
          <dd>
            <PriorityLabel priority={issue.priority} />
          </dd>
        </div>
        <div className={styles.property}>
          <dt>Created</dt>
          <dd className={styles.time}>
            <RelativeTime iso={issue.createdAt} style="long" />
            <span className={styles.exact}>{formatAbsolute(issue.createdAt)}</span>
          </dd>
        </div>
        <div className={styles.property}>
          <dt>Updated</dt>
          <dd className={styles.time}>
            <RelativeTime iso={issue.updatedAt} style="long" />
          </dd>
        </div>
      </dl>

      <section className={styles.descriptionSection} aria-labelledby="issue-description-label">
        <h3 id="issue-description-label" className={styles.sectionLabel}>
          Description
        </h3>
        {issue.description ? (
          <p className={styles.description} dir="auto">
            {issue.description}
          </p>
        ) : (
          <p className={styles.noDescription}>No description.</p>
        )}
      </section>
    </div>
  );
}
