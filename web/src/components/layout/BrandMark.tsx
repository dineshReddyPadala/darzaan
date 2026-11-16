import React from 'react';
export function BrandMark({
  size = 36


}: {size?: number;}) {
  return <span className="inline-flex shrink-0 items-center justify-center rounded-xl bg-brand font-display font-medium text-white" style={{
    width: size,
    height: size,
    fontSize: size * 0.55
  }} aria-label="Darzaan">
      D
    </span>;
}