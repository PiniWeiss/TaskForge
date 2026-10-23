import type { Project } from '@taskforge/shared';
import type { ReactNode } from 'react';
import { useIssueCount } from '../../api/projects.ts';
import styles from './ProjectHeader.module.css';

interface ProjectHeaderProps {
  project: Project;
  actions?: ReactNode;
}

export function ProjectHeader({ project, actions }: ProjectHeaderProps) {
  const open = useIssueCount(project.id, 'open');
  const total = useIssueCount(project.id);

  return (
    <header className={styles.header}>
      <h1 className={styles.name} dir="auto">
        {project.name}
      </h1>
      {open.isSuccess && total.isSuccess && (
        <p className={styles.meta}>
          {open.data} open · {total.data} total
        </p>
      )}
      {actions && <div className={styles.actions}>{actions}</div>}
    </header>
  );
}
