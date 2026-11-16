import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import { apiMode } from '../services/mode';
import { readHydration, scheduleSave, storedOrSample } from '../services/sync';
import { DEMO_PREFIX, demoMode } from '../utils/demo';

const SAVED_BY_HAND = new Set(['orders', 'customers', 'quotes', 'notifications']);

/**
 * useState that, in demo mode, is mirrored to session storage so the /flow page and the live
 * screen inside it see each other's changes straight away. Outside the demo it is plain useState.
 * In http mode the value is the saved workspace, and edits are written back.
 */
export function useSharedState<T>(key: string, seed: T): [T, Dispatch<SetStateAction<T>>] {
  const storageKey = DEMO_PREFIX + key;
  const [value, setValue] = useState<T>(() => {
    const hydrated = readHydration<T>(key);
    if (hydrated !== undefined) return hydrated;
    const fallback = storedOrSample(key, seed);
    if (!demoMode) return fallback;
    try {
      const saved = sessionStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) as T : fallback;
    } catch {
      return fallback;
    }
  });
  const skipSave = useRef(true);

  useEffect(() => {
    if (!demoMode) return;
    try {
      const next = JSON.stringify(value);
      if (sessionStorage.getItem(storageKey) !== next) sessionStorage.setItem(storageKey, next);
    } catch {
      /* storage full or unavailable */
    }
  }, [storageKey, value]);

  useEffect(() => {
    if (!demoMode) return;
    const onStorage = (e: StorageEvent) => {
      if (e.storageArea !== sessionStorage) return;
      if (e.key === null) {
        setValue(seed);
        return;
      }
      if (e.key !== storageKey) return;
      if (e.newValue === null) setValue(seed);
      else {
        try {
          setValue(JSON.parse(e.newValue) as T);
        } catch {
          /* ignore malformed value */
        }
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
    // seed is the module-level sample data; it never changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  useEffect(() => {
    if (!apiMode || SAVED_BY_HAND.has(key)) return;
    if (skipSave.current) {
      skipSave.current = false;
      return;
    }
    scheduleSave(key, value);
  }, [key, value]);

  return [value, setValue];
}
