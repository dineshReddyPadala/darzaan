export interface Fabric {
  id: string;
  name: string;
  type: string;
  color: string;
  pricePerM: number;
  stock: number;
  reorderLevel: number;
  location: string;
  supplier: string;
  usage30d: number;
}

export interface Trim {
  id: string;
  name: string;
  category: 'Border' | 'Lace' | 'Buttons' | 'Tassels' | 'Zips' | 'Hooks' | 'Pads' | 'Boning';
  unit: string;
  price: number;
  cost: number;
  stock: number;
  reorderLevel: number;
  location: string;
  supplier: string;
}

export const fabrics: Fabric[] = [
{ id: 'FAB-2101', name: 'Garnet', type: 'Raw Silk', color: '#7E2338', pricePerM: 1800, stock: 42, reorderLevel: 15, location: 'Rack A3', supplier: 'Surat Silk House', usage30d: 18 },
{ id: 'FAB-2104', name: 'Antique Gold', type: 'Banarasi Brocade', color: '#B8954A', pricePerM: 2400, stock: 28, reorderLevel: 12, location: 'Rack A1', supplier: 'Varanasi Weavers Co.', usage30d: 22 },
{ id: 'FAB-2110', name: 'Blush', type: 'Georgette', color: '#E7B7B0', pricePerM: 950, stock: 65, reorderLevel: 20, location: 'Rack B2', supplier: 'Mumbai Textiles', usage30d: 31 },
{ id: 'FAB-2115', name: 'Ivory', type: 'Chanderi', color: '#EFE6D2', pricePerM: 1100, stock: 54, reorderLevel: 20, location: 'Rack B4', supplier: 'Chanderi Handloom', usage30d: 14 },
{ id: 'FAB-2120', name: 'Emerald', type: 'Velvet', color: '#1F5A46', pricePerM: 2100, stock: 7, reorderLevel: 15, location: 'Rack C1', supplier: 'Amritsar Velvet Mills', usage30d: 19 },
{ id: 'FAB-2124', name: 'Powder Blue', type: 'Organza', color: '#BFD3E2', pricePerM: 1350, stock: 33, reorderLevel: 15, location: 'Rack B1', supplier: 'Mumbai Textiles', usage30d: 12 },
{ id: 'FAB-2130', name: 'Sand', type: 'Linen', color: '#D6C3A1', pricePerM: 780, stock: 80, reorderLevel: 25, location: 'Rack D2', supplier: 'Linen Club', usage30d: 27 },
{ id: 'FAB-2133', name: 'Midnight', type: 'Crepe', color: '#1E2742', pricePerM: 1250, stock: 0, reorderLevel: 15, location: 'Rack C3', supplier: 'Surat Silk House', usage30d: 16 },
{ id: 'FAB-2140', name: 'Mustard', type: 'Tussar', color: '#C9962E', pricePerM: 1450, stock: 22, reorderLevel: 10, location: 'Rack A4', supplier: 'Bhagalpur Silks', usage30d: 9 },
{ id: 'FAB-2145', name: 'Peacock Teal', type: 'Kanjivaram', color: '#146C72', pricePerM: 3200, stock: 12, reorderLevel: 10, location: 'Rack A2', supplier: 'Kanchipuram Looms', usage30d: 8 }];


export const trims: Trim[] = [
{ id: 'TRM-301', name: 'Zardozi Border 2"', category: 'Border', unit: 'm', price: 420, cost: 260, stock: 64, reorderLevel: 20, location: 'Bin T1', supplier: 'Chandni Chowk Trims' },
{ id: 'TRM-302', name: 'Gota Border 1"', category: 'Border', unit: 'm', price: 180, cost: 95, stock: 120, reorderLevel: 40, location: 'Bin T1', supplier: 'Jaipur Gota Works' },
{ id: 'TRM-310', name: 'French Chantilly Lace', category: 'Lace', unit: 'm', price: 650, cost: 410, stock: 18, reorderLevel: 20, location: 'Bin T2', supplier: 'Lace Atelier' },
{ id: 'TRM-311', name: 'Cotton Crochet Lace', category: 'Lace', unit: 'm', price: 140, cost: 70, stock: 90, reorderLevel: 30, location: 'Bin T2', supplier: 'Lace Atelier' },
{ id: 'TRM-320', name: 'Kundan Buttons', category: 'Buttons', unit: 'pc', price: 85, cost: 40, stock: 240, reorderLevel: 80, location: 'Bin T3', supplier: 'Chandni Chowk Trims' },
{ id: 'TRM-321', name: 'Fabric-covered Buttons', category: 'Buttons', unit: 'pc', price: 25, cost: 9, stock: 600, reorderLevel: 150, location: 'Bin T3', supplier: 'In-house' },
{ id: 'TRM-330', name: 'Silk Latkan Tassels', category: 'Tassels', unit: 'pc', price: 120, cost: 55, stock: 48, reorderLevel: 20, location: 'Bin T4', supplier: 'Jaipur Gota Works' },
{ id: 'TRM-331', name: 'Pearl Drop Tassels', category: 'Tassels', unit: 'pc', price: 220, cost: 120, stock: 12, reorderLevel: 20, location: 'Bin T4', supplier: 'Lace Atelier' },
// Tassel work from the 2026 price list — made in-house, priced per set.
{ id: 'TRM-332', name: 'Customised tassels', category: 'Tassels', unit: 'set', price: 500, cost: 0, stock: 999, reorderLevel: 0, location: 'Workshop', supplier: 'In-house' },
{ id: 'TRM-333', name: 'Hand-embroidered tassels – Simple', category: 'Tassels', unit: 'set', price: 1000, cost: 0, stock: 999, reorderLevel: 0, location: 'Workshop', supplier: 'In-house' },
{ id: 'TRM-334', name: 'Hand-embroidered tassels – Complicated', category: 'Tassels', unit: 'set', price: 2000, cost: 0, stock: 999, reorderLevel: 0, location: 'Workshop', supplier: 'In-house' },
{ id: 'TRM-340', name: 'Invisible Zip 9"', category: 'Zips', unit: 'pc', price: 45, cost: 18, stock: 300, reorderLevel: 100, location: 'Bin C1', supplier: 'YKK India' },
{ id: 'TRM-350', name: 'Hooks & Eyes', category: 'Hooks', unit: 'pc', price: 8, cost: 2, stock: 1200, reorderLevel: 300, location: 'Bin C2', supplier: 'Prym India' },
{ id: 'TRM-360', name: 'Moulded Bra Cups', category: 'Pads', unit: 'pair', price: 140, cost: 60, stock: 80, reorderLevel: 30, location: 'Bin C3', supplier: 'Prym India' },
{ id: 'TRM-370', name: 'Rigilene Boning', category: 'Boning', unit: 'm', price: 60, cost: 28, stock: 6, reorderLevel: 20, location: 'Bin C3', supplier: 'Prym India' }];


/** Attachments the order form offers — only what's on the 2026 price list (tassel work). */
export const priceListAttachmentIds = ['TRM-332', 'TRM-333', 'TRM-334'];
export const priceListAttachments = trims.filter((t) => priceListAttachmentIds.includes(t.id));