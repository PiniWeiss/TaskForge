import { Link, Outlet, useLocation, useNavigate, useParams } from 'react-router';
import { useProjects } from '../api/projects.ts';
import { paths } from '../app/paths.ts';
import { useColumnVisibility } from '../issues/columns.ts';
import { useIssueViewState } from '../issues/useIssueViewState.ts';
import { IssuesPane } from '../components/issues/IssuesPane.tsx';
import { IssueToolbar } from '../components/issues/IssueToolbar.tsx';
import { ProjectHeader } from '../components/projects/ProjectHeader.tsx';
import { ErrorState } from '../components/ui/ErrorState.tsx';
import type { ProjectOutletContext } from './IssueRoute.tsx';
import styles from './ProjectView.module.css';

export function ProjectView() {
  const { projectId = '', issueId } = useParams();
  const { search } = useLocation();
  const navigate = useNavigate();
  const projects = useProjects();
  const [viewState, updateView] = useIssueViewState();
  const [columnVisibility, toggleColumn] = useColumnVisibility();

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

  const outletContext: ProjectOutletContext = {
    project,
    closePanel: () => {
      void navigate(paths.project(project.id, search));
    },
  };

  return (
    <div className={styles.layout}>
      <div className={styles.view}>
        <ProjectHeader project={project} />
        <IssueToolbar
          state={viewState}
          onChange={updateView}
          columnVisibility={columnVisibility}
          onToggleColumn={toggleColumn}
        />
        <IssuesPane
          project={project}
          state={viewState}
          columnVisibility={columnVisibility}
          selectedId={issueId}
          onSortChange={(sort) => {
            updateView({ sort });
          }}
          onPageChange={(page) => {
            updateView({ page });
          }}
          onClearFilters={() => {
            updateView({ status: undefined, priority: undefined, q: '' });
          }}
        />
      </div>
      <Outlet context={outletContext} />
    </div>
  );
}
