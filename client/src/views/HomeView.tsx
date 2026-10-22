import { Navigate } from 'react-router';
import { useProjects } from '../api/projects.ts';
import { paths } from '../app/paths.ts';
import { ErrorState } from '../components/ui/ErrorState.tsx';
import styles from './HomeView.module.css';

/** `/` opens the first project. With no projects yet, it explains where to start. */
export function HomeView() {
  const projects = useProjects();

  if (projects.isPending) return null;
  if (projects.isError) {
    return (
      <ErrorState
        title="Couldn’t load projects."
        error={projects.error}
        onRetry={() => void projects.refetch()}
      />
    );
  }

  const [first] = projects.data;
  if (first) return <Navigate to={paths.project(first.id)} replace />;

  return (
    <div className={styles.home}>
      <h1 className={styles.title}>No projects yet</h1>
      <p className={styles.message}>
        A project holds the issues for one codebase or team. Name your first one under Projects in
        the sidebar, for example “Payments” or “Web app”.
      </p>
    </div>
  );
}
