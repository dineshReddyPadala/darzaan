import type { AppNotification } from '../types';

export const notifications: AppNotification[] = [
{ id: 'N-1', category: 'Action Required', severity: 'critical', title: 'Express order not started', body: 'DZ-10305 (Angrakha, 24h) is due tomorrow and has not been assigned.', orderId: 'DZ-10305', at: '2026-10-08T09:00:00', read: false },
{ id: 'N-2', category: 'Production', severity: 'warning', title: 'Delivery at risk', body: 'DZ-10293 lehenga embroidery is 2 days behind plan.', orderId: 'DZ-10293', at: '2026-10-07T18:00:00', read: false },
{ id: 'N-3', category: 'Production', severity: 'warning', title: 'Failed QC', body: 'DZ-10299 evening gown — uneven hem. Routed to Hemming.', orderId: 'DZ-10299', at: '2026-10-07T15:22:00', read: false },
{ id: 'N-4', category: 'Customer', severity: 'attention', title: 'Change request awaiting approval', body: 'Rohan Kapoor asked to swap sherwani buttons (+₹450, +1 day).', orderId: 'DZ-10301', at: '2026-10-07T19:10:00', read: false },
{ id: 'N-5', category: 'Payments', severity: 'attention', title: 'Advance incomplete', body: 'DZ-10308 has 40% paid. 70% is required before production.', orderId: 'DZ-10308', at: '2026-10-05T18:00:00', read: true },
{ id: 'N-6', category: 'Order Updates', severity: 'info', title: 'Trial today at 11:30', body: 'Kavya Iyer — Floor-length Anarkali.', orderId: 'DZ-10288', at: '2026-10-08T08:00:00', read: false },
{ id: 'N-7', category: 'Logistics', severity: 'info', title: 'Pickup scheduled', body: 'Runner Arjun Singh picks up 3 orders from Okhla at 14:00.', at: '2026-10-08T09:30:00', read: true },
{ id: 'N-8', category: 'System', severity: 'attention', title: 'Low stock: Emerald Velvet', body: '7 m left — below reorder level of 15 m.', at: '2026-10-07T12:00:00', read: true }];