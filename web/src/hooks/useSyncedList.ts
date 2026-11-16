import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import { scheduleSave, storedOrSample } from '../services/sync';

export function useSyncedList<T>(key: string, seed: T): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => storedOrSample(key, seed));
  const skip = useRef(true);
  useEffect(() => {
    if (skip.current) {
      skip.current = false;
      return;
    }
    scheduleSave(key, value);
  }, [key, value]);
  return [value, setValue];
}
