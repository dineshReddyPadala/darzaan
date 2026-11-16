import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { pageClass } from '../utils/styles';

export function NotFound() {
  return <div className={`${pageClass} flex min-h-[60vh] flex-col items-start justify-center`}>
    <p className="text-sm font-medium text-ink-subtle">404</p>
    <h1 className="mt-2 font-display text-4xl">Page not found</h1>
    <p className="mt-3 max-w-md text-[15px] text-ink-muted">That address is not part of the desk.</p>
    <Link to="/" className="mt-6"><Button>Back to home</Button></Link>
  </div>;
}
