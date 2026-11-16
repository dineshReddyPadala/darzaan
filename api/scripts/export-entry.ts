import { writeFileSync } from 'fs';
import path from 'path';
import { categories, samplers } from '../../webapp/src/data/catalog';
import { customers } from '../../webapp/src/data/customers';
import { fabrics, trims } from '../../webapp/src/data/inventory';
import { deliveryJobs, logisticsIssues, movements } from '../../webapp/src/data/logistics';
import { notifications } from '../../webapp/src/data/notifications';
import { orders } from '../../webapp/src/data/orders';
import { seedPackages } from '../../webapp/src/data/packages';
import { priceRequests } from '../../webapp/src/data/priceRequests';
import { qcIssues, qcReworks } from '../../webapp/src/data/production';
import { quotes } from '../../webapp/src/data/quotes';
import { customerMetrics, onTimeByWeek, qcByStation, revenueByWeek } from '../../webapp/src/data/reports';
import { floorDrafts, floorRequests, swatchLoans } from '../../webapp/src/data/store';
import { employees } from '../../webapp/src/data/team';

const payload = {
  customers,
  orders,
  quotes,
  notifications,
  priceRequests,
  qcIssues,
  qcInspections: [],
  qcReworks,
  packages: seedPackages,
  movements,
  deliveries: deliveryJobs,
  logisticsIssues,
  floorRequests,
  floorDrafts,
  swatchLoans,
  cashCloses: [],
  inventoryFabrics: fabrics,
  inventoryTrims: trims,
  inventorySamplers: samplers,
  team: employees,
  catalog: categories,
  notificationSettings: {},
  reports: { revenueByWeek, qcByStation, onTimeByWeek, customerMetrics },
};

writeFileSync(path.resolve('prisma/seed-data.json'), JSON.stringify(payload));
