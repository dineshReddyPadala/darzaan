import React from "react";
import { BanknoteIcon, BoxIcon, CalendarCheckIcon, CheckCircle2Icon, FactoryIcon, GitPullRequestIcon, MessageCircleIcon, PenLineIcon, PlusCircleIcon, RulerIcon, ScissorsIcon, ShieldCheckIcon, SparklesIcon, TruckIcon, UserCheckIcon, WrenchIcon, type LucideIcon } from "lucide-react";
import { ActivityEvent, ActivityKind } from "../../types";
import { fmtDate, fmtDateTime } from "../../utils/format";
const icons: Record<ActivityKind, LucideIcon> = {
  created: PlusCircleIcon,
  payment: BanknoteIcon,
  signature: PenLineIcon,
  design: SparklesIcon,
  measurement: RulerIcon,
  production: FactoryIcon,
  assignment: UserCheckIcon,
  qc: ShieldCheckIcon,
  rework: WrenchIcon,
  logistics: TruckIcon,
  trial: CalendarCheckIcon,
  alteration: ScissorsIcon,
  delivery: BoxIcon,
  closure: CheckCircle2Icon,
  communication: MessageCircleIcon,
  change: GitPullRequestIcon
};
export function OrderTimeline({
  events,
  compact



}: {events: ActivityEvent[];compact?: boolean;}) {
  const sorted = [...events].sort((a, b) => b.at.localeCompare(a.at));
  let lastDay = '';
  return <ol className="relative">
      {sorted.map((e, i) => {
      const day = fmtDate(e.at, 'EEE, d MMM');
      const showDay = day !== lastDay;
      lastDay = day;
      const Icon = icons[e.kind];
      return <li key={e.id}>
            {showDay && <p className={`pb-2 text-xs font-semibold uppercase tracking-wide text-ink-subtle ${i > 0 ? 'pt-4' : ''}`}>{day}</p>}
            <div className="relative flex gap-3 pb-4">
              {i < sorted.length - 1 && <span className="absolute left-4 top-9 h-[calc(100%-28px)] w-px bg-line" aria-hidden />}
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sunken text-ink-muted">
                <Icon className="h-4 w-4" />
              </span>
              <div className="min-w-0 pt-1">
                <p className={compact ? 'text-sm leading-snug' : 'text-[15px] leading-snug'}>{e.what}</p>
                <p className="mt-0.5 text-xs text-ink-subtle">
                  {e.who} · {fmtDateTime(e.at)}
                </p>
              </div>
            </div>
          </li>;
    })}
    </ol>;
}