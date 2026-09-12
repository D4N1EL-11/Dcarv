export type Role = 'admin' | 'editor' | 'viewer';
const permissions: Record<Role, string[]> = { admin: ['read', 'create', 'update', 'delete'], editor: ['read', 'create', 'update'], viewer: ['read'] };
export function can(role: Role, action: string) { return permissions[role]?.includes(action) ?? false; }