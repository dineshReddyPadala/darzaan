import React from 'react';
import type { PackageStatus } from '../../types/packaging';
import { packageStatusLabel, packageStatusTone } from '../../utils/packages';
import { Badge } from '../ui/Badge';
export function PackageStatusBadge({
  status,
  size



}: {status: PackageStatus;size?: 'sm' | 'md';}) {
  return <Badge tone={packageStatusTone[status]} size={size} dot>{packageStatusLabel[status]}</Badge>;
}