import { enrichCustomer, enrichOrder, enrichPackage } from '../libs/common/src/enrich-state';
import { formatCustomerCode, formatOrderCode, formatPackageCode } from '../libs/common/src/display-ids';

describe('display ids', () => {
  it('formats numeric order and customer keys', () => {
    expect(formatOrderCode('3')).toBe('DZ-10003');
    expect(formatCustomerCode('4')).toBe('C-1004');
    expect(formatOrderCode('DZ-12001')).toBe('DZ-12001');
  });

  it('enriches entities with codes and string ids', () => {
    const order = enrichOrder({ status: 'Draft' }, 3, 4);
    expect(order.id).toBe('3');
    expect(order.orderCode).toBe('DZ-10003');
    expect(order.customerCode).toBe('C-1004');

    const customer = enrichCustomer({ name: 'A' }, 4, 'Nisha');
    expect(customer.customerCode).toBe('C-1004');
    expect(customer.designer).toBe('Nisha');

    const pkg = enrichPackage({ id: '2', orderId: '3' });
    expect(pkg.packageCode).toMatch(/^PKG-10003-/);
    expect(pkg.orderCode).toBe('DZ-10003');
  });

  it('builds package codes from order context', () => {
    expect(formatPackageCode('1', '3')).toBe('PKG-10003-B');
  });
});