import React, { useEffect, useRef } from 'react';
import { CheckCircle2Icon, RotateCcwIcon } from 'lucide-react';
import { cn } from '../../utils/cn';
interface SignaturePadProps {
  label: string;
  signerName: string;
  signed: boolean;
  onSignedChange: (signed: boolean) => void;
}
export function SignaturePad({
  label,
  signerName,
  signed,
  onSignedChange
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#2B2A20';
  }, []);
  const point = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };
  const onDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drawing.current = true;
    const p = point(e);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
  };
  const onMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const p = point(e);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
  };
  const onUp = () => {
    if (!drawing.current) return;
    drawing.current = false;
    if (!signed) onSignedChange(true);
  };
  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    onSignedChange(false);
  };
  return <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-ink-muted">{label}</p>
          <p className="text-[15px] font-semibold text-ink">{signerName}</p>
        </div>
        {signed ? <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-sm font-medium text-success">
              <CheckCircle2Icon className="h-4 w-4" /> Signed
            </span>
            <button onClick={clear} className="flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-sm text-ink-muted hover:bg-sunken" type="button">
              <RotateCcwIcon className="h-4 w-4" /> Clear
            </button>
          </div> : <span className="text-sm text-ink-subtle">Sign with finger or stylus</span>}
      </div>
      <div className={cn('relative h-36 overflow-hidden rounded-xl border bg-canvas', signed ? 'border-success/40' : 'border-dashed border-line-strong')}>
        {!signed && <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-ink-subtle">Sign here</span>}
        <span className="pointer-events-none absolute inset-x-6 bottom-8 border-b border-line-strong" aria-hidden />
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full touch-none" onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerLeave={onUp} aria-label={`${label} signature pad`} />
      </div>
    </div>;
}