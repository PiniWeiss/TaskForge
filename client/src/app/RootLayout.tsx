import { Outlet, useParams } from 'react-router';
import { useProjects } from '../api/projects.ts';
import { ProjectList } from '../components/projects/ProjectList.tsx';
import { AppShell } from '../components/shell/AppShell.tsx';
import { Sidebar } from '../components/shell/Sidebar.tsx';

export function RootLayout() {
  const { projectId } = useParams();
  const projects = useProjects();
  const current = projects.data?.find((p) => p.id === projectId);

  return (
    <AppShell
      title={current && <span dir="auto">{current.name}</span>}
      sidebar={({ onNavigate }) => (
        <Sidebar>
          <ProjectList onNavigate={onNavigate} />
        </Sidebar>
      )}
    >
      <Outlet />
    </AppShell>
  );
}
