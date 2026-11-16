import React, { useEffect, useState } from 'react';
import { CheckIcon } from 'lucide-react';
import { listProductionAssistants } from '../../services/api';
import { apiMode } from '../../services/mode';
import type { Employee } from '../../types';
import { teamList } from '../../utils/team';
import { cn } from '../../utils/cn';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';

function isAssistant(person: { role?: string; roleId?: string; title?: string }): boolean {
  if (person.roleId === 'production_assistant' || person.role === 'production_assistant') return true;
  const label = (person.title || person.role || '').trim().toLowerCase();
  return label === 'production assistant' || label === 'production assistance';
}

interface Props {
  open: boolean;
  garment: string;
  customer: string;
  current?: string;
  /** Set when the card was dragged with nobody on it — assigning also moves it. */
  moveTo?: string;
  onPick: (name: string) => void;
  onClose: () => void;
}

/** Pick the one production assistant who runs this garment, without leaving the board. */
export function AssignAssistantModal({ open, garment, customer, current, moveTo, onPick, onClose }: Props) {
  const [accounts, setAccounts] = useState<Employee[] | null>(null);
  useEffect(() => {
    if (!open) return;
    if (!apiMode) {
      setAccounts(null);
      return;
    }
    let live = true;
    listProductionAssistants()
      .then((rows) => {
        if (!live) return;
        setAccounts(rows.map((row) => ({
          id: row.id,
          name: row.name,
          role: row.title || 'Production Assistant',
          roleId: 'production_assistant',
          station: row.title || 'Production Assistant',
          location: row.location,
          storeId: row.storeId,
          status: 'On shift',
          activeTasks: 0,
          capacity: 0,
          qcRejectRate: 0,
          avgCycleHrs: 0,
          tasksThisWeek: 0,
          attendancePct: 0,
        })));
      })
      .catch(() => {
        if (live) setAccounts([]);
      });
    return () => { live = false; };
  }, [open]);
  const fromTeam = teamList().filter((person) => !person.disabled && isAssistant(person));
  const assistants = accounts
    ? [...accounts, ...fromTeam.filter((person) => !accounts.some((account) => account.name === person.name))]
    : fromTeam;
  const [pick, setPick] = useState(current ?? '');
  useEffect(() => {
    if (open) setPick(current ?? '');
  }, [open, current]);
  return <Modal open={open} onClose={onClose} title={moveTo ? 'No worker assigned' : 'Assign production assistant'} description={moveTo ? `Assign someone before moving ${garment} to ${moveTo}.` : `${garment} · ${customer}`} footer={<>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button disabled={!pick} onClick={() => onPick(pick)}>{moveTo ? 'Assign & move' : 'Assign'}</Button>
      </>}>
      <div role="radiogroup" aria-label="Production assistant" className="space-y-2">
        {assistants.length === 0 && <p className="text-[15px] text-ink-muted">No production assistant is on file yet. Add one under Team, then assign them here.</p>}
        {assistants.map((a) => {
        const on = pick === a.name;
        return <button key={a.id} type="button" role="radio" aria-checked={on} onClick={() => setPick(a.name)} className={cn('flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-[border-color,background-color] duration-150 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-brand', on ? 'border-brand bg-brand-soft' : 'border-line-strong hover:border-ink-subtle')}>
              <Avatar name={a.name} size="sm" />
              <span className="flex-1 text-[15px] font-medium">{a.name}</span>
              {a.capacity > 0 && <span className="text-sm tabular text-ink-muted">{a.activeTasks} active</span>}
              <CheckIcon className={cn('h-5 w-5 text-brand', !on && 'invisible')} aria-hidden />
            </button>;
      })}
      </div>
    </Modal>;
}