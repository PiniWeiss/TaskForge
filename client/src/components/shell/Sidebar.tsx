import type { ReactNode } from 'react';
import { Kbd } from '../ui/Kbd.tsx';
import styles from './Sidebar.module.css';
import { ThemeToggle } from './ThemeToggle.tsx';

interface SidebarProps {
  children?: ReactNode;
  onShowShortcuts?: () => void;
}

export function Sidebar({ children, onShowShortcuts }: SidebarProps) {
  return (
    <div className={styles.sidebar}>
      <div className={styles.brand}>
        <span className={styles.mark} aria-hidden="true" />
        TaskForge
      </div>
      <nav className={styles.nav} aria-label="Projects">
        {children}
      </nav>
      <footer className={styles.footer}>
        <ThemeToggle />
        <button
          type="button"
          className={styles.shortcuts}
          onClick={onShowShortcuts}
          aria-label="Keyboard shortcuts"
          title="Keyboard shortcuts"
          aria-keyshortcuts="?"
        >
          <Kbd>?</Kbd>
        </button>
      </footer>
    </div>
  );
}
