import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

/**
 * Route guard component that checks for an access token in localStorage.
 * Redirects unauthenticated users to the `/login` page.
 */
const ProtectedRoute = () => {
  const token = localStorage.getItem('access_token');

  if (!token) {
    // Redirect to login if token is missing
    return <Navigate to="/login" replace />;
  }

  // Renders nested route components if authenticated
  return <Outlet />;
};

export default ProtectedRoute;
