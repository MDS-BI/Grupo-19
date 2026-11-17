export const ACTIVE_USER_KEY = 'logistics:active_user_id';

export const MODULES = ['dashboard', 'products', 'warehouses', 'stock', 'movements', 'transfers', 'alerts', 'replenishments', 'entities', 'documents', 'search'];

const ROLE_PERMISSIONS = {
  administrador: {
    modules: ['dashboard', 'products', 'warehouses', 'stock', 'movements', 'transfers', 'alerts', 'replenishments', 'entities', 'documents', 'search'],
    actions: {
      'products.manage': true,
      'warehouses.manage': true,
      'stock.configure_min': true,
      'movements.register': true,
      'movements.adjust': true,
      'transfers.create': true,
      'transfers.confirm': true,
      'transfers.cancel': true,
      'replenishments.create': true,
      'replenishments.approve': true,
      'replenishments.cancel': true,
      'replenishments.receive': false,
      'base.manage': true
    }
  },
  supervisor_inventario: {
    modules: ['dashboard', 'products', 'warehouses', 'stock', 'movements', 'transfers', 'alerts', 'replenishments'],
    actions: {
      'products.manage': false,
      'warehouses.manage': false,
      'stock.configure_min': false,
      'movements.register': false,
      'movements.adjust': false,
      'transfers.create': false,
      'transfers.confirm': false,
      'transfers.cancel': false,
      'replenishments.create': true,
      'replenishments.approve': false,
      'replenishments.cancel': false,
      'replenishments.receive': false,
      'base.manage': false
    }
  },
  encargado_bodega: {
    modules: ['dashboard', 'products', 'warehouses', 'stock', 'movements', 'transfers', 'alerts', 'replenishments'],
    actions: {
      'products.manage': false,
      'warehouses.manage': false,
      'stock.configure_min': false,
      'movements.register': true,
      'movements.adjust': true,
      'transfers.create': true,
      'transfers.confirm': true,
      'transfers.cancel': true,
      'replenishments.create': false,
      'replenishments.approve': false,
      'replenishments.cancel': false,
      'replenishments.receive': true,
      'base.manage': false
    }
  }
};

export function getRolePermissions(role){
  return ROLE_PERMISSIONS[role] || { modules: ['dashboard'], actions: {} };
}

export function canAccessModule(role, moduleName){
  return getRolePermissions(role).modules.includes(moduleName);
}

export function canPerform(role, action){
  return Boolean(getRolePermissions(role).actions[action]);
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
  if(role === 'administrador') return 'Administrador';
  if(role === 'supervisor_inventario') return 'Supervisor de inventario';
  if(role === 'encargado_bodega') return 'Encargado de bodega';
  return role || 'Sin rol';
}
