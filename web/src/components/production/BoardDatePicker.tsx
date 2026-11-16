import React, { useRef } from 'react';
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { cn } from '../../utils/cn';
import { fmtDate, isoPlusDays, TODAY_ISO } from '../../utils/format';

interface Props {
  value: string;
  onChange: (iso: string) => void;
  /** Garments scheduled after this day, shown as a quiet hint under the picker. */
  laterCount?: number;
}

/** Day stepper for the board: ‹ day › with the calendar behind the middle, and a way back to today. */
export function BoardDatePicker({ value, onChange, laterCount = 0 }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const isToday = value === TODAY_ISO;
  const step = (n: number) => onChange(isoPlusDays(value, n));
  const open = () => {
    const el = input.current;
    if (!el) return;
    try {
      el.showPicker();
    } catch {
      el.focus();
    }
  };
  const arrow = 'flex w-11 items-center justify-center text-ink-muted transition-colors duration-150 ease-out hover:bg-sunken hover:text-ink focus:outline-none focus-visible:bg-sunken focus-visible:text-ink';
  return <div className="flex flex-col items-start gap-1.5 md:items-end">
      <div className="flex items-center gap-2">
        {!isToday && <button type="button" onClick={() => onChange(TODAY_ISO)} className="h-11 rounded-xl px-3 text-sm font-medium text-brand transition-colors duration-150 ease-out hover:bg-brand-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-brand">
            Back to today
          </button>}
        <div className="flex h-11 items-stretch overflow-hidden rounded-xl border border-line-strong bg-surface shadow-soft">
          <button type="button" onClick={() => step(-1)} aria-label="Previous day" className={arrow}>
            <ChevronLeftIcon className="h-4 w-4" />
          </button>
          <div className="relative border-x border-line">
            <button type="button" onClick={open} aria-label={`Board date: ${fmtDate(value, 'EEEE d MMMM')}. Choose a date`} className="flex h-full min-w-[168px] items-center justify-center gap-2 px-4 transition-colors duration-150 ease-out hover:bg-sunken focus:outline-none focus-visible:bg-sunken">
              <CalendarIcon className="h-4 w-4 text-ink-muted" aria-hidden />
              <span className="text-[15px] font-semibold">{isToday ? 'Today' : fmtDate(value, 'EEE')}</span>
              <span className={cn('text-[15px] tabular', isToday ? 'text-ink-muted' : 'font-semibold')}>{fmtDate(value, 'd MMM')}</span>
            </button>
            <input ref={input} type="date" tabIndex={-1} aria-hidden value={value} onChange={(e) => e.target.value && onChange(e.target.value)} className="pointer-events-none absolute inset-x-0 bottom-0 h-0 w-full opacity-0" />
          </div>
          <button type="button" onClick={() => step(1)} aria-label="Next day" className={arrow}>
            <ChevronRightIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
      {laterCount > 0 && <p className="text-sm text-ink-muted">{laterCount} {laterCount === 1 ? 'garment starts' : 'garments start'} after this day</p>}
    </div>;
}