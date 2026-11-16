import type { Garment, Order } from '../types';
import { daysUntil, isoPlusDays, TODAY_ISO } from './format';
import { garmentDue, stageIndex } from './orders';

/** Days before the due date by which a garment should have reached Finishing. */
export const BEHIND_DAYS = 2;

/** Red on the board: overdue, nearly due but not yet at Finishing, or past its planned finish. */
export function isBehind(order: Order, garment: Garment): boolean {
  if (garment.stage === 'alteration') return false;
  if (stageIndex(garment.stage) >= stageIndex('packaging')) return false;
  const d = daysUntil(garmentDue(order, garment));
  if (d < 0) return true;
  if (d <= BEHIND_DAYS && stageIndex(garment.stage) < stageIndex('finishing')) return true;
  if (garment.plannedStart && garment.makeDays && isoPlusDays(garment.plannedStart, garment.makeDays) < TODAY_ISO) return true;
  return false;
}

/** Scheduled to start after the given day and not yet started — kept off the board until then. */
export function startsAfter(garment: Garment, day: string): boolean {
  return !!garment.plannedStart && garment.plannedStart > day && stageIndex(garment.stage) <= stageIndex('scheduling');
}