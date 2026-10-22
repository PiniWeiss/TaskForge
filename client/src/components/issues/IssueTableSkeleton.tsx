import clsx from 'clsx';
import tableStyles from './IssueTable.module.css';
import styles from './IssueTableSkeleton.module.css';

// Title widths vary like real titles do, so the skeleton doesn't read as a striped pattern.
const TITLE_WIDTHS = [
  'w72',
  'w48',
  'w64',
  'w36',
  'w56',
  'w68',
  'w44',
  'w60',
  'w52',
  'w40',
] as const;

/** Same columns, row height and rules as the real table, so nothing jumps when data arrives. */
export function IssueTableSkeleton() {
  return (
    <table className={tableStyles.table} aria-busy="true" aria-label="Loading issues">
      <thead>
        <tr>
          <th scope="col" className={tableStyles.colNumber}>
            <span className={styles.head}>ID</span>
          </th>
          <th scope="col" className={tableStyles.colTitle}>
            <span className={styles.head}>Title</span>
          </th>
          <th scope="col" className={tableStyles.colStatus}>
            <span className={styles.head}>Status</span>
          </th>
          <th scope="col" className={tableStyles.colPriority}>
            <span className={styles.head}>Priority</span>
          </th>
          <th scope="col" className={tableStyles.colCreated}>
            <span className={styles.head}>Created</span>
          </th>
        </tr>
      </thead>
      <tbody>
        {TITLE_WIDTHS.map((width) => (
          <tr key={width}>
            <td className={tableStyles.colNumber}>
              <span className={clsx(styles.bar, styles.w60)} />
            </td>
            <td className={tableStyles.colTitle}>
              <span className={clsx(styles.bar, styles[width])} />
            </td>
            <td className={tableStyles.colStatus}>
              <span className={clsx(styles.bar, styles.w64)} />
            </td>
            <td className={tableStyles.colPriority}>
              <span className={clsx(styles.bar, styles.w56)} />
            </td>
            <td className={tableStyles.colCreated}>
              <span className={clsx(styles.bar, styles.w40, styles.end)} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
