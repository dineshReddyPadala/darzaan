import React from 'react';
interface PageHeaderProps {
  title: string;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
}
export function PageHeader({
  actions
}: PageHeaderProps) {
  if (!actions) return null;
  return <header className="mb-4 flex justify-end">
      <div className="flex flex-wrap items-center gap-2">{actions}</div>
    </header>;
}