import { locations as seed, type StoreLocation } from '../data/locations';
import { storedOrSample } from '../services/sync';

export function locationList(): StoreLocation[] {
  return storedOrSample('locations', seed);
}

export function activeLocations(): StoreLocation[] {
  const all = locationList();
  const active = all.filter((location) => location.active);
  return active.length ? active : all;
}
