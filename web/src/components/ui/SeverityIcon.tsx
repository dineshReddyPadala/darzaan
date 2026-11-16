import React from 'react';
import { AlertOctagonIcon, AlertTriangleIcon, BellIcon, InfoIcon } from 'lucide-react';
import { cn } from '../../utils/cn';
import type { Severity } from '../../types';
const map = {
  critical: {
    Icon: AlertOctagonIcon,
    cls: 'bg-critical-soft text-critical'
  },
  warning: {
    Icon: AlertTriangleIcon,
    cls: 'bg-warning-soft text-warning'
  },
  attention: {
    Icon: BellIcon,
    cls: 'bg-attention-soft text-attention'
  },
  info: {
    Icon: InfoIcon,
    cls: 'bg-info-soft text-info'
  }
};
export function SeverityIcon({
  severity,
  size = 'md'



}: {severity: Severity;size?: 'sm' | 'md';}) {
  const {
    Icon,
    cls
  } = map[severity];
  return <span className={cn('flex shrink-0 items-center justify-center rounded-full', size === 'md' ? 'h-10 w-10' : 'h-8 w-8', cls)} aria-hidden>
      <Icon className={size === 'md' ? 'h-5 w-5' : 'h-4 w-4'} />
    </span>;
}