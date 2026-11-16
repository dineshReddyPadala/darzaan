/** /api/v1/auth session and password routes. */
export const authRoutes = {
  base: 'v1/auth',
  login: 'login',
  refresh: 'refresh',
  logout: 'logout',
  forgotPassword: 'forgot-password',
  resetPassword: 'reset-password',
  changePassword: 'change-password',
  me: 'me',
} as const;
