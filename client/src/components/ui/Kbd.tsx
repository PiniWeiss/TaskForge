import clsx from 'clsx';
import styles from './Kbd.module.css';

interface KbdProps {
  children: string;
  className?: string;
}

/** A keyboard hint. Hidden from assistive tech: shortcuts are announced via aria-keyshortcuts. */
export function Kbd({ children, className }: KbdProps) {
  return (
    <kbd className={clsx(styles.kbd, className)} aria-hidden="true">
      {children}
    </kbd>
  );
}
