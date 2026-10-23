import { useRef, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate, useParams } from 'react-router';
import { useIssues } from '../api/issues.ts';
import { useProjects } from '../api/projects.ts';
import { paths } from '../app/paths.ts';
import { IssuesPane } from '../components/issues/IssuesPane.tsx';
import { IssueToolbar } from '../components/issues/IssueToolbar.tsx';
import { QuickAdd } from '../components/issues/QuickAdd.tsx';
import { ProjectHeader } from '../components/projects/ProjectHeader.tsx';
import { Button } from '../components/ui/Button.tsx';
import { ErrorState } from '../components/ui/ErrorState.tsx';
import { IconPlus } from '../components/ui/icons.tsx';
import { Kbd } from '../components/ui/Kbd.tsx';
import { useHotkeys } from '../hooks/useHotkeys.ts';
import { useColumnVisibility } from '../issues/columns.ts';
import { toListParams } from '../issues/list-params.ts';
import { useIssueViewState } from '../issues/useIssueViewState.ts';
import { useRowCursor } from '../issues/useRowCursor.ts';
import type { ProjectOutletContext } from './IssueRoute.tsx';
import styles from './ProjectView.module.css';

export function ProjectView() {
  const { projectId = '', issueId } = useParams();
  const { search } = useLocation();
  const navigate = useNavigate();
  const projects = useProjects();
  const [viewState, updateView] = useIssueViewState();
  const [columnVisibility, toggleColumn] = useColumnVisibility();
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  // Same query as the table (deduplicated by React Query); the keyboard needs the row order.
  const issues = useIssues(projectId, toListParams(viewState));
  const rowIds = issues.data?.data.map((issue) => issue.id) ?? [];
  const cursor = useRowCursor(rowIds, issueId);

  const openQuickAdd = () => {
    setQuickAddOpen(true);
  };
  const openIssue = (id: string, replace = false) => {
    void navigate(paths.issue(projectId, id, search), { replace });
  };
  /** Moves the cursor and real focus to a row, so screen readers follow along. */
  const focusRow = (id: string) => {
    cursor.setCursorId(id);
    requestAnimationFrame(() => {
      const link = document.querySelector<HTMLElement>(`tr[data-issue-id="${id}"] a`);
      link?.focus({ preventScroll: true });
      link?.closest('tr')?.scrollIntoView({ block: 'nearest' });
    });
  };
  const move = (delta: 1 | -1) => {
    const next = cursor.step(delta);
    if (!next) return;
    // With the panel open, J/K page through issues in place instead of stacking history.
    if (issueId) openIssue(next, true);
    else focusRow(next);
  };

  useHotkeys({
    c: () => {
      if (!quickAddOpen) openQuickAdd();
    },
    j: () => {
      move(1);
    },
    k: () => {
      move(-1);
    },
    Enter: (event) => {
      // A focused link or button already handles Enter itself.
      if (event.target instanceof HTMLElement && event.target.closest('a, button')) return false;
      if (!cursor.cursorId || issueId) return false;
      openIssue(cursor.cursorId);
      return undefined;
    },
    '/': () => {
      searchRef.current?.focus();
      searchRef.current?.select();
    },
  });

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
      const closing = issueId;
      void navigate(paths.project(project.id, search));
      if (closing) focusRow(closing);
    },
  };

  return (
    <div className={styles.layout}>
      <div className={styles.view}>
        <ProjectHeader
          project={project}
          actions={
            <Button variant="primary" onClick={openQuickAdd} aria-keyshortcuts="c">
              <IconPlus /> New issue <Kbd className={styles.kbdOnSignal}>C</Kbd>
            </Button>
          }
        />
        <IssueToolbar
          state={viewState}
          onChange={updateView}
          columnVisibility={columnVisibility}
          onToggleColumn={toggleColumn}
          searchRef={searchRef}
        />
        {quickAddOpen && (
          <QuickAdd
            projectId={project.id}
            onClose={() => {
              setQuickAddOpen(false);
            }}
            onOpenIssue={(issue) => {
              void navigate(paths.issue(project.id, issue.id, search));
            }}
          />
        )}
        <IssuesPane
          project={project}
          state={viewState}
          columnVisibility={columnVisibility}
          selectedId={issueId}
          cursorId={cursor.cursorId}
          onCursorChange={cursor.setCursorId}
          onCreate={openQuickAdd}
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
