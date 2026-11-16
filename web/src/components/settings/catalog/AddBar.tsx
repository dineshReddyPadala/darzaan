import React from 'react';
import { PlusIcon } from 'lucide-react';
import { Button } from '../../ui/Button';

interface AddBarProps {
  onSubmit: () => void;
  disabled: boolean;
  error?: string;
  children: React.ReactNode;
}

/** The one "add" row used by every catalogue list: labelled fields on the left, the Add button always on the right. */
export function AddBar({ onSubmit, disabled, error, children }: AddBarProps) {
  return <form className="border-t border-line bg-canvas px-5 py-3" onSubmit={(e) => {
    e.preventDefault();
    if (!disabled) onSubmit();
  }}>
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex min-w-0 flex-1 basis-64 flex-wrap items-end gap-3">{children}</div>
        <Button type="submit" className="ml-auto h-10" size="sm" icon={<PlusIcon className="h-4 w-4" />} disabled={disabled}>Add</Button>
      </div>
      {error && <p className="mt-1.5 text-sm text-critical">{error}</p>}
    </form>;
}

interface AddFieldProps {
  label: string;
  className?: string;
  children: React.ReactNode;
}

/** A labelled field inside AddBar, so every add input reads the same way. */
export function AddField({ label, className, children }: AddFieldProps) {
  return <label className={className ?? 'min-w-0 flex-1 basis-48'}>
      <span className="mb-1 block text-xs font-medium text-ink-muted">{label}</span>
      {children}
    </label>;
}