// Development-only design reference: the tokens and core pieces rendered together on one page.
// Registered only when import.meta.env.DEV is true; never shipped in the production bundle's routes.

import type { IssuePriority, IssueStatus } from '@taskforge/shared';
import clsx from 'clsx';
import { PriorityLabel } from '../components/issues/PriorityLabel.tsx';
import { StatusLabel } from '../components/issues/StatusLabel.tsx';
import { Button } from '../components/ui/Button.tsx';
import { IconArrowDown, IconPlus, IconSearch } from '../components/ui/icons.tsx';
import { Kbd } from '../components/ui/Kbd.tsx';
import styles from './Specimen.module.css';

interface Row {
  number: number;
  title: string;
  status: IssueStatus;
  priority: IssuePriority;
  created: string;
}

const ROWS: Row[] = [
  {
    number: 41,
    title: 'Refund webhook retries forever on 409 from Stripe',
    status: 'open',
    priority: 'high',
    created: '2h',
  },
  {
    number: 40,
    title: 'Invoice PDF renders Hebrew customer names left-to-right',
    status: 'in_progress',
    priority: 'high',
    created: '5h',
  },
  {
    number: 38,
    title: 'Move currency rounding into the ledger service',
    status: 'in_progress',
    priority: 'medium',
    created: '1d',
  },
  {
    number: 37,
    title: 'Dunning emails ignore the customer locale',
    status: 'open',
    priority: 'medium',
    created: '2d',
  },
  {
    number: 35,
    title: 'Drop the legacy /v1/charges endpoint',
    status: 'open',
    priority: 'low',
    created: '4d',
  },
  {
    number: 34,
    title: 'Proration is off by one day across DST changes',
    status: 'closed',
    priority: 'high',
    created: '6d',
  },
  {
    number: 31,
    title: 'Add idempotency keys to payout creation',
    status: 'closed',
    priority: 'medium',
    created: '9d',
  },
  {
    number: 29,
    title: 'Tax ID field accepts trailing whitespace',
    status: 'closed',
    priority: 'low',
    created: '12d',
  },
];

const SWATCHES = [
  'paper',
  'paper-2',
  'paper-hover',
  'ink',
  'ink-2',
  'ink-3',
  'rule',
  'rule-strong',
  'signal',
  'signal-wash',
  'status-open',
  'status-progress',
  'status-closed',
] as const;

const TYPE_SCALE = [
  { token: 'head', sample: 'Payments' },
  { token: 'title', sample: 'Refund webhook retries forever on 409 from Stripe' },
  {
    token: 'read',
    sample: 'Stripe returns 409 when the refund already exists; we should treat it as success.',
  },
  { token: 'body', sample: 'Move currency rounding into the ledger service' },
  { token: 'meta', sample: 'Opened 2 hours ago · updated 14 minutes ago' },
  { token: 'micro', sample: 'STATUS  PRIORITY  CREATED' },
] as const;

export function Specimen() {
  return (
    <div className={styles.page}>
      <header className={styles.projectBar}>
        <h1 className={styles.projectName}>Payments</h1>
        <span className={styles.projectMeta}>14 open · 3 in progress</span>
        <Button variant="primary" className={styles.newIssue}>
          <IconPlus /> New issue <Kbd className={styles.kbdOnSignal}>C</Kbd>
        </Button>
      </header>

      <div className={styles.toolbar}>
        <label className={styles.search}>
          <IconSearch />
          <input placeholder="Search titles or #number" aria-label="Search issues" />
          <Kbd>/</Kbd>
        </label>
        <div className={styles.segmented} role="group" aria-label="Status">
          <button type="button" aria-pressed="true">
            All
          </button>
          <button type="button" aria-pressed="false">
            Open
          </button>
          <button type="button" aria-pressed="false">
            In progress
          </button>
          <button type="button" aria-pressed="false">
            Closed
          </button>
        </div>
        <button type="button" className={styles.select}>
          Priority: any
        </button>
      </div>

      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.colNumber}>ID</th>
            <th>Title</th>
            <th className={styles.colStatus}>Status</th>
            <th className={styles.colPriority}>Priority</th>
            <th className={clsx(styles.colCreated, styles.sorted)}>
              Created <IconArrowDown width={12} height={12} />
            </th>
          </tr>
        </thead>
        <tbody>
          {ROWS.map((row, index) => (
            <tr key={row.number} className={clsx(index === 1 && styles.cursor)}>
              <td className={styles.colNumber}>#{row.number}</td>
              <td className={styles.title}>{row.title}</td>
              <td>
                <StatusLabel status={row.status} />
              </td>
              <td>
                <PriorityLabel priority={row.priority} />
              </td>
              <td className={styles.colCreated}>{row.created}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className={styles.tableFoot}>8 of 41 · sorted by created, newest first</p>

      <section className={styles.section}>
        <h2 className={styles.sectionLabel}>Color</h2>
        <ul className={styles.swatches}>
          {SWATCHES.map((name) => (
            <li key={name} className={styles.swatch}>
              <span className={clsx(styles.chip, styles[`chip-${name}`])} />
              <code>--{name}</code>
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionLabel}>Type</h2>
        <dl className={styles.typeScale}>
          {TYPE_SCALE.map(({ token, sample }) => (
            <div key={token} className={styles.typeRow}>
              <dt>--text-{token}</dt>
              <dd className={styles[`type-${token}`]}>{sample}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionLabel}>Controls</h2>
        <div className={styles.controls}>
          <Button variant="primary">Create issue</Button>
          <Button>Rename</Button>
          <Button variant="quiet">Cancel</Button>
          <Button variant="danger">Delete project</Button>
          <input className={styles.field} defaultValue="Payments" aria-label="Project name" />
          <span className={styles.inlineError} role="status">
            Couldn&apos;t save. A project named &quot;Payments&quot; already exists.
          </span>
        </div>
      </section>
    </div>
  );
}
