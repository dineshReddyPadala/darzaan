/** Re-exports catalog helpers from roles.ts so callers can import either path. */
export {
  catalogRoleIds,
  getRoleCatalog,
  hasRole,
  roleDefFor,
  sanitizeRoleId,
  seedRoleCatalog,
  setRoleCatalog,
} from './roles';
