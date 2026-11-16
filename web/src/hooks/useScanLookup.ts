import { useCallback, useEffect, useRef, useState } from 'react';

/** Scanner dialog state with a brief lookup spinner, so the prototype shows a loading state between scan and result. */
export function useScanLookup(onResult: (code: string, typed: boolean) => void) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  const cb = useRef(onResult);
  cb.current = onResult;

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const run = useCallback((code: string, typed: boolean) => {
    setBusy(true);
    timer.current = window.setTimeout(() => {
      setBusy(false);
      setOpen(false);
      cb.current(code, typed);
    }, 350);
  }, []);

  return { open, setOpen, busy, run };
}