/** /api/v1/consultations — admin lists, slot board, and appointment status. */
export const consultationRoutes = {
  base: 'v1/consultations',
  appointments: 'appointments',
  appointment: 'appointments/:reference',
  franchise: 'franchise',
  slots: 'slots',
} as const;
