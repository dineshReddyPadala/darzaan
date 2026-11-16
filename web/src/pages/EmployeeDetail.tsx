import React, { useMemo, useRef, useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeftIcon, FingerprintIcon, MapPinIcon, MessageCircleIcon, MoreHorizontalIcon } from 'lucide-react';
import { Avatar } from '../components/ui/Avatar';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { InfoCard, InfoLine, SectionCard } from '../components/ui/InfoCard';
import { Tabs } from '../components/ui/Tabs';
import { useApp } from '../contexts/AppContext';
import { useQc } from '../contexts/QcContext';
import { seedTasks } from '../hooks/useOrderWorkflow';
import type { ProductionTask } from '../types';
import { cn } from '../utils/cn';
import { dueLabel, fmtDate, fmtDateTime } from '../utils/format';
import { garmentDue, isActive } from '../utils/orders';
import { orderLink } from '../utils/roles';
import { orderStatusTone } from '../utils/status';
import { directReports, reportsTo, statusTone, teamList } from '../utils/team';
import { buttonClass } from '../components/ui/Button';
import { pageClass } from '../utils/styles';
type Tab = 'work' | 'quality';
interface TaskRow {
  task: ProductionTask;
  orderId: string;
  garment: string;
  due: string;
}

/** One employee — same layout as Order Details: header, work on the left, who / how they’re doing on the right. */
export function EmployeeDetail() {
  const {
    id = ''
  } = useParams();
  const {
    orders,
    role,
    customerName
  } = useApp();
  const {
    issues
  } = useQc();
  const [tab, setTab] = useState<Tab>('work');
  const [menu, setMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const people = teamList();
  const e = people.find((x) => String(x.id) === String(id));
  useEffect(() => {
    if (!menu) return;
    const close = (ev: MouseEvent) => !menuRef.current?.contains(ev.target as Node) && setMenu(false);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [menu]);
  const rows = useMemo<TaskRow[]>(() => {
    if (!e) return [];
    return orders.flatMap((o) => (o.tasks ?? seedTasks(o)).filter((t) => t.assignee === e.name).map((t) => {
      const g = o.garments.find((x) => x.id === t.garmentId);
      return {
        task: t,
        orderId: o.id,
        garment: g?.subCategory ?? 'Garment',
        due: g ? garmentDue(o, g) : o.deliveryDate
      };
    }));
  }, [orders, e]);
  if (!e) {
    return <div className={pageClass}>
        <p className="text-ink-muted">Employee not found.</p>
        <Link to="/team" className={buttonClass('secondary', 'md', 'mt-4')}>Back to team</Link>
      </div>;
  }
  const open = rows.filter((r) => r.task.status !== 'Done').sort((a, b) => a.due.localeCompare(b.due));
  const done = rows.filter((r) => r.task.status === 'Done').sort((a, b) => (b.task.updatedAt ?? '').localeCompare(a.task.updatedAt ?? '')).slice(0, 8);
  const designing = orders.filter((o) => o.designer === e.name && isActive(o));
  const defects = issues.filter((i) => i.responsible === e.name && i.kind !== 'Packing gap').sort((a, b) => b.at.localeCompare(a.at));
  const boss = reportsTo(e, people);
  const team = directReports(e, people);
  const active = Math.max(e.activeTasks, open.length);
  const load = e.capacity ? Math.round(active / e.capacity * 100) : 0;
  const first = e.name.split(' ')[0];
  return <div className={pageClass}>
      <Link to="/team" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-ink-muted hover:text-ink">
        <ArrowLeftIcon className="h-4 w-4" /> Team
      </Link>

      <header className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <Avatar name={e.name} size="lg" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-display text-[30px] font-medium leading-none tracking-tight">{e.name}</h1>
              <Badge tone={statusTone(e.status)} size="md" dot>{e.status}</Badge>
            </div>
            <p className="mt-2 text-[16px] text-ink-muted">{e.role} · {e.station} · {e.id}</p>
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button size="lg" icon={<MessageCircleIcon className="h-5 w-5" />} onClick={() => toast.success(`Message sent to ${first}`)}>Message</Button>
          <div className="relative" ref={menuRef}>
            <button type="button" aria-label="More actions" aria-expanded={menu} onClick={() => setMenu((m) => !m)} className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface ring-1 ring-inset ring-line-strong transition-colors duration-150 ease-out hover:bg-sunken">
              <MoreHorizontalIcon className="h-5 w-5" />
            </button>
            {menu && <div className="absolute right-0 top-full z-30 mt-2 w-60 rounded-2xl border border-line bg-surface p-1.5 shadow-pop" role="menu">
                {['Mark on break', 'Mark off today', 'Print ID badge'].map((label) => <button key={label} type="button" role="menuitem" onClick={() => {
              setMenu(false);
              toast.success(label, {
                description: e.name
              });
            }} className="block w-full rounded-xl px-3 py-2.5 text-left text-[15px] hover:bg-sunken">{label}</button>)}
              </div>}
          </div>
        </div>
      </header>

      <Tabs<Tab> value={tab} onChange={setTab} tabs={[{
      key: 'work',
      label: 'Work',
      count: open.length
    }, {
      key: 'quality',
      label: 'Quality',
      count: defects.length
    }]} />

      <div className="grid gap-5 pt-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-5">
          {tab === 'work' && <>
              <SectionCard title="Working on now" count={open.length} flush>
                <TaskList rows={open} role={role} empty={designing.length ? 'No workshop tasks — see their orders below.' : `${first} has nothing assigned right now.`} />
              </SectionCard>
              {designing.length > 0 && <SectionCard title="Orders as designer" count={designing.length} flush>
                  <ul className="divide-y divide-line">
                    {designing.map((o) => {
                const to = orderLink(role, o.id);
                const body = <>
                          <div className="min-w-0 flex-1">
                            <p className="font-mono text-sm text-ink-muted">{o.id}</p>
                            <p className="truncate text-[15px] font-medium">{customerName(o.customerId)} · {o.garments.map((g) => g.subCategory).join(', ')}</p>
                          </div>
                          <Badge tone={orderStatusTone[o.status]} dot>{o.status}</Badge>
                          <span className="w-24 text-right text-sm text-ink-muted">{dueLabel(o.deliveryDate)}</span>
                        </>;
                return <li key={o.id}>{to ? <Link to={to} className="flex items-center gap-4 px-5 py-3 transition-colors duration-150 ease-out hover:bg-canvas">{body}</Link> : <div className="flex items-center gap-4 px-5 py-3">{body}</div>}</li>;
              })}
                  </ul>
                </SectionCard>}
              <SectionCard title="Recently finished" count={done.length} flush>
                <TaskList rows={done} role={role} empty="Nothing finished yet." finished />
              </SectionCard>
            </>}

          {tab === 'quality' && <SectionCard title="Problems found at QC" count={defects.length} flush>
              {defects.length ? <ul className="divide-y divide-line">
                  {defects.map((d) => <li key={d.id} className="flex items-start gap-4 px-5 py-3">
                      {d.photo ? <img src={d.photo} alt="" className="h-12 w-12 shrink-0 rounded-lg object-cover" /> : <span className="h-12 w-12 shrink-0 rounded-lg bg-sunken" aria-hidden />}
                      <div className="min-w-0 flex-1">
                        <p className="text-[15px] font-medium">{d.issue}</p>
                        <p className="text-sm text-ink-subtle">{d.orderId} · {d.garment} · {fmtDateTime(d.at)}{d.fixedAtQc ? ' · fixed at QC' : ''}</p>
                      </div>
                      <Badge tone={d.status === 'Resolved' ? 'success' : 'attention'}>{d.status === 'Resolved' ? 'Fixed' : 'Being fixed'}</Badge>
                    </li>)}
                </ul> : <p className="px-5 py-10 text-center text-ink-muted">No problems found in {first}’s work.</p>}
            </SectionCard>}
        </div>

        <aside className="space-y-5">
          <InfoCard title="Today">
            <p className="text-[16px] font-semibold">{e.status}</p>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-muted"><FingerprintIcon className="h-3.5 w-3.5" />{e.clockIn ? `Clocked in at ${e.clockIn}` : 'Not clocked in'}</p>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-muted"><MapPinIcon className="h-3.5 w-3.5" />{e.location}</p>
            {e.mobile && <p className="mt-1 text-sm text-ink-muted">{e.mobile}</p>}
            {e.address && <p className="mt-1 text-sm text-ink-muted">{e.address.replace(/\n/g, ', ')}</p>}
            <Link to={`/team/${e.id}/edit`} className="mt-3 inline-flex text-sm font-medium text-brand hover:underline">Edit details</Link>
          </InfoCard>

          <InfoCard title="Reports to">
            {boss ? <Link to={`/team/${boss.id}`} className="flex items-center gap-3 rounded-xl hover:opacity-80">
                <Avatar name={boss.name} size="sm" />
                <span><span className="block text-[15px] font-semibold">{boss.name}</span><span className="block text-sm text-ink-muted">{boss.role}</span></span>
              </Link> : <p className="text-[15px] text-ink-muted">Owner</p>}
            {team.length > 0 && <div className="mt-3 border-t border-line pt-3">
                <p className="mb-2 text-sm text-ink-muted">{team.length} people report to {first}</p>
                <div className="flex flex-wrap gap-1.5">
                  {team.map((t) => <Link key={t.id} to={`/team/${t.id}`} className="rounded-full bg-sunken px-2.5 py-1 text-sm hover:bg-line">{t.name.split(' ')[0]}</Link>)}
                </div>
              </div>}
          </InfoCard>

          <InfoCard title="Workload">
            <div className="flex items-baseline justify-between">
              <p className="text-[16px] font-semibold tabular">{active} of {e.capacity} tasks</p>
              <span className={cn('text-sm font-medium', load >= 100 ? 'text-critical' : load >= 80 ? 'text-warning' : 'text-ink-muted')}>{load >= 100 ? 'Full' : load >= 80 ? 'Nearly full' : 'Has room'}</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-sunken">
              <div className={cn('h-full rounded-full', load >= 100 ? 'bg-critical' : load >= 80 ? 'bg-warning' : 'bg-brand')} style={{
              width: `${Math.min(100, load)}%`
            }} />
            </div>
          </InfoCard>

          <InfoCard title="This week">
            <dl className="space-y-1.5 text-[15px]">
              <InfoLine k="Tasks done" v={e.tasksThisWeek} />
              <InfoLine k="Average time per task" v={e.avgCycleHrs ? `${e.avgCycleHrs} h` : '—'} />
              <InfoLine k="Sent back by QC" v={e.qcRejectRate ? `${e.qcRejectRate}%` : '—'} tone={e.qcRejectRate > 5 ? 'text-warning' : undefined} />
              <InfoLine k="Attendance" v={`${e.attendancePct}%`} />
            </dl>
          </InfoCard>
        </aside>
      </div>
    </div>;
}
function TaskList({
  rows,
  role,
  empty,
  finished





}: {rows: TaskRow[];role: Parameters<typeof orderLink>[0];empty: string;finished?: boolean;}) {
  if (!rows.length) return <p className="px-5 py-10 text-center text-ink-muted">{empty}</p>;
  return <ul className="divide-y divide-line">
      {rows.map(({
      task,
      orderId,
      garment,
      due
    }) => {
      const to = orderLink(role, orderId, 'workflow');
      const body = <>
            <div className="min-w-0 flex-1">
              <p className="font-mono text-sm text-ink-muted">{orderId}</p>
              <p className="truncate text-[15px] font-medium">{task.name} · {garment}</p>
              {task.instructions && <p className="truncate text-sm text-ink-subtle">{task.instructions}</p>}
            </div>
            {finished ? <span className="text-right text-sm text-ink-muted">{task.updatedAt ? fmtDate(task.updatedAt, 'd MMM') : 'Done'}</span> : <>
                  <Badge tone={task.rework ? 'attention' : task.status === 'In progress' ? 'info' : 'neutral'} dot>{task.rework ? 'Repair' : task.status}</Badge>
                  <span className={cn('hidden w-24 text-right text-sm sm:block', dueLabel(due).toLowerCase().includes('overdue') ? 'text-critical' : 'text-ink-muted')}>{dueLabel(due)}</span>
                </>}
          </>;
      return <li key={task.id}>{to ? <Link to={to} className="flex items-center gap-4 px-5 py-3 transition-colors duration-150 ease-out hover:bg-canvas">{body}</Link> : <div className="flex items-center gap-4 px-5 py-3">{body}</div>}</li>;
    })}
    </ul>;
}