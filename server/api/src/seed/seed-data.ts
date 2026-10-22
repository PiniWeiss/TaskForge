// Demo data: three projects of a small product team, with issues spread over the last two months.

import type { IssuePriority, IssueStatus } from '@taskforge/shared';

export interface SeedIssue {
  title: string;
  status: IssueStatus;
  priority: IssuePriority;
  /** How long before the seed run the issue was filed, in hours. */
  ageHours: number;
  /** Hours after filing that it was last touched. */
  touchedAfterHours?: number;
  description?: string;
}

export interface SeedProject {
  name: string;
  description: string;
  issues: SeedIssue[];
}

const DAY = 24;

export const SEED_PROJECTS: SeedProject[] = [
  {
    name: 'Payments',
    description: 'Billing, invoices, refunds and payouts.',
    issues: [
      {
        title: 'Proration is off by one day across DST changes',
        status: 'closed',
        priority: 'high',
        ageHours: 58 * DAY,
        touchedAfterHours: 3 * DAY,
        description:
          'Plans upgraded on the night clocks change are charged for one extra day.\n\nWe compute the period in local time and then convert; do it in UTC end to end.',
      },
      {
        title: 'Add idempotency keys to payout creation',
        status: 'closed',
        priority: 'high',
        ageHours: 52 * DAY,
        touchedAfterHours: 6 * DAY,
      },
      {
        title: 'Tax ID field accepts trailing whitespace',
        status: 'closed',
        priority: 'low',
        ageHours: 47 * DAY,
        touchedAfterHours: DAY,
      },
      {
        title: 'Move currency rounding into the ledger service',
        status: 'in_progress',
        priority: 'medium',
        ageHours: 41 * DAY,
        touchedAfterHours: 30 * DAY,
      },
      {
        title: 'Drop the legacy /v1/charges endpoint',
        status: 'open',
        priority: 'low',
        ageHours: 37 * DAY,
      },
      {
        title: 'Dunning emails ignore the customer locale',
        status: 'open',
        priority: 'medium',
        ageHours: 30 * DAY,
        description:
          'Customers with locale he-IL still get the English reminder sequence. The template lookup falls back before it checks the account locale.',
      },
      {
        title: 'Show the card brand on the invoice PDF',
        status: 'closed',
        priority: 'low',
        ageHours: 26 * DAY,
        touchedAfterHours: 2 * DAY,
      },
      {
        title: 'Retry failed SEPA debits on the next business day, not the next day',
        status: 'open',
        priority: 'medium',
        ageHours: 21 * DAY,
      },
      {
        title: 'Coupons stack when applied from two tabs',
        status: 'in_progress',
        priority: 'high',
        ageHours: 16 * DAY,
        touchedAfterHours: 12 * DAY,
      },
      {
        title: 'חשבונית PDF מציגה שמות לקוח בעברית הפוך',
        status: 'in_progress',
        priority: 'high',
        ageHours: 9 * DAY,
        touchedAfterHours: 7 * DAY,
        description:
          'בלקוחות עם שם בעברית, השם מודפס משמאל לימין בחשבונית.\nקורה רק בתבנית invoice-v2; התבנית הישנה תקינה.',
      },
      {
        title: 'Export CSV drops the currency column',
        status: 'open',
        priority: 'medium',
        ageHours: 6 * DAY,
      },
      {
        title: 'Payout schedule page times out for accounts with 5k+ payouts',
        status: 'open',
        priority: 'medium',
        ageHours: 4 * DAY,
      },
      {
        title: 'Refund webhook retries forever on 409',
        status: 'open',
        priority: 'high',
        ageHours: 26,
        description:
          'Stripe answers 409 when a refund with the same idempotency key already exists. The worker treats that as a failure and retries every 30 s, forever.\n\nExpected: treat 409 as success and mark the refund settled.\nSeen on 41 refunds since Tuesday.',
      },
      {
        title: 'Webhook signature check fails when the body has a BOM',
        status: 'open',
        priority: 'high',
        ageHours: 5,
      },
      {
        title: 'Document the refund states for support',
        status: 'open',
        priority: 'low',
        ageHours: 2,
      },
    ],
  },
  {
    name: 'Web app',
    description: 'The customer-facing dashboard.',
    issues: [
      {
        title: 'Date picker opens off-screen on small laptops',
        status: 'closed',
        priority: 'medium',
        ageHours: 55 * DAY,
        touchedAfterHours: 4 * DAY,
      },
      {
        title: 'Replace the moment.js formatting with Intl',
        status: 'closed',
        priority: 'low',
        ageHours: 49 * DAY,
        touchedAfterHours: 20 * DAY,
      },
      {
        title: 'Session expires silently while a form is open',
        status: 'closed',
        priority: 'high',
        ageHours: 44 * DAY,
        touchedAfterHours: 2 * DAY,
      },
      {
        title: 'Settings page loads every team member just to count them',
        status: 'in_progress',
        priority: 'medium',
        ageHours: 33 * DAY,
        touchedAfterHours: 25 * DAY,
      },
      {
        title: 'Table header scrolls away on the usage page',
        status: 'open',
        priority: 'low',
        ageHours: 28 * DAY,
        description:
          'The header should stick to the top of the scroll container, like the invoices table.',
      },
      {
        title: 'Focus is lost after closing the invite dialog',
        status: 'open',
        priority: 'medium',
        ageHours: 24 * DAY,
      },
      {
        title: 'Dark mode: chart gridlines are invisible',
        status: 'closed',
        priority: 'low',
        ageHours: 19 * DAY,
        touchedAfterHours: DAY,
      },
      {
        title: 'Right-to-left layout breaks the breadcrumb separators',
        status: 'open',
        priority: 'medium',
        ageHours: 14 * DAY,
      },
      {
        title: 'Upgrade to React Router 7 data APIs',
        status: 'in_progress',
        priority: 'medium',
        ageHours: 11 * DAY,
        touchedAfterHours: 9 * DAY,
      },
      {
        title: 'Search returns stale results after renaming a project',
        status: 'open',
        priority: 'high',
        ageHours: 7 * DAY,
        description:
          'Rename a project, then search for the new name: no results until a hard refresh. The search cache key does not include the project version.',
      },
      {
        title: 'Bundle size grew 140 kB after the charts update',
        status: 'open',
        priority: 'medium',
        ageHours: 3 * DAY,
      },
      {
        title: 'Copy link button gives no feedback',
        status: 'open',
        priority: 'low',
        ageHours: 40,
      },
      {
        title: 'Avatar uploads over 2 MB fail without an error',
        status: 'open',
        priority: 'high',
        ageHours: 9,
      },
      {
        title: 'Keyboard shortcut "?" conflicts with Hebrew keyboard layouts',
        status: 'open',
        priority: 'low',
        ageHours: 1,
      },
    ],
  },
  {
    name: 'Infrastructure',
    description: 'CI, deploys, databases and observability.',
    issues: [
      {
        title: 'Postgres 15 → 16 upgrade on the primary cluster',
        status: 'closed',
        priority: 'high',
        ageHours: 59 * DAY,
        touchedAfterHours: 14 * DAY,
      },
      {
        title: 'CI cache misses on every dependency bump',
        status: 'closed',
        priority: 'medium',
        ageHours: 50 * DAY,
        touchedAfterHours: 5 * DAY,
      },
      {
        title: 'Rotate the staging database credentials',
        status: 'closed',
        priority: 'medium',
        ageHours: 43 * DAY,
        touchedAfterHours: DAY,
      },
      {
        title: 'Nightly backup job overlaps with the reporting ETL',
        status: 'in_progress',
        priority: 'high',
        ageHours: 35 * DAY,
        touchedAfterHours: 33 * DAY,
        description:
          'Both start at 02:00 UTC and fight for IO; the backup has run past 06:00 three times this month. Move the ETL to 04:00 or give the backup its own replica.',
      },
      {
        title: 'Alert on queue depth, not on worker CPU',
        status: 'open',
        priority: 'medium',
        ageHours: 27 * DAY,
      },
      {
        title: 'Preview environments are not torn down after merge',
        status: 'open',
        priority: 'medium',
        ageHours: 20 * DAY,
      },
      {
        title: 'Pin the base image digest in every Dockerfile',
        status: 'closed',
        priority: 'low',
        ageHours: 15 * DAY,
        touchedAfterHours: 2 * DAY,
      },
      {
        title: 'Log lines over 16 kB are split by the collector',
        status: 'open',
        priority: 'low',
        ageHours: 10 * DAY,
      },
      {
        title: 'Deploys hang when a migration takes a table lock',
        status: 'in_progress',
        priority: 'high',
        ageHours: 5 * DAY,
        touchedAfterHours: 4 * DAY,
      },
      {
        title: 'TLS certificate for status page expires in 21 days',
        status: 'open',
        priority: 'high',
        ageHours: 50,
      },
      {
        title: 'Flaky e2e: checkout spec times out on CI only',
        status: 'open',
        priority: 'medium',
        ageHours: 20,
      },
      {
        title: 'Grafana dashboard for p95 API latency per route',
        status: 'open',
        priority: 'low',
        ageHours: 3,
      },
    ],
  },
];
