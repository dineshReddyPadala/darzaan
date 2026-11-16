import React from 'react';
import { QrGlyph } from '../ui/QrGlyph';

/** Code-128-style bars derived from the package ID — the code only points to the record, it holds no customer data. */
export function Barcode({
  value,
  height = 44



}: {value: string;height?: number;}) {
  const bars: number[] = [2, 1, 1];
  for (const ch of value) {
    const c = ch.charCodeAt(0);
    bars.push(c % 3 + 1, (c >> 2) % 2 + 1, (c >> 3) % 3 + 1, (c >> 1) % 2 + 1);
  }
  bars.push(2, 1, 1);
  let x = 0;
  const rects = bars.map((w, i) => {
    const r = i % 2 === 0 ? <rect key={i} x={x} y={0} width={w} height={height} fill="currentColor" /> : null;
    x += w;
    return r;
  });
  return <svg viewBox={`0 0 ${x} ${height}`} preserveAspectRatio="none" className="h-11 w-full text-ink" role="img" aria-label={`Barcode ${value}`}>
      {rects}
    </svg>;
}
export function PackageQr({
  value,
  size = 96



}: {value: string;size?: number;}) {
  return <span role="img" aria-label={`QR code ${value}`} className="inline-flex"><QrGlyph value={value} size={size} /></span>;
}