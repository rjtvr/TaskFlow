import { Navigate, Outlet, useLocation } from 'react-router-dom';

// TODO(Step 5): replace this stub with
//   const isAuthenticated = useAppSelector(selectIsAuthenticated);
const isAuthenticated = true;

export function ProtectedRoute() {
  const location = useLocation();
  return isAuthenticated ? (
    <Outlet />
  ) : (
    <Navigate to="/login" replace state={{ from: location }} />
  );
}
