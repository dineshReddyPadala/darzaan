export interface StoreLocation {
  id: number;
  name: string;
  kind: 'store' | 'workshop';
  address: string;
  phone: string;
  store?: string;
  active: boolean;
}
