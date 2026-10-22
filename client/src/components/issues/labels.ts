import type { IssuePriority, IssueStatus } from '@taskforge/shared';

export const STATUS_LABELS: Record<IssueStatus, string> = {
  open: 'Open',
  in_progress: 'In progress',
  closed: 'Closed',
};

export const PRIORITY_LABELS: Record<IssuePriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};

export function formatIssueNumber(number: number): string {
  return `#${String(number)}`;
}
