import type { Urgency } from '../types';

/**
 * Price list — the prototype's stand-in for the catalogue table in the database.
 * Every sub-category carries its own price; selecting it in the order form fills the price in.
 * Prices follow the 2026 consolidated list; tassel work is picked as an attachment.
 */

export interface SubCategoryDef {
  name: string;
  basePrice: number;
  /** Optional heading the item is listed under in the dropdown, e.g. "Skirts". */
  group?: string;
  /** Short note from the price list, e.g. "6 kalis". */
  remark?: string;
  /** Measurement chart for this item when it differs from its category's (e.g. skirts under Western Wear). */
  spec?: MeasureSpec;
  deletedAt?: string;
}

/** A required yes/no, pick-one or written detail recorded with the measurements. */
type DetailBase = { name: string; deletedAt?: string };
export type DetailDef = (DetailBase & { kind: 'yesno' }) | (DetailBase & { kind: 'choice'; options: string[] }) | (DetailBase & { kind: 'note' });

/** One measurement chart: the numbers to take, plus the yes/no and preference details. All are required. */
export interface MeasureSpec {
  fields: string[];
  details: DetailDef[];
}

export interface CategoryDef {
  /** A, B, C… as in the price list. */
  code: string;
  name: string;
  subCategories: SubCategoryDef[];
  measurements: MeasureSpec;
  /** Saved measurement profiles of this kind can be reused (profiles are labelled with the older names). */
  profile?: string;
  /** Default fabric length in metres when Darzaan supplies the fabric. */
  meters: number;
  /** Missing means the category is active. */
  active?: boolean;
  deletedAt?: string;
}

/** Measurement charts from the workshop's list. Every field and detail is required. Lining is asked in its own section. */
const yesno = (name: string): DetailDef => ({ name, kind: 'yesno' });
const choice = (name: string, options: string[]): DetailDef => ({ name, kind: 'choice', options });
const ZIP = ['Side', 'Back', 'Front'];

const BLOUSE: MeasureSpec = {
  fields: ['Blouse length front', 'Blouse length back', 'Shoulder', 'Bust', 'Upper bust', 'Under bust', 'Blouse waist', 'Front length', 'Back length', 'Armhole', 'Sleeve length', 'Sleeve round mid', 'Sleeve round end', 'Front neck deep', 'Front neck width', 'Back neck deep', 'Back neck width', 'Front cross', 'Back cross', 'Shoulder to apex', 'Shoulder to waist', 'Apex to apex', 'Back opening', 'Front opening'],
  details: [yesno('Padding'), yesno('Hooks'), yesno('Buttons'), { name: 'Shoulder slope and posture notes', kind: 'note' }]
};
const JACKET: MeasureSpec = {
  fields: ['Shoulder', 'Armhole', 'Front cross', 'Back cross', 'Sleeve length', 'Sleeve round', 'Elbow', 'Wrist', 'Length front', 'Length back', 'Waist', 'Low waist'],
  details: [yesno('Shoulder pads'), yesno('Fusing'), yesno('Lapel')]
};
const KURTA: MeasureSpec = {
  fields: ['Front length', 'Back length', 'Shoulder', 'Bust', 'Front cross', 'Back cross', 'Waist', 'Stomach', 'Low waist', 'Hip', 'Armhole', 'Sleeve length', 'Sleeve round', 'Neck deep', 'Neck width', 'Side slit length', 'Daman width'],
  details: [choice('Fit preference', ['Slim', 'Regular', 'Loose']), choice('Opening', ['Front', 'Back', 'Side']), choice('Elastic, buttons or drawstring', ['Elastic', 'Buttons', 'Drawstring'])]
};
const ANARKALI: MeasureSpec = {
  fields: ['Bodice length front', 'Bodice length back', 'Shoulder', 'Bust', 'Upper bust', 'Under bust', 'Bodice waist', 'Bodice front length', 'Bodice back length', 'Armhole', 'Sleeve length', 'Sleeve round mid', 'Sleeve round end', 'Front neck deep', 'Front neck width', 'Back neck deep', 'Back neck width', 'Front cross', 'Back cross', 'Shoulder to apex', 'Shoulder to waist', 'Apex to apex', 'Waist to full length', 'Full garment length', 'Flare', 'Back opening / zip length', 'Number of kalis', 'Width of kalis'],
  details: [yesno('Can-can')]
};
const LEHENGA: MeasureSpec = {
  fields: ['Waist', 'Low waist', 'Hip', 'Waist to floor length', 'Waist to ankle length', 'Lehenga length', 'Lehenga flare / circumference'],
  details: [choice('Can-can volume', ['None', 'Light', 'Medium', 'Full']), choice('Zip placement', ZIP)]
};
const BOTTOMS: MeasureSpec = {
  fields: ['Waist', 'Hip', 'Thigh', 'Knee', 'Calf', 'Ankle', 'Crotch', 'Front rise', 'Back rise', 'Inseam', 'Full length'],
  details: [choice('Zip placement', [...ZIP, 'No zip']), choice('Elastic or drawstring', ['Elastic', 'Drawstring'])]
};
const PALAZZO: MeasureSpec = {
  fields: ['Waist', 'Hip', 'Thigh', 'Rise', 'Inseam', 'Full length', 'Bottom circumference'],
  details: [yesno('Can-can'), choice('Zip placement', [...ZIP, 'No zip']), choice('Waistband', ['Elastic', 'Drawstring'])]
};
const NONE: MeasureSpec = { fields: [], details: [] };

