import { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { Spinner } from '@/components/ui';
import { AppLayout } from './AppLayout';

const KitPage = lazy(() => import('@/features/kit/KitPage'));

// Partial router. The rest of Step 3 adds login, ProtectedRoute around the
// layout, and the lazy feature pages (projects, board, dashboard).
export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      {
        path: 'kit',
        element: (
          <Suspense fallback={<Spinner />}>
            <KitPage />
          </Suspense>
        ),
      },
    ],
  },
]);
