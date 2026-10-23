import {
  ISSUE_PRIORITIES,
  ISSUE_STATUSES,
  type IssuePriority,
  type IssueStatus,
} from '@taskforge/shared';
import type { Ref } from 'react';
import {
  COLUMN_LABELS,
  OPTIONAL_COLUMNS,
  type ColumnVisibility,
  type OptionalColumn,
} from '../../issues/columns.ts';
import { hasFilters, type IssueViewState } from '../../issues/list-params.ts';
import { Button } from '../ui/Button.tsx';
import { MenuCheckboxItem, MenuContent, MenuLabel, MenuRoot, MenuTrigger } from '../ui/Menu.tsx';
import { Segmented } from '../ui/Segmented.tsx';
import { SelectMenu } from '../ui/SelectMenu.tsx';
import styles from './IssueToolbar.module.css';
import { PRIORITY_LABELS, STATUS_LABELS } from './labels.ts';
import { SearchField } from './SearchField.tsx';

type StatusChoice = IssueStatus | 'all';
type PriorityChoice = IssuePriority | 'any';

const STATUS_OPTIONS: { value: StatusChoice; label: string }[] = [
  { value: 'all', label: 'All' },
  ...ISSUE_STATUSES.map((status) => ({ value: status, label: STATUS_LABELS[status] })),
];

// Highest first: that's the order people scan for.
const PRIORITY_OPTIONS: { value: PriorityChoice; label: string }[] = [
  { value: 'any', label: 'Any' },
  ...[...ISSUE_PRIORITIES].reverse().map((p) => ({ value: p, label: PRIORITY_LABELS[p] })),
];

interface IssueToolbarProps {
  state: IssueViewState;
  onChange: (change: Partial<IssueViewState>, options?: { replace?: boolean }) => void;
  columnVisibility: ColumnVisibility;
  onToggleColumn: (column: OptionalColumn, visible: boolean) => void;
  searchRef?: Ref<HTMLInputElement>;
}

export function IssueToolbar({
  state,
  onChange,
  columnVisibility,
  onToggleColumn,
  searchRef,
}: IssueToolbarProps) {
  const onStatusChange = (value: StatusChoice) => {
    onChange({ status: value === 'all' ? undefined : value });
  };

  return (
    <div className={styles.toolbar} role="search">
      <SearchField
        ref={searchRef}
        value={state.q}
        onCommit={(q) => {
          onChange({ q }, { replace: true });
        }}
      />
      <div className={styles.filters}>
        {/* One of these is display:none at any width (container query), so only one is ever
            in the accessibility tree. */}
        <Segmented
          className={styles.roomy}
          legend="Status"
          options={STATUS_OPTIONS}
          value={state.status ?? 'all'}
          onChange={onStatusChange}
        />
        <SelectMenu
          className={styles.compact}
          label="Status"
          options={STATUS_OPTIONS}
          value={state.status ?? 'all'}
          onChange={onStatusChange}
        />
        <SelectMenu
          label="Priority"
          options={PRIORITY_OPTIONS}
          value={state.priority ?? 'any'}
          onChange={(value) => {
            onChange({ priority: value === 'any' ? undefined : value });
          }}
        />
        {hasFilters(state) && (
          <Button
            variant="quiet"
            onClick={() => {
              onChange({ status: undefined, priority: undefined, q: '' });
            }}
          >
            Clear
          </Button>
        )}
      </div>
      <MenuRoot>
        <MenuTrigger asChild>
          <Button variant="quiet" className={styles.columns}>
            Columns
          </Button>
        </MenuTrigger>
        <MenuContent>
          <MenuLabel>Show columns</MenuLabel>
          {OPTIONAL_COLUMNS.map((column) => (
            <MenuCheckboxItem
              key={column}
              checked={columnVisibility[column]}
              onCheckedChange={(checked) => {
                onToggleColumn(column, checked);
              }}
              // Keep the menu open so several columns can be toggled in a row.
              onSelect={(event) => {
                event.preventDefault();
              }}
            >
              {COLUMN_LABELS[column]}
            </MenuCheckboxItem>
          ))}
        </MenuContent>
      </MenuRoot>
    </div>
  );
}