/** Fields counted rather than measured in inches. */
const COUNTED = ['Number of kalis'];
export const measurementUnit = (field: string) => COUNTED.includes(field) ? 'pcs' : 'in';

const withSpec = (subs: SubCategoryDef[], spec: MeasureSpec) => subs.map((s) => ({ ...s, spec }));

/** Three-tier items: Simple / Complicated / Designer under one heading. */
const tiers = (group: string, prices: [number, number, number], prefix = group): SubCategoryDef[] => [
{ name: `${prefix} – Simple`, basePrice: prices[0], group },
{ name: `${prefix} – Complicated`, basePrice: prices[1], group },
{ name: `${prefix} – Designer`, basePrice: prices[2], group }];


/** Fabrics kept in stock for lining. */
export const liningFabrics = ['Cotton', 'Mul cotton', 'Satin', 'Shantoon', 'Crepe', 'Net'];

/** Tailoring & Stitching Price List 2026 (consolidated). Remarks come from the list's Remarks column. */
export const categories: CategoryDef[] = [
{
  code: 'A', name: 'Blouses', profile: 'Blouse', meters: 1.5, measurements: BLOUSE,
  subCategories: [
  { name: 'Princess Cut', basePrice: 1200 },
  { name: 'Darted Blouse', basePrice: 1000 },
  { name: 'Pattern Blouse', basePrice: 1500, remark: 'Includes piping, patches & cloth tassels/dories' }]

},
{
  code: 'B', name: 'Saree & Border Services', meters: 0, measurements: NONE,
  subCategories: [
  { name: 'Saree Fall & Pico', basePrice: 300, group: 'Saree finishing' },
  { name: 'Can-Can Stitching', basePrice: 500, group: 'Saree finishing' },
  { name: 'Saree Knots – Basic', basePrice: 500, group: 'Saree Knots' },
  { name: 'Saree Knots – Simple Pattern', basePrice: 800, group: 'Saree Knots', remark: 'Customised' },
  { name: 'Saree Knots – Complicated Pattern', basePrice: 1500, group: 'Saree Knots', remark: 'Customised' },
  { name: 'Saree Border – Simple', basePrice: 1000, group: 'Saree Border' },
  { name: 'Saree Border – Pattern', basePrice: 2000, group: 'Saree Border', remark: 'Stones & maggam' },
  { name: 'Border Backing, Dupatta – Simple', basePrice: 500, group: 'Border Backing', remark: 'Without fusing' },
  { name: 'Border Backing, Dupatta – Pattern', basePrice: 1000, group: 'Border Backing', remark: 'With fusing' },
  { name: 'Border Backing, Lehenga – Basic', basePrice: 1000, group: 'Border Backing', remark: 'Without fusing, 6 kalis' },
  { name: 'Ready-made Saree', basePrice: 3500, group: 'Sarees' },
  { name: 'Cocktail Saree', basePrice: 7500, group: 'Sarees' }]

},
{
  code: 'C', name: 'Kurta & Kurta Sets', profile: 'Kurta', meters: 2.5, measurements: KURTA,
  subCategories: [
  { name: 'Basic Kurta', basePrice: 1000 },
  { name: 'Pattern Kurta – Simple', basePrice: 1500, group: 'Pattern Kurta' },
  { name: 'Pattern Kurta – Complicated', basePrice: 2500, group: 'Pattern Kurta' },
  { name: 'Pattern Kurta Set', basePrice: 3500, remark: 'With pant' }]

},
{
  code: 'D', name: 'Anarkali', profile: 'Anarkali', meters: 7, measurements: ANARKALI,
  subCategories: [
  { name: 'Basic Anarkali', basePrice: 2000, remark: '6 kalis' },
  { name: 'Pattern Anarkali – Simple', basePrice: 2500, group: 'Pattern Anarkali' },
  { name: 'Pattern Anarkali – Complicated', basePrice: 3500, group: 'Pattern Anarkali', remark: '16 kalis' }]

},
{
  code: 'E', name: 'Pants & Bottom Wear', profile: 'Salwar', meters: 2, measurements: BOTTOMS,
  subCategories: [
  { name: 'Pants – Basic', basePrice: 1000, group: 'Pants', remark: 'Starlight, cigarette, palazzo or shotgun' },
  { name: 'Pants – Simple Pattern', basePrice: 1500, group: 'Pants', remark: 'Lace, scallops, buttons' },
  { name: 'Pants – Simple', basePrice: 800, group: 'Pants' },
  { name: 'Pants – Complicated', basePrice: 1500, group: 'Pants' },
  { name: 'Pants – Designer', basePrice: 2000, group: 'Pants' },
  { name: 'Dhoti Pant', basePrice: 3500 },
  { name: 'Sharara & Gharara Pants', basePrice: 4500, spec: PALAZZO },
  { name: 'Saree Petticoat', basePrice: 600 }]

},
{
  code: 'F', name: 'Lehenga', profile: 'Lehenga', meters: 6, measurements: LEHENGA,
  subCategories: [
  { name: 'Lehenga', basePrice: 2000, remark: 'Basic, 6 kalis, circular' },
  { name: 'Pattern Lehenga', basePrice: 2500, remark: 'Simple' },
  { name: 'Pattern Lehenga – Complicated', basePrice: 3500, remark: '16 kalis, circular, pattern' }]

},
{
  code: 'G', name: 'Co-ord Sets', meters: 3.5, measurements: KURTA,
  subCategories: [
  { name: 'Co-ord Set', basePrice: 1500, remark: 'Simple' },
  { name: 'Co-ord Set – Simple Pattern', basePrice: 2000 },
  { name: 'Co-ord Set – Complicated Pattern', basePrice: 3000 },
  { name: 'Co-ord Set, Two-Piece – Simple', basePrice: 5000, group: 'Two-Piece' },
  { name: 'Co-ord Set, Two-Piece – Complicated', basePrice: 7000, group: 'Two-Piece' },
  { name: 'Co-ord Set, Two-Piece – Designer', basePrice: 10000, group: 'Two-Piece' }]

},
{
  code: 'H', name: 'Western Wear', profile: 'Gown', meters: 3, measurements: ANARKALI,
  subCategories: [
  { name: 'Western Skirt', basePrice: 1500, group: 'Skirts', spec: LEHENGA },
  ...withSpec(tiers('Skirts', [800, 1500, 2500], 'Skirt'), LEHENGA),
  { name: 'Western Frock', basePrice: 2500, group: 'Frocks & Dresses', remark: 'Simple' },
  { name: 'Western Frock – Customised', basePrice: 3500, group: 'Frocks & Dresses' },
  { name: 'Cocktail Dress – Basic', basePrice: 5000, group: 'Frocks & Dresses' },
  { name: 'Cocktail Dress – Complicated', basePrice: 8500, group: 'Frocks & Dresses' },
  { name: 'Cocktail Dress – Designer', basePrice: 10000, group: 'Frocks & Dresses' },
  ...withSpec(tiers('Shirts', [1000, 2500, 3500], 'Western Shirt'), KURTA),
  ...tiers('Jumpsuits', [2500, 4500, 7500], 'Jumpsuit')]

},
{
  code: 'I', name: 'Indo-Western & Occasion Wear', meters: 4, measurements: ANARKALI,
  subCategories: [
  ...tiers('Indo-Western', [5500, 7500, 10500]),
  { name: 'Sharara Set', basePrice: 4500, group: 'Sharara & Gharara' },
  { name: 'Gharara Set', basePrice: 4500, group: 'Sharara & Gharara' },
  ...tiers('Kaftan', [1600, 2000, 3500]),
  ...tiers('Resort Wear', [2000, 3500, 5500])]

},
{
  code: 'J', name: 'Blazers & Waistcoats', profile: 'Bandhgala', meters: 3, measurements: JACKET,
  subCategories: [
  { name: "Women's Blazer", basePrice: 2000 },
  { name: 'Blazer with Pant', basePrice: 5000, group: 'Blazer with Pant' },
  ...tiers('Blazer with Pant', [3500, 10000, 15000]),
  ...tiers('Blazer without Pant', [2500, 8500, 13500]),
  ...tiers('Waistcoat, Sleeveless', [1000, 2000, 3500])]

},
{
  code: 'K', name: 'Alterations', meters: 0, measurements: NONE,
  subCategories: [
  { name: 'Alterations – Basic', basePrice: 500 },
  { name: 'Alterations – Complicated', basePrice: 1500 },
  { name: 'Alterations – Designer', basePrice: 3000 }]

}];


