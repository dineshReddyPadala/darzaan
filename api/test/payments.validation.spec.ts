import { PrismaClient } from '../generated/core';
import { saveOrderDocument } from '../apps/core-service/src/shared/persist';

const describeIf = process.env.CORE_DATABASE_URL ? describe : describe.skip;

describeIf('payment validation', () => {
  const prisma = new PrismaClient();

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('rejects UPI payments without a transaction reference', async () => {
    await expect(
      prisma.$transaction((tx) =>
        saveOrderDocument(
          tx,
          {
            customerId: 999998,
            status: 'Draft',
            store: 'Khan Market',
            storeId: 1,
            deliveryDate: '2026-12-01',
            priority: 'Regular',
            garments: [{ id: 'G1', category: 'Blouse', subCategory: 'Blouse', stage: 'cutting', price: 10000, fabric: { pieces: [] }, embroidery: { versions: [] } }],
            payments: [{ amount: 1500, method: 'UPI', reference: '', at: '2026-11-03T10:00:00', by: 'Ritu Sharma', kind: 'Advance' }],
            alterations: [],
            activity: [],
          },
          { correlationId: 'test-upi', emit: false },
        ),
      ),
    ).rejects.toThrow(/transaction reference/);
  });
});