import { Outlet } from 'react-router';
import { ProjectsSection } from '../components/projects/ProjectsSection.tsx';
import { AppShell } from '../components/shell/AppShell.tsx';
import { Sidebar } from '../components/shell/Sidebar.tsx';

export function RootLayout() {
  return (
    <AppShell
      sidebar={({ onNavigate }) => (
        <Sidebar>
          <ProjectsSection onNavigate={onNavigate} />
        </Sidebar>
      )}
    >
      <Outlet />
    </AppShell>
  );
}