/** Earlier price list — kept so orders taken before the new list still price and measure correctly. */
const legacy: Record<string, {measurements: MeasureSpec;prices: Record<string, number>;}> = {
  Blouse: { measurements: BLOUSE, prices: { 'Designer Blouse': 4500, 'Regular Blouse': 2200, 'Corset Blouse': 6500 } },
  Kurta: { measurements: KURTA, prices: { 'Regular Kurta': 2800, 'Straight Kurta': 2600, Angrakha: 3800 } },
  Anarkali: { measurements: ANARKALI, prices: { 'Floor Length': 7800, 'Calf Length': 6200 } },
  Lehenga: { measurements: LEHENGA, prices: { 'Bridal Lehenga': 38000, 'Party Lehenga': 16000 } },
  Sherwani: { measurements: JACKET, prices: { 'Classic Sherwani': 24000, 'Indo-Western': 19000 } },
  Bandhgala: { measurements: JACKET, prices: { Jodhpuri: 14000 } },
  Gown: { measurements: ANARKALI, prices: { 'Evening Gown': 12000, 'Cocktail Gown': 9000 } },
  Salwar: { measurements: BOTTOMS, prices: { Churidar: 1400, Palazzo: 1600 } }
};

export function categoryDef(name: string): CategoryDef | undefined {
  return categories.find((c) => c.name === name);
}

