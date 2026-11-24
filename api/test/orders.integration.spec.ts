import { PrismaClient } from '../generated/core';
import { saveOrderDocument } from '../apps/core-service/src/shared/persist';

const describeIf = process.env.CORE_DATABASE_URL ? describe : describe.skip;

describeIf('order persistence', () => {
  const prisma = new PrismaClient();

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('writes the order, a payment row and an outbox event in one transaction', async () => {
    const written = await prisma.$transaction((tx) => saveOrderDocument(tx, {
      customerId: 999999,
      status: 'Draft',
      store: 'Khan Market',
      storeId: 1,
      deliveryDate: '2026-12-01',
      priority: 'Regular',
      garments: [{ id: 'G1', category: 'Blouse', subCategory: 'Blouse', stage: 'cutting', fabric: { pieces: [] }, embroidery: { versions: [] } }],
      payments: [{ id: 'P1', amount: 1500, method: 'UPI', reference: 'TXN-482910', at: '2026-11-03T10:00:00', by: 'Ritu Sharma', kind: 'Advance' }],
      alterations: [],
      activity: [],
    }, { correlationId: 'test', emit: true }));
    const id = Number(written.order.id);
    const order = await prisma.order.findUnique({ where: { id }, include: { payments: true } });
    const outbox = await prisma.outboxEvent.findFirst({ where: { aggregateId: String(id), type: 'order.created' } });
    expect(order?.payments).toHaveLength(1);
    expect(outbox).toBeTruthy();
    await prisma.order.delete({ where: { id } });
    await prisma.customer.deleteMany({ where: { name: 'Unknown customer', orders: { none: {} } } }).catch(() => undefined);
  });
});
