import { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { Spinner } from '@/components/ui';

const KitPage = lazy(() => import('@/features/kit/KitPage'));

// Minimal router for now. Step 3 adds login, the protected AppLayout and the
// lazy feature pages (projects, board, dashboard) alongside /kit.
export const router = createBrowserRouter([
  {
    path: '/kit',
    element: (
      <Suspense fallback={<Spinner />}>
        <KitPage />
      </Suspense>
    ),
  },
]);
