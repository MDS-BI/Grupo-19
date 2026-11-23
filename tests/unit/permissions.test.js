import { describe, it, expect, beforeEach } from 'vitest';
import {
  clearAll,
  loadProducts,
  loadReplenishments,
  loadRolePermissions,
  loadRoles,
  loadStock,
  loadTransfers,
  loadUserPermissionOverrides,
  loadUsers,
  saveProducts,
  saveRolePermissions,
  saveUsers,
  seedLogisticsCatalogs
} from '../../src/storage.js';
import {
  ACTIVE_USER_KEY,
  ADMIN_RESOURCE,
  MODULES,
  canAccessModule,
  canPerform,
  getEffectivePermission,
  getRolePermissions,
  getRoles,
  resolveLandingModule,
  roleLabel,
  setActiveUserId,
  setRoleLandingModule,
  setRolePermission,
  setUserPermissionOverride,
  setUserRole
} from '../../src/domain/permissions.js';

const store = new Map();
globalThis.localStorage = {
  getItem: (key) => (store.has(key) ? store.get(key) : null),
  setItem: (key, value) => store.set(key, String(value)),
  removeItem: (key) => store.delete(key),
  clear: () => store.clear()
};

beforeEach(() => {
  store.clear();
  seedLogisticsCatalogs();
});

