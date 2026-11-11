import { Suspense, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { Spinner } from '@/components/ui';
import { ErrorBoundary } from '@/components/ErrorBoundary/ErrorBoundary';

// Wraps each routed page. The boundary sits outside Suspense so a failed lazy
// chunk load is caught too, and it is keyed by path so navigating away from a
// crashed page clears the error. The layout (header, sidebar) stays alive.
export function PageBoundary({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  return (
    <ErrorBoundary key={pathname}>
      <Suspense fallback={<Spinner />}>{children}</Suspense>
    </ErrorBoundary>
  );
}
