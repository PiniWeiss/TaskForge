import * as Tooltip from '@radix-ui/react-tooltip';
import { useNow } from '../../hooks/useNow.ts';
import { formatAbsolute, formatRelative } from '../../lib/time.ts';
import styles from './RelativeTime.module.css';

interface RelativeTimeProps {
  iso: string;
  style?: 'short' | 'long';
  className?: string;
}

/** Relative time, with the exact time in a tooltip and in the machine-readable dateTime. */
export function RelativeTime({ iso, style = 'short', className }: RelativeTimeProps) {
  const now = useNow();
  const exact = formatAbsolute(iso);

  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>
        <time dateTime={iso} className={className}>
          {formatRelative(iso, now, style)}
        </time>
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content className={styles.tooltip} side="top" sideOffset={6}>
          {exact}
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}
