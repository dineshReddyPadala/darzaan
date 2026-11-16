import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'sonner';
import { useSyncedList } from '../../hooks/useSyncedList';
import { storedOrSample } from '../../services/sync';
import { categories as seed, type CategoryDef } from '../../data/catalog';
import { cn } from '../../utils/cn';
import { panelClass } from '../../utils/styles';
import { Button } from '../ui/Button';
import { Segmented } from '../ui/Segmented';
import { CategoryList } from './catalog/CategoryList';
import { MeasurementFieldList } from './catalog/MeasurementFieldList';
import { SubCategoryTable } from './catalog/SubCategoryTable';
import { FitDetailsEditor, fitDetailInvalid } from './FitDetailsEditor';

type Section = 'items' | 'measurements' | 'fit';

/** Segment label with its count; the active one is filled brand so it reads clearly against the page tabs above. */
function SectionLabel({ text, count, active }: {text: string;count: number;active: boolean;}) {
  return <>
      <span className={active ? 'font-semibold text-ink' : undefined}>{text}</span>
      <span className={cn('rounded-full px-1.5 text-xs tabular', active ? 'bg-brand text-white' : 'bg-surface text-ink-muted')}>{count}</span>
    </>;
}

/** Catalogue editor: pick one category on the left, edit one section of it at a time on the right. */
export function CatalogSettings({ focus }: { focus?: string }) {
  const [saved, setSaved] = useSyncedList<CategoryDef[]>('catalog', seed);
  const [cats, setCats] = useState<CategoryDef[]>(() => storedOrSample('catalog', seed));
  const [sel, setSel] = useState(focus || seed[0]?.name || '');
  const [section, setSection] = useState<Section>('items');
  const cat = cats.find((c) => c.name === sel && !c.deletedAt) ?? cats.find((c) => !c.deletedAt);
  const update = (fn: (c: CategoryDef) => CategoryDef) => {
    if (!cat) return;
    setCats((prev) => prev.map((c) => c.name === cat.name ? fn(c) : c));
  };

  const changed = useMemo(() => {
    const before = new Map(saved.map((c) => [c.name, JSON.stringify(c)]));
    return new Set(cats.filter((c) => before.get(c.name) !== JSON.stringify(c)).map((c) => c.name));
  }, [cats, saved]);
  const invalid = cats.some((c) => c.measurements.details.some((detail) => !detail.deletedAt && fitDetailInvalid(detail)));

  const addCategory = (name: string) => {
    setCats((prev) => [...prev, {
      code: String.fromCharCode(65 + prev.length % 26) + (prev.length >= 26 ? Math.floor(prev.length / 26) : ''),
      meters: 2,
      name,
      subCategories: [],
      measurements: { fields: [], details: [] }
    }]);
    setSel(name);
    setSection('items');
  };
  const save = () => {
    setSaved(cats);
    toast.success(changed.size === 1 ? `${[...changed][0]} saved` : `${changed.size} categories saved`);
  };

  if (!cat) return <div className="pb-24">
      <CategoryList categories={cats} selected="" changed={changed} onSelect={setSel} onAdd={addCategory} />
      <p className="mt-6 text-sm text-ink-muted">No categories saved yet. Add one to build the price list.</p>
    </div>;

  return <div className="pb-24">
      <div className="grid gap-6 md:grid-cols-[260px_minmax(0,1fr)] md:items-start">
        <CategoryList categories={cats} selected={cat.name} changed={changed} onSelect={setSel} onAdd={addCategory} />
        <section className={cn(panelClass, 'overflow-hidden')} aria-label={cat.name}>
          <header className="px-5 pt-4">
            <p className="text-sm text-ink-subtle">Category {cat.code}</p>
            <h3 className="font-display text-2xl text-ink">{cat.name}</h3>
            <div className="no-scrollbar -mx-1 mt-3 overflow-x-auto px-1 pb-4">
              <Segmented<Section> ariaLabel="Category section" value={section} onChange={setSection} options={[{
              value: 'items',
              label: <SectionLabel text="Items & prices" count={cat.subCategories.filter((item) => !item.deletedAt).length} active={section === 'items'} />
            }, {
              value: 'measurements',
              label: <SectionLabel text="Measurements" count={cat.measurements.fields.length} active={section === 'measurements'} />
            }, {
              value: 'fit',
              label: <SectionLabel text="Fit details" count={cat.measurements.details.filter((detail) => !detail.deletedAt).length} active={section === 'fit'} />
            }]} />
            </div>
          </header>
          <div className="border-t border-line" />
          <div key={`${cat.name}-${section}`}>
            {section === 'items' && <SubCategoryTable items={cat.subCategories} onChange={(subCategories) => update((c) => ({ ...c, subCategories }))} />}
            {section === 'measurements' && <MeasurementFieldList fields={cat.measurements.fields} onChange={(fields) => update((c) => ({ ...c, measurements: { ...c.measurements, fields } }))} />}
            {section === 'fit' && <FitDetailsEditor details={cat.measurements.details} onChange={(details) => update((c) => ({ ...c, measurements: { ...c.measurements, details } }))} />}
          </div>
        </section>
      </div>
      <AnimatePresence>
        {changed.size > 0 && <motion.div initial={{
        opacity: 0,
        y: 16
      }} animate={{
        opacity: 1,
        y: 0
      }} exit={{
        opacity: 0,
        y: 16
      }} transition={{
        duration: 0.2,
        ease: [0.23, 1, 0.32, 1]
      }} className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 backdrop-blur md:left-auto md:right-6 md:bottom-6 md:rounded-2xl md:border md:shadow-pop">
            <div className="flex items-center gap-3 px-4 py-3">
              <p className="min-w-0 flex-1 text-sm">
                <span className="font-medium">{changed.size === 1 ? `Unsaved changes in ${[...changed][0]}` : `Unsaved changes in ${changed.size} categories`}</span>
                {invalid && <span className="block text-critical">Fix the fit details marked “Needs attention” first.</span>}
              </p>
              <Button variant="ghost" size="sm" onClick={() => setCats(saved)}>Discard</Button>
              <Button size="sm" disabled={invalid} onClick={save}>Save changes</Button>
            </div>
          </motion.div>}
      </AnimatePresence>
    </div>;
}