export function liveCategories(list: CategoryDef[] = categories): CategoryDef[] {
  return list.filter((category) => !category.deletedAt);
}

export function liveSubs(items: SubCategoryDef[]): SubCategoryDef[] {
  return items.filter((item) => !item.deletedAt);
}

function namedItem<T extends { name: string; deletedAt?: string }>(items: T[], name?: string): T | undefined {
  if (!name) return undefined;
  return items.find((item) => item.name === name && !item.deletedAt) ?? items.find((item) => item.name === name);
}

/** Measurement chart for a garment — the sub-category's own chart if it has one, else its category's. */
export function measureSpecFor(category: string, subCategory?: string): MeasureSpec {
  const cat = categoryDef(category);
  return namedItem(cat?.subCategories ?? [], subCategory)?.spec ?? cat?.measurements ?? legacy[category]?.measurements ?? NONE;
}

/** Required measurement fields for a garment. */
export function measurementsFor(category: string, subCategory?: string): string[] {
  return measureSpecFor(category, subCategory).fields;
}

/** Required yes/no and preference details for a garment. */
export function detailsFor(category: string, subCategory?: string): DetailDef[] {
  return measureSpecFor(category, subCategory).details.filter((detail) => !detail.deletedAt);
}

/** Catalogue price for a sub-category, or undefined if it isn't on any list. */
export function listPrice(category: string, subCategory: string): number | undefined {
  return namedItem(categoryDef(category)?.subCategories ?? [], subCategory)?.basePrice ?? legacy[category]?.prices[subCategory];
}

