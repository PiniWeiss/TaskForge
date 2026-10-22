import * as Dialog from '@radix-ui/react-dialog';
import { useState, type ReactNode } from 'react';
import { NARROW_QUERY, useMediaQuery } from '../../hooks/useMediaQuery.ts';
import { IconClose, IconMenu } from '../ui/icons.tsx';
import styles from './AppShell.module.css';

interface AppShellProps {
  /** Rendered in a fixed column on wide screens and in a drawer on narrow ones. */
  sidebar: (props: { onNavigate: () => void }) => ReactNode;
  /** Shown in the top bar on narrow screens, next to the menu button. */
  title?: ReactNode;
  children: ReactNode;
}

export function AppShell({ sidebar, title, children }: AppShellProps) {
  const narrow = useMediaQuery(NARROW_QUERY);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const closeDrawer = () => {
    setDrawerOpen(false);
  };

  if (!narrow) {
    return (
      <div className={styles.shell}>
        <aside className={styles.sidebar}>{sidebar({ onNavigate: closeDrawer })}</aside>
        <main className={styles.main}>{children}</main>
      </div>
    );
  }

  return (
    <div className={styles.narrow}>
      <Dialog.Root open={drawerOpen} onOpenChange={setDrawerOpen}>
        <header className={styles.topBar}>
          <Dialog.Trigger className={styles.barButton} aria-label="Open projects">
            <IconMenu />
          </Dialog.Trigger>
          <div className={styles.topTitle}>{title}</div>
        </header>
        <Dialog.Portal>
          <Dialog.Overlay className={styles.overlay} />
          <Dialog.Content className={styles.drawer} aria-describedby={undefined}>
            <Dialog.Title className={styles.srOnly}>Projects</Dialog.Title>
            <Dialog.Close className={styles.drawerClose} aria-label="Close projects">
              <IconClose />
            </Dialog.Close>
            {sidebar({ onNavigate: closeDrawer })}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
      <main className={styles.main}>{children}</main>
    </div>
  );
}
