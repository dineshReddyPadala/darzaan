import React, { useState } from 'react';
import { addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameMonth, parseISO, startOfMonth, startOfWeek } from 'date-fns';
import { ChevronLeftIcon, ChevronRightIcon, ZapIcon } from 'lucide-react';
import { cn } from '../../utils/cn';
import type { Order } from '../../types';
import { levelFor, levelMeta, loadForDate, type CapacityLevel } from '../../utils/capacity';
import { TODAY, TODAY_ISO } from '../../utils/format';
interface DeliveryHeatmapProps {
  selected?: string;
  onSelect?: (iso: string) => void;
  minDate?: string;
  markers?: Record<string, number>;
  /** Dates an express garment is due — shown with a lightning mark. */
  urgent?: string[];
  size?: 'compact' | 'large';
  /** Month to open on when nothing is selected. */
  startOn?: string;
  /** Colour each day by workshop capacity. Off for calendars where capacity means nothing (trials). */
  showLoad?: boolean;
  /** Live capacity from orders; omit to use demo static curve. */
  orders?: Order[];
}
export function DeliveryHeatmap({
  selected,
  onSelect,
  minDate = TODAY_ISO,
  markers,
  urgent = [],
  size = 'compact',
  startOn,
  showLoad = true,
  orders
}: DeliveryHeatmapProps) {
  const [month, setMonth] = useState(startOfMonth(selected ? parseISO(selected) : startOn ? parseISO(startOn) : TODAY));
  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(month), {
      weekStartsOn: 1
    }),
    end: endOfWeek(endOfMonth(month), {
      weekStartsOn: 1
    })
  });
  return <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[15px] font-semibold">{format(month, 'MMMM yyyy')}</p>
        <div className="flex gap-1">
          <button type="button" aria-label="Previous month" onClick={() => setMonth(addMonths(month, -1))} className="flex h-10 w-10 items-center justify-center rounded-lg text-ink-muted hover:bg-sunken">
            <ChevronLeftIcon className="h-5 w-5" />
          </button>
          <button type="button" aria-label="Next month" onClick={() => setMonth(addMonths(month, 1))} className="flex h-10 w-10 items-center justify-center rounded-lg text-ink-muted hover:bg-sunken">
            <ChevronRightIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1.5 text-center text-[11px] font-medium uppercase tracking-wide text-ink-muted">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => <span key={d} className="py-1">{d.slice(0, size === 'compact' ? 1 : 3)}</span>)}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1.5">
        {days.map((day) => {
        const iso = format(day, 'yyyy-MM-dd');
        if (!isSameMonth(day, month)) return <span key={iso} />;
        const load = showLoad ? loadForDate(iso, orders) : null;
        const level: CapacityLevel | null = load !== null ? levelFor(load) : null;
        const unavailable = iso < minDate;
        const isSelected = iso === selected;
        const isToday = iso === TODAY_ISO;
        const isUrgent = urgent.includes(iso);
        const marker = markers?.[iso];
        return <button key={iso} type="button" disabled={!onSelect || unavailable} onClick={() => onSelect?.(iso)} title={load !== null ? `${format(day, 'd MMM')} — ${load}% capacity` : undefined} aria-label={`${format(day, 'd MMMM')}${unavailable ? ', unavailable' : load !== null ? `, ${load}% capacity, ${levelMeta[level as CapacityLevel].label}` : ''}${isUrgent ? ', express garment due' : ''}`} aria-pressed={isSelected} className={cn('relative flex flex-col items-center justify-center rounded-lg text-sm tabular transition-[box-shadow,transform] duration-150 ease-out', size === 'large' ? 'h-16' : 'h-10', isSelected ? 'z-[1] ring-2 ring-brand ring-offset-2' : unavailable ? 'bg-sunken text-ink-muted line-through decoration-ink-muted' : level ? levelMeta[level].cell : 'bg-sunken text-ink-muted', onSelect && !unavailable && !isSelected && 'hover:ring-2 hover:ring-brand/40 active:scale-95', isUrgent && !isSelected && 'ring-2 ring-[#5B21B6] ring-offset-1', 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2', !onSelect && 'cursor-default')}>
              <span className={cn('font-semibold', isToday && 'underline decoration-2 underline-offset-2')}>{format(day, 'd')}</span>
              {size === 'large' && load !== null && !unavailable && <span className="text-[11px] font-medium">{load}%</span>}
              {isUrgent && <ZapIcon className={cn('absolute left-1 top-1 h-3.5 w-3.5', isSelected ? 'text-brand' : level === 'overloaded' ? 'text-white' : 'text-[#5B21B6]')} aria-hidden />}
              {marker ? <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-surface px-1 text-[10px] font-semibold text-ink ring-1 ring-line-strong">{marker}</span> : null}
            </button>;
      })}
      </div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
        {showLoad && (Object.keys(levelMeta) as CapacityLevel[]).map((l) => <span key={l} className="flex items-center gap-1.5 text-xs text-ink-muted">
            <span className={cn('h-3.5 w-3.5 rounded', levelMeta[l].dot)} />
            {levelMeta[l].label}
          </span>)}
        {onSelect && <span className="flex items-center gap-1.5 text-xs text-ink-muted"><span className="h-3.5 w-3.5 rounded bg-ink" />Selected</span>}
        {onSelect && showLoad && <span className="flex items-center gap-1.5 text-xs text-ink-muted"><span className="h-3.5 w-3.5 rounded bg-sunken ring-1 ring-inset ring-ink-muted" />Unavailable</span>}
        {!showLoad && markers && <span className="flex items-center gap-1.5 text-xs text-ink-muted"><span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-surface px-1 text-[10px] font-semibold text-ink ring-1 ring-line-strong">2</span>Trials booked</span>}
        {urgent.length > 0 && <span className="flex items-center gap-1.5 text-xs text-ink-muted"><ZapIcon className="h-3.5 w-3.5 text-[#5B21B6]" />Express due</span>}
      </div>
    </div>;
}