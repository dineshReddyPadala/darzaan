import React from 'react';
import { Link } from 'react-router-dom';
import { useLogistics } from '../../contexts/LogisticsContext';
import { buttonClass } from '../ui/Button';

/** A bag coming from the workshop: when it lands and one action. Contents are counted on the receiving screen. */
export function BagPanel({
  bagId


}: {bagId: string;}) {
  const {
    movements
  } = useLogistics();
  const m = movements.find((x) => x.id === bagId);
  if (!m) return null;
  const notYet = m.status === 'Awaiting pickup';
  return <div className="p-6">
      <p className="text-xl font-semibold leading-tight">Bag {m.id}</p>
      <p className="text-sm text-ink-subtle">{m.bags.length} garment{m.bags.length > 1 ? 's' : ''} · {m.runner.split(' ')[0]}</p>
      <p className="mt-6 text-[17px] font-semibold">{notYet ? 'Not picked up yet' : m.eta ? `Arrives ${m.eta}` : 'On the way'}</p>
      <Link to="/logistics?tab=receive" className={buttonClass(notYet ? 'secondary' : 'primary', 'lg', 'mt-6 w-full')}>{notYet ? 'Track the bag' : 'Receive and count'}</Link>
    </div>;
}