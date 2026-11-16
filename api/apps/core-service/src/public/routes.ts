/** Public storefront and marketing routes. No bearer token. */
export const publicRoutes = {
  base: 'v1/public',
  order: 'orders/:id',
  bookings: 'bookings',
  slots: 'slots',
  appointments: 'appointments',
  franchise: 'franchise',
} as const;
