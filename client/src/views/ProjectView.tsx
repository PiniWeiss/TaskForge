import { Link, useParams } from 'react-router';
import { useProjects } from '../api/projects.ts';
import { paths } from '../app/paths.ts';
import { ProjectHeader } from '../components/projects/ProjectHeader.tsx';
import { ErrorState } from '../components/ui/ErrorState.tsx';
import styles from './ProjectView.module.css';

export function ProjectView() {
  const { projectId = '' } = useParams();
  const projects = useProjects();

  if (projects.isPending) return null;
  if (projects.isError) {
    return (
      <ErrorState
        title="Couldn’t load this project."
        error={projects.error}
        onRetry={() => void projects.refetch()}
      />
    );
  }

  const project = projects.data.find((p) => p.id === projectId);
  if (!project) {
    return (
      <div className={styles.missing}>
        <h1 className={styles.missingTitle}>This project doesn’t exist</h1>
        <p className={styles.missingText}>
          It may have been deleted, or the link is wrong.{' '}
          <Link to={paths.home()}>Open your first project</Link>.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.view}>
      <ProjectHeader project={project} />
    </div>
  );
}
