export type WorkplaceKind = 'store' | 'workshop';

export interface StoreLocation {
  id: number;
  name: string;
  kind: WorkplaceKind;
  address: string;
  phone: string;
  /** Order store code, set for retail locations. */
  store?: string;
  active: boolean;
}

export const locations: StoreLocation[] = [
  {
    id: 1,
    name: 'Khan Market Store',
    kind: 'store',
    address: '24 Middle Lane, Khan Market, New Delhi',
    phone: '+91 98110 24024',
    store: 'Khan Market',
    active: true,
  },
  {
    id: 2,
    name: 'Okhla Workshop',
    kind: 'workshop',
    address: 'Okhla Industrial Area, New Delhi',
    phone: '',
    active: true,
  },
];
