import type { Issue, IssueSortField } from '@taskforge/shared';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  type SortingState,
} from '@tanstack/react-table';
import clsx from 'clsx';
import { useMemo, type MouseEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { paths } from '../../app/paths.ts';
import type { ColumnVisibility } from '../../issues/columns.ts';
import type { IssueViewState } from '../../issues/list-params.ts';
import { IconArrowDown, IconArrowUp } from '../ui/icons.tsx';
import { RelativeTime } from '../ui/RelativeTime.tsx';
import styles from './IssueTable.module.css';
import { formatIssueNumber } from './labels.ts';
import { PriorityLabel } from './PriorityLabel.tsx';
import { StatusLabel } from './StatusLabel.tsx';

interface ColumnMeta {
  className: string | undefined;
}

const column = createColumnHelper<Issue>();

function buildColumns(projectId: string, search: string) {
  return [
    column.accessor('number', {
      id: 'number',
      header: 'ID',
      sortDescFirst: true,
      cell: (info) => formatIssueNumber(info.getValue()),
      meta: { className: styles.colNumber } satisfies ColumnMeta,
    }),
    column.accessor('title', {
      id: 'title',
      header: 'Title',
      sortDescFirst: false,
      cell: (info) => (
        <Link
          className={styles.titleLink}
          to={paths.issue(projectId, info.row.original.id, search)}
          dir="auto"
        >
          {info.getValue()}
        </Link>
      ),
      meta: { className: styles.colTitle } satisfies ColumnMeta,
    }),
    column.accessor('status', {
      id: 'status',
      header: 'Status',
      sortDescFirst: false,
      cell: (info) => <StatusLabel status={info.getValue()} compactOnNarrow />,
      meta: { className: styles.colStatus } satisfies ColumnMeta,
    }),
    column.accessor('priority', {
      id: 'priority',
      header: 'Priority',
      sortDescFirst: true,
      cell: (info) => <PriorityLabel priority={info.getValue()} />,
      meta: { className: styles.colPriority } satisfies ColumnMeta,
    }),
    column.accessor('createdAt', {
      id: 'createdAt',
      header: 'Created',
      sortDescFirst: true,
      cell: (info) => <RelativeTime iso={info.getValue()} />,
      meta: { className: styles.colCreated } satisfies ColumnMeta,
    }),
  ];
}

function metaOf(meta: unknown): ColumnMeta | undefined {
  return typeof meta === 'object' && meta !== null && 'className' in meta
    ? (meta as ColumnMeta)
    : undefined;
}

interface IssueTableProps {
  projectId: string;
  issues: Issue[];
  sort: IssueViewState['sort'];
  onSortChange: (sort: IssueViewState['sort']) => void;
  columnVisibility: ColumnVisibility;
  /** The row the keyboard cursor is on, if any. */
  cursorId?: string;
  /** Issue open in the detail panel, if any. */
  selectedId?: string;
  /** True while a new view is loading over the previous rows. */
  stale?: boolean;
  /** Focus landing in a row (Tab, click) moves the keyboard cursor there. */
  onCursorChange?: (issueId: string) => void;
}

export function IssueTable({
  projectId,
  issues,
  sort,
  onSortChange,
  columnVisibility,
  cursorId,
  selectedId,
  stale = false,
  onCursorChange,
}: IssueTableProps) {
  const { search } = useLocation();
  const navigate = useNavigate();
  const columns = useMemo(() => buildColumns(projectId, search), [projectId, search]);
  const sorting: SortingState = [{ id: sort.field, desc: sort.dir === 'desc' }];

  // TanStack Table returns a mutable instance the React Compiler can't memoize; it opts this
  // component out of auto-memoization, which is fine for one table per page.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: issues,
    columns,
    getRowId: (issue) => issue.id,
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
    enableMultiSort: false,
    enableSortingRemoval: false,
    state: { sorting, columnVisibility },
    onSortingChange: (updater) => {
      const next = typeof updater === 'function' ? updater(sorting) : updater;
      const [first] = next;
      if (first)
        onSortChange({ field: first.id as IssueSortField, dir: first.desc ? 'desc' : 'asc' });
    },
  });

  function openRow(event: MouseEvent<HTMLTableRowElement>, issueId: string) {
    // The title link handles its own clicks (and modifier-clicks into new tabs).
    if (event.target instanceof Element && event.target.closest('a')) return;
    void navigate(paths.issue(projectId, issueId, search));
  }

  return (
    <table className={clsx(styles.table, stale && styles.stale)} aria-busy={stale}>
      <thead>
        {table.getHeaderGroups().map((group) => (
          <tr key={group.id}>
            {group.headers.map((header) => {
              const sorted = header.column.getIsSorted();
              return (
                <th
                  key={header.id}
                  scope="col"
                  className={metaOf(header.column.columnDef.meta)?.className}
                  aria-sort={
                    sorted === 'asc' ? 'ascending' : sorted === 'desc' ? 'descending' : undefined
                  }
                >
                  <button
                    type="button"
                    className={clsx(styles.sortButton, sorted && styles.sorted)}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    {sorted === 'asc' && <IconArrowUp width={12} height={12} />}
                    {sorted === 'desc' && <IconArrowDown width={12} height={12} />}
                  </button>
                </th>
              );
            })}
          </tr>
        ))}
      </thead>
      <tbody>
        {table.getRowModel().rows.map((row) => (
          <tr
            key={row.id}
            data-issue-id={row.id}
            className={clsx(
              styles.row,
              row.id === cursorId && styles.cursor,
              row.id === selectedId && styles.selected,
            )}
            aria-current={row.id === selectedId ? 'true' : undefined}
            onClick={(event) => {
              openRow(event, row.id);
            }}
            onFocus={() => {
              onCursorChange?.(row.id);
            }}
          >
            {row.getVisibleCells().map((cell) => (
              <td key={cell.id} className={metaOf(cell.column.columnDef.meta)?.className}>
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
