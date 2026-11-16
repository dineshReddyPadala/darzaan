export const inputClass =
'h-11 w-full rounded-xl border border-line-strong bg-surface px-3.5 text-[15px] text-ink placeholder:text-ink-subtle transition-[border-color,box-shadow] duration-150 ease-out focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 disabled:bg-sunken disabled:text-ink-subtle';

export const textareaClass =
'w-full rounded-xl border border-line-strong bg-surface px-3.5 py-3 text-[15px] text-ink placeholder:text-ink-subtle transition-[border-color,box-shadow] duration-150 ease-out focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20';

export const panelClass = 'rounded-2xl border border-line bg-surface shadow-soft';

/** Order lists: stacked cards on phone/tablet, a single ruled table from desktop up. */
export const orderListPanelClass = 'lg:rounded-2xl lg:border lg:border-line lg:bg-surface lg:shadow-soft';
export const orderListClass = 'grid gap-3 sm:grid-cols-2 lg:block lg:divide-y lg:divide-line';

/** Read-only metric tile (not interactive). */
export const kpiTileClass = 'flex min-w-[148px] flex-col md:min-w-0 rounded-2xl border border-line bg-surface px-5 py-4 shadow-soft';

/** One stand-alone metric tile that acts as a filter. */
export const statTileClass =
'flex min-w-[148px] flex-col rounded-2xl border border-line bg-surface px-5 py-4 shadow-soft transition-[border-color,background-color] duration-150 ease-out hover:border-line-strong';

export const pageClass = 'mx-auto w-full max-w-[1440px] px-4 py-6 md:px-6 lg:px-8 lg:py-8';

export const chipClass = (active: boolean): string =>
`inline-flex h-10 items-center gap-2 whitespace-nowrap rounded-full px-4 text-sm font-medium transition-[background-color,color,box-shadow] duration-150 ease-out ${
active ? 'bg-brand-soft text-brand-hover ring-1 ring-inset ring-brand/30' : 'bg-surface text-ink-muted ring-1 ring-inset ring-line-strong hover:text-ink hover:bg-sunken'}`;