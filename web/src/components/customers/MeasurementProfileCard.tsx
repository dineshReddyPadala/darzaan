import React from 'react';
import { ShieldCheckIcon, UserIcon } from 'lucide-react';
import type { MeasurementProfile } from '../../types';
import { fmtDate } from '../../utils/format';
import { Badge } from '../ui/Badge';
export function sourceLabel(source: MeasurementProfile['source']): string {
  switch (source) {
    case 'Designer':
      return 'Taken by designer';
    case 'Customer':
      return 'Customer-provided';
    case 'Profile':
      return 'From saved profile';
    default:
      return 'From sample garment';
  }
}
export function MeasurementProfileCard({
  profile


}: {profile: MeasurementProfile;}) {
  const entries = Object.entries(profile.values);
  return <article className="rounded-2xl border border-line bg-surface">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-4">
        <div>
          <h3 className="text-[16px] font-semibold">{profile.label}</h3>
          <p className="text-sm text-ink-subtle">
            {sourceLabel(profile.source)} · {profile.takenBy} · {fmtDate(profile.date, 'd MMM yyyy')}
          </p>
        </div>
        {profile.verified ? <Badge tone="success"><ShieldCheckIcon className="h-3.5 w-3.5" /> Darzaan-verified</Badge> : <Badge tone="attention"><UserIcon className="h-3.5 w-3.5" /> Awaiting verification</Badge>}
      </header>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-3 px-5 py-4 sm:grid-cols-3 xl:grid-cols-5">
        {entries.map(([k, v]) => <div key={k}>
            <dt className="text-xs text-ink-subtle">{k}</dt>
            <dd className="text-[17px] font-semibold tabular">{v}"</dd>
          </div>)}
      </dl>
    </article>;
}