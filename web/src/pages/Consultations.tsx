import React, { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Tabs } from '../components/ui/Tabs';
import {
  consultationBoard,
  listConsultationAppointments,
  listFranchiseLeads,
  setConsultationStatus,
  type ConsultationAppointment,
  type ConsultationSlot,
} from '../services/api';
import { apiMode } from '../services/mode';
import { inputClass, pageClass, panelClass } from '../utils/styles';

type Lead = { name: string; phone: string; profile: string; area: string; createdAt: string };
type ModeBoard = { mode: string; slots: ConsultationSlot[] };
const STATUSES: ConsultationAppointment['status'][] = ['requested', 'confirmed', 'cancelled', 'completed'];

function todayInIndia(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}

export function Consultations() {
  const [date, setDate] = useState(todayInIndia);
  const [tab, setTab] = useState<'appointments' | 'franchise'>('appointments');
  const [appointments, setAppointments] = useState<ConsultationAppointment[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [modes, setModes] = useState<ModeBoard[]>([]);
  const [pending, setPending] = useState('');

  const load = useCallback(async (day: string) => {
    if (!apiMode) return;
    try {
      const [booked, enquiries, board] = await Promise.all([
        listConsultationAppointments(),
        listFranchiseLeads(),
        consultationBoard(day),
      ]);
      setAppointments(booked.appointments);
      setLeads(enquiries.leads);
      setModes(board.modes);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not load consultations');
    }
  }, []);

  useEffect(() => {
    void load(date);
  }, [date, load]);

  const change = async (reference: string, status: ConsultationAppointment['status']) => {
    setPending(reference);
    try {
      await setConsultationStatus(reference, status);
      await load(date);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not update this appointment');
    } finally {
      setPending('');
    }
  };

  return <div className={pageClass}>
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-3xl font-medium tracking-tight">Consultations</h1>
        <p className="mt-1 text-sm text-ink-muted">Appointment requests, open times, and franchise enquiries from the website.</p>
      </div>
      <label className="text-sm font-medium text-ink">
        Day
        <input type="date" className={`${inputClass} mt-1 w-44`} value={date} onChange={(event) => setDate(event.target.value)} />
      </label>
    </div>
    {!apiMode && <p className={`${panelClass} px-5 py-4 text-sm text-ink-muted`}>Connect the app to the API to read consultation bookings.</p>}
    {apiMode && <>
      <div className="grid gap-4 lg:grid-cols-2">
        {modes.map((mode) => <section key={mode.mode} className={`${panelClass} p-5`}>
          <h2 className="text-sm font-semibold">{mode.mode}</h2>
          <ul className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {mode.slots.map((slot) => <li key={slot.time} className={`rounded-xl border px-3 py-2 text-sm ${slot.available ? 'border-line text-ink-muted' : 'border-brand/30 bg-brand-soft text-ink'}`}>
              <p className="font-medium">{slot.time}</p>
              <p className="mt-1 truncate text-xs">{slot.available ? 'Open' : slot.name}</p>
            </li>)}
          </ul>
        </section>)}
      </div>
      <Tabs
        className="mt-8"
        value={tab}
        onChange={setTab}
        tabs={[
          { key: 'appointments', label: 'Appointments', count: appointments.length },
          { key: 'franchise', label: 'Franchise', count: leads.length },
        ]}
      />
      {tab === 'appointments' ? <div className={`${panelClass} mt-4 overflow-x-auto`}>
        <table className="w-full min-w-[880px] text-sm">
          <thead>
            <tr className="border-b border-line text-left text-ink-muted">
              <th className="px-4 py-3 font-medium">Reference</th>
              <th className="px-4 py-3 font-medium">Guest</th>
              <th className="px-4 py-3 font-medium">Service</th>
              <th className="px-4 py-3 font-medium">When</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {appointments.map((row) => <tr key={row.reference}>
              <td className="px-4 py-3 font-medium">{row.reference}</td>
              <td className="px-4 py-3">
                <p>{row.name}</p>
                <p className="text-xs text-ink-muted">{row.phone}{row.email ? ` · ${row.email}` : ''}</p>
              </td>
              <td className="px-4 py-3">
                <p>{row.service}</p>
                <p className="text-xs text-ink-muted">{row.mode}</p>
                {row.notes && <p className="mt-1 max-w-xs text-xs text-ink-muted">{row.notes}</p>}
              </td>
              <td className="whitespace-nowrap px-4 py-3">{row.date} · {row.time}</td>
              <td className="px-4 py-3">
                <select
                  aria-label={`Status for ${row.reference}`}
                  className="h-9 rounded-lg border border-line-strong bg-surface px-2 text-sm"
                  value={row.status}
                  disabled={pending === row.reference}
                  onChange={(event) => void change(row.reference, event.target.value as ConsultationAppointment['status'])}
                >
                  {STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
                </select>
              </td>
            </tr>)}
            {appointments.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-ink-muted">No appointment requests yet.</td></tr>}
          </tbody>
        </table>
      </div> : <div className={`${panelClass} mt-4 overflow-x-auto`}>
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-line text-left text-ink-muted">
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Phone</th>
              <th className="px-4 py-3 font-medium">Profile</th>
              <th className="px-4 py-3 font-medium">Area</th>
              <th className="px-4 py-3 font-medium">Received</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {leads.map((row) => <tr key={`${row.phone}-${row.createdAt}`}>
              <td className="px-4 py-3 font-medium">{row.name}</td>
              <td className="px-4 py-3">{row.phone}</td>
              <td className="px-4 py-3">{row.profile}</td>
              <td className="px-4 py-3">{row.area}</td>
              <td className="whitespace-nowrap px-4 py-3">{new Date(row.createdAt).toLocaleString()}</td>
            </tr>)}
            {leads.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-ink-muted">No franchise enquiries yet.</td></tr>}
          </tbody>
        </table>
      </div>}
    </>}
  </div>;
}
