import clsx from 'clsx';
import { useProjects } from '../../api/projects.ts';
import { ErrorState } from '../ui/ErrorState.tsx';
import { ProjectItem } from './ProjectItem.tsx';
import styles from './ProjectList.module.css';

interface ProjectListProps {
  onNavigate: () => void;
}

const SKELETON_ROWS = ['wide', 'short', 'medium'] as const;

export function ProjectList({ onNavigate }: ProjectListProps) {
  const projects = useProjects();

  if (projects.isPending) {
    return (
      <ul className={styles.list} aria-busy="true" aria-label="Loading projects">
        {SKELETON_ROWS.map((width) => (
          <li key={width} className={styles.skeletonRow}>
            <span className={clsx(styles.skeletonBar, styles[width])} />
          </li>
        ))}
      </ul>
    );
  }

  if (projects.isError) {
    return (
      <ErrorState
        compact
        title="Couldn’t load projects."
        error={projects.error}
        onRetry={() => void projects.refetch()}
      />
    );
  }

  return (
    <ul className={styles.list}>
      {projects.data.map((project) => (
        <ProjectItem key={project.id} project={project} onNavigate={onNavigate} />
      ))}
    </ul>
  );
}
