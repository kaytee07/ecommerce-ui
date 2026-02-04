export const ROLES = {
  USER: 'ROLE_USER',
  ADMIN: 'ROLE_ADMIN',
  CONTENT_MANAGER: 'ROLE_CONTENT_MANAGER',
  SUPPORT_AGENT: 'ROLE_SUPPORT_AGENT',
  WAREHOUSE: 'ROLE_WAREHOUSE',
  SUPER_ADMIN: 'ROLE_SUPER_ADMIN',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export function hasRole(userRoles: string[], requiredRole: string): boolean {
  return userRoles.includes(requiredRole);
}

export function hasAnyRole(userRoles: string[], requiredRoles: string[]): boolean {
  return requiredRoles.some((role) => userRoles.includes(role));
}

export function isAdmin(roles: string[]): boolean {
  return hasAnyRole(roles, [
    ROLES.ADMIN,
    ROLES.CONTENT_MANAGER,
    ROLES.SUPPORT_AGENT,
    ROLES.WAREHOUSE,
    ROLES.SUPER_ADMIN,
  ]);
}

export function getPermissions(roles: string[]) {
  return {
    // Product management
    canViewAdminProducts: hasAnyRole(roles, [ROLES.CONTENT_MANAGER, ROLES.SUPER_ADMIN]),
    canCreateProducts: hasAnyRole(roles, [ROLES.CONTENT_MANAGER, ROLES.SUPER_ADMIN]),
    canEditProducts: hasAnyRole(roles, [ROLES.CONTENT_MANAGER, ROLES.SUPER_ADMIN]),
    canDeleteProducts: hasAnyRole(roles, [ROLES.CONTENT_MANAGER, ROLES.SUPER_ADMIN]),

    // Category management
    canManageCategories: hasAnyRole(roles, [ROLES.CONTENT_MANAGER, ROLES.SUPER_ADMIN]),
    canPermanentDeleteCategories: hasRole(roles, ROLES.SUPER_ADMIN),

    // Order management
    canViewAllOrders: hasAnyRole(roles, [
      ROLES.WAREHOUSE,
      ROLES.CONTENT_MANAGER,
      ROLES.SUPPORT_AGENT,
      ROLES.SUPER_ADMIN,
    ]),
    canFulfillOrders: hasAnyRole(roles, [ROLES.WAREHOUSE, ROLES.SUPER_ADMIN]),
    canCancelOrders: hasAnyRole(roles, [ROLES.CONTENT_MANAGER, ROLES.SUPER_ADMIN]),

    // Payment management
    canViewPayments: hasAnyRole(roles, [ROLES.SUPPORT_AGENT, ROLES.CONTENT_MANAGER, ROLES.SUPER_ADMIN]),
    canProcessRefunds: hasAnyRole(roles, [ROLES.SUPPORT_AGENT, ROLES.CONTENT_MANAGER, ROLES.SUPER_ADMIN]),

    // User management
    canViewUsers: hasAnyRole(roles, [ROLES.ADMIN, ROLES.SUPPORT_AGENT, ROLES.SUPER_ADMIN]),
    canManageRoles: hasRole(roles, ROLES.SUPER_ADMIN),

    // Inventory management
    canViewInventory: hasAnyRole(roles, [ROLES.WAREHOUSE, ROLES.CONTENT_MANAGER, ROLES.SUPER_ADMIN]),
    canAdjustInventory: hasAnyRole(roles, [ROLES.WAREHOUSE, ROLES.CONTENT_MANAGER, ROLES.SUPER_ADMIN]),

    // Analytics
    canViewAnalytics: hasAnyRole(roles, [ROLES.ADMIN, ROLES.SUPER_ADMIN]),
    canExportData: hasRole(roles, ROLES.SUPER_ADMIN),

    // Storefront content
    canManageStorefront: hasAnyRole(roles, [ROLES.ADMIN, ROLES.SUPER_ADMIN]),

    // Notifications
    canViewNotifications: hasAnyRole(roles, [
      ROLES.CONTENT_MANAGER,
      ROLES.WAREHOUSE,
      ROLES.SUPPORT_AGENT,
      ROLES.SUPER_ADMIN,
    ]),
    canSendAnnouncements: hasAnyRole(roles, [ROLES.ADMIN, ROLES.SUPER_ADMIN]),

    // Audit logs (SUPER_ADMIN only)
    canViewAuditLogs: hasRole(roles, ROLES.SUPER_ADMIN),

    // Super admin
    isSuperAdmin: hasRole(roles, ROLES.SUPER_ADMIN),
  };
}
