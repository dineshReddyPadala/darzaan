import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';

/** A Code 128 of the order id, with the id printed under the bars. */
export function OrderBarcode({ value, compact }: { value: string; compact?: boolean }) {
  const ref = useRef<SVGSVGElement>(null);
  useEffect(() => {
    if (!ref.current || !value) return;
    JsBarcode(ref.current, value, {
      format: 'CODE128',
      displayValue: true,
      font: 'ui-monospace, monospace',
      textMargin: 6,
      height: compact ? 40 : 64,
      fontSize: compact ? 11 : 14,
      margin: 0,
      background: '#ffffff',
      lineColor: '#2B2A20',
    });
  }, [value, compact]);
  return <div className="inline-flex rounded-xl border border-line bg-white p-3">
    <svg ref={ref} role="img" aria-label={`Barcode for ${value}`} />
  </div>;
}
