import { describe, expect, it } from 'vitest';
import {
  DEFAULT_SORT,
  hasFilters,
  parseViewState,
  serializeViewState,
  toListParams,
} from '../../src/issues/list-params.ts';

function parse(query: string) {
  return parseViewState(new URLSearchParams(query));
}

describe('parseViewState', () => {
  it('defaults to every issue, newest first, page 1', () => {
    expect(parse('')).toEqual({
      status: undefined,
      priority: undefined,
      q: '',
      sort: DEFAULT_SORT,
      page: 1,
    });
  });

  it('reads filters, search, sort and page', () => {
    expect(parse('status=in_progress&priority=HIGH&q=%20refund%20&sort=-priority&page=3')).toEqual({
      status: 'in_progress',
      priority: 'high',
      q: 'refund',
      sort: { field: 'priority', dir: 'desc' },
      page: 3,
    });
    expect(parse('sort=number').sort).toEqual({ field: 'number', dir: 'asc' });
  });

  it('falls back to defaults for values it does not understand', () => {
    expect(parse('status=done&priority=urgent&sort=-assignee&page=-2')).toEqual(parse(''));
    expect(parse('page=1.5').page).toBe(1);
  });
});

describe('serializeViewState', () => {
  it('omits defaults so the plain URL stays clean', () => {
    expect(serializeViewState(parse('')).toString()).toBe('');
  });

  it('round-trips every non-default value', () => {
    const query = 'status=closed&priority=low&q=csv+export&sort=title&page=2';
    expect(serializeViewState(parse(query)).toString()).toBe(query);
  });
});

describe('hasFilters', () => {
  it('counts status, priority and search but not sort or page', () => {
    expect(hasFilters(parse('sort=title&page=2'))).toBe(false);
    expect(hasFilters(parse('q=x'))).toBe(true);
    expect(hasFilters(parse('priority=high'))).toBe(true);
  });
});

describe('toListParams', () => {
  it('converts the page to an offset of 100-issue pages and drops an empty search', () => {
    expect(toListParams(parse('page=3&status=open'))).toEqual({
      status: 'open',
      priority: undefined,
      q: undefined,
      sort: DEFAULT_SORT,
      offset: 200,
    });
  });
});
