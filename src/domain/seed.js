// Catálogos semilla de Logística e Inventario (FR-071).
// PRODUCT_CATEGORIES y USERS se precargan; no hay pantallas de administración
// para estos catálogos en esta iteración.

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
