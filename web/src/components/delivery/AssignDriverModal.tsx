import React, { useEffect, useState } from 'react';
import { usePackages } from '../../contexts/PackagesContext';
import { RUNNERS } from '../../data/packages';
import type { PackageRecord } from '../../types/packaging';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { DriverPicker } from './DriverPicker';

/** Assign or change the driver for one shipment. */
export function AssignDriverModal({
  p,
  onClose



}: {p: PackageRecord | null;onClose: () => void;}) {
  const {
    assignDriver
  } = usePackages();
  const [driver, setDriver] = useState(RUNNERS[0]);
  useEffect(() => {
    if (p) setDriver(p.runner ?? RUNNERS[0]);
  }, [p]);
  const changing = !!p?.runner;
  return <Modal open={!!p} onClose={onClose} title={changing ? 'Change driver' : 'Assign driver'} footer={<>
      <Button variant="ghost" onClick={onClose}>Cancel</Button>
      <Button disabled={!p || driver === p.runner} onClick={() => {
      if (p) assignDriver(p.id, driver);
      onClose();
    }}>{changing ? 'Change driver' : 'Assign & send out'}</Button>
    </>}>
      <DriverPicker value={driver} onChange={setDriver} />
    </Modal>;
}