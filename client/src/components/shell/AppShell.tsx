import * as Dialog from '@radix-ui/react-dialog';
import * as VisuallyHidden from '@radix-ui/react-visually-hidden';
import { useState, type ReactNode } from 'react';
import { NARROW_QUERY, useMediaQuery } from '../../hooks/useMediaQuery.ts';
import { IconClose, IconMenu } from '../ui/icons.tsx';
import styles from './AppShell.module.css';

interface AppShellProps {
  /** Rendered in a fixed column on wide screens and in a drawer on narrow ones. */
  sidebar: (props: { onNavigate: () => void }) => ReactNode;
  children: ReactNode;
}

export function AppShell({ sidebar, children }: AppShellProps) {
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
          <span className={styles.wordmark}>
            <span className={styles.mark} aria-hidden="true" />
            TaskForge
          </span>
        </header>
        <Dialog.Portal>
          <Dialog.Overlay className={styles.overlay} />
          <Dialog.Content className={styles.drawer} aria-describedby={undefined}>
            <VisuallyHidden.Root asChild>
              <Dialog.Title>Projects</Dialog.Title>
            </VisuallyHidden.Root>
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
