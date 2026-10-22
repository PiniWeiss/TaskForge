import type { Project } from '@taskforge/shared';
import { useIssues } from '../../api/issues.ts';
import type { ColumnVisibility } from '../../issues/columns.ts';
import { hasFilters, toListParams, type IssueViewState } from '../../issues/list-params.ts';
import { ErrorState } from '../ui/ErrorState.tsx';
import { IssuesEmpty } from './IssuesEmpty.tsx';
import styles from './IssuesPane.module.css';
import { IssueTable } from './IssueTable.tsx';
import { IssueTableFooter } from './IssueTableFooter.tsx';
import { IssueTableSkeleton } from './IssueTableSkeleton.tsx';

interface IssuesPaneProps {
  project: Project;
  state: IssueViewState;
  onSortChange: (sort: IssueViewState['sort']) => void;
  onPageChange: (page: number) => void;
  onClearFilters: () => void;
  onCreate?: () => void;
  columnVisibility: ColumnVisibility;
  selectedId?: string;
}

/** The scrolling table region: loading, error, empty, or the rows. */
export function IssuesPane({
  project,
  state,
  onSortChange,
  onPageChange,
  onClearFilters,
  onCreate,
  columnVisibility,
  selectedId,
}: IssuesPaneProps) {
  const issues = useIssues(project.id, toListParams(state));

  let content;
  let footer = null;
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
  } else if (
    issues.data.data.length === 0 &&
    !issues.isPlaceholderData &&
    issues.data.pagination.total > 0
  ) {
    // A stale ?page= beyond the last page.
    content = (
      <IssuesEmpty
        projectName={project.name}
        state={state}
        filtered={false}
        beyondLastPage
        onClearFilters={onClearFilters}
        onFirstPage={() => {
          onPageChange(1);
        }}
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
        selectedId={selectedId}
        stale={issues.isPlaceholderData}
      />
    );
    footer = (
      <IssueTableFooter
        total={issues.data.pagination.total}
        shown={issues.data.data.length}
        state={state}
        onPageChange={onPageChange}
      />
    );
  }

  return (
    <>
      <div className={styles.pane}>{content}</div>
      {footer}
    </>
  );
}