describe('HU-08 roles and permissions domain', () => {
  it('seeds the three roles with their landing pages and admin flag (FR-106, FR-118)', () => {
    const roles = getRoles();
    expect(roles.map((r) => r.role_key)).toEqual(['administrador', 'supervisor_inventario', 'encargado_bodega']);
    expect(roles.map((r) => r.default_landing_module)).toEqual(['dashboard', 'alerts', 'movements']);
    expect(roles.filter((r) => r.is_admin).map((r) => r.role_key)).toEqual(['administrador']);
    expect(roleLabel('supervisor_inventario')).toBe('Supervisor de inventario');
    expect(loadUserPermissionOverrides()).toEqual([]);
  });

  it('preserves the legacy permission matrix as the initial seed (FR-071, FR-108)', () => {
    expect(loadRolePermissions().length).toBeGreaterThan(0);
    expect(canPerform('administrador', 'products.manage')).toBe(true);
    expect(canPerform('administrador', 'replenishments.receive')).toBe(false);
    expect(canPerform('supervisor_inventario', 'replenishments.create')).toBe(true);
    expect(canPerform('supervisor_inventario', 'movements.register')).toBe(false);
    expect(canPerform('encargado_bodega', 'movements.register')).toBe(true);
    expect(canPerform('encargado_bodega', 'replenishments.receive')).toBe(true);
    expect(canAccessModule('supervisor_inventario', 'entities')).toBe(false);
  });

  it('gives individual overrides precedence over the role (SC-045)', () => {
    setUserPermissionOverride(3, 'accion', 'action:products.manage', true);
    expect(getEffectivePermission('supervisor_inventario', 'accion', 'action:products.manage', 3)).toBe(true);
    expect(canPerform('supervisor_inventario', 'products.manage', 3)).toBe(true);
    expect(canPerform('supervisor_inventario', 'products.manage')).toBe(false);
  });

  it('keeps business-rule restrictions even when the matrix tries to grant them (FR-124, SC-050)', () => {
    const result = setRolePermission('encargado_bodega', 'accion', 'action:replenishments.create', true);
    expect(result.success).toBe(false);
    expect(getEffectivePermission('encargado_bodega', 'accion', 'action:replenishments.create')).toBe(false);
    expect(canPerform('encargado_bodega', 'replenishments.create')).toBe(false);
  });

  it('limits an unknown role to dashboard with no actions (SC-048)', () => {
    expect(getRolePermissions('invitado').modules).toEqual(['dashboard']);
    expect(getRolePermissions('invitado').actions).toEqual({});
    expect(canAccessModule('invitado', 'products')).toBe(false);
    expect(canPerform('invitado', 'base.manage')).toBe(false);
  });

  it('always allows admin:permissions for the administrator and warns on disable attempts (FR-118)', () => {
    const result = setRolePermission('administrador', 'panel', ADMIN_RESOURCE, false);
    expect(result.success).toBe(false);
    expect(result.warning).toBeTruthy();
    expect(getEffectivePermission('administrador', 'panel', ADMIN_RESOURCE)).toBe(true);
    expect(getEffectivePermission('supervisor_inventario', 'panel', ADMIN_RESOURCE)).toBe(false);
  });

  it('persists role, landing and permission changes without touching operational data (FR-120, FR-121, FR-122)', () => {
    saveProducts([{ product_id: 7, sku: 'SKU-7', product_name: 'Producto', status: 'activo' }]);
    const usersBefore = loadUsers();
    setActiveUserId(3);
    const activeBefore = localStorage.getItem(ACTIVE_USER_KEY);

    expect(setUserRole(3, 'encargado_bodega').success).toBe(true);
    expect(loadUsers().find((u) => u.user_id === 3).role).toBe('encargado_bodega');
    expect(loadUsers().find((u) => u.user_id === 1).role).toBe('administrador');
    expect(setUserRole(3, 'inexistente').success).toBe(false);
    expect(loadUsers().find((u) => u.user_id === 3).role).toBe('encargado_bodega');

    expect(setRoleLandingModule('encargado_bodega', 'stock').success).toBe(true);
    const landing = resolveLandingModule('encargado_bodega', 3);
    expect(landing.module).toBe('stock');
    expect(landing.fallback).toBe(false);

    const fallback = resolveLandingModule('encargado_bodega', 999);
    expect(fallback.module).toBe('dashboard');
    expect(fallback.fallback).toBe(true);

    expect(loadProducts().map((p) => p.sku)).toEqual(['SKU-7']);
    expect(loadStock()).toEqual([]);
    expect(loadTransfers()).toEqual([]);
    expect(loadReplenishments()).toEqual([]);
    expect(localStorage.getItem(ACTIVE_USER_KEY)).toBe(activeBefore);
    expect(loadUsers().map((u) => u.user_id)).toEqual(usersBefore.map((u) => u.user_id));
    expect(loadRoles().length).toBe(3);
    clearAll();
  });

  it('falls back to dashboard when a landing module is unknown or disallowed', () => {
    setRoleLandingModule('supervisor_inventario', 'entities');
    expect(resolveLandingModule('supervisor_inventario', 3)).toMatchObject({ module: 'dashboard', fallback: true });

    setRoleLandingModule('supervisor_inventario', 'modulo_inexistente');
    expect(resolveLandingModule('supervisor_inventario', 3)).toMatchObject({ module: 'dashboard', fallback: true });
    expect(MODULES).toContain('dashboard');
  });

  it('saves role permissions with unique composite keys', () => {
    setRolePermission('supervisor_inventario', 'modulo', 'module:stock', false);
    setRolePermission('supervisor_inventario', 'modulo', 'module:stock', true);
    const entries = loadRolePermissions().filter(
      (p) => p.role_key === 'supervisor_inventario' && p.scope === 'modulo' && p.resource_key === 'module:stock'
    );
    expect(entries).toHaveLength(1);
    expect(entries[0].allowed).toBe(true);
  });

  it('updates existing users only when their role is valid', () => {
    const users = loadUsers();
    saveUsers(users.map((u) => (u.user_id === 4 ? { ...u, role: 'supervisor_inventario' } : u)));
    expect(loadUsers().find((u) => u.user_id === 4).role).toBe('supervisor_inventario');
    saveRolePermissions(loadRolePermissions());
  });

  it('registers shipment permissions for all three roles without business-rule forbiddance (T122, FR-130, FR-133)', () => {
    expect(MODULES).toContain('shipments');
    for(const role of ['administrador', 'supervisor_inventario', 'encargado_bodega']){
      expect(canAccessModule(role, 'shipments')).toBe(true);
      expect(getEffectivePermission(role, 'vista', 'view:shipments')).toBe(true);
      expect(canPerform(role, 'shipments.create')).toBe(true);
      expect(canPerform(role, 'shipments.update_status')).toBe(true);
      expect(setRolePermission(role, 'accion', 'action:shipments.create', true).success).toBe(true);
      expect(setRolePermission(role, 'accion', 'action:shipments.update_status', true).success).toBe(true);
    }
  });

  it('falls back to the seed for shipment rows missing from a persisted matrix without rewriting it (T122, FR-124, FR-133)', () => {
    const trimmed = loadRolePermissions().filter(permission => !permission.resource_key.includes('shipments'));
    saveRolePermissions(trimmed);
    const before = loadRolePermissions();
    expect(before.some(permission => permission.resource_key.includes('shipments'))).toBe(false);

    expect(canAccessModule('administrador', 'shipments')).toBe(true);
    expect(getEffectivePermission('supervisor_inventario', 'vista', 'view:shipments')).toBe(true);
    expect(canPerform('encargado_bodega', 'shipments.update_status')).toBe(true);
    expect(loadRolePermissions()).toEqual(before);
  });
});
