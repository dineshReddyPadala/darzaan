import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { PlusIcon } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { RowMenu } from '../components/ui/RowMenu';
import { Toggle } from '../components/ui/Toggle';
import { Field } from '../components/ui/Field';
import { Modal } from '../components/ui/Modal';
import { PageHeader } from '../components/ui/PageHeader';
import { TablePager, usePagedRows } from '../components/ui/TablePager';
import { categories as seed, type CategoryDef } from '../data/catalog';
import { useConfirm } from '../hooks/useConfirm';
import { useSyncedList } from '../hooks/useSyncedList';
import { getCatalog, putCollection } from '../services/api';
import { apiMode } from '../services/mode';
import { scheduleSave } from '../services/sync';
import { inputClass, pageClass, panelClass } from '../utils/styles';

const isActive = (category: CategoryDef) => category.active !== false;

function nextCode(count: number): string {
  return String.fromCharCode(65 + count % 26) + (count >= 26 ? Math.floor(count / 26) : '');
}

export function Categories({ embedded = false, basePath = '/master/categories' }: { embedded?: boolean; basePath?: string }) {
  const navigate = useNavigate();
  const [cats, setCats] = useSyncedList<CategoryDef[]>('catalog', seed);
  const [open, setOpen] = useState(false);
  const [viewing, setViewing] = useState<CategoryDef | null>(null);
  const [loading, setLoading] = useState(apiMode);
  const [pendingName, setPendingName] = useState<string | null>(null);
  const [name, setName] = useState('');
  const { confirm, dialog } = useConfirm();
  const visible = cats.filter((category) => !category.deletedAt);
  const page = usePagedRows(visible, String(visible.length));

  useEffect(() => {
    if (!apiMode) {
      setLoading(false);
      return;
    }
    let live = true;
    setLoading(true);
    getCatalog()
      .then((body) => {
        if (!live) return;
        const rows = Array.isArray(body) ? body as CategoryDef[] : [];
        setCats(rows);
      })
      .catch(() => { if (live) toast.error('Could not load categories'); })
      .finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, [setCats]);

  const setActive = (category: CategoryDef, active: boolean) => {
    if (pendingName) return;
    const next = cats.map((item) => item.name === category.name ? { ...item, active } : item);
    if (!apiMode) {
      setCats(next);
      return;
    }
    setPendingName(category.name);
    putCollection('catalog', next)
      .then(() => setCats(next))
      .catch(() => toast.error('Could not update that category'))
      .finally(() => setPendingName((current) => current === category.name ? null : current));
  };
  const taken = cats.some((category) => category.name.toLowerCase() === name.trim().toLowerCase());

  const create = () => {
    const label = name.trim();
    if (!label) {
      toast.error('Give the category a name');
      return;
    }
    if (taken) {
      toast.error('That category already exists');
      return;
    }
    const next: CategoryDef[] = [...cats, {
      code: nextCode(cats.length),
      meters: 2,
      name: label,
      subCategories: [],
      measurements: { fields: [], details: [] },
      active: true,
    }];
    setCats(next);
    scheduleSave('catalog', next);
    setName('');
    setOpen(false);
    toast.success(`${label} added`);
    navigate(`${basePath}/${encodeURIComponent(label)}`);
  };

  const shell = embedded ? 'space-y-4' : pageClass;
  return <div className={shell}>
    {dialog}
    <PageHeader
      title="Categories"
      actions={<Button icon={<PlusIcon className="h-4 w-4" />} onClick={() => setOpen(true)}>Create</Button>}
    />
    <div className={`${panelClass} overflow-x-auto`}>
      <table className="w-full min-w-[720px] text-sm">
        <thead>
          <tr className="border-b border-line text-left text-ink-muted">
            <th className="px-3 py-2 font-medium">Code</th>
            <th className="px-3 py-2 font-medium">Name</th>
            <th className="px-3 py-2 text-right font-medium">Items</th>
            <th className="px-3 py-2 text-right font-medium">Measurements</th>
            <th className="px-3 py-2 font-medium">Active</th>
            <th className="px-3 py-2" />
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {!loading && page.rows.map((category) => (
            <tr key={category.name} className="hover:bg-canvas">
              <td className="px-3 py-2 font-medium">{category.code}</td>
              <td className="px-3 py-2">
                <Link to={`${basePath}/${encodeURIComponent(category.name)}`} className="font-medium hover:text-brand">{category.name}</Link>
              </td>
              <td className="px-3 py-2 text-right tabular">{category.subCategories.filter((item) => !item.deletedAt).length}</td>
              <td className="px-3 py-2 text-right tabular">{category.measurements.fields.length}</td>
              <td className="px-3 py-2">
                <Toggle
                  compact
                  busy={pendingName === category.name}
                  checked={isActive(category)}
                  label={`${category.name} active`}
                  onChange={(active) => setActive(category, active)}
                />
              </td>
              <td className="px-3 py-2 text-right">
                <RowMenu label={`Actions for ${category.name}`} items={[
                  { label: 'View', onClick: () => setViewing(category) },
                  { label: 'Update', to: `${basePath}/${encodeURIComponent(category.name)}` },
                  { label: 'Delete', destructive: true, onClick: () => void confirm({
                    title: `Delete ${category.name}?`,
                    description: 'It will leave the category list. Existing orders that use it stay as they are.',
                  }).then((yes) => {
                    if (!yes) return;
                    setCats((prev) => prev.map((item) => item.name === category.name ? { ...item, deletedAt: new Date().toISOString() } : item));
                    toast.success(`${category.name} removed`);
                  }) },
                ]} />
              </td>
            </tr>
          ))}
          {loading && <tr><td colSpan={6} className="px-4 py-8 text-center text-ink-muted">Loading categories…</td></tr>}
          {!loading && page.total === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-ink-muted">No categories in this view.</td></tr>}
        </tbody>
      </table>
      <TablePager page={page.page} pages={page.pages} from={page.from} to={page.to} total={page.total} onPage={page.setPage} />
    </div>
    <Modal
      open={open}
      onClose={() => setOpen(false)}
      title="New category"
      description="You can add items, measurements and fit details on the next page."
      footer={<>
        <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
        <Button onClick={create} disabled={!name.trim() || taken}>Create</Button>
      </>}
    >
      <Field label="Name" required>
        <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} placeholder="Blouses" />
      </Field>
    </Modal>
    <Modal open={viewing != null} onClose={() => setViewing(null)} title={viewing?.name ?? 'Category'}>
      {viewing && <dl className="space-y-3 text-sm">
        <div><dt className="text-ink-subtle">Code</dt><dd className="font-medium">{viewing.code}</dd></div>
        <div><dt className="text-ink-subtle">Items</dt><dd className="font-medium">{viewing.subCategories.filter((item) => !item.deletedAt).length}</dd></div>
        <div><dt className="text-ink-subtle">Active</dt><dd className="font-medium">{isActive(viewing) ? 'Active' : 'Inactive'}</dd></div>
      </dl>}
    </Modal>
  </div>;
}
