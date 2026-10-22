import { useState } from 'react';

/**
 * The keyboard cursor over table rows. While the panel shows an issue, the cursor is that issue,
 * so J/K walk through issues in the panel instead.
 */
export function useRowCursor(rowIds: readonly string[], openId: string | undefined) {
  const [cursorId, setCursorId] = useState<string | undefined>(undefined);
  const current =
    openId ?? (cursorId !== undefined && rowIds.includes(cursorId) ? cursorId : undefined);

  function step(delta: 1 | -1): string | undefined {
    if (rowIds.length === 0) return undefined;
    const index = current === undefined ? -1 : rowIds.indexOf(current);
    const next =
      index === -1
        ? delta === 1
          ? rowIds[0]
          : rowIds[rowIds.length - 1]
        : rowIds[Math.min(rowIds.length - 1, Math.max(0, index + delta))];
    return next;
  }

  return { cursorId: current, setCursorId, step };
}
