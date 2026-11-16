import React, { useCallback, useState } from 'react';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';

interface Ask {
  title: string;
  description: string;
  confirmLabel?: string;
  resolve: (yes: boolean) => void;
}

export function useConfirm() {
  const [ask, setAsk] = useState<Ask | null>(null);
  const confirm = useCallback((options: Omit<Ask, 'resolve'>) => {
    return new Promise<boolean>((resolve) => setAsk({ ...options, resolve }));
  }, []);
  const close = (yes: boolean) => {
    ask?.resolve(yes);
    setAsk(null);
  };
  const dialog = <ConfirmDialog
    open={!!ask}
    title={ask?.title ?? ''}
    description={ask?.description ?? ''}
    confirmLabel={ask?.confirmLabel}
    onCancel={() => close(false)}
    onConfirm={() => close(true)}
  />;
  return { confirm, dialog };
}
