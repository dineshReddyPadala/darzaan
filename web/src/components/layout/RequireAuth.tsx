import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { apiMode } from '../../services/mode';
import { readSession } from '../../services/session';
import { AppShell } from './AppShell';

export function RequireAuth() {
  const location = useLocation();
  const session = apiMode ? readSession() : null;
  if (apiMode && !session) return <Navigate to="/login" replace />;
  if (session?.user.mustChangePassword && location.pathname !== '/change-password') {
    return <Navigate to="/change-password" replace />;
  }
  return <Outlet />;
}

/** The signed-in desk. */
export function StoreShell() {
  return <AppShell />;
}
