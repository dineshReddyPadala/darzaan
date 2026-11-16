import React, { useRef } from 'react';
import { CameraIcon, XIcon } from 'lucide-react';
interface PhotoCaptureProps {
  photos: string[];
  onChange: (photos: string[]) => void;
  label?: string;
  hint?: string;
}
export function PhotoCapture({
  photos,
  onChange,
  label = 'Capture photo',
  hint
}: PhotoCaptureProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const onFiles = (files: FileList | null) => {
    if (!files) return;
    const urls = Array.from(files).map((f) => URL.createObjectURL(f));
    onChange([...photos, ...urls]);
  };
  return <div>
      <div className="flex flex-wrap gap-3">
        {photos.map((src, i) => <div key={src} className="group relative h-24 w-24 overflow-hidden rounded-xl border border-line bg-sunken">
            <img src={src} alt={`Captured photo ${i + 1}`} className="h-full w-full object-cover" />
            <button type="button" onClick={() => onChange(photos.filter((p) => p !== src))} className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-ink/70 text-white" aria-label="Remove photo">
              <XIcon className="h-4 w-4" />
            </button>
          </div>)}
        <button type="button" onClick={() => inputRef.current?.click()} className="flex h-24 w-24 flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-line-strong bg-canvas text-ink-muted transition-colors duration-150 ease-out hover:border-brand hover:text-brand">
          <CameraIcon className="h-6 w-6" />
          <span className="px-2 text-center text-xs font-medium leading-tight">{label}</span>
        </button>
      </div>
      {hint && <p className="mt-2 text-xs text-ink-subtle">{hint}</p>}
      <input ref={inputRef} type="file" accept="image/*" capture="environment" multiple className="hidden" onChange={(e) => onFiles(e.target.files)} />
    </div>;
}