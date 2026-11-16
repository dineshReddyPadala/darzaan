import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { NotificationSettings } from '../components/settings/NotificationSettings';
import { PricingSettings } from '../components/settings/PricingSettings';
import { WorkflowSettings } from '../components/settings/WorkflowSettings';
import { PageHeader } from '../components/ui/PageHeader';
import { Tabs } from '../components/ui/Tabs';
import { defaultStoreSettings, readStoreSettings, saveStoreSettings, type StoreSettingsSlice } from '../data/store-settings';
import { readSession } from '../services/session';
import { pageClass } from '../utils/styles';

type Section = 'pricing' | 'workflow' | 'notifications';

export function Settings({ embedded = false, storeId }: { embedded?: boolean; storeId?: string | number }) {
  const id = storeId ?? readSession()?.user.storeId;
  const key = id == null || id === '' ? '' : String(id);
  const [section, setSection] = useState<Section>('pricing');
  const [draft, setDraft] = useState<StoreSettingsSlice>(() => (key && readStoreSettings()[key]) || defaultStoreSettings());
  useEffect(() => {
    if (!key) return;
    setDraft(readStoreSettings()[key] ?? defaultStoreSettings());
  }, [key]);
  const save = (label: string) => {
    if (!key) {
      toast.error('This account is not assigned to a store');
      return;
    }
    saveStoreSettings(key, draft);
    toast.success(label);
  };
  const body = <>
    <Tabs<Section> value={section} onChange={setSection} tabs={[
      { key: 'pricing', label: 'Pricing' },
      { key: 'workflow', label: 'Workflow' },
      { key: 'notifications', label: 'Notifications' },
    ]} />
    <div className="pt-6">
      {!key && <p className="text-sm text-ink-muted">This account is not assigned to a store.</p>}
      {key && section === 'pricing' && <PricingSettings value={draft.pricing} onChange={(pricing) => setDraft({ ...draft, pricing })} onSave={() => save('Pricing saved')} />}
      {key && section === 'workflow' && <WorkflowSettings value={draft.workflow} onChange={(workflow) => setDraft({ ...draft, workflow })} onSave={() => save('Workflow saved')} />}
      {key && section === 'notifications' && <NotificationSettings value={draft.notifications} onChange={(notifications) => setDraft({ ...draft, notifications })} onSave={() => save('Notification settings saved')} />}
    </div>
  </>;
  if (embedded) return <div>{body}</div>;
  return <div className={pageClass}>
    <PageHeader title="Settings" />
    {body}
  </div>;
}
