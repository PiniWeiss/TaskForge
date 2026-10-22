import { useState } from 'react';
import { Outlet } from 'react-router';
import { ProjectsSection } from '../components/projects/ProjectsSection.tsx';
import { AppShell } from '../components/shell/AppShell.tsx';
import { ShortcutsSheet } from '../components/shell/ShortcutsSheet.tsx';
import { Sidebar } from '../components/shell/Sidebar.tsx';
import { useHotkeys } from '../hooks/useHotkeys.ts';

export function RootLayout() {
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const showShortcuts = () => {
    setShortcutsOpen(true);
  };
  useHotkeys({ '?': showShortcuts });

  return (
    <>
      <AppShell
        sidebar={({ onNavigate }) => (
          <Sidebar
            onShowShortcuts={() => {
              onNavigate();
              showShortcuts();
            }}
          >
            <ProjectsSection onNavigate={onNavigate} />
          </Sidebar>
        )}
      >
        <Outlet />
      </AppShell>
      <ShortcutsSheet open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
    </>
  );
}
