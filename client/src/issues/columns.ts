// Which optional table columns a viewer has chosen to show. A per-browser preference, so localStorage.

import { useCallback, useState } from 'react';

export const OPTIONAL_COLUMNS = ['status', 'priority', 'createdAt'] as const;
export type OptionalColumn = (typeof OPTIONAL_COLUMNS)[number];
export type ColumnVisibility = Record<OptionalColumn, boolean>;

export const COLUMN_LABELS: Record<OptionalColumn, string> = {
  status: 'Status',
  priority: 'Priority',
  createdAt: 'Created',
};

const STORAGE_KEY = 'taskforge.columns';
const ALL_VISIBLE: ColumnVisibility = { status: true, priority: true, createdAt: true };

function read(): ColumnVisibility {
  try {
    const raw: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');
    if (typeof raw !== 'object' || raw === null) return ALL_VISIBLE;
    const stored = raw as Partial<Record<string, unknown>>;
    return Object.fromEntries(
      OPTIONAL_COLUMNS.map((column) => [column, stored[column] !== false]),
    ) as ColumnVisibility;
  } catch {
    return ALL_VISIBLE;
  }
}

export function useColumnVisibility() {
  const [visibility, setVisibility] = useState(read);

  const toggle = useCallback((column: OptionalColumn, visible: boolean) => {
    setVisibility((current) => {
      const next = { ...current, [column]: visible };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Unavailable storage only means the choice isn't remembered.
      }
      return next;
    });
  }, []);

  return [visibility, toggle] as const;
}
