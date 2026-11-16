/** /api/v1/notifications */
export const notificationRoutes = {
  base: 'v1/notifications',
  itemRead: ':id/read',
  readAll: 'read-all',
  item: ':id',
} as const;
