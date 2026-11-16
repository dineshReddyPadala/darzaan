import React, { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '../components/ui/Button';
import { PageHeader } from '../components/ui/PageHeader';
import { listAudit, type AuditEntry } from '../services/api';
import { apiMode } from '../services/mode';
import { pageClass, panelClass } from '../utils/styles';

function summary(meta: Record<string, unknown> | null): string {
  if (!meta) return '—';
  const text = Object.entries(meta)
    .filter(([, value]) => value != null && value !== '')
    .map(([key, value]) => `${key}: ${typeof value === 'object' ? JSON.stringify(value) : String(value)}`)
    .join(' · ');
  return text || '—';
}

export function AuditLog() {
  const [rows, setRows] = useState<AuditEntry[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (next?: string) => {
    if (!apiMode) return;
    setLoading(true);
    try {
      const page = await listAudit({ cursor: next, take: 50 });
      setRows((current) => next ? [...current, ...page.items] : page.items);
      setCursor(page.nextCursor);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not load the audit log');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return <div className={pageClass}>
    <PageHeader title="Audit log" subtitle="Sign-ins and staff account changes." />
    {!apiMode && <p className={`${panelClass} px-5 py-4 text-sm text-ink-muted`}>Connect the app to the API to read the audit log.</p>}
    {apiMode && (
      <div className={`${panelClass} overflow-x-auto`}>
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-line text-left text-ink-muted">
              <th className="px-4 py-3 font-medium">Time</th>
              <th className="px-4 py-3 font-medium">Actor</th>
              <th className="px-4 py-3 font-medium">Action</th>
              <th className="px-4 py-3 font-medium">Detail</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="whitespace-nowrap px-4 py-3 tabular">{new Date(row.at).toLocaleString()}</td>
                <td className="px-4 py-3">{row.actor ? `${row.actor.name}` : '—'}</td>
                <td className="px-4 py-3 font-medium">{row.action}</td>
                <td className="px-4 py-3 text-ink-muted">{summary(row.meta)}</td>
              </tr>
            ))}
            {rows.length === 0 && !loading && <tr><td colSpan={4} className="px-4 py-8 text-center text-ink-muted">No audit rows yet.</td></tr>}
          </tbody>
        </table>
        {cursor && (
          <div className="border-t border-line px-4 py-3">
            <Button variant="secondary" size="sm" disabled={loading} onClick={() => void load(cursor)}>Load more</Button>
          </div>
        )}
      </div>
    )}
  </div>;
}
