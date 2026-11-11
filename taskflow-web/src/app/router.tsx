import { lazy, type ReactNode } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from './AppLayout';
import { PageBoundary } from './PageBoundary';
import { ProtectedRoute } from './ProtectedRoute';
import { RouteError } from './RouteError';

const LoginPage = lazy(() => import('@/features/auth/LoginPage'));
const ProjectsPage = lazy(() => import('@/features/projects/ProjectsPage'));
const BoardPage = lazy(() => import('@/features/tasks/BoardPage'));
const DashboardPage = lazy(() => import('@/features/dashboard/DashboardPage'));
const KitPage = lazy(() => import('@/features/kit/KitPage'));

const page = (el: ReactNode) => <PageBoundary>{el}</PageBoundary>;

export const router = createBrowserRouter([
  { path: '/login', element: page(<LoginPage />) },
  {
    element: <ProtectedRoute />,
    errorElement: <RouteError />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <Navigate to="/projects" replace /> },
          { path: 'projects', element: page(<ProjectsPage />) },
          { path: 'projects/:projectId/board', element: page(<BoardPage />) },
          { path: 'dashboard', element: page(<DashboardPage />) },
          { path: 'kit', element: page(<KitPage />) },
        ],
      },
    ],
  },
]);
