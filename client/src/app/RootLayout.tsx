import { Outlet } from 'react-router';
import { AppShell } from '../components/shell/AppShell.tsx';
import { Sidebar } from '../components/shell/Sidebar.tsx';

export function RootLayout() {
  return (
    <AppShell sidebar={() => <Sidebar />}>
      <Outlet />
    </AppShell>
  );
}
