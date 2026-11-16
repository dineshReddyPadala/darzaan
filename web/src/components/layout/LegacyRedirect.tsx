import React from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { useApp } from '../../contexts/AppContext';
import { scanHomeFor } from '../../utils/packages';
import { homeFor } from '../../utils/roles';

/** Old links (/scan, /dispatch, /handover…) land on this persona's delivery screen. */
export function LegacyRedirect({
  to


}: {to: 'scan' | 'handover';}) {
  const {
    role
  } = useApp();
  const [params] = useSearchParams();
  if (to === 'handover') return <Navigate to={scanHomeFor(role) ?? homeFor(role)} replace />;
  const home = scanHomeFor(role);
  const code = params.get('code');
  return <Navigate to={home ? `${home}${code ? `?code=${code}` : ''}` : homeFor(role)} replace />;
}