import React from 'react';
import { HomeIcon, KeyRoundIcon, MapPinIcon, NavigationIcon, PhoneIcon, StoreIcon } from 'lucide-react';
import { buttonClass } from '../ui/Button';

interface StoreContact {
  contact: string;
  phone: string;
  hours: string;
}

/**
 * Where a package is going, for the shipment's side panel.
 * The place leads, then the address with directions, then who to reach there — the same shape as the Driver card.
 */
export function DestinationDetails({
  kind,
  name,
  address,
  store,
  customerPhone






}: {kind: 'store' | 'customer';name: string;address: string;store?: StoreContact;customerPhone?: string;}) {
  const isStore = kind === 'store';
  const Icon = isStore ? StoreIcon : HomeIcon;
  const phone = isStore ? store?.phone : customerPhone;
  const directions = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${isStore ? name + ', ' : ''}${address}`)}`;
  return <div>
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand" aria-hidden>
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-[17px] font-semibold leading-tight">{name}</p>
          <p className="mt-0.5 text-sm text-ink-muted">{isStore ? 'Darzaan store' : 'Customer’s home'}</p>
        </div>
      </div>

      <div className="mt-4 flex gap-2.5 border-t border-line pt-4">
        <MapPinIcon className="mt-0.5 h-4 w-4 shrink-0 text-ink-subtle" aria-hidden />
        <div className="min-w-0">
          <p className="text-[15px] leading-snug">{address}</p>
          <a href={directions} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 rounded text-sm font-medium text-brand hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand">
            <NavigationIcon className="h-3.5 w-3.5" aria-hidden /> Directions
          </a>
        </div>
      </div>

      {isStore && store && <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-line pt-4">
          <div className="min-w-0">
            <dt className="text-sm text-ink-muted">Contact</dt>
            <dd className="mt-0.5 truncate text-[15px] font-medium">{store.contact}</dd>
          </div>
          <div className="min-w-0">
            <dt className="text-sm text-ink-muted">Open</dt>
            <dd className="mt-0.5 truncate text-[15px] font-medium tabular">{store.hours}</dd>
          </div>
        </dl>}

      {!isStore && <p className="mt-4 flex items-center gap-2.5 rounded-xl bg-sunken px-3.5 py-3 text-sm">
          <KeyRoundIcon className="h-4 w-4 shrink-0 text-brass" aria-hidden />
          Handed over only with the customer’s OTP
        </p>}

      {phone && <a href={`tel:${phone.replace(/\s/g, '')}`} className={buttonClass('secondary', 'md', 'mt-4 w-full')}>
          <PhoneIcon className="h-4 w-4" aria-hidden /> Call {isStore ? store?.contact.split(' ')[0] : 'customer'} <span className="tabular">{phone}</span>
        </a>}
    </div>;
}