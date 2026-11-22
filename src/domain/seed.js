export const PRODUCT_CATEGORY_SEED = [
  'Electrónica',
  'Alimentos y Bebidas',
  'Ferretería',
  'Insumos de Oficina',
  'Limpieza y Aseo'
];

export const USER_SEED = [
  { user_name: 'Ana Torres', role: 'administrador', email: 'ana.torres@empresa.cl' },
  { user_name: 'Carlos Pérez', role: 'encargado_bodega', email: 'carlos.perez@empresa.cl' },
  { user_name: 'María López', role: 'supervisor_inventario', email: 'maria.lopez@empresa.cl' },
  { user_name: 'Jorge Soto', role: 'encargado_bodega', email: 'jorge.soto@empresa.cl' }
];

export const ROLE_SEED = [
  {
    role_key: 'administrador',
    role_label: 'Administrador',
    default_landing_module: 'dashboard',
    is_admin: true,
    description: 'Acceso integral a la configuración y a la operación logística.'
  },
  {
    role_key: 'supervisor_inventario',
    role_label: 'Supervisor de inventario',
    default_landing_module: 'alerts',
    is_admin: false,
    description: 'Supervisa alertas y solicita reposiciones.'
  },
  {
    role_key: 'encargado_bodega',
    role_label: 'Encargado de bodega',
    default_landing_module: 'movements',
    is_admin: false,
    description: 'Registra movimientos, transferencias y recepciones de bodega.'
  }
];

const ALL_MODULES = ['dashboard', 'products', 'warehouses', 'stock', 'movements', 'transfers', 'alerts', 'replenishments', 'entities', 'documents', 'search'];
const OPERATION_MODULES = ['dashboard', 'products', 'warehouses', 'stock', 'movements', 'transfers', 'alerts', 'replenishments'];
const SECTIONS = ['product-form', 'warehouse-form', 'movement-form', 'transfer-form', 'replenishment-form', 'base-module-card', 'entity-form', 'document-form'];

const ADMIN_ACTIONS = {
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
};

const SUPERVISOR_ACTIONS = {
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
};

const WAREHOUSE_ACTIONS = {
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
};

function roleEntries(roleKey, modules, actions, isAdmin){
  return [
    ...modules.map(moduleName => ({ role_key: roleKey, scope: 'modulo', resource_key: `module:${moduleName}`, allowed: true })),
    ...modules.map(moduleName => ({ role_key: roleKey, scope: 'vista', resource_key: `view:${moduleName}`, allowed: true })),
    ...SECTIONS.map(section => ({
      role_key: roleKey,
      scope: 'seccion',
      resource_key: `section:${section}`,
      allowed: isAdmin || section === 'movement-form' || section === 'transfer-form' || section === 'replenishment-form'
    })),
    ...Object.entries(actions).map(([action, allowed]) => ({ role_key: roleKey, scope: 'accion', resource_key: `action:${action}`, allowed })),
    { role_key: roleKey, scope: 'panel', resource_key: 'admin:permissions', allowed: isAdmin }
  ];
}

export const ROLE_PERMISSION_SEED = [
  ...roleEntries('administrador', ALL_MODULES, ADMIN_ACTIONS, true),
  ...roleEntries('supervisor_inventario', OPERATION_MODULES, SUPERVISOR_ACTIONS, false),
  ...roleEntries('encargado_bodega', OPERATION_MODULES, WAREHOUSE_ACTIONS, false)
];
