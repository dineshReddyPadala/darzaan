/** Staff accounts stay under /api/v1/auth. */
export const userRoutes = {
  base: 'v1/auth',
  users: 'users',
  user: 'users/:id',
  password: 'users/:id/password',
  assistants: 'production-assistants',
} as const;