/** Which saved measurement profiles fit this category. */
export function profileMatches(category: string, profileCategory: string): boolean {
  return profileCategory === category || categoryDef(category)?.profile === profileCategory;
}

/**
 * Urgency is set per garment. The charge is a percentage of that garment's value
 * (stitching, design, attachments, construction, finishing — Darzaan fabric excluded).
 * The order date never changes; only the garment's ready date moves up.
 */
export const urgencyOptions: {value: Urgency;label: string;short: string;surchargePct: number;days: number | null;}[] = [
{ value: 'Regular', label: 'Regular delivery', short: 'Regular', surchargePct: 0, days: null },
{ value: 'Express 3d', label: '3-day delivery', short: '3 days', surchargePct: 0.5, days: 3 },
{ value: 'Express 2d', label: '2-day delivery', short: '2 days', surchargePct: 0.7, days: 2 },
{ value: 'Express 24h', label: '1-day delivery', short: '1 day', surchargePct: 1, days: 1 }];


export const samplers = [
{ id: 'SMP-101', name: 'Zardozi Floral Border', technique: 'Hand', price: 8500, color: '#B08D3C' },
{ id: 'SMP-114', name: 'Aari Paisley Jaal', technique: 'Hand', price: 5200, color: '#8C3B4A' },
{ id: 'SMP-122', name: 'Geometric Thread Lattice', technique: 'Machine', price: 2400, color: '#3F5D74' },
{ id: 'SMP-130', name: 'Gota Patti Trellis', technique: 'Hand', price: 4600, color: '#C5A253' },
{ id: 'SMP-141', name: 'Resham Vine', technique: 'Machine', price: 3800, color: '#5C6E3A' },
{ id: 'SMP-150', name: 'Mirror Work Buti', technique: 'Hand', price: 3200, color: '#7D7A75' }];


/** Used only for older custom-design orders that pre-date production pricing. */
export const CUSTOM_EMBROIDERY_PRICE = 12000;

export const designers = ['Nisha Arora', 'Aarav Bedi', 'Tanvi Kohli'];
export const assistants = ['Ritu Sharma', 'Simran Gill', 'None'];
export const occasions = ['Wedding', 'Reception', 'Sangeet', 'Festive', 'Party', 'Everyday'];

export const ADVANCE_PCT = 0.7;
export const HOME_DELIVERY_CHARGE = 500;
/** Full charge for one alteration. Fit fixes are charged a share of it by round. */
export const ALTERATION_CHARGE = 1500;
/** Fit-fix rounds per garment: #1 free, #2 half, #3 and after full. */
export const ALTERATION_TIERS = [0, 0.5, 1] as const;
export const REGULAR_LEAD_DAYS = 10;

export const orderTerms = [
'A 70% advance confirms the order. The balance is due at pickup or delivery.',
'Express (1, 2 or 3-day) charges are non-refundable once work has started.',
'Free alterations cover fit issues against the agreed measurements. Changes to the design are charged.',
'Customer-supplied fabric is handled with care; Darzaan is not liable for flaws already in the fabric.',
'Garments not collected within 30 days of the ready date may incur a storage charge.',
'Cancellations after cutting has begun forfeit the advance.'];