import React from 'react';
interface QrGlyphProps {
  value: string;
  size?: number;
}

// Deterministic QR-style glyph for labels and previews.
export function QrGlyph({
  value,
  size = 72
}: QrGlyphProps) {
  const n = 21;
  let seed = value.split('').reduce((s, c) => s * 31 + c.charCodeAt(0) >>> 0, 7);
  const rand = () => {
    seed = seed * 1664525 + 1013904223 >>> 0;
    return seed / 4294967296;
  };
  const cells: React.ReactNode[] = [];
  const finder = (x: number, y: number) => x < 7 && y < 7;
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const inFinder = finder(x, y) || finder(n - 1 - x, y) || finder(x, n - 1 - y);
      if (inFinder) continue;
      if (rand() > 0.52) cells.push(<rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} />);
    }
  }
  const Finder = ({
    x,
    y



  }: {x: number;y: number;}) => <g>
      <rect x={x} y={y} width={7} height={7} />
      <rect x={x + 1} y={y + 1} width={5} height={5} fill="#fff" />
      <rect x={x + 2} y={y + 2} width={3} height={3} />
    </g>;
  return <svg width={size} height={size} viewBox={`-1 -1 ${n + 2} ${n + 2}`} role="img" aria-label={`QR code ${value}`} className="rounded-md bg-white">
      <g fill="#2B2A20">
        {cells}
        <Finder x={0} y={0} />
        <Finder x={n - 7} y={0} />
        <Finder x={0} y={n - 7} />
      </g>
    </svg>;
}