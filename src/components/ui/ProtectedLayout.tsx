import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Nav } from './Nav';

export function ProtectedLayout() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#9ca3af',
          fontSize: 14,
        }}
      >
        Loading…
      </div>
    );
  }

  if (!user) {
    // Preserve the intended destination so AuthPage can redirect back
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  return (
    <>
      <Nav />
      <Outlet />
    </>
  );
}
