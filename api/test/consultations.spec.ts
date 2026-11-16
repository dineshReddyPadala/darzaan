import { HttpStatus } from '@nestjs/common';
import { ConsultationsService } from '../apps/core-service/src/consultations/service';
import { availableDates, SLOT_TAKEN } from '../apps/core-service/src/consultations/rules';
import { AppError } from '../libs/common/src/http';
import type { PrismaService } from '../apps/core-service/src/shared/prisma.service';
import type { AuthUser } from '../libs/common/src/auth-context';

type Appointment = {
  id: number;
  reference: string;
  name: string;
  phone: string;
  email: string;
  service: string;
  mode: string;
  appointmentDate: string;
  appointmentTime: string;
  notes: string;
  status: string;
  consent: boolean;
  createdAt: Date;
};

type Lead = {
  id: number;
  name: string;
  phone: string;
  profile: string;
  area: string;
  consent: boolean;
  createdAt: Date;
};

const admin: AuthUser = { sub: '1', email: 'admin@darzaan.test', role: 'admin', name: 'Aditi' };
const salesperson: AuthUser = { sub: '2', email: 'sales@darzaan.test', role: 'salesperson', name: 'Ritu' };

function memory() {
  const appointments: Appointment[] = [];
  const leads: Lead[] = [];
  let nextId = 1;
  const matches = (row: Appointment, where: Record<string, unknown> | undefined) => {
    if (!where) return true;
    return Object.entries(where).every(([key, value]) => {
      if (value && typeof value === 'object' && 'not' in value) {
        return row[key as keyof Appointment] !== (value as { not: unknown }).not;
      }
      return row[key as keyof Appointment] === value;
    });
  };
  const clash = (data: { appointmentDate: string; appointmentTime: string; mode: string; status?: string }, ignoreId?: number) =>
    data.status !== 'cancelled' && appointments.some((row) =>
      row.id !== ignoreId
      && row.status !== 'cancelled'
      && row.appointmentDate === data.appointmentDate
      && row.appointmentTime === data.appointmentTime
      && row.mode === data.mode);
  const api: {
    appointment: {
      findMany: (args?: { where?: Record<string, unknown>; orderBy?: { createdAt: 'desc' }; select?: { appointmentTime: true } }) => Promise<unknown>;
      findFirst: (args: { where?: Record<string, unknown> }) => Promise<Appointment | null>;
      findUnique: (args: { where: { reference?: string; id?: number } }) => Promise<Appointment | null>;
      create: (args: { data: Omit<Appointment, 'id' | 'createdAt'> }) => Promise<Appointment>;
      update: (args: { where: { id: number }; data: { status: string } }) => Promise<Appointment>;
    };
    franchiseLead: {
      findMany: (args?: { orderBy?: { createdAt: 'desc' } }) => Promise<Lead[]>;
      create: (args: { data: Omit<Lead, 'id' | 'createdAt'> }) => Promise<Lead>;
    };
    $transaction: <T>(run: (tx: unknown) => Promise<T>) => Promise<T>;
  } = {
    appointment: {
      findMany: async ({ where, orderBy, select }: { where?: Record<string, unknown>; orderBy?: { createdAt: 'desc' }; select?: { appointmentTime: true } } = {}) => {
        const rows = appointments.filter((row) => matches(row, where));
        const ordered = orderBy?.createdAt === 'desc' ? [...rows].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()) : rows;
        return select ? ordered.map((row) => ({ appointmentTime: row.appointmentTime })) : ordered;
      },
      findFirst: async ({ where }: { where?: Record<string, unknown> }) => appointments.find((row) => matches(row, where)) ?? null,
      findUnique: async ({ where }: { where: { reference?: string; id?: number } }) =>
        appointments.find((row) => (where.reference ? row.reference === where.reference : row.id === where.id)) ?? null,
      create: async ({ data }: { data: Omit<Appointment, 'id' | 'createdAt'> }) => {
        if (appointments.some((row) => row.reference === data.reference) || clash(data)) {
          throw Object.assign(new Error('unique'), { code: 'P2002' });
        }
        const row: Appointment = { ...data, id: nextId, createdAt: new Date(Date.now() + nextId) };
        nextId += 1;
        appointments.push(row);
        return row;
      },
      update: async ({ where, data }: { where: { id: number }; data: { status: string } }) => {
        const row = appointments.find((item) => item.id === where.id);
        if (!row) throw new Error('missing');
        if (clash({ ...row, status: data.status }, row.id)) throw Object.assign(new Error('unique'), { code: 'P2002' });
        row.status = data.status;
        return row;
      },
    },
    franchiseLead: {
      findMany: async ({ orderBy }: { orderBy?: { createdAt: 'desc' } } = {}) =>
        orderBy?.createdAt === 'desc' ? [...leads].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()) : leads,
      create: async ({ data }: { data: Omit<Lead, 'id' | 'createdAt'> }) => {
        const row: Lead = { ...data, id: nextId, createdAt: new Date() };
        nextId += 1;
        leads.push(row);
        return row;
      },
    },
    $transaction: async (run) => run(api),
  };
  return api;
}

