import type { Project } from '@taskforge/shared';
import { useIssues } from '../../api/issues.ts';
import type { ColumnVisibility } from '../../issues/columns.ts';
import { hasFilters, toListParams, type IssueViewState } from '../../issues/list-params.ts';
import { ErrorState } from '../ui/ErrorState.tsx';
import { IssuesEmpty } from './IssuesEmpty.tsx';
import styles from './IssuesPane.module.css';
import { IssueTable } from './IssueTable.tsx';
import { IssueTableSkeleton } from './IssueTableSkeleton.tsx';

interface IssuesPaneProps {
  project: Project;
  state: IssueViewState;
  onSortChange: (sort: IssueViewState['sort']) => void;
  onClearFilters: () => void;
  onCreate?: () => void;
  columnVisibility: ColumnVisibility;
}

/** The scrolling table region: loading, error, empty, or the rows. */
export function IssuesPane({
  project,
  state,
  onSortChange,
  onClearFilters,
  onCreate,
  columnVisibility,
}: IssuesPaneProps) {
  const issues = useIssues(project.id, toListParams(state));

  let content;
  if (issues.isPending) {
    content = <IssueTableSkeleton />;
  } else if (issues.isError) {
    content = (
      <ErrorState
        title="Couldn’t load issues."
        error={issues.error}
        onRetry={() => void issues.refetch()}
      />
    );
  } else if (issues.data.data.length === 0 && !issues.isPlaceholderData) {
    content = (
      <IssuesEmpty
        projectName={project.name}
        state={state}
        filtered={hasFilters(state)}
        onClearFilters={onClearFilters}
        onCreate={onCreate}
      />
    );
  } else {
    content = (
      <IssueTable
        projectId={project.id}
        issues={issues.data.data}
        sort={state.sort}
        onSortChange={onSortChange}
        columnVisibility={columnVisibility}
        stale={issues.isPlaceholderData}
      />
    );
  }

  return <div className={styles.pane}>{content}</div>;
}
