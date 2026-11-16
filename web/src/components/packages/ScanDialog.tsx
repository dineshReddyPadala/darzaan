import React, { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { KeyboardIcon, Loader2Icon, ScanLineIcon } from 'lucide-react';
import { cn } from '../../utils/cn';
import { inputClass } from '../../utils/styles';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
interface Props {
  open: boolean;
  onClose: () => void;
  title?: string;
  /** Labels in view of the camera — tapping one simulates a scan in this prototype. */
  samples: {
    code: string;
    hint: string;
    /** Shown instead of the code (e.g. a smudged label). */
    label?: string;
  }[];
  onResult: (code: string, manual: boolean) => void;
  busy?: boolean;
}

/** iPad camera or a connected scanner; typing the ID is the fallback when the scanner isn’t working. */
export function ScanDialog({
  open,
  onClose,
  title = 'Scan package label',
  samples,
  onResult,
  busy
}: Props) {
  const [manual, setManual] = useState(false);
  const [code, setCode] = useState('');
  const reduce = useReducedMotion();
  useEffect(() => {
    if (!open) {
      setManual(false);
      setCode('');
    }
  }, [open]);

  // A connected barcode scanner types the code and presses Enter — catch it anywhere in the dialog.
  useEffect(() => {
    if (!open || manual) return;
    let buf = '';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && buf.length > 3) {
        onResult(buf, false);
        buf = '';
      } else if (e.key.length === 1) buf += e.key;
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, manual, onResult]);
  return <Modal open={open} onClose={onClose} title={title} description={manual ? 'Type the ID printed under the barcode.' : 'Point the camera at the QR code or barcode, or use a scanner.'}>
      {busy ? <div className="flex flex-col items-center gap-3 py-12 text-ink-muted" role="status">
          <Loader2Icon className="h-8 w-8 animate-spin text-brand" />
          <p className="text-[15px]">Looking up the package…</p>
        </div> : manual ? <form onSubmit={(e) => {
      e.preventDefault();
      if (code.trim()) onResult(code.trim().toUpperCase(), true);
    }} className="space-y-4">
          <input autoFocus value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. PKG-24105" className={cn(inputClass, 'h-14 font-mono text-lg uppercase')} aria-label="Package ID" />
          <div className="flex gap-3">
            <Button variant="ghost" size="lg" onClick={() => setManual(false)}>Use camera</Button>
            <Button type="submit" size="lg" className="flex-1" disabled={!code.trim()}>Find package</Button>
          </div>
        </form> : <div className="space-y-4">
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-ink">
            <div className="absolute inset-8 rounded-xl border-2 border-white/70" />
            {!reduce && <motion.div className="absolute inset-x-10 h-0.5 bg-success" initial={{
          top: '20%'
        }} animate={{
          top: ['20%', '78%', '20%']
        }} transition={{
          duration: 2.4,
          repeat: Infinity,
          ease: 'linear'
        }} />}
            <p className="absolute inset-x-0 bottom-3 text-center text-sm text-white/80"><ScanLineIcon className="mr-1 inline h-4 w-4" />Camera ready</p>
          </div>
          <div>
            <p className="mb-2 flex items-center justify-between gap-2 text-sm font-medium text-ink-muted">
              Labels in front of the camera
              <span className="rounded-full bg-brass-soft px-2 py-0.5 text-xs font-semibold text-brass-text">Demo · tap to scan</span>
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {samples.map((s) => <button key={s.code} type="button" onClick={() => onResult(s.code, false)} className="rounded-xl bg-canvas px-4 py-3 text-left ring-1 ring-inset ring-line transition-colors duration-150 ease-out hover:bg-sunken focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand">
                  <span className="block font-mono text-[15px] font-semibold">{s.label ?? s.code}</span>
                  <span className="block text-sm text-ink-muted">{s.hint}</span>
                </button>)}
            </div>
          </div>
          <Button variant="secondary" size="lg" fullWidth icon={<KeyboardIcon className="h-5 w-5" />} onClick={() => setManual(true)}>Scanner not working? Type the ID</Button>
        </div>}
    </Modal>;
}