import {
  loadRolePermissions,
  loadRoles,
  loadUserPermissionOverrides,
  loadUsers,
  saveRolePermissions,
  saveRoles,
  saveUserPermissionOverrides,
  saveUsers,
  seedLogisticsCatalogs
} from '../storage.js';
import { ROLE_PERMISSION_SEED, ROLE_SEED } from './seed.js';

export const ACTIVE_USER_KEY = 'logistics:active_user_id';
export const ADMIN_RESOURCE = 'admin:permissions';
export const MODULES = ['dashboard', 'products', 'warehouses', 'stock', 'movements', 'transfers', 'shipments', 'alerts', 'replenishments'];
export const PERMISSION_SCOPES = ['modulo', 'vista', 'seccion', 'accion', 'panel'];
export const ACTION_KEYS = [...new Set(ROLE_PERMISSION_SEED.filter(p => p.scope === 'accion').map(p => p.resource_key.replace('action:', '')))];

const FORBIDDEN_BY_ROLE = new Map([
  ['administrador', new Set(['action:replenishments.receive'])],
  ['supervisor_inventario', new Set(['action:replenishments.approve', 'action:replenishments.cancel', 'action:replenishments.receive', 'action:base.manage'])],
  ['encargado_bodega', new Set(['action:replenishments.create', 'action:replenishments.approve', 'action:replenishments.cancel', 'action:base.manage'])]
]);

function ensurePermissionSeed(){
  if(loadRoles().length === 0 || loadRolePermissions().length === 0){
    seedLogisticsCatalogs();
  }
}

function getRoleRecord(roleKey){
  ensurePermissionSeed();
  return loadRoles().find(role => role.role_key === roleKey);
}

function isAdminRole(roleKey){
  const role = getRoleRecord(roleKey);
  return Boolean(role && role.is_admin === true);
}

function resourceFor(scope, key){
  if(scope === 'modulo') return `module:${key}`;
  if(scope === 'vista') return `view:${key}`;
  if(scope === 'seccion') return `section:${key}`;
  if(scope === 'accion') return `action:${key}`;
  if(scope === 'panel') return key;
  return key;
}

function isValidResource(scope, resource){
  if(scope === 'modulo') return /^module:[a-z_]+$/.test(resource);
  if(scope === 'vista') return /^view:[a-z_]+$/.test(resource);
  if(scope === 'seccion') return /^section:[a-z0-9-]+$/.test(resource);
  if(scope === 'accion') return /^action:[a-z0-9._]+$/.test(resource);
  if(scope === 'panel') return resource === ADMIN_RESOURCE;
  return false;
}

function resourceLabel(resource){
  return resource === ADMIN_RESOURCE ? 'panel de permisos' : resource;
}

function isForbidden(role, scope, resource){
  if(resource === ADMIN_RESOURCE) return !isAdminRole(role);
  return Boolean(FORBIDDEN_BY_ROLE.get(role)?.has(resource));
}

function findStoredPermission(role, scope, resource){
  return loadRolePermissions().find(p => p.role_key === role && p.scope === scope && p.resource_key === resource);
}

function findSeedPermission(role, scope, resource){
  return ROLE_PERMISSION_SEED.find(p => p.role_key === role && p.scope === scope && p.resource_key === resource);
}

function findOverride(userId, scope, resource){
  if(userId === undefined || userId === null || userId === '') return undefined;
  return loadUserPermissionOverrides().find(o => Number(o.user_id) === Number(userId) && o.scope === scope && o.resource_key === resource);
}

export function getRoles(){
  ensurePermissionSeed();
  return loadRoles();
}

export function getUserPermissionOverrides(){
  ensurePermissionSeed();
  return loadUserPermissionOverrides();
}

export function getRolePermissions(role){
  ensurePermissionSeed();
  if(!getRoleRecord(role)) return { modules: ['dashboard'], actions: {} };
  const entries = loadRolePermissions().filter(p => p.role_key === role);
  const modules = entries
    .filter(p => p.scope === 'modulo' && p.allowed)
    .map(p => p.resource_key.replace('module:', ''));
  const actions = {};
  entries
    .filter(p => p.scope === 'accion')
    .forEach(p => { actions[p.resource_key.replace('action:', '')] = Boolean(p.allowed); });
  return { modules, actions };
}

export function getEffectivePermission(role, scope, resource, userId){
  ensurePermissionSeed();
  if(resource === ADMIN_RESOURCE) return isAdminRole(role);
  if(isForbidden(role, scope, resource)) return false;
  if(scope === 'modulo' && resource === 'module:dashboard') return true;
  const override = findOverride(userId, scope, resource);
  if(override) return Boolean(override.allowed);
  const stored = findStoredPermission(role, scope, resource);
  if(stored) return Boolean(stored.allowed);
  const seed = findSeedPermission(role, scope, resource);
  if(seed) return Boolean(seed.allowed);
  if(scope === 'vista'){
    const moduleName = resource.replace('view:', '');
    return getEffectivePermission(role, 'modulo', `module:${moduleName}`, userId);
  }
  return false;
}

export function canAccessModule(role, moduleName, userId){
  return getEffectivePermission(role, 'modulo', resourceFor('modulo', moduleName), userId);
}

export function canPerform(role, action, userId){
  return getEffectivePermission(role, 'accion', resourceFor('accion', action), userId);
}

