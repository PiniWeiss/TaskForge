import { createBrowserRouter, type RouteObject } from 'react-router';
import { Specimen } from '../dev/Specimen.tsx';
import { HomeView } from '../views/HomeView.tsx';
import { IssueRoute } from '../views/IssueRoute.tsx';
import { ProjectView } from '../views/ProjectView.tsx';
import { RootLayout } from './RootLayout.tsx';

// The specimen page is a design reference for development only; it is not part of the product.
const devRoutes: RouteObject[] = import.meta.env.DEV
  ? [{ path: '_specimen', element: <Specimen /> }]
  : [];

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { index: true, element: <HomeView /> },
      {
        path: 'p/:projectId',
        element: <ProjectView />,
        children: [{ path: 'i/:issueId', element: <IssueRoute /> }],
      },
      ...devRoutes,
    ],
  },
]);