function booking(date: string, time = '10:30 AM', extra: Record<string, unknown> = {}) {
  return {
    name: 'Ananya Reddy',
    phone: '9876543210',
    email: 'ananya@example.com',
    service: 'Designer Blouse',
    mode: 'In-studio consultation',
    date,
    time,
    notes: 'Silk blouse',
    consent: true,
    website: '',
    ...extra,
  };
}

describe('consultation bookings', () => {
  const date = availableDates(new Date('2026-11-12T10:00:00+05:30'))[0];

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-11-12T10:00:00+05:30'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('offers the next non-Sunday dates in India', () => {
    const dates = availableDates(new Date('2026-11-12T10:00:00+05:30'));
    expect(dates[0]).toBe('2026-11-13');
    expect(dates).not.toContain('2026-11-15');
    expect(dates).toHaveLength(12);
  });

  it('saves a request and rejects the same slot', async () => {
    const service = new ConsultationsService(memory() as unknown as PrismaService);
    const created = await service.createAppointment(booking(date));
    expect(created).toMatchObject({ ok: true, status: 'requested' });
    if (!('reference' in created) || !created.reference) throw new Error('missing reference');
    expect(created.reference).toMatch(/^DZ-[0-9A-F]{8}$/);
    const open = await service.slots(date, 'In-studio consultation');
    expect(open.slots.find((slot) => slot.time === '10:30 AM')?.available).toBe(false);
    expect(open.slots.find((slot) => slot.time === '11:30 AM')?.available).toBe(true);
    await expect(service.createAppointment(booking(date))).rejects.toMatchObject({ status: HttpStatus.CONFLICT, message: SLOT_TAKEN });
  });

  it('rejects a bad phone, missing consent, a past date, and a honeypot', async () => {
    const service = new ConsultationsService(memory() as unknown as PrismaService);
    await expect(service.createAppointment(booking(date, '11:30 AM', { phone: '123' }))).rejects.toBeInstanceOf(AppError);
    await expect(service.createAppointment(booking(date, '11:30 AM', { consent: false }))).rejects.toMatchObject({ status: HttpStatus.BAD_REQUEST });
    await expect(service.createAppointment(booking('1999-01-01', '11:30 AM'))).rejects.toMatchObject({ message: 'Invalid service or appointment slot' });
    const hidden = await service.createAppointment(booking(date, '11:30 AM', { website: 'https://spam.example' }));
    expect(hidden).toEqual({ ok: true, message: 'Request received' });
    const open = await service.slots(date, 'In-studio consultation');
    expect(open.slots.every((slot) => slot.available)).toBe(true);
  });

  it('saves a franchise enquiry', async () => {
    const service = new ConsultationsService(memory() as unknown as PrismaService);
    const saved = await service.createFranchise({ name: 'Kavya Sharma', phone: '9123456789', type: 'Fashion Designer', area: 'Kondapur', consent: true, website: '' });
    expect(saved).toEqual({ ok: true, message: 'Thank you. Your enquiry has been received.' });
    const list = await service.franchise(admin);
    expect(list.leads).toEqual([expect.objectContaining({ name: 'Kavya Sharma', phone: '9123456789', profile: 'Fashion Designer', area: 'Kondapur' })]);
  });

  it('shows bookings to admin and frees a cancelled slot', async () => {
    const service = new ConsultationsService(memory() as unknown as PrismaService);
    const created = await service.createAppointment(booking(date));
    if (!('reference' in created) || !created.reference) throw new Error('missing reference');
    await expect(service.appointments(salesperson)).rejects.toMatchObject({ status: HttpStatus.FORBIDDEN });
    const list = await service.appointments(admin);
    expect(list.appointments[0]).toMatchObject({ reference: created.reference, name: 'Ananya Reddy', status: 'requested', date, time: '10:30 AM' });
    const board = await service.board(admin, date);
    const held = board.modes.find((mode) => mode.mode === 'In-studio consultation')?.slots.find((slot) => slot.time === '10:30 AM');
    expect(held).toMatchObject({ available: false, reference: created.reference, name: 'Ananya Reddy' });
    await service.setStatus(admin, created.reference, 'cancelled');
    const open = await service.slots(date, 'In-studio consultation');
    expect(open.slots.find((slot) => slot.time === '10:30 AM')?.available).toBe(true);
    const again = await service.createAppointment(booking(date));
    expect('reference' in again && again.reference).toMatch(/^DZ-/);
  });
});
