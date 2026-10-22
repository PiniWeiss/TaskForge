import * as VisuallyHidden from '@radix-ui/react-visually-hidden';
import type { Project } from '@taskforge/shared';
import clsx from 'clsx';
import { NavLink } from 'react-router';
import { useIssueCount } from '../../api/projects.ts';
import { paths } from '../../app/paths.ts';
import styles from './ProjectItem.module.css';

interface ProjectItemProps {
  project: Project;
  onNavigate: () => void;
}

export function ProjectItem({ project, onNavigate }: ProjectItemProps) {
  const openCount = useIssueCount(project.id, 'open');

  return (
    <li className={styles.item}>
      <NavLink
        to={paths.project(project.id)}
        className={({ isActive }) => clsx(styles.link, isActive && styles.active)}
        onClick={onNavigate}
      >
        <span className={styles.name} dir="auto">
          {project.name}
        </span>
        {openCount.isSuccess && (
          <span className={styles.count} title={`${String(openCount.data)} open`}>
            {openCount.data}
            <VisuallyHidden.Root> open</VisuallyHidden.Root>
          </span>
        )}
      </NavLink>
    </li>
  );
}
