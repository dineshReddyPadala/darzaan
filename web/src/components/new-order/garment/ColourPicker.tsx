import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { shadeCards } from '../../../data/shades';
import type { FabricSelection } from '../../../types';
import { cn } from '../../../utils/cn';
import { inputClass } from '../../../utils/styles';
import { ScanQrPanel } from '../ScanQrPanel';
const HEX = /^#[0-9a-f]{6}$/i;

/** Scan a chip on the shade card, or pick any colour by HEX. */
export function ColourPicker({
  fabric,
  onChange



}: {fabric: FabricSelection;onChange: (patch: Partial<FabricSelection>) => void;}) {
  const scanned = shadeCards.find((s) => s.code === fabric.colourCode);
  const [hex, setHex] = useState(fabric.colourHex ?? '');
  useEffect(() => setHex(fabric.colourHex ?? ''), [fabric.colourHex]);
  const scan = () => {
    const s = shadeCards.find((x) => x.code !== fabric.colourCode) ?? shadeCards[0];
    onChange({
      colourCode: s.code,
      colourName: s.name,
      colourHex: s.hex
    });
    toast.success(`Scanned ${s.code} — ${s.name}`);
  };
  const setManual = (value: string) => {
    const v = value.startsWith('#') ? value : `#${value}`;
    setHex(v);
    if (HEX.test(v)) onChange({
      colourHex: v.toUpperCase(),
      colourCode: undefined,
      colourName: undefined
    });
  };
  const invalid = hex.length > 1 && !HEX.test(hex);
  return <div className="space-y-4">
      <ScanQrPanel title="Scan shade card QR" hint="Scan the tag on the colour chip." onScan={scan} picked={scanned && {
      id: scanned.code,
      name: scanned.name,
      detail: scanned.hex,
      color: scanned.hex
    }} />
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm text-ink-muted">Or pick a colour</span>
        <label className="relative h-12 w-12 shrink-0 cursor-pointer overflow-hidden rounded-xl ring-1 ring-inset ring-line-strong" style={{
        backgroundColor: fabric.colourHex ?? '#FFFFFF'
      }}>
          <span className="sr-only">Colour picker</span>
          <input type="color" value={HEX.test(fabric.colourHex ?? '') ? fabric.colourHex : '#FFFFFF'} onChange={(e) => setManual(e.target.value)} className="absolute inset-0 h-full w-full cursor-pointer opacity-0" />
        </label>
        <input value={hex} onChange={(e) => setManual(e.target.value.trim())} placeholder="#C2185B" maxLength={7} aria-label="HEX code" aria-invalid={invalid} className={cn(inputClass, 'w-36 font-mono uppercase', invalid && 'ring-2 ring-critical')} />
        {!scanned && fabric.colourHex && <span className="text-sm text-ink-muted">Custom colour</span>}
      </div>
      {invalid && <p className="text-sm text-critical">Use six characters, e.g. #C2185B.</p>}
    </div>;
}