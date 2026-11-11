import { isRouteErrorResponse, Link, useRouteError } from 'react-router-dom';
import { EmptyState } from '@/components/ui';

// Last-resort screen for errors React Router catches (loader failures,
// unmatched routes, errors outside a PageBoundary).
export function RouteError() {
  const error = useRouteError();
  const message = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : error instanceof Error
      ? error.message
      : 'Unknown error';

  return (
    <div role="alert">
      <EmptyState
        title="Something went wrong"
        message={message}
        action={<Link to="/">Back to the app</Link>}
      />
    </div>
  );
}
