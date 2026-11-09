export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'STAFF' | 'RIDER';

export const ROLES: Record<UserRole, UserRole> = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  STAFF: 'STAFF',
  RIDER: 'RIDER',
};

/**
 * Check if a user's role satisfies any of the required roles
 */
export function hasRole(userRole: string | undefined | null, requiredRoles: UserRole[]): boolean {
  if (!userRole) return false;
  // SUPER_ADMIN has access to all admin and staff capabilities
  if (userRole === 'SUPER_ADMIN') return true;
  return requiredRoles.includes(userRole as UserRole);
}

/**
 * Check if the user is authorized for Admin Dashboard access
 */
export function canAccessAdmin(role: string | undefined | null): boolean {
  return hasRole(role, ['SUPER_ADMIN', 'ADMIN', 'STAFF']);
}

/**
 * Check if the user has Rider portal access
 */
export function canAccessRider(role: string | undefined | null): boolean {
  return role === 'RIDER';
}

/**
 * Check if the user can modify financial settings / refund deposits
 */
export function canModifyFinancials(role: string | undefined | null): boolean {
  return hasRole(role, ['SUPER_ADMIN', 'ADMIN']);
}
