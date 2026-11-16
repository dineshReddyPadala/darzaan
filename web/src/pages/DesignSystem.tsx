import React from 'react';
import { DocShell, type DocNavItem } from '../components/docs/DocShell';
import { CodeBlock, DoDont, DocSection, Preview, SpecTable, SubHeading, Token } from '../components/docs/DocBlocks';
import { ComponentPreview, OrderStatusMap } from '../components/docs/ComponentPreview';
import { categories, componentSpecs, type Category, type ComponentSpec } from '../data/designSystem';

const slug = (c: string) => c.toLowerCase().replace(/[^a-z]+/g, '-').replace(/-$/, '');

const nav: DocNavItem[] = [
{ id: 'principles', title: 'Principles' },
{ id: 'status', title: 'Status system' },
...categories.map((c) => ({ id: slug(c), title: c })),
{ id: 'patterns', title: 'Interaction patterns' },
{ id: 'contributing', title: 'Adding components' }];


const principles = [
{ title: 'Minimum per role', body: 'Each screen shows only what that role acts on. If a field doesn’t drive an action, it isn’t there. Hide what a role can’t use instead of disabling it.' },
{ title: 'Scan first, type last', body: 'Scanning is the primary input on the floor. Every scan has a typed fallback; every typed field uses the right keyboard.' },
{ title: 'The action is the record', body: 'A valid scan or a single button records the event with who and when. No extra confirm screens for reversible steps.' },
{ title: 'Text carries status', body: 'Colour reinforces, it never stands alone. Every status has a label; red is reserved for things that need someone now.' }];


export function DesignSystem() {
  return <DocShell current="designsystem" title="Design system" intro="The shared components behind every Darzaan screen, with live examples, props, states and usage rules. Built on the tokens in the style guide." nav={nav} meta={<p className="text-sm text-ink-muted">React 18 · TypeScript · Tailwind v3 · framer-motion · lucide-react · sonner. Named exports only. Components live in <Token>components/ui</Token> unless noted.</p>}>
      <DocSection id="principles" title="Principles">
        <div className="grid gap-x-10 gap-y-6 md:grid-cols-2">
          {principles.map((p, i) => <div key={p.title} className="flex gap-4">
              <span className="font-display text-[22px] leading-none text-brand">{i + 1}</span>
              <div>
                <h3 className="text-[16px] font-semibold">{p.title}</h3>
                <p className="mt-1.5 text-[15px] leading-relaxed text-ink-muted">{p.body}</p>
              </div>
            </div>)}
        </div>
      </DocSection>

      <DocSection id="status" title="Status system" intro="Statuses are derived, never typed in. Map domain status to a tone in utils/status.ts and render through Badge or DeliveryStateBadge.">
        <div>
          <SubHeading>Order status → Badge tone</SubHeading>
          <Preview><OrderStatusMap /></Preview>
          <p className="mt-3 text-sm text-ink-muted">Store roles see “In workshop” instead of “In Production” and never see workshop step names. Production roles see the step.</p>
        </div>
        <SpecTable headers={['Tone', 'Meaning', 'Examples']} widths={['w-32', 'w-64']} rows={[
      ['neutral', 'Not started or finished, nothing to do', 'Draft, Closed, Ready to pack'],
      ['brand', 'Moving normally', 'In Production, Packed'],
      ['info', 'Confirmed / on its way', 'Confirmed, Out for delivery'],
      ['success', 'Done or ready for the customer', 'Ready for Trial, Ready for Pickup, Delivered, Passed'],
      ['attention', 'Needs a look soon', 'Alteration, Unassigned, Waiting for QC recheck'],
      ['warning', 'Time is tight', 'Due in 2 days, Express'],
      ['critical', 'Someone must act now', 'Overdue, Behind, Failed QC, Wrong store, Needs attention']]
      } />
        <SpecTable headers={['Package state', 'Label', 'Set when']} widths={['w-36', 'w-44']} rows={[
      ['ready', 'Ready to pack', 'Production Assistant sends the garment to packing'],
      ['packing', 'Packing', 'Logistics starts the checklist'],
      ['packed', 'Packed', 'All items ticked and label attached'],
      ['transit', 'Out for delivery', 'A driver is assigned'],
      ['delivered', 'Received / Delivered', 'Correct-store scan, or customer OTP for home delivery'],
      ['attention', 'Needs attention', 'Missing item, wrong-store scan, discrepancy']]
      } />
      </DocSection>

      {categories.map((c) => <CategorySection key={c} category={c} specs={componentSpecs.filter((s) => s.category === c)} />)}

      <DocSection id="patterns" title="Interaction patterns" intro="How components combine. Follow these before inventing a new flow.">
        <SpecTable headers={['Situation', 'Pattern', 'Why']} widths={['w-56', 'w-80']} rows={[
      ['Reversible action', 'Act immediately + toast. Undo from the record.', 'No confirmation dialogs for things that can be changed back'],
      ['Irreversible action', 'Modal with a reason field; danger button names the outcome ("Cancel order").', 'Prevents accidental taps on a touch screen'],
      ['Action needs input', 'Modal; primary disabled until valid; inline errors on submit.', 'Keeps the user on the page'],
      ['Multi-step task', 'OrderStepRail + ContextHeader + sticky Back / Continue footer.', 'Order form, QC inspection, Pack order share one shape'],
      ['Edit from Review', 'Jump to the step; button reads "Save & back to review"; returns to Review.', 'Avoids walking through every later step again'],
      ['List filters', 'KPI tiles filter in place; FilterMenu for long lists; chips for 2–6 values.', 'Never navigate away from a tile'],
      ['Scan outcome', 'Valid → act and show the result. Invalid → coloured message naming the fix; nothing recorded.', 'Wrong store / not found / already received / unreadable'],
      ['Permission', 'Hide controls a role can’t use. Deep link to a blocked screen → "You don’t have access" + Go home.', 'Avoids greyed-out clutter'],
      ['Device fallback', 'Camera denied → typed ID. Printer missing → label preview with browser print.', 'Work never stops on hardware']]
      } />
        <div>
          <SubHeading>Form validation flow</SubHeading>
          <ol className="space-y-2 text-[15px] leading-relaxed text-ink-muted">
            <li><span className="font-medium text-ink">1.</span> No errors while the user is filling in the form for the first time.</li>
            <li><span className="font-medium text-ink">2.</span> On Continue / submit, outline every invalid field in critical and scroll to the first.</li>
            <li><span className="font-medium text-ink">3.</span> Show one message naming the first gap near the button: “Pattern Blouse: enter Armhole”.</li>
            <li><span className="font-medium text-ink">4.</span> Errors clear live as each field becomes valid.</li>
          </ol>
        </div>
      </DocSection>

      <DocSection id="contributing" title="Adding components">
        <DoDont dos={['Check this page first — most needs are a variant of an existing component.', 'Build with tokens only and expose variants as string-literal props.', 'Cover default, hover, focus-visible, disabled, loading and error where they apply.', 'Add the component here with a live example and props table.']} donts={['Don’t fork a component into a near-duplicate (two scanner dialogs exist today; merge them).', 'Don’t use transition-all, ease-in, or anything over 300ms.', 'Don’t add gradients, decorative shapes, or emoji icons.', 'Don’t hardcode hex or Tailwind palette colours.']} />
      </DocSection>
    </DocShell>;
}

