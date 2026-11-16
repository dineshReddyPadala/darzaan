import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { PlusIcon } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { RowMenu } from '../components/ui/RowMenu';
import { Toggle } from '../components/ui/Toggle';
import { Field } from '../components/ui/Field';
import { Modal } from '../components/ui/Modal';
import { PageHeader } from '../components/ui/PageHeader';
import { TablePager, usePagedRows } from '../components/ui/TablePager';
import { locations as seed, type StoreLocation, type WorkplaceKind } from '../data/locations';
import { ensureStoreSettings } from '../data/store-settings';
import { useConfirm } from '../hooks/useConfirm';
import { useSyncedList } from '../hooks/useSyncedList';
import { createUser, putCollection } from '../services/api';
import { apiMode } from '../services/mode';
import { inputClass, pageClass, panelClass } from '../utils/styles';

type Draft = Omit<StoreLocation, 'id'> & { id?: number };

const blank = (): Draft => ({
  name: '',
  kind: 'store',
  address: '',
  phone: '',
  store: '',
  active: true,
});

export function StoreLocations({ hrefFor }: { hrefFor?: (row: StoreLocation) => string }) {
  const [rows, setRows] = useSyncedList<StoreLocation[]>('locations', seed);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [viewing, setViewing] = useState<StoreLocation | null>(null);
  const [draft, setDraft] = useState<Draft>(blank);
  const [admin, setAdmin] = useState({ name: '', email: '', mobile: '' });
  const [issued, setIssued] = useState<{ email: string; password: string; emailed: boolean } | null>(null);
  const [saving, setSaving] = useState(false);
  const [pendingId, setPendingId] = useState<number | null>(null);
  const page = usePagedRows(rows, String(rows.length));
  const { confirm, dialog } = useConfirm();

  const add = async () => {
    if (!draft.name.trim() || !draft.address.trim()) {
      toast.error('Name and address are required');
      return;
    }
    if (rows.some((row) => row.id !== editingId && row.name.toLowerCase() === draft.name.trim().toLowerCase())) {
      toast.error('That location already exists');
      return;
    }
    if (editingId != null) {
      const next = rows.map((row) => row.id === editingId ? {
        ...row,
        name: draft.name.trim(),
        kind: draft.kind,
        address: draft.address.trim(),
        phone: draft.phone.trim(),
        store: draft.kind === 'store' ? draft.store?.trim() || undefined : undefined,
        active: draft.active,
      } : row);
      setSaving(true);
      try {
        const saved = await putCollection('locations', next) as StoreLocation[];
        setRows(Array.isArray(saved) ? saved : next);
        setOpen(false);
        setEditingId(null);
        toast.success('Location updated');
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Could not save the location');
      } finally {
        setSaving(false);
      }
      return;
    }
    const created = {
      name: draft.name.trim(),
      kind: draft.kind,
      address: draft.address.trim(),
      phone: draft.phone.trim(),
      store: draft.kind === 'store' ? draft.store?.trim() || undefined : undefined,
      active: true,
    };
    setSaving(true);
    try {
      const saved = await putCollection('locations', [...rows, created]) as StoreLocation[];
      const list = Array.isArray(saved) ? saved : [...rows, { ...created, id: rows.length + 1 }];
      setRows(list);
      const place = list.find((row) => row.name === created.name);
      if (place) ensureStoreSettings(place.id);
      const adminEmail = admin.email.trim();
      if (created.kind === 'store' && place && adminEmail) {
        const account = await createUser({
          email: adminEmail,
          name: admin.name.trim() || adminEmail,
          roleId: 'admin',
          title: 'Admin',
          location: place.name,
          store: place.store,
          storeId: place.id,
          mobile: admin.mobile.trim() || undefined,
        });
        setIssued({ email: account.user.email, password: account.password, emailed: account.emailed });
      }
      setDraft(blank());
      setAdmin({ name: '', email: '', mobile: '' });
      setOpen(false);
      const withAdmin = created.kind === 'store' && Boolean(adminEmail);
      toast.success(!withAdmin ? (created.kind === 'store' ? 'Store created' : 'Location added') : 'Store created');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not save the location');
    } finally {
      setSaving(false);
    }
  };

  const setActive = (row: StoreLocation, active: boolean) => {
    if (pendingId != null) return;
    const next = rows.map((item) => item.id === row.id ? { ...item, active } : item);
    if (!apiMode) {
      setRows(next);
      return;
    }
    setPendingId(row.id);
    putCollection('locations', next)
      .then((saved) => setRows(Array.isArray(saved) ? saved as StoreLocation[] : next))
      .catch(() => toast.error('Could not update that location'))
      .finally(() => setPendingId((current) => current === row.id ? null : current));
  };

  return <div className={pageClass}>
    {dialog}
    {issued && <p className="mb-4 rounded-2xl border border-brand/30 bg-brand-soft px-4 py-3 text-sm">
      {issued.emailed
        ? <>We emailed {issued.email} a temporary password. They choose a new one the first time they sign in.</>
        : <>The email to {issued.email} could not be sent. Copy the temporary password: <span className="font-mono font-semibold">{issued.password}</span></>}
    </p>}
    <PageHeader
      title="Store locations"
      actions={<Button icon={<PlusIcon className="h-4 w-4" />} onClick={() => { setEditingId(null); setDraft(blank()); setAdmin({ name: '', email: '', mobile: '' }); setOpen(true); }}>Create</Button>}
    />
    <div className={`${panelClass} overflow-x-auto`}>
      <table className="w-full min-w-[760px] text-sm">
        <thead>
          <tr className="border-b border-line text-left text-ink-muted">
            <th className="px-3 py-2 font-medium">Name</th>
            <th className="px-3 py-2 font-medium">Kind</th>
            <th className="px-3 py-2 font-medium">Address</th>
            <th className="px-3 py-2 font-medium">Phone</th>
            <th className="px-3 py-2 font-medium">Active</th>
            <th className="px-3 py-2" />
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {page.rows.map((row) => (
            <tr key={row.id}>
              <td className="px-3 py-2 font-medium">{hrefFor ? <Link to={hrefFor(row)} className="hover:text-brand">{row.name}</Link> : row.name}</td>
              <td className="px-3 py-2 capitalize">{row.kind}</td>
              <td className="px-3 py-2 text-ink-muted">{row.address}</td>
              <td className="px-3 py-2">{row.phone || '—'}</td>
              <td className="px-3 py-2">
                <Toggle compact busy={pendingId === row.id} checked={row.active} label={`${row.name} active`} onChange={(active) => setActive(row, active)} />
              </td>
              <td className="px-3 py-2 text-right">
                <RowMenu label={`Actions for ${row.name}`} items={[
                  { label: 'View', onClick: () => setViewing(row) },
                  { label: 'Update', onClick: () => { setEditingId(row.id); setDraft(row); setOpen(true); } },
                  { label: 'Delete', destructive: true, onClick: () => void confirm({
                    title: `Delete ${row.name}?`,
                    description: 'It will disappear from the store list. Past orders keep their link to it.',
                  }).then((yes) => {
                    if (!yes) return;
                    setRows((prev) => prev.filter((item) => item.id !== row.id));
                    toast.success(`${row.name} removed`);
                  }) },
                ]} />
              </td>
            </tr>
          ))}
          {page.total === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-ink-muted">No locations in this view.</td></tr>}
        </tbody>
      </table>
      <TablePager page={page.page} pages={page.pages} from={page.from} to={page.to} total={page.total} onPage={page.setPage} />
    </div>
    <Modal
      open={open}
      onClose={() => setOpen(false)}
      title={editingId != null ? 'Edit location' : 'New location'}
      description={editingId != null ? 'Update this store or workshop.' : 'A store or workshop employees can be assigned to.'}
      footer={<>
        <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
        <Button onClick={() => void add()} disabled={saving}>{saving ? 'Saving' : editingId != null ? 'Save' : 'Create'}</Button>
      </>}
    >
      <div className="space-y-4">
        <Field label="Name" required>
          <input className={inputClass} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
        </Field>
        <Field label="Kind">
          <select className={inputClass} value={draft.kind} onChange={(e) => setDraft({ ...draft, kind: e.target.value as WorkplaceKind })}>
            <option value="store">Store</option>
            <option value="workshop">Workshop</option>
          </select>
        </Field>
        <Field label="Address" required>
          <input className={inputClass} value={draft.address} onChange={(e) => setDraft({ ...draft, address: e.target.value })} />
        </Field>
        <Field label="Phone">
          <input className={inputClass} value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} />
        </Field>
        {draft.kind === 'store' && editingId == null && (
          <>
            <Field label="Store code" hint="Used on orders, for example Khan Market">
              <input className={inputClass} value={draft.store ?? ''} onChange={(e) => setDraft({ ...draft, store: e.target.value })} />
            </Field>
            <Field label="Admin name" hint="Optional. Defaults to the admin email">
              <input className={inputClass} value={admin.name} onChange={(e) => setAdmin({ ...admin, name: e.target.value })} />
            </Field>
            <Field label="Admin email" hint="Optional. An admin login is created only when this is filled">
              <input className={inputClass} type="email" value={admin.email} onChange={(e) => setAdmin({ ...admin, email: e.target.value })} />
            </Field>
            <Field label="Admin mobile" hint="Optional">
              <input className={inputClass} value={admin.mobile} onChange={(e) => setAdmin({ ...admin, mobile: e.target.value })} />
            </Field>
          </>
        )}
      </div>
    </Modal>
    <Modal open={viewing != null} onClose={() => setViewing(null)} title={viewing?.name ?? 'Location'}>
      {viewing && <dl className="space-y-3 text-sm">
        <div><dt className="text-ink-subtle">Kind</dt><dd className="font-medium capitalize">{viewing.kind}</dd></div>
        <div><dt className="text-ink-subtle">Address</dt><dd className="font-medium">{viewing.address}</dd></div>
        <div><dt className="text-ink-subtle">Phone</dt><dd className="font-medium">{viewing.phone || '—'}</dd></div>
        <div><dt className="text-ink-subtle">Active</dt><dd className="font-medium">{viewing.active ? 'Active' : 'Inactive'}</dd></div>
      </dl>}
    </Modal>
  </div>;
}
