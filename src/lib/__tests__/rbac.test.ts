import { describe, expect, it } from 'vitest';
import { can } from '../auth/rbac';
describe('RBAC', () => { it('admin puede borrar', () => expect(can('admin', 'delete')).toBe(true)); it('editor no puede borrar', () => expect(can('editor', 'delete')).toBe(false)); it('viewer solo puede leer', () => expect(can('viewer', 'read')).toBe(true)); });