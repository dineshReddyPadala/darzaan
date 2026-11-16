/** Public storefront content: the lookbook, fabrics on the shelf and consultation slots. */

export type Occasion = 'Wedding' | 'Festive' | 'Everyday';

export interface LookbookDesign {
  id: string;
  name: string;
  /** Matches a sub-category in data/catalog.ts so the Designer can price it straight away. */
  garment: string;
  occasion: Occasion;
  fromPrice: number;
  leadDays: number;
  image: string;
  description: string;
  details: string[];
}

export interface ShelfFabric {
  id: string;
  name: string;
  composition: string;
  pricePerMetre: number;
  color: string;
}

export const occasions: Occasion[] = ['Wedding', 'Festive', 'Everyday'];

export const lookbook: LookbookDesign[] = [
{
  id: 'LB-01', name: 'Noor Anarkali', garment: 'Floor Length', occasion: 'Wedding', fromPrice: 7800, leadDays: 21,
  image: "/55f851ce-e8c9-44f1-bfae-e114d8b53cd9.jpg",
  description: 'Floor-length chanderi anarkali with a hand-worked zari yoke and a scalloped dupatta.',
  details: ['Hand zari on yoke and sleeves', 'Chanderi silk, lined in cotton', 'Two fittings included']
},
{
  id: 'LB-02', name: 'Sabz Lehenga', garment: 'Party Lehenga', occasion: 'Wedding', fromPrice: 16000, leadDays: 28,
  image: "/995cba89-73ec-429f-ae94-78bfa6e5bc6a.jpg",
  description: 'Raw-silk lehenga in olive with a fine gota border, cut for movement.',
  details: ['Raw silk with gota border', 'Can-can optional', 'Two fittings included']
},
{
  id: 'LB-03', name: 'Zari Rust Blouse', garment: 'Designer Blouse', occasion: 'Festive', fromPrice: 4500, leadDays: 14,
  image: "/709292fc-ed37-4151-8490-01b0e5e9d0ba.jpg",
  description: 'Rust silk blouse with mirror and zardozi work on the sleeves. Pairs with your own saree.',
  details: ['Mirror and zardozi sleeves', 'Bring your saree to match', 'One fitting included']
},
{
  id: 'LB-04', name: 'Neel Angrakha', garment: 'Angrakha', occasion: 'Festive', fromPrice: 3800, leadDays: 12,
  image: "/737453a0-0229-4b54-a1c6-6628ce209e9a.jpg",
  description: 'Indigo hand-block cotton angrakha with side ties and a soft flared hem.',
  details: ['Hand-block printed cotton', 'Side tie closure', 'One fitting included']
},
{
  id: 'LB-05', name: 'Reth Linen Kurta', garment: 'Straight Kurta', occasion: 'Everyday', fromPrice: 2600, leadDays: 10,
  image: "/fcd87ded-8a6b-4293-a5bf-3cd8f755b475.jpg",
  description: 'Straight kurta in sand linen with tonal thread work along the placket.',
  details: ['Pure linen', 'Tonal placket embroidery', 'Reorder online once measured']
}];


export const shelfFabrics: ShelfFabric[] = [
{ id: 'SF-1', name: 'Chanderi silk', composition: 'Silk–cotton', pricePerMetre: 950, color: '#EFE6D2' },
{ id: 'SF-2', name: 'Raw silk', composition: '100% silk', pricePerMetre: 1400, color: '#5E6E35' },
{ id: 'SF-3', name: 'Banarasi brocade', composition: 'Silk, zari', pricePerMetre: 2600, color: '#9A4A2B' },
{ id: 'SF-4', name: 'Hand-block cotton', composition: '100% cotton', pricePerMetre: 480, color: '#2F3E63' },
{ id: 'SF-5', name: 'Irish linen', composition: '100% linen', pricePerMetre: 820, color: '#CDBB98' },
{ id: 'SF-6', name: 'Georgette', composition: 'Silk georgette', pricePerMetre: 1100, color: '#B98A9A' }];


export const consultationDays = ['Fri 16 Oct', 'Sat 17 Oct', 'Sun 18 Oct', 'Mon 19 Oct', 'Tue 20 Oct'];
export const consultationSlots = ['11:00–13:00', '13:00–15:00', '15:00–17:00', '17:00–19:00'];

export const storeAddress = 'Darzaan, 14 Khan Market, New Delhi 110003';
export const storeHours = 'Open daily 11:00–20:00';