import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router';
import { parseViewState, serializeViewState, type IssueViewState } from './list-params.ts';

type ViewChange = Partial<Omit<IssueViewState, 'page'>> & { page?: number };

/**
 * The table's filters, search, sort and page, read from and written to the URL.
 * Any change other than the page itself goes back to page 1.
 */
export function useIssueViewState() {
  const [searchParams, setSearchParams] = useSearchParams();
  const state = useMemo(() => parseViewState(searchParams), [searchParams]);

  const update = useCallback(
    (change: ViewChange, options: { replace?: boolean } = {}) => {
      setSearchParams(
        (current) => {
          const previous = parseViewState(current);
          const next: IssueViewState = { ...previous, page: 1, ...change };
          return serializeViewState(next);
        },
        // Apply synchronously so controls (radios, selects) never flash their previous value
        // while the navigation is pending.
        { replace: options.replace ?? false, flushSync: true },
      );
    },
    [setSearchParams],
  );

  return [state, update] as const;
}
