import React, { useEffect, useState } from 'react';
import { Button } from './Button';

const PAGE_SIZE = 10;

export function usePagedRows<T>(rows: T[], resetKey: string) {
  const [page, setPage] = useState(0);
  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const safe = Math.min(page, pages - 1);

  useEffect(() => {
    setPage(0);
  }, [resetKey]);

  useEffect(() => {
    if (page !== safe) setPage(safe);
  }, [page, safe]);

  return {
    page: safe,
    pages,
    rows: rows.slice(safe * PAGE_SIZE, safe * PAGE_SIZE + PAGE_SIZE),
    setPage,
    from: rows.length === 0 ? 0 : safe * PAGE_SIZE + 1,
    to: Math.min(rows.length, (safe + 1) * PAGE_SIZE),
    total: rows.length,
  };
}

export function TablePager({ page, pages, from, to, total, onPage }: {
  page: number;
  pages: number;
  from: number;
  to: number;
  total: number;
  onPage: (page: number) => void;
}) {
  if (total === 0) return null;
  return <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-3 text-sm text-ink-muted">
    <span className="tabular">{from}–{to} of {total}</span>
    <div className="flex items-center gap-2">
      <Button variant="secondary" size="sm" disabled={page === 0} onClick={() => onPage(page - 1)}>Previous</Button>
      <span className="tabular">{page + 1} / {pages}</span>
      <Button variant="secondary" size="sm" disabled={page >= pages - 1} onClick={() => onPage(page + 1)}>Next</Button>
    </div>
  </div>;
}
