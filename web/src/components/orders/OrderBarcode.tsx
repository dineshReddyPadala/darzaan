import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';

/** A Code 128 of the order id, with the id printed under the bars. */
export function OrderBarcode({ value }: { value: string }) {
  const ref = useRef<SVGSVGElement>(null);
  useEffect(() => {
    if (!ref.current || !value) return;
    JsBarcode(ref.current, value, {
      format: 'CODE128',
      displayValue: true,
      font: 'ui-monospace, monospace',
      fontSize: 14,
      textMargin: 6,
      height: 64,
      margin: 0,
      background: '#ffffff',
      lineColor: '#2B2A20',
    });
  }, [value]);
  return <div className="inline-flex rounded-xl border border-line bg-white p-3">
    <svg ref={ref} role="img" aria-label={`Barcode for ${value}`} />
  </div>;
}