function CategorySection({ category, specs }: {category: Category;specs: ComponentSpec[];}) {
  return <DocSection id={slug(category)} title={category}>
      <div className="space-y-12">
        {specs.map((s) => <ComponentEntry key={s.id} spec={s} />)}
      </div>
    </DocSection>;
}

function ComponentEntry({ spec }: {spec: ComponentSpec;}) {
  return <article id={spec.id} aria-labelledby={`${spec.id}-name`} className="scroll-mt-24 space-y-4">
      <header>
        <h3 id={`${spec.id}-name`} className="text-[20px] font-semibold">{spec.name}</h3>
        <p className="mt-1 font-mono text-[12.5px] text-ink-subtle">{spec.file}</p>
        <p className="mt-2 max-w-3xl text-[15px] leading-relaxed text-ink-muted">{spec.purpose}</p>
      </header>
      <Preview label="Live example">
        <ComponentPreview id={spec.id} />
      </Preview>
      {spec.props && <SpecTable headers={['Prop', 'Type', 'Default', 'Description']} widths={['w-44', 'w-64', 'w-24']} rows={spec.props.map((p) => [<span className="font-mono text-[13px]">{p.name}</span>, <span className="font-mono text-[12.5px]">{p.type}</span>, p.defaultValue ? <span className="font-mono text-[12.5px]">{p.defaultValue}</span> : '—', p.description])} />}
      {spec.states && <p className="text-sm leading-relaxed text-ink-muted"><span className="font-medium text-ink">States: </span>{spec.states}</p>}
      <DoDont dos={spec.dos} donts={spec.donts} />
      {spec.a11y && <p className="text-sm leading-relaxed text-ink-muted"><span className="font-medium text-ink">Accessibility: </span>{spec.a11y}</p>}
      {spec.code && <CodeBlock code={spec.code} />}
    </article>;
}