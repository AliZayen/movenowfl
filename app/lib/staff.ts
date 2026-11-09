// Staff roles and what each may do. Shared by the server (which enforces it) and the admin UI
// (which only hides what the server would refuse anyway).

export const STAFF_ROLES = ['manager', 'dispatcher', 'support'] as const;
export type StaffRoleId = (typeof STAFF_ROLES)[number];

export const PERMISSIONS = [
  'overview.view',
  'bookings.view',
  'bookings.manage', // confirm, assign, start, complete, cancel, edit photos
  'providers.view',
  'providers.manage',
  'customers.view',
  'support.reply', // the support inbox in Messages
  'availability.manage',
  'staff.manage',
  'audit.view',
] as const;
export type Permission = (typeof PERMISSIONS)[number];

const ROLE_PERMISSIONS: Record<StaffRoleId, readonly Permission[]> = {
  manager: PERMISSIONS,
  dispatcher: ['overview.view', 'bookings.view', 'bookings.manage', 'providers.view', 'providers.manage', 'customers.view', 'availability.manage'],
  support: ['overview.view', 'bookings.view', 'providers.view', 'customers.view', 'support.reply'],
};

export const STAFF_ROLE_LABELS: Record<StaffRoleId, { label: string; description: string }> = {
  manager: { label: 'Manager', description: 'Everything, including staff accounts and the audit log' },
  dispatcher: { label: 'Dispatcher', description: 'Bookings, providers and availability' },
  support: { label: 'Support', description: 'Reads bookings and customers, answers support messages' },
};

interface StaffLike {
  role: string;
  staffRole?: StaffRoleId | null;
  disabledAt?: Date | string | null;
}

export function permissionsOf(user: StaffLike | null | undefined): Permission[] {
  if (!user || user.role !== 'admin' || user.disabledAt || !user.staffRole) return [];
  return [...ROLE_PERMISSIONS[user.staffRole]];
}

export function can(user: StaffLike | null | undefined, permission: Permission) {
  return permissionsOf(user).includes(permission);
}