export function setRolePermission(role, scope, resource, allowed){
  ensurePermissionSeed();
  if(!getRoleRecord(role)) return { success: false, error: 'El cargo no existe' };
  if(!PERMISSION_SCOPES.includes(scope)) return { success: false, error: 'El ámbito del permiso no es válido' };
  if(!isValidResource(scope, resource)) return { success: false, error: 'La clave del recurso no es válida' };
  if(typeof allowed !== 'boolean') return { success: false, error: 'El permiso debe ser booleano' };
  if(resource === ADMIN_RESOURCE && (!isAdminRole(role) || !allowed)){
    return { success: false, warning: `El ${resourceLabel(resource)} siempre debe permanecer habilitado para el cargo administrador` };
  }
  if(isForbidden(role, scope, resource)){
    return { success: false, warning: `La regla de negocio impide modificar ${resourceLabel(resource)} para este cargo` };
  }
  const list = loadRolePermissions();
  const idx = list.findIndex(p => p.role_key === role && p.scope === scope && p.resource_key === resource);
  if(idx === -1 && list.some(p => p.role_key === role && p.scope === scope && p.resource_key === resource)){
    return { success: false, error: 'La clave del permiso ya existe' };
  }
  const permission = idx === -1
    ? { role_key: role, scope, resource_key: resource, allowed }
    : { ...list[idx], allowed };
  if(idx === -1) list.push(permission);
  else list[idx] = permission;
  saveRolePermissions(list);
  return { success: true, permission };
}

export function setUserPermissionOverride(userId, scope, resource, allowed){
  ensurePermissionSeed();
  const user = loadUsers().find(u => Number(u.user_id) === Number(userId));
  if(!user) return { success: false, error: 'El usuario no existe' };
  if(!PERMISSION_SCOPES.includes(scope)) return { success: false, error: 'El ámbito del permiso no es válido' };
  if(!isValidResource(scope, resource)) return { success: false, error: 'La clave del recurso no es válida' };
  if(typeof allowed !== 'boolean') return { success: false, error: 'El permiso debe ser booleano' };
  if(isForbidden(user.role, scope, resource)){
    return { success: false, warning: `La regla de negocio impide exceptuar ${resourceLabel(resource)} para este usuario` };
  }
  const list = loadUserPermissionOverrides();
  const idx = list.findIndex(o => Number(o.user_id) === Number(userId) && o.scope === scope && o.resource_key === resource);
  const override = idx === -1
    ? { user_id: Number(userId), scope, resource_key: resource, allowed }
    : { ...list[idx], allowed };
  if(idx === -1) list.push(override);
  else list[idx] = override;
  saveUserPermissionOverrides(list);
  return { success: true, override };
}

export function setUserRole(userId, role){
  ensurePermissionSeed();
  if(!getRoleRecord(role)) return { success: false, error: 'El cargo no existe' };
  const users = loadUsers();
  const idx = users.findIndex(u => Number(u.user_id) === Number(userId));
  if(idx === -1) return { success: false, error: 'El usuario no existe' };
  users[idx] = { ...users[idx], role };
  saveUsers(users);
  return { success: true, user: users[idx] };
}

export function setRoleLandingModule(role, moduleName){
  ensurePermissionSeed();
  const roles = loadRoles();
  const idx = roles.findIndex(r => r.role_key === role);
  if(idx === -1) return { success: false, error: 'El cargo no existe' };
  roles[idx] = { ...roles[idx], default_landing_module: moduleName };
  saveRoles(roles);
  const known = MODULES.includes(moduleName);
  const allowed = known && canAccessModule(role, moduleName);
  return {
    success: true,
    warning: known && allowed ? undefined : 'La landing configurada no es válida para el cargo; se usa el panel como fallback'
  };
}

export function resolveLandingModule(role, userId){
  ensurePermissionSeed();
  if(userId !== undefined && userId !== null && userId !== '' && !loadUsers().some(u => Number(u.user_id) === Number(userId))){
    return { module: 'dashboard', fallback: true, warning: 'No existe un usuario activo válido; se usa el panel como fallback' };
  }
  const roleRecord = getRoleRecord(role);
  if(!roleRecord) return { module: 'dashboard', fallback: true, warning: 'El cargo no es reconocido; se usa el panel como fallback' };
  const moduleName = roleRecord.default_landing_module;
  if(!MODULES.includes(moduleName) || !canAccessModule(role, moduleName, userId)){
    return { module: 'dashboard', fallback: true, warning: 'La landing configurada no es válida para el cargo; se usa el panel como fallback' };
  }
  return { module: moduleName, fallback: false };
}

export function getActiveUserId(){
  const raw = localStorage.getItem(ACTIVE_USER_KEY);
  if(!raw) return null;
  const n = Number(raw);
  return Number.isInteger(n) ? n : null;
}

export function setActiveUserId(userId){
  if(userId === null || userId === undefined || userId === ''){
    localStorage.removeItem(ACTIVE_USER_KEY);
    return;
  }
  localStorage.setItem(ACTIVE_USER_KEY, String(userId));
}

export function resolveActiveUser(users){
  if(!Array.isArray(users) || users.length === 0) return null;
  const stored = getActiveUserId();
  const found = users.find(u => Number(u.user_id) === Number(stored));
  const user = found || users[0];
  if(!found) setActiveUserId(user.user_id);
  return user;
}

export function roleLabel(role){
  const record = getRoleRecord(role);
  if(record) return record.role_label;
  const fallback = ROLE_SEED.find(r => r.role_key === role);
  return fallback ? fallback.role_label : (role || 'Sin rol');
}
