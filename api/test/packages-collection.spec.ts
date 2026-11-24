import { validateAndNormalizePackages } from '../libs/common/src/packages-collection';

describe('packages collection', () => {
  const open = {
    id: '1',
    orderId: '10003',
    status: 'Packaging assigned',
    items: [{ garmentId: '10', category: 'garment', label: 'Blouse' }],
    destination: { kind: 'store', name: 'Khan Market', detail: '' },
  };

  it('rejects duplicate open packages for the same garments', () => {
    expect(() => validateAndNormalizePackages([open, { ...open, id: '2' }], { name: 'Ritu' })).toThrow(/already exists/);
  });

  it('fills receivedBy on store delivery when missing', () => {
    const delivered = {
      ...open,
      status: 'Delivered',
      destination: { kind: 'store', name: 'Khan Market', detail: '' },
    };
    const [row] = validateAndNormalizePackages([delivered], { name: 'Sunil' });
    expect(row.receivedBy).toBe('Sunil');
  });
});