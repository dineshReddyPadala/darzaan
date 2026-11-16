import { HttpStatus, Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';
import type { AuthUser } from '../../../../libs/common/src/auth-context';
import { AppError } from '../../../../libs/common/src/http';
import { PrismaService } from '../shared/prisma.service';
import {
  MODES,
  SERVICES,
  SLOTS,
  SLOT_TAKEN,
  STATUSES,
  availableDates,
  cleanText,
  indianMobile,
  isSlotConflict,
  optionalEmail,
  optionalNotes,
  type AppointmentStatus,
} from './rules';

type AppointmentRow = {
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
  createdAt: Date;
};

@Injectable()
export class ConsultationsService {
  constructor(private readonly prisma: PrismaService) {}

  slots(date: string, mode: string) {
    this.requireBookable(date, mode);
    return this.occupancy(date, mode).then((taken) => ({
      date,
      mode,
      slots: SLOTS.map((time) => ({ time, available: !taken.has(time) })),
    }));
  }

  async createAppointment(body: Record<string, unknown>) {
    if (String(body.website ?? '').trim()) return { ok: true, message: 'Request received' };
    if (body.consent !== true) throw new AppError(HttpStatus.BAD_REQUEST, 'Consent required');
    const name = cleanText(body.name, 2, 80);
    const phone = indianMobile(body.phone);
    const email = optionalEmail(body.email);
    const service = typeof body.service === 'string' ? body.service : '';
    const mode = typeof body.mode === 'string' ? body.mode : '';
    const date = typeof body.date === 'string' ? body.date : '';
    const time = typeof body.time === 'string' ? body.time : '';
    const notes = optionalNotes(body.notes);
    if (!SERVICES.includes(service as (typeof SERVICES)[number]) || !this.isBookable(date, mode) || !SLOTS.includes(time as (typeof SLOTS)[number])) {
      throw new AppError(HttpStatus.BAD_REQUEST, 'Invalid service or appointment slot');
    }
    const reference = `DZ-${randomBytes(4).toString('hex').toUpperCase()}`;
    try {
      await this.prisma.$transaction(async (tx) => {
        const taken = await tx.appointment.findFirst({
          where: { appointmentDate: date, appointmentTime: time, mode, status: { not: 'cancelled' } },
        });
        if (taken) throw new AppError(HttpStatus.CONFLICT, SLOT_TAKEN);
        await tx.appointment.create({
          data: {
            reference,
            name,
            phone,
            email,
            service,
            mode,
            appointmentDate: date,
            appointmentTime: time,
            notes,
            status: 'requested',
            consent: true,
          },
        });
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      if (isSlotConflict(error)) throw new AppError(HttpStatus.CONFLICT, SLOT_TAKEN);
      throw error;
    }
    return {
      ok: true,
      reference,
      status: 'requested' as const,
      message: 'Your request has been received. The Darzaan team will confirm your appointment.',
    };
  }

  async createFranchise(body: Record<string, unknown>) {
    if (String(body.website ?? '').trim()) return { ok: true };
    if (body.consent !== true) throw new AppError(HttpStatus.BAD_REQUEST, 'Consent required');
    const name = cleanText(body.name, 2, 120);
    const phone = indianMobile(body.phone);
    const profile = cleanText(body.type, 1, 90);
    const area = cleanText(body.area, 2, 120);
    await this.prisma.franchiseLead.create({ data: { name, phone, profile, area, consent: true } });
    return { ok: true, message: 'Thank you. Your enquiry has been received.' };
  }

  async appointments(user: AuthUser) {
    this.requireAdmin(user);
    const rows = await this.prisma.appointment.findMany({ orderBy: { createdAt: 'desc' } });
    return { appointments: rows.map((row) => this.present(row)) };
  }

  async franchise(user: AuthUser) {
    this.requireAdmin(user);
    const rows = await this.prisma.franchiseLead.findMany({ orderBy: { createdAt: 'desc' } });
    return {
      leads: rows.map((row) => ({
        name: row.name,
        phone: row.phone,
        profile: row.profile,
        area: row.area,
        createdAt: row.createdAt.toISOString(),
      })),
    };
  }

  async board(user: AuthUser, date: string) {
    this.requireAdmin(user);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new AppError(HttpStatus.BAD_REQUEST, 'Invalid appointment date');
    const rows = await this.prisma.appointment.findMany({
      where: { appointmentDate: date, status: { not: 'cancelled' } },
    });
    return {
      date,
      modes: MODES.map((mode) => ({
        mode,
        slots: SLOTS.map((time) => {
          const held = rows.find((row) => row.mode === mode && row.appointmentTime === time);
          return held
            ? { time, available: false as const, reference: held.reference, name: held.name }
            : { time, available: true as const };
        }),
      })),
    };
  }

  async setStatus(user: AuthUser, reference: string, status: string) {
    this.requireAdmin(user);
    if (!STATUSES.includes(status as AppointmentStatus)) throw new AppError(HttpStatus.BAD_REQUEST, 'Invalid status');
    const row = await this.prisma.appointment.findUnique({ where: { reference } });
    if (!row) throw new AppError(HttpStatus.NOT_FOUND, 'Not found');
    if (status !== 'cancelled') {
      const clash = await this.prisma.appointment.findFirst({
        where: {
          appointmentDate: row.appointmentDate,
          appointmentTime: row.appointmentTime,
          mode: row.mode,
          status: { not: 'cancelled' },
          id: { not: row.id },
        },
      });
      if (clash) throw new AppError(HttpStatus.CONFLICT, SLOT_TAKEN);
    }
    try {
      await this.prisma.appointment.update({ where: { id: row.id }, data: { status } });
    } catch (error) {
      if (isSlotConflict(error)) throw new AppError(HttpStatus.CONFLICT, SLOT_TAKEN);
      throw error;
    }
    return { ok: true };
  }

  private requireAdmin(user: AuthUser) {
    if (user.role !== 'admin') throw new AppError(HttpStatus.FORBIDDEN, 'Only an admin can view consultations');
  }

  private requireBookable(date: string, mode: string) {
    if (!this.isBookable(date, mode)) throw new AppError(HttpStatus.BAD_REQUEST, 'Invalid appointment date or consultation mode');
  }

  private isBookable(date: string, mode: string) {
    return availableDates().includes(date) && MODES.includes(mode as (typeof MODES)[number]);
  }

  private async occupancy(date: string, mode: string) {
    const rows = await this.prisma.appointment.findMany({
      where: { appointmentDate: date, mode, status: { not: 'cancelled' } },
      select: { appointmentTime: true },
    });
    return new Set(rows.map((row) => row.appointmentTime));
  }

  private present(row: AppointmentRow) {
    return {
      reference: row.reference,
      name: row.name,
      phone: row.phone,
      email: row.email,
      service: row.service,
      mode: row.mode,
      date: row.appointmentDate,
      time: row.appointmentTime,
      notes: row.notes,
      status: row.status,
    };
  }
}